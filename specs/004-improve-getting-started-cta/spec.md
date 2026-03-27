# Feature Specification: Improve Getting Started CTA

**Feature Branch**: `004-improve-getting-started-cta`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "Improve the 'Getting Started' call to action. make it present on all screens. - Only show for admins and owner user types - check for successful sending of invites, not for the user but for the account as whole, has the account sent invites. If invites have been sent then mark that item as complete and use strike through text formatting. - Check for the loading of the themes page, not for the user but for the account as whole. Title this line item 'Review connection themes'. Upon first loading of the themes page mark this item complete with strike through text formatting. - check for the creation and starting of a schedule, not for the user but for the account as whole. Name this item Launch a connection schedule' - Clicking the close icon will close it for the user and they will not see it again regardless of the status of the 3 getting started items. Be sure to review the current implimentation thourghlly"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin/Owner Global Visibility (Priority: P1)

As an Admin or Owner, I want to see the "Getting Started" checklist on every page of the application so that I am always aware of the next steps required to set up my account.

**Why this priority**: High priority because it ensures the onboarding guidance is always visible and accessible to the decision-makers (Admins/Owners) during the initial setup phase.

**Independent Test**: Log in as an Admin or Owner and navigate through different pages (Dashboard, Settings, Teams, etc.). The checklist should appear on all of them.

**Acceptance Scenarios**:

1. **Given** I am logged in as an 'admin' or 'owner', **When** I navigate to any page within the dashboard, **Then** I should see the "Getting Started" checklist.
2. **Given** I am logged in as a regular 'member', **When** I navigate to any page, **Then** I should NOT see the "Getting Started" checklist.

---

### User Story 2 - Account-Wide Progress Tracking (Priority: P1)

As an Admin, I want the checklist to reflect the progress of the entire account, so that I don't see tasks as "incomplete" if another administrator has already performed them.

**Why this priority**: Essential for collaborative environments where multiple admins might be setting up the account. It prevents redundant work and provides a shared source of truth.

**Independent Test**: Have one admin invite a member, and verify that a second admin sees the "Invite Members" task as completed (strike-through).

**Acceptance Scenarios**:

1. **Given** no invites have been sent for the account, **When** any admin sends an invite, **Then** the "Invite Members" task should be marked complete with strike-through text for all admins/owners in that account.
2. **Given** the themes page has never been visited, **When** any admin visits the themes page, **Then** the "Review connection themes" task should be marked complete with strike-through text for all admins/owners.
3. **Given** no schedule exists, **When** a schedule is created and started for the account, **Then** the "Launch a connection schedule" task should be marked complete with strike-through text.

---

### User Story 3 - Persistent User Dismissal (Priority: P2)

As a user, I want to be able to close the checklist permanently if I find it distracting or no longer relevant, even if some items are not yet complete.

**Why this priority**: Important for user experience and preventing annoyance once the user has decided they no longer need the guidance.

**Independent Test**: Click the 'X' button on the checklist and refresh the page or navigate to other pages to ensure it doesn't reappear.

**Acceptance Scenarios**:

1. **Given** the checklist is visible, **When** I click the close icon, **Then** the checklist should disappear immediately and never show again for my user account, regardless of the completion status of the items.

---

### Edge Cases

- **Account with no owner/admin**: The checklist should not show if no one has the required role (though typically an account always has an owner).
- **Simultaneous actions**: If two admins complete different tasks at the same time, the checklist should ideally update to show both as completed on next load.
- **Empty Account ID**: If a user is not associated with an account yet, the checklist should not attempt to fetch account-wide data and should probably remain hidden.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Getting Started" component MUST be moved or integrated into a global layout so it appears on all application screens.
- **FR-002**: The system MUST restrict checklist visibility to users with 'admin' or 'owner' roles.
- **FR-003**: The checklist MUST contain exactly three items:
    1. "Invite Members"
    2. "Review connection themes"
    3. "Launch a connection schedule"
- **FR-004**: "Invite Members" MUST be marked complete if the `invitations` collection contains any records for the current `accountId`.
- **FR-005**: "Review connection themes" MUST be marked complete if the account has been flagged as having "reviewed themes".
- **FR-006**: "Launch a connection schedule" MUST be marked complete if a schedule exists and is active for the account.
- **FR-007**: Completed items MUST use strike-through text formatting and a visual checkmark.
- **FR-008**: The system MUST persist a "dismissed" state per-user once the close icon is clicked.

### Key Entities

- **Account**: Represents the organization. Will need a flag like `hasReviewedThemes` (boolean).
- **User**: Represents the individual. Stores `hasDismissedGettingStarted` (boolean).
- **Invitation**: Tracked for the account to determine if members have been invited.
- **Schedule**: Tracked for the account to determine if a connection schedule has been launched.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Checklist is visible to 100% of Admins/Owners on all dashboard routes until dismissal.
- **SC-002**: 0% visibility of the checklist for 'member' role users.
- **SC-003**: Checklist completion state correctly reflects account-wide data within 1 second of page load.
- **SC-004**: Dismissal is 100% persistent across sessions and different pages for the dismissing user.
