import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { adminDb } from '@/lib/firebase/server';
import { resetConnectionData } from '@/lib/firestore/connections';

export async function POST(req: NextRequest, { params }: { params: Promise<{ connectionId: string }> }) {
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

        // Reset connection data
        await resetConnectionData(connectionId);

        return NextResponse.json({ success: true, message: 'Connection reset for reconnection' });

    } catch (error: any) {
        console.error('Error in /api/connections/reconnect:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
