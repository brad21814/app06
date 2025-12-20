import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { adminDb } from '@/lib/firebase/server';
import { TwilioService } from '@/lib/twilio';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { connectionId } = await req.json();
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
        console.log(`[POST /api/twilio/token] Access Check: User=${userId}, connectionId=${connectionId}, Proposer=${connectionData.proposerId}, Confirmer=${connectionData.confirmerId}`);
        if (connectionData.proposerId !== userId && connectionData.confirmerId !== userId) {
            return NextResponse.json({ error: 'Not a participant of this connection' }, { status: 403 });
        }

        const roomName = connectionData.connectRoomUniqueName;
        if (!roomName) {
            return NextResponse.json({ error: 'Video room not provisioned for this connection' }, { status: 400 });
        }

        // Ensure room exists and recording is enabled
        try {
            await TwilioService.createRoom(roomName);
        } catch (error) {
            console.error("Error ensuring room existence:", error);
            // Verify if we should block or continue? 
            // Blocking is safer to ensure recording.
            return NextResponse.json({ error: 'Failed to initialize video room' }, { status: 500 });
        }

        // Generate Token
        // Use userId as identity
        const token = TwilioService.generateToken({
            identity: userId,
            roomName: roomName
        });

        return NextResponse.json({ token });

    } catch (error) {
        console.error('Error in /api/twilio/token:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
