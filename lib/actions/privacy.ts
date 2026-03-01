'use client';

import { PrivacyTier } from '@/types/firestore';
import { updateUser } from '@/lib/firebase/firestore';

export async function updatePrivacyTier(uid: string, tier: PrivacyTier) {
    try {
        await updateUser(uid, { privacyTier: tier });
        return { success: true };
    } catch (error) {
        console.error('Error updating privacy tier:', error);
        return { success: false, error: 'Failed to update privacy settings' };
    }
}
