# Tasks: Stripe Subscription Management

**Feature**: Stripe Subscription Management
**Status**: Ready
**MVP Scope**: Phase 1 through Phase 3 (US1)

## Implementation Strategy
We will implement the subscription management system incrementally.
1. **Setup**: Project dependencies and environment configuration.
2. **Foundational**: Core Firestore updates and Stripe service layer.
3. **Phase 3 (US1)**: Internal 30-day trial logic (No card required).
4. **Phase 4 (US2)**: Stripe Checkout integration and paid conversion.
5. **Phase 5 (US3)**: Automated tiering based on seat count.
6. **Phase 6 (US4)**: Stripe Billing Portal and management.

## Phase 1: Setup
- [x] T001 Install stripe dependency `npm install stripe`
- [x] T002 Configure environment variables in `.env.local` per `specs/001-stripe-subscription-management/quickstart.md`
- [x] T003 [P] Create Stripe Price IDs in Stripe Dashboard for Launchpad, Growth, and Culture tiers

## Phase 2: Foundational
- [x] T004 Update `types/firestore.ts` with new `Organization` subscription fields and `SubscriptionLog` interface
- [x] T005 [P] Implement Stripe client utility in `lib/payments/stripe.ts`
- [x] T006 Implement subscription utility functions (e.g., `getTierFromUserCount`) in `lib/payments/utils.ts`
- [x] T007 [P] Update Firestore organization converters in `lib/firebase/firestore.ts` to include subscription fields
- [x] T026 Implement `logSubscriptionEvent` helper in `lib/payments/utils.ts` to populate `SubscriptionLog` collection

## Phase 3: User Story 1 - Start 30-Day Free Pilot
**Goal**: Automatically start a 30-day trial for new organizations without a credit card.
**Independent Test**: Create an org and verify `trialEndsAt` is set and status is `trialing`.

- [x] T008 [US1] Update organization creation logic to set initial `subscriptionStatus: 'trialing'` and `trialEndsAt` (now + 30 days) in `lib/actions/organization.ts`
- [x] T009 [US1] Create a middleware or layout-level check to display trial status/remaining days in `components/dashboard/trial-banner.tsx`
- [x] T010 [US1] Implement "Hard Limit" check in member invitation logic to block adding > 9 users during trial in `lib/actions/members.ts`
- [x] T011 [US1] Add UI feedback/modal for the 9-user limit in `components/invite-member-dialog.tsx`

## Phase 4: User Story 2 - Convert to Paid Subscription
**Goal**: Allow admins to upgrade to a paid plan via Stripe Checkout.
**Independent Test**: Complete checkout and verify status becomes `active` in Firestore.

- [x] T012 [US2] Implement `createCheckoutSession` server action in `lib/payments/actions.ts`
- [x] T013 [P] [US2] Create billing settings page in `app/(dashboard)/settings/billing/page.tsx`
- [x] T014 [US2] Create Stripe webhook handler for `checkout.session.completed` in `app/api/stripe/webhook/route.ts`
- [x] T015 [US2] Implement subscription sync logic and log `paid_started` event in `lib/payments/webhook-handlers.ts` when payment succeeds
- [x] T016 [US2] Create "Subscription Required" guard page in `app/(dashboard)/subscription-required/page.tsx`

## Phase 5: User Story 3 - Automatic Tier Adjustments
**Goal**: Sync seat count to Stripe and swap Price IDs as team grows/shrinks.
**Independent Test**: Add 10th member and verify Stripe subscription price ID changes.

- [x] T017 [US3] Implement `updateSubscriptionQuantity` helper to sync user count to Stripe in `lib/payments/stripe.ts`
- [x] T018 [US3] Add hook to member add/remove actions to trigger Stripe quantity/price sync in `lib/actions/members.ts`
- [x] T019 [US3] Create Stripe webhook handler for `customer.subscription.updated` to sync tier changes back to Firestore in `app/api/stripe/webhook/route.ts`

## Phase 6: User Story 4 - Manage Billing via Portal
**Goal**: Provide access to the Stripe Customer Portal for invoice/card management.
**Independent Test**: Verify redirection to Stripe Portal from dashboard.

- [x] T020 [US4] Implement `createPortalSession` server action in `lib/payments/actions.ts`
- [x] T021 [US4] Add "Manage Billing" button to the billing settings page in `app/(dashboard)/settings/billing/page.tsx`

## Phase 7: Polish & Cross-cutting
- [x] T022 Implement grace period logic (3 days) for payment failures in `lib/payments/webhook-handlers.ts`
- [x] T023 Add subscription status checks to `app/(dashboard)/layout.tsx` to enforce access control (excluding `billing` and `subscription-required` routes)
- [x] T024 [P] Update `GEMINI.md` with final implementation details and commands
- [x] T025 [P] Performance validation: Verify upgrade flow takes < 3 mins (SC-003) and webhook updates reflect in < 30s (SC-004)

## Dependencies
- US2 (Paid Conversion) depends on US1 (Trial) being established.
- US3 (Tiering) depends on US2 (Paid Subscription) existing in Stripe.
- US4 (Portal) depends on US2 (Stripe Customer ID) existing.

## Parallel Execution
- T003, T005, T007 can be done in parallel.
- T013 can be developed in parallel with T012.
