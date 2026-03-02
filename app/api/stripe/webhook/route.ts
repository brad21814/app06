import { NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import {
    handleCheckoutSessionCompleted,
    handleSubscriptionUpdated,
    handleSubscriptionDeleted,
    handleInvoicePaymentFailed
} from '@/lib/payments/webhook-handlers';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
        return NextResponse.json({ error: 'Missing stripe signature or secret' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error(`Webhook handler failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
