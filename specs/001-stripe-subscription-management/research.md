# Research Findings: Stripe Subscription Management

## Decision 1: Syncing Firestore User Counts to Stripe
- **Decision**: Real-time sync via Firestore Cloud Function or Server Action during member add/remove operations.
- **Rationale**: Ensures billing is always accurate and prevents "phantom" users from being billed. Next.js Server Actions are ideal for this as they can trigger the Stripe update immediately after the Firestore write succeeds.
- **Alternatives considered**: Scheduled daily sync (rejected due to complexity of handling mid-cycle changes and potential lag in billing accuracy).

## Decision 2: Stripe Checkout Configuration
- **Decision**: 
    - **Initial Trial**: Internal Firestore-only logic. Stripe customer is created, but no subscription is started in Stripe until the trial ends or they upgrade.
    - **Upgrade/Paid**: Stripe Checkout with `mode: 'subscription'`.
- **Rationale**: Since the trial requires *no credit card*, starting a Stripe subscription with a trial period is complex (requires a card by default in many Stripe configs). Managing the 30-day "free" period internally simplifies the initial onboarding.
- **Alternatives considered**: Stripe "Trial without Card" (requires specific setup and still complicates the 'hard limit' logic).

## Decision 3: Automatic Tiering Logic
- **Decision**: Use Stripe **Metered Billing** or **Graduated Pricing** if possible, but given the simplicity of the request, we will use a single **Price ID** that we swap on the subscription object when a tier boundary is crossed.
- **Rationale**: Simpler to implement and debug for an MVP. We listen for `customer.subscription.updated` webhooks to confirm the tier change was processed by Stripe.
- **Alternatives considered**: Metered billing (overkill for fixed seat counts).

## Decision 4: Implementing the "Hard Limit"
- **Decision**: Intercept the `invite-member` and `add-member` UI/Server Actions. If `organization.userCount >= 9` AND `organization.subscriptionStatus === 'trial'`, block the action and show an "Upgrade Required" modal.
- **Rationale**: Direct and prevents the system from entering an invalid state.
- **Alternatives considered**: Allow adding but lock the team (confusing user experience).

## Technology Best Practices
- **Stripe**: Always use `stripe-node` for server-side operations. Use `Webhooks` for source of truth on payment status.
- **Firestore**: Store `stripeSubscriptionId` and `stripeCustomerId` on the `Organization` document.
- **Security**: Validate Stripe webhook signatures using `stripe.webhooks.constructEvent`.
