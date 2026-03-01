'use client';

import { db } from '@/lib/firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { SummaryStatus } from '@/types/firestore';

export async function approveSummary(summaryId: string) {
    try {
        const summaryRef = doc(db, 'summaries', summaryId);
        await updateDoc(summaryRef, {
            status: SummaryStatus.APPROVED,
            updatedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error('Error approving summary:', error);
        return { success: false, error: 'Failed to approve summary' };
    }
}

export async function rejectSummary(summaryId: string) {
    try {
        const summaryRef = doc(db, 'summaries', summaryId);
        // FR-008: REJECTION MUST result in the immediate and permanent deletion
        await deleteDoc(summaryRef);
        return { success: true };
    } catch (error) {
        console.error('Error rejecting summary:', error);
        return { success: false, error: 'Failed to reject summary' };
    }
}
