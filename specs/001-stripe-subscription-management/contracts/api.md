# Interface Contracts: Stripe Subscription Management

## Server Actions (lib/payments/actions.ts)

### `createCheckoutSession(orgId: string): Promise<{ url: string }>`
- **Purpose**: Creates a Stripe Checkout session for an organization.
- **Rules**:
    - Must verify user is an admin of `orgId`.
    - Must determine correct Price ID based on current `org.userCount`.
    - Must set `customer` if `org.stripeCustomerId` exists.
- **Success Outcome**: Returns Stripe Checkout URL.
- **Error Outcome**: Throws if unauthorized or Stripe error.

### `createPortalSession(orgId: string): Promise<{ url: string }>`
- **Purpose**: Redirects user to Stripe Billing Portal.
- **Rules**:
    - Must verify user is an admin.
    - `org.stripeCustomerId` MUST exist.
- **Success Outcome**: Returns Stripe Portal URL.

## Webhook Endpoints (app/api/stripe/webhook/route.ts)

### `POST /api/stripe/webhook`
- **Purpose**: Handles asynchronous events from Stripe.
- **Critical Events**:
    - `checkout.session.completed`: Mark subscription as `active`. Update `org.stripeCustomerId` and `org.stripeSubscriptionId`.
    - `customer.subscription.updated`: Update `org.subscriptionStatus`, `org.subscriptionTier`, and `org.currentPeriodEnd`.
    - `customer.subscription.deleted`: Mark `org.subscriptionStatus` as `canceled`.
    - `invoice.payment_failed`: Mark `org.subscriptionStatus` as `past_due`.
- **Validation**: MUST verify `stripe-signature` header.
- **Responses**:
    - 200: Successfully processed.
    - 400: Signature verification failed.
    - 404: Organization not found.
