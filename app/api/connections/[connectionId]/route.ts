import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest, { params }: { params: Promise<{ connectionId: string }> }) {
    console.log('GET /api/connections/[connectionId]');
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { connectionId } = await params;
        const userId = session.user.id;

        const connectionRef = adminDb.collection('connections').doc(connectionId);
        const connectionSnap = await connectionRef.get();

        if (!connectionSnap.exists) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        const data = connectionSnap.data();
        if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 });

        // Access Control
        console.log(`[GET /api/connections/${connectionId}] Access Check: User=${userId}, Proposer=${data.proposerId}, Confirmer=${data.confirmerId}`);
        // Log types too in case of string/number mismatch or subtle issues
        console.log(`[GET /api/connections/${connectionId}] Types: User=${typeof userId}, Proposer=${typeof data.proposerId}`);
        if (data.proposerId !== userId && data.confirmerId !== userId) {
            // Allow admin/owner? For now strict participant check or owner
            // Let's assume strict for basic implementation
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Fetch participants, theme, and schedule details
        const [proposerSnap, confirmerSnap, themeSnap, scheduleSnap] = await Promise.all([
            adminDb.collection('users').doc(data.proposerId).get(),
            adminDb.collection('users').doc(data.confirmerId).get(),
            data.themeId ? adminDb.collection('themes').doc(data.themeId).get() : Promise.resolve(null),
            data.scheduleId ? adminDb.collection('schedules').doc(data.scheduleId).get() : Promise.resolve(null)
        ]);

        const participants = [
            {
                id: data.proposerId,
                name: proposerSnap.exists ? proposerSnap.data()?.name || 'Proposer' : 'Unknown',
                email: proposerSnap.exists ? proposerSnap.data()?.email : '',
                role: 'proposer'
            },
            {
                id: data.confirmerId,
                name: confirmerSnap.exists ? confirmerSnap.data()?.name || 'Confirmer' : 'Unknown',
                email: confirmerSnap.exists ? confirmerSnap.data()?.email : '',
                role: 'confirmer'
            }
        ];

        const themeData = themeSnap && themeSnap.exists ? themeSnap.data() : null;
        const scheduleData = scheduleSnap && scheduleSnap.exists ? scheduleSnap.data() : null;

        // Check if questions are already saved on the connection
        let questions: string[] = data.questions || [];

        if (questions.length === 0) {
            let availableQuestions = themeData?.questions || [
                "What is a hobby you have that no one at work knows about?",
                "What is one professional skill you are currently working on?",
                "If you could have dinner with any historical figure, who would it be?"
            ];

            // Randomly select questions based on duration and max discussion time
            if (scheduleData && scheduleData.duration && scheduleData.maxTimePerQuestion) {
                const durationMins = scheduleData.duration;
                const maxTimeMins = scheduleData.maxTimePerQuestion / 60;
                // Formula: (Duration / MaxTime) - 1
                const calculatedCount = Math.floor((durationMins / maxTimeMins) - 1);
                const count = Math.max(1, calculatedCount); // Ensure at least 1 question

                // Shuffle
                const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
                questions = shuffled.slice(0, count);
            } else {
                questions = availableQuestions;
            }


            // Persist the selected questions to the connection ensures all users see the same ones
            await adminDb.collection('connections').doc(connectionId).update({
                questions: questions,
                updatedAt: Timestamp.now()
            });
        }

        return NextResponse.json({
            id: connectionId,
            status: data.status,
            startedAt: data.startedAt,
            themeId: data.themeId,
            connectRoomUniqueName: data.connectRoomUniqueName,
            participants,
            theme: {
                name: themeData?.name || 'Default Theme',
                questions: questions
            },
            timerSettings: {
                minTime: scheduleData?.minTimePerQuestion || 60,
                maxTime: scheduleData?.maxTimePerQuestion || 180
            }
        });

    } catch (error) {
        console.error('Error fetching connection:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
