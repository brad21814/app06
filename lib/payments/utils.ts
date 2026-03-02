import { SubscriptionLog } from '@/types/firestore';
import { getSubscriptionLogsCollection } from '@/lib/firestore/admin/collections';
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

export type SubscriptionTier = 'launchpad' | 'growth' | 'culture';

export function getTierFromUserCount(userCount: number): SubscriptionTier {
    if (userCount < 10) return 'launchpad';
    if (userCount < 50) return 'growth';
    return 'culture';
}

export function getPriceIdFromTier(tier: SubscriptionTier): string {
    switch (tier) {
        case 'launchpad':
            return process.env.STRIPE_PRICE_ID_LAUNCHPAD || '';
        case 'growth':
            return process.env.STRIPE_PRICE_ID_GROWTH || '';
        case 'culture':
            return process.env.STRIPE_PRICE_ID_CULTURE || '';
        default:
            return '';
    }
}

export async function logSubscriptionEvent(
    accountId: string,
    type: SubscriptionLog['type'],
    fromTier?: string | null,
    toTier?: string | null
): Promise<void> {
    const logId = randomUUID();
    const log: SubscriptionLog = {
        id: logId,
        accountId,
        type,
        fromTier: fromTier || null,
        toTier: toTier || null,
        createdAt: Timestamp.now() as any // Cast since client Timestamp type is used in shared interface
    };

    const logsCollection = getSubscriptionLogsCollection(accountId);
    await logsCollection.doc(logId).set(log);
}
