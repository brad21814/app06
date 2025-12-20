import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { emailService } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { connectionId, proposedTimes } = await req.json();

        if (!connectionId || !proposedTimes || !Array.isArray(proposedTimes)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // 1. Fetch Connection
        const connectionRef = adminDb.collection('connections').doc(connectionId);
        const connectionSnap = await connectionRef.get();

        if (!connectionSnap.exists) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        const connectionData = connectionSnap.data() as any; // Using any to avoid Timestamp type mismatch with client types if strict

        // 2. Fetch Proposer and Confirmer
        const proposerSnap = await adminDb.collection('users').doc(connectionData.proposerId).get();
        const confirmerSnap = await adminDb.collection('users').doc(connectionData.confirmerId).get();

        if (!proposerSnap.exists || !confirmerSnap.exists) {
            return NextResponse.json({ error: 'Participants not found' }, { status: 404 });
        }

        const proposerData = proposerSnap.data();
        const confirmerData = confirmerSnap.data();

        // 3. Update Connection
        const proposedTimestamps = proposedTimes.map((isoString: string) => Timestamp.fromDate(new Date(isoString)));

        await connectionRef.update({
            status: 'proposed',
            proposedTimes: proposedTimestamps,
            updatedAt: Timestamp.now()
        });

        // 4. Send Email to Confirmer
        // Construct the link. Assuming valid BASE_URL in environment or derive from request.
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
        const link = `${baseUrl}/schedule/${connectionId}`;

        // We send email to the Confirmer, telling them Proposer has proposed times.
        if (confirmerData?.email) {
            await emailService.sendProposalEmail(
                confirmerData.email,
                proposerData?.name || 'Your partner',
                link
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in /api/schedule/propose:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
