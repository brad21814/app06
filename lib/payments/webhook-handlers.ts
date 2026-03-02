import { getAccountDoc } from '@/lib/firestore/admin/collections';
import { logSubscriptionEvent } from './utils';
import { Timestamp } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { stripe } from './stripe';

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const accountId = session.metadata?.accountId;
    if (!accountId) {
        console.error('No accountId found in session metadata');
        return;
    }

    const subscriptionId = session.subscription as string;
    
    // Update Account
    const accountRef = getAccountDoc(accountId);
    await accountRef.update({
        subscriptionStatus: 'active',
        stripeSubscriptionId: subscriptionId
    });

    // Log Event
    await logSubscriptionEvent(accountId, 'paid_started');
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const accountId = subscription.metadata?.accountId;
    if (!accountId) return;

    const status = subscription.status === 'active' ? 'active' :
                   subscription.status === 'past_due' ? 'past_due' :
                   subscription.status === 'canceled' ? 'canceled' : 'trialing';

    const currentPeriodEnd = new Date(((subscription as any).current_period_end || 0) * 1000);

    // Get the current tier from the price
    let tier = 'launchpad'; // fallback
    const priceId = subscription.items?.data[0]?.price?.id;
    if (priceId === process.env.STRIPE_PRICE_ID_GROWTH) {
        tier = 'growth';
    } else if (priceId === process.env.STRIPE_PRICE_ID_CULTURE) {
        tier = 'culture';
    }

    const accountRef = getAccountDoc(accountId);
    await accountRef.update({
        subscriptionStatus: status,
        subscriptionTier: tier as any,
        currentPeriodEnd: Timestamp.fromDate(currentPeriodEnd)
    });
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const accountId = subscription.metadata?.accountId;
    if (!accountId) return;

    const accountRef = getAccountDoc(accountId);
    await accountRef.update({
        subscriptionStatus: 'canceled'
    });
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const accountId = subscription.metadata.accountId;

        if (!accountId) return;

        // Provide 3 days grace period
        // For simplicity we just log the event, but we could set a specific flag
        // or actually cancel the subscription in Stripe after 3 days.
        // For this task, we will mark status as 'past_due' which allows UI to warn them.

        const accountRef = getAccountDoc(accountId);
        await accountRef.update({
            subscriptionStatus: 'past_due'
        });

        await logSubscriptionEvent(accountId, 'payment_failed');
    } catch (err) {
        console.error('Failed to handle invoice payment failed:', err);
    }
}
