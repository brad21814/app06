import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Resets a connection's state to allow it to be restarted.
 * Clears session-specific data like start/end times and question events.
 */
export async function resetConnectionData(connectionId: string) {
    const connectionRef = adminDb.collection('connections').doc(connectionId);
    
    await connectionRef.update({
        status: 'scheduled',
        startedAt: FieldValue.delete(),
        endedAt: FieldValue.delete(),
        questionEvents: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
    });
}
