import { getFirestore } from 'firebase-admin/firestore';
import { PrivacyTier, User } from '../../../types/firestore';

const db = getFirestore();

export class PrivacyService {
    static async getUserPrivacyTier(userId: string): Promise<PrivacyTier> {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data() as User;
                return userData.privacyTier || PrivacyTier.TIER_1_STANDARD;
            }
            return PrivacyTier.TIER_1_STANDARD;
        } catch (error) {
            console.error(`[PrivacyService] Error fetching privacy tier for user ${userId}:`, error);
            return PrivacyTier.TIER_1_STANDARD;
        }
    }

    static async shouldStoreTranscript(userId: string): Promise<boolean> {
        const tier = await this.getUserPrivacyTier(userId);
        // Tier 3: No transcript storage
        return tier !== PrivacyTier.TIER_3_PRIVATE;
    }

    static async getInitialSummaryStatus(userId: string): Promise<{ status: string, isApprovalRequired: boolean }> {
        const tier = await this.getUserPrivacyTier(userId);
        if (tier === PrivacyTier.TIER_2_CONTROLLED) {
            return { status: 'PENDING_APPROVAL', isApprovalRequired: true };
        }
        return { status: 'APPROVED', isApprovalRequired: false };
    }
}
