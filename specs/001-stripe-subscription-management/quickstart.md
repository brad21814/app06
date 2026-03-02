# Quickstart: Stripe Subscription Management

## Setup Requirements

### Stripe Configuration
1. Create 3 Recurring Products in Stripe Dashboard:
   - **Launchpad**: $12 / user / month
   - **Growth Engine**: $10 / user / month
   - **Culture Catalyst**: $8 / user / month
2. Create a Webhook Endpoint in Stripe CLI/Dashboard:
   - URL: `https://[your-domain]/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### Environment Variables (.env.local)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID_LAUNCHPAD=price_...
STRIPE_PRICE_ID_GROWTH=price_...
STRIPE_PRICE_ID_CULTURE=price_...
```

## Running the Feature

### 1. Initial Trial
- Create a new organization.
- Observe `trialEndsAt` is set to 30 days in the future.
- Access dashboard features.

### 2. Testing the "Hard Limit"
- Add 9 members to the organization.
- Attempt to add a 10th member.
- Verify the "Upgrade Required" modal appears and blocks the action.

### 3. Upgrading to Paid
- Click "Upgrade" in the billing settings.
- Complete Stripe Checkout.
- Verify `subscriptionStatus` becomes `active`.

### 4. Testing Tier Changes
- Add more members (e.g., up to 15).
- Verify the Price ID in the Stripe Subscription is updated to the "Growth Engine" price.

## Validation Commands
```bash
# Test Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
