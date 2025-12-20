import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { emailService } from '@/lib/email';
import * as ics from 'ics';

export async function POST(req: NextRequest) {
    try {
        const { connectionId, confirmedTime } = await req.json();

        if (!connectionId || !confirmedTime) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // 1. Fetch Connection
        const connectionRef = adminDb.collection('connections').doc(connectionId);
        const connectionSnap = await connectionRef.get();

        if (!connectionSnap.exists) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }
        const connectionData = connectionSnap.data() as any;

        // 2. Fetch Schedule (for duration)
        const scheduleSnap = await adminDb.collection('schedules').doc(connectionData.scheduleId).get();
        if (!scheduleSnap.exists) {
            return NextResponse.json({ error: 'Schedule data not found' }, { status: 404 });
        }
        const scheduleData = scheduleSnap.data() as any;
        const durationMinutes = scheduleData.duration || 30; // default 30 mins

        // 3. Fetch Participants
        const proposerSnap = await adminDb.collection('users').doc(connectionData.proposerId).get();
        const confirmerSnap = await adminDb.collection('users').doc(connectionData.confirmerId).get();

        if (!proposerSnap.exists || !confirmerSnap.exists) {
            return NextResponse.json({ error: 'Participants not found' }, { status: 404 });
        }

        const proposerData = proposerSnap.data() as any;
        const confirmerData = confirmerSnap.data() as any;

        // 4. Update Connection
        const confirmedDate = new Date(confirmedTime);
        await connectionRef.update({
            status: 'scheduled',
            confirmedTime: Timestamp.fromDate(confirmedDate),
            updatedAt: Timestamp.now()
        });

        // 5. Generate ICS
        // ics expects [year, month, day, hour, minute]
        const start: ics.DateArray = [
            confirmedDate.getFullYear(),
            confirmedDate.getMonth() + 1,
            confirmedDate.getDate(),
            confirmedDate.getHours(),
            confirmedDate.getMinutes()
        ];

        const event: ics.EventAttributes = {
            start: start,
            duration: { minutes: durationMinutes },
            title: `TeamPulp Connection: ${proposerData.name} & ${confirmerData.name}`,
            description: `Scheduled connection via TeamPulp.\n\nParticipants:\n- ${proposerData.name}\n- ${confirmerData.name}\n\nJoin Video Room: ${connectionData.connectRoomUrl || 'Link pending'}`,
            location: 'Online',
            url: connectionData.connectRoomUrl || '',
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: 'TeamPulp', email: 'admin@teampulp.com' }, // Use a valid email
            attendees: [
                { name: proposerData.name || proposerData.email || 'Participant', email: proposerData.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
                { name: confirmerData.name || confirmerData.email || 'Participant', email: confirmerData.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
            ]
        };

        const { error: icsError, value: icsValue } = ics.createEvent(event);

        if (icsError || !icsValue) {
            console.error('Error generating ICS:', icsError);
            // We still return success as the DB update worked, but we explicitly note email failed logging
        } else {
            // 6. Send Emails
            // Send to Proposer
            if (proposerData.email) {
                await emailService.sendCalendarInvite(
                    proposerData.email,
                    proposerData.name,
                    confirmerData.name || 'Partner',
                    icsValue
                );
            }
            // Send to Confirmer
            if (confirmerData.email) {
                await emailService.sendCalendarInvite(
                    confirmerData.email,
                    confirmerData.name,
                    proposerData.name || 'Partner',
                    icsValue
                );
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in /api/schedule/confirm:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
