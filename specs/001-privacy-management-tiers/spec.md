# Feature Specification: Privacy Management Tiers

**Feature Branch**: `001-privacy-management-tiers`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Implement privacy management feature whereby each user upon registering for the first time can sit simple privacy management which has three basic tiers. Tier one, the and then full access to the transcripts, tier two, where they don't allow full access to transcripts. Summaries that they approve manually and tier three where transcripts and engagement making transcripts. And do not share any transcript information. We should capture this basic preference on a member's first sign up. And we should also have a settings page for the user to manage their privacy settings as part of their standard preferences."

## Clarifications

### Session 2026-03-01
- Q: How should Tier 2 manual approval granularity be handled? → A: Individual Approval - every summary requires a discrete manual action to finalize for users in this tier.
- Q: What actions are available to users when reviewing a Tier 2 summary? → A: Approval Only - User can only Approve or Reject; no editing allowed.
- Q: When should Tier 3 restrictions activate if changed during an active session? → A: Next Session - The new Tier 3 rules only apply to sessions started after the change.
- Q: What happens when a user Rejects a Tier 2 summary? → A: Delete Immediately - The summary and its associated data are permanently removed.
- Q: What should the privacy settings section be named? → A: Privacy Management - Direct and functionally descriptive.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Privacy Selection (Priority: P1)

As a new user registering for the service, I want to choose my privacy level immediately so that I know how my data will be handled from the start.

**Why this priority**: Critical for legal compliance and establishing user trust. It's the primary entry point for the feature.

**Independent Test**: Can be tested by completing a new user registration flow and verifying that the privacy selection is presented and saved.

**Acceptance Scenarios**:

1. **Given** a new user on the final step of registration, **When** they are presented with three privacy tiers, **Then** they must select one before completing registration.
2. **Given** a selected privacy tier during registration, **When** the account is created, **Then** the selected tier is correctly associated with the user's profile.

---

### User Story 2 - Privacy Settings Management (Priority: P2)

As a registered user, I want to view and change my privacy tier in my account settings so that I can adjust my preferences as my needs change.

**Why this priority**: Provides ongoing control and transparency, which is essential for user retention and data rights.

**Independent Test**: Can be tested by navigating to the settings page, changing the tier, and verifying the update persists after a page refresh.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the settings page, **When** they view their privacy preferences, **Then** their current active tier is clearly displayed.
2. **Given** a user changes their tier in settings, **When** they save changes, **Then** the system updates their data handling behavior accordingly.

---

### User Story 3 - Tier-Specific Data Handling (Priority: P3)

As a user, I want the system to respect my chosen privacy tier (e.g., requiring manual approval for Tier 2 summaries) so that my data is processed exactly as I requested.

**Why this priority**: This is the functional "teeth" of the feature, ensuring the selection actually changes system behavior.

**Independent Test**: Can be tested by attempting to access a transcript or summary under different tier settings and verifying the access/approval logic triggers correctly.

**Acceptance Scenarios**:

1. **Given** a user is on Tier 2, **When** a summary is generated, **Then** it remains in a 'Pending Approval' state until the user manually reviews it.
2. **Given** a user is on Tier 3, **When** a session concludes, **Then** no transcript data is shared or stored in accessible formats.

---

### Edge Cases

- **No Selection during Onboarding**: How does the system handle a user who tries to bypass the selection? (Assumption: The "Next" button is disabled until a tier is selected).
- **Tier Downgrade**: If a user moves from Tier 1 to Tier 3, what happens to existing transcripts? (Assumption: Existing transcripts remain but new ones follow Tier 3 rules; users can optionally delete old ones).
- **Failed Save**: How does the system handle a database error when saving the preference? (Requirement: Show a retry option and prevent proceeding until saved).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present three distinct privacy tiers during the initial user onboarding/registration flow.
- **FR-002**: System MUST persist the user's privacy tier selection in their profile data.
- **FR-003**: System MUST provide a "Privacy Management" section within the user preferences page.
- **FR-004**: **Tier 1 (Standard)**: System MUST allow full access to transcripts for AI processing and sharing as per standard service terms.
- **FR-005**: **Tier 2 (Controlled)**: System MUST restrict direct transcript access and MUST require manual user approval for any generated summaries before they are shared or finalized.
- **FR-006**: **Tier 3 (Private)**: System MUST NOT share or store transcript information in a way that allows access; engagement features (transcripts) MUST use local/non-persistent processing that is never saved or shared externally. This restriction MUST apply to all sessions started AFTER the Tier 3 setting is enabled.
- **FR-007**: System MUST automatically assign Tier 1 (Standard) to existing users who have not set a privacy tier, and MUST display a non-intrusive notification informing them of their default setting and how to change it.
- **FR-008**: The manual approval workflow for Tier 2 summaries MUST utilize an In-App Notification Center, where every individual summary requires a discrete manual approval action (Approve or Reject only; no editing). REJECTION MUST result in the immediate and permanent deletion of the summary and its associated data.

### Key Entities *(include if feature involves data)*

- **User Profile**: Stores the `privacyTier` attribute (Enum: TIER_1, TIER_2, TIER_3).
- **Transcript/Summary**: Data entities whose visibility and processing state are governed by the user's `privacyTier`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new users have a privacy tier assigned upon completion of registration.
- **SC-002**: Users can update their privacy tier in settings in fewer than 3 clicks from the dashboard.
- **SC-003**: 0% of Tier 3 transcripts are accessible via standard sharing or processing APIs.
- **SC-004**: Tier 2 summaries are never shared or finalized without a recorded user approval event.
