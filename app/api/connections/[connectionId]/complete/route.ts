import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { adminDb } from '@/lib/firebase/server';
import { TwilioService } from '@/lib/twilio';

export async function POST(req: NextRequest, { params }: { params: Promise<{ connectionId: string }> }) {
    console.log('POST /api/connections/[connectionId]/complete');
    try {
        const session = await getSession();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { connectionId } = await params;
        if (!connectionId) {
            return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
        }

        const connectionRef = adminDb.collection('connections').doc(connectionId);
        const connectionSnap = await connectionRef.get();

        if (!connectionSnap.exists) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        const connectionData = connectionSnap.data();
        if (!connectionData) {
            return NextResponse.json({ error: 'Connection data missing' }, { status: 404 });
        }

        // Verify participant
        const userId = session.user.id;
        if (connectionData.proposerId !== userId && connectionData.confirmerId !== userId) {
            return NextResponse.json({ error: 'Not a participant of this connection' }, { status: 403 });
        }

        const roomName = connectionData.connectRoomUniqueName;
        if (!roomName) {
            return NextResponse.json({ error: 'Video room not provisioned' }, { status: 400 });
        }

        console.log(`[POST /complete] Closing room: ${roomName} for connection: ${connectionId}`);

        // 1. Close the Twilio Room
        const roomSid = await TwilioService.completeRoom(roomName);

        // 2. Update Firestore immediately (Webhook will also do this, but this is faster for UI)
        // Ensure we save the Room SID so webhooks can find this connection later
        const updateData: any = {
            status: 'completed',
            endedAt: new Date(), // adminDb uses native Dates or Firestore Timestamps
        };

        if (roomSid) {
            updateData.connectRoomSid = roomSid;
        }

        await connectionRef.update(updateData);

        return NextResponse.json({ success: true, message: 'Room closed', roomSid });

    } catch (error: any) {
        console.error('Error in /api/connections/complete:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
