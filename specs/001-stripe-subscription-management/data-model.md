# Data Model: Stripe Subscription Management

## Entities

### Organization (Existing - Enhanced)
Represented in `/organizations/{orgId}`.
- `id`: string
- `name`: string
- `ownerId`: string (UID)
- `userCount`: number (Counter of active users)
- `stripeCustomerId`: string (Reference to Stripe Customer)
- `subscriptionStatus`: 'trialing' | 'active' | 'past_due' | 'canceled'
- `subscriptionTier`: 'launchpad' | 'growth' | 'culture'
- `trialEndsAt`: Timestamp (Date trial expires)
- `currentPeriodEnd`: Timestamp (Sync from Stripe)

### SubscriptionLog (New)
Represented in `/organizations/{orgId}/subscriptionLogs/{logId}`.
- `id`: string
- `type`: 'trial_started' | 'paid_started' | 'tier_changed' | 'payment_failed'
- `fromTier`: string
- `toTier`: string
- `createdAt`: Timestamp

## Validation Rules
- **Member Addition**: If `org.subscriptionStatus === 'trialing'` AND `org.userCount >= 9`, block addition.
- **Tier Determination**:
  - 1-9 users -> `launchpad`
  - 10-49 users -> `growth`
  - 50+ users -> `culture`

## State Transitions
1. **New Org** -> `trialing` (30 days, no card)
2. **Trialing** -> `active` (via Stripe Checkout)
3. **Active** -> `past_due` (via Webhook: `invoice.payment_failed`)
4. **Active/Trialing** -> `canceled` (Manual or Trial Expired)
