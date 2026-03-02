import Stripe from 'stripe';
import { getPriceIdFromTier, getTierFromUserCount } from './utils';
import { redirect } from 'next/navigation';
import { Team } from '@/types/firestore';
import { getUser } from '@/lib/firestore/client/queries';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-04-30.basil' as any,
  typescript: true,
});

// -- Legacy Team-Based actions --
export async function createCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer: team.stripeCustomerId || undefined,
    client_reference_id: user.id.toString(),
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14
    }
  });

  redirect(session.url!);
}

export async function createCustomerPortalSession(team: Team) {
  if (!team.stripeCustomerId || !team.stripeProductId) {
    redirect('/pricing');
  }
  return stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
  });
}

// -- New Account-Based functions --

export async function updateSubscriptionQuantity(subscriptionId: string, newCount: number) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription || !subscription.items.data.length) return;

    const subscriptionItem = subscription.items.data[0];
    const newTier = getTierFromUserCount(newCount);
    const newPriceId = getPriceIdFromTier(newTier);

    // If tier changes, update price as well. Otherwise just quantity.
    if (subscriptionItem.price.id !== newPriceId) {
        await stripe.subscriptions.update(subscriptionId, {
            items: [
                {
                    id: subscriptionItem.id,
                    price: newPriceId,
                    quantity: newCount,
                }
            ],
            proration_behavior: 'always_invoice'
        });
    } else {
        await stripe.subscriptionItems.update(subscriptionItem.id, {
            quantity: newCount,
            proration_behavior: 'always_invoice'
        });
    }
}

export async function getStripePrices() {
  // If running with dummy key (e.g. during build), return mock data
  if (process.env.STRIPE_SECRET_KEY === 'sk_test_dummy' || !process.env.STRIPE_SECRET_KEY) {
    return [];
  }

  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'recurring'
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days
  }));
}

export async function getStripeProducts() {
  // If running with dummy key (e.g. during build), return mock data
  if (process.env.STRIPE_SECRET_KEY === 'sk_test_dummy' || !process.env.STRIPE_SECRET_KEY) {
    return [];
  }

  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price']
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}

