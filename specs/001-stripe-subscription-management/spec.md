# Feature Specification: Stripe Subscription Management

**Feature Branch**: `001-stripe-subscription-management`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "lets build a feature that integrates Stripe for subscription management. We want the simplest yet well integrated and clean subscirption management. This document describes the pricing model we want to follow for subscirptions '/home/brad/Code/app06/docs/research/pricing_model.md'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start 30-Day Free Pilot (Priority: P1)

As a new organization admin, I want to start a 30-day free trial without providing a credit card, so that I can experience the value of the product before committing to a purchase.

**Why this priority**: High. This is the primary entry point for new customers and essential for the "Pilot Launch" milestone.

**Independent Test**: Can be tested by creating a new account/organization and verifying the "Trial Active" status and 30-day expiration date without a checkout flow.

**Acceptance Scenarios**:

1. **Given** a new organization is created, **When** the onboarding is completed, **Then** a 30-day free trial is automatically started for the "Launchpad" tier (limit 9 seats).
2. **Given** an active trial, **When** the admin views the dashboard, **Then** the remaining trial days are clearly displayed.

---

### User Story 2 - Convert to Paid Subscription (Priority: P1)

As an organization admin, I want to subscribe to a paid plan after the trial ends (or during the trial), so that my team can continue using the platform.

**Why this priority**: High. This is how the business generates revenue.

**Independent Test**: Can be tested by navigating to the billing section, selecting "Subscribe," completing the Stripe Checkout, and verifying the subscription status change.

**Acceptance Scenarios**:

1. **Given** an expired trial, **When** the admin visits the application, **Then** they are redirected to a "Subscription Required" page.
2. **Given** a subscription request, **When** the admin completes Stripe Checkout, **Then** the organization status is updated to "Subscribed" and the correct tier is applied based on user count.

---

### User Story 3 - Automatic Tier Adjustments (Priority: P2)

As an admin, I want my subscription price per user to automatically adjust based on the number of users in my organization, so that I always get the best rate according to the tiered pricing model.

**Why this priority**: Medium. Ensures fair pricing and incentivizes growth.

**Independent Test**: Can be tested by adding users to cross a tier threshold (e.g., from 9 to 10 users) and verifying the unit price changes in Stripe.

**Acceptance Scenarios**:

1. **Given** an organization with 9 users ($12/user), **When** a 10th user is added, **Then** the subscription is updated to the "Growth Engine" tier ($10/user).
2. **Given** an organization with 50 users ($8/user), **When** users are removed below 50, **Then** the subscription reverts to the "Growth Engine" tier ($10/user).

---

### User Story 4 - Manage Billing via Portal (Priority: P3)

As an admin, I want to manage my payment methods and view invoices through a secure portal, so that I can maintain my billing information easily.

**Why this priority**: Low. Standard self-service requirement for SaaS.

**Independent Test**: Can be tested by clicking "Manage Billing" and verifying redirection to the Stripe-hosted billing portal.

**Acceptance Scenarios**:

1. **Given** a subscribed organization, **When** the admin clicks "Manage Billing," **Then** they are redirected to the Stripe Billing Portal.
2. **Given** the Stripe Portal, **When** the admin updates a card, **Then** the changes are reflected in future billing cycles.

### Edge Cases

- **Trial Expiration during active session**: User should be prompted to subscribe on their next navigation or action after the 30-day window closes.
- **Payment Failure**: System should provide a grace period (e.g., 3 days) before locking access, handled via Stripe webhooks.
- **Exceeding Launchpad limit during trial**: If a trial user attempts to add a 10th member, the system MUST enforce a hard limit. The admin must provide a credit card and convert to a paid "Growth Engine" plan to continue adding users, which immediately ends the free trial period.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically start a 30-day trial for new organizations without requiring a credit card.
- **FR-002**: System MUST implement tiered per-user pricing:
    - Launchpad (1-9 users): $12 / user / month
    - Growth Engine (10-49 users): $10 / user / month
    - Culture Catalyst (50+ users): $8 / user / month
- **FR-003**: System MUST calculate the subscription price based on the total number of users (seats) in the organization.
- **FR-004**: System MUST sync user count changes to Stripe to ensure accurate billing for the next cycle.
- **FR-005**: System MUST restrict access to core features (Video, AI Analysis, Bond Cards) if a trial expires or a subscription becomes delinquent.
- **FR-006**: System MUST provide a "Billing" section in the Admin Dashboard for subscription status and management.
- **FR-007**: System MUST use Stripe Webhooks to handle subscription updates, payment successes, and payment failures.

### Key Entities

- **Subscription**: Represents the billing state of an organization. Attributes: Status (Trialing, Active, Past Due, Canceled), Current Tier, Period End Date.
- **Organization**: The billing unit. Contains a list of Users and a reference to its Subscription.
- **User**: Represents a "seat" in the organization. The count of active users determines the subscription cost.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new organizations successfully start a 30-day trial upon sign-up.
- **SC-002**: Subscription pricing matches the tiered model ($12, $10, $8) with 100% accuracy in Stripe invoices.
- **SC-003**: Admins can complete the upgrade from trial to paid subscription in under 3 minutes (excluding card entry time).
- **SC-004**: System correctly reflects subscription status changes (e.g., "Active" to "Past Due") within 30 seconds of receiving a Stripe webhook.
