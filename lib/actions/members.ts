'use server';

import { getAccountDoc, getTeamMembersCollection, getUsersCollection } from '@/lib/firestore/admin/collections';
import { updateSubscriptionQuantity } from '@/lib/payments/stripe';
import { Account } from '@/types/firestore';

export async function syncSubscriptionSeats(accountId: string) {
    try {
        const accountRef = getAccountDoc(accountId);
        const accountDoc = await accountRef.get();
        if (!accountDoc.exists) return;

        const account = accountDoc.data() as Account;
        
        // Count active users in this account
        const usersQuery = await getUsersCollection()
            .where('accountId', '==', accountId)
            .get();
        
        const newCount = usersQuery.size;

        if (account.userCount !== newCount) {
            await accountRef.update({ userCount: newCount });

            // If subscription is active, update Stripe
            if (account.subscriptionStatus === 'active' && account.stripeSubscriptionId) {
                await updateSubscriptionQuantity(account.stripeSubscriptionId, newCount);
            }
        }

        return { success: true, count: newCount };
    } catch (err) {
        console.error('Failed to sync subscription seats:', err);
        return { success: false, error: 'Failed to sync seats' };
    }
}
