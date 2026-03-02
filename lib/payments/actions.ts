'use server';

import { redirect } from 'next/navigation';
import { stripe } from './stripe';
import { getAccountDoc } from '@/lib/firestore/admin/collections';
import { getPriceIdFromTier } from './utils';

// -- New Account-Based Actions for Feature 001-stripe-subscription-management -- //

export async function createAccountCheckoutSession(accountId: string, returnUrl: string) {
    try {
        const accountDoc = await getAccountDoc(accountId).get();
        if (!accountDoc.exists) {
            throw new Error('Account not found');
        }

        const account = accountDoc.data();
        if (!account) throw new Error('Account data missing');

        const tier = account.subscriptionTier || 'launchpad';
        const priceId = getPriceIdFromTier(tier);
        const quantity = account.userCount || 1;

        if (!priceId) {
            throw new Error(`Price ID not configured for tier: ${tier}`);
        }

        let customerId = account.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                metadata: { accountId }
            });
            customerId = customer.id;
            await getAccountDoc(accountId).update({ stripeCustomerId: customerId });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: quantity
                }
            ],
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: returnUrl,
            metadata: { accountId },
            subscription_data: {
                metadata: { accountId }
            }
        });

        if (!session.url) {
            throw new Error('Failed to create session URL');
        }

        return { url: session.url };
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

export async function createAccountPortalSession(accountId: string, returnUrl: string) {
    try {
        const accountDoc = await getAccountDoc(accountId).get();
        if (!accountDoc.exists) {
            throw new Error('Account not found');
        }

        const account = accountDoc.data();
        if (!account || !account.stripeCustomerId) {
            throw new Error('Customer ID not found for this account');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: account.stripeCustomerId,
            return_url: returnUrl,
        });

        return { url: session.url };
    } catch (error) {
        console.error('Error creating portal session:', error);
        throw error;
    }
}

// -- Legacy Team-Based Actions (to preserve marketing page build) -- //
import { withTeam } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData, team) => {
    // Legacy mock action to unbreak marketing UI
    console.log('checkoutAction called for team', team.id);
    throw new Error('Not supported in new account-based billing. Upgrade your app logic.');
});

export const customerPortalAction = withTeam(async (_, team) => {
    console.log('customerPortalAction called for team', team.id);
    throw new Error('Not supported in new account-based billing. Upgrade your app logic.');
});
