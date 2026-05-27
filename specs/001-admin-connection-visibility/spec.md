# Feature Specification: Account-Wide Connection Visibility for Owners and Admins

**Feature Branch**: `001-admin-connection-visibility`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "When i log in with the account owneer the COnnection network should show all connections within the account. Currently i see only my own connections. (which are 0 for now). But when i log in with another user that has had a conneciton i see that map. Onlly the owner and admin type useres should see all connections."

## Clarifications

### Session 2026-04-20

- Q: Is the "Administrator" role defined at the Account level (all teams) or at the Team level? → A: Account-level Admin: Role is tied to the Account; sees connections across all teams.
- Q: Should the account-wide view for Owners/Admins include all connection statuses or only completed connections? → A: Completed Only: Only show connections that have been successfully finished.
- Q: Should Owners/Admins be able to view the full details (summary, transcript, sentiment analysis) of connections they did not personally participate in? → A: Full Access (Conditional): Owners/Admins can view full details only for users who have granted access via their individual privacy settings.
- Q: What should be the default behavior for users who have not yet set their privacy tier? → A: Opt-out (Standard): Default to TIER_1 (Standard) and allow users to restrict it later.
- Q: If an account grows to thousands of connections, should we implement pagination/date-filtering for the graph view? → A: Date-filtered default: Load recent (e.g., 90 days) by default; allow user to expand range.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Owner Overview (Priority: P1)

As an Account Owner, I want to see all completed connections made by every member of my organization on the Connection Network map so that I can have a complete overview of our networking activity, while respecting individual privacy settings for detailed content.

**Why this priority**: This is the primary requirement. Owners need to oversee all successful account activity to manage the organization effectively while maintaining trust through privacy compliance.

**Independent Test**: Log in as an Account Owner. Verify that the Connection Network displays all completed connections. Attempt to view details of a connection and verify that content (summary/transcript) is only visible if participants' privacy tiers allow.

**Acceptance Scenarios**:

1. **Given** an organization has 10 completed connections spread across 5 different users, **When** the Account Owner logs in and views the Connection Network, **Then** all 10 completed connections must be visible on the map.
2. **Given** a connection exists between User A (Tier 1 - Standard) and User B (Tier 1 - Standard), **When** the Account Owner attempts to view details, **Then** the full summary and transcript must be visible.
3. **Given** a connection exists involving a User with Tier 3 (Private) settings, **When** the Account Owner views the connection on the map, **Then** the connection itself is visible but the detailed summary/transcript must be redacted or hidden.

---

### User Story 2 - Account-level Admin Overview (Priority: P1)

As an Account-level Admin, I want to see all completed connections made by every member of my organization on the Connection Network map so that I can assist in managing our network and analyzing our reach, while respecting individual privacy settings.

**Why this priority**: Account-level Admins share management responsibilities with owners and require the same level of visibility across all teams, subject to the same privacy constraints.

**Independent Test**: Log in as an Account-level Admin. Verify that the Connection Network displays all completed connections and respects privacy tiers for detailed views.

**Acceptance Scenarios**:

1. **Given** an organization has completed connections from multiple users across different teams, **When** an Account-level Admin views the Connection Network, **Then** they must see the complete set of completed connections for the entire account.

---

### User Story 3 - Regular User (Member) Privacy (Priority: P2)

As a Regular User (Member), I want to see only my own completed connections on the Connection Network map and have my privacy settings respected when others view my activity.

**Why this priority**: Ensures that the default view for non-privileged users remains focused and respects existing data access patterns and personal privacy choices.

**Independent Test**: Log in as a Regular User (Member). Verify that only the logged-in user's completed connections are visible. Verify that their own privacy tier controls what others see.

**Acceptance Scenarios**:

1. **Given** I am a Regular User (Member) with 2 completed connections and my colleague has 3, **When** I view the Connection Network, **Then** only my 2 completed connections are visible.

---

### Edge Cases

- **Mixed Privacy Tiers**: If one participant in a connection allows full access (Tier 1) but the other restricts it (Tier 3), the system MUST default to the more restrictive setting (e.g., hide transcript/summary) to ensure privacy for both parties.
- **Default Privacy Tier**: New users or users who have not configured their privacy settings MUST default to TIER_1 (Standard) visibility, allowing Owners/Admins full access to their connection details until they explicitly change to a more restrictive tier.
- **High Volume Scaling**: For organizations with >1000 connections, the system MUST implement a 90-day default window for the Connection Network graph to maintain performance.
- **No Connections**: What happens when an Account Owner logs in to a new account with zero completed connections across all users? The map should show an empty state or a helpful "Getting Started" message rather than an error.
- **Role Changes**: If a Regular User is promoted to Account-level Admin, their view should immediately update to show all account completed connections upon the next page load/refresh.
- **Account Isolation**: Ensure that Account Owners/Admins *only* see completed connections for their own organization, never from other organizations on the platform.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identify the user's role (Owner, Account-level Admin, or Regular User/Member) upon login.
- **FR-002**: System MUST identify the organization (Account) associated with the logged-in user.
- **FR-003**: For Account Owners and Account-level Admins, the Connection Network MUST aggregate and display all completed connection records linked to their specific organization ID.
- **FR-004**: For Regular Users (Members), the Connection Network MUST only display completed connection records where the `userId` matches the logged-in user's ID.
- **FR-005**: The system MUST ensure strict data isolation between different organizations/accounts.
- **FR-006**: System MUST enforce individual user privacy settings (Privacy Tiers) when Owners or Admins attempt to view detailed connection content (summaries, transcripts, sentiment).
- **FR-007**: If any participant in a connection has a restrictive privacy setting (e.g., TIER_3_PRIVATE), detailed content MUST be hidden from Owners/Admins who were not participants in that specific connection.
- **FR-008**: System MUST default unconfigured user privacy settings to TIER_1 (Standard).
- **FR-009**: The Connection Network graph MUST default to showing connections from the last 90 days for Owners/Admins, with controls provided to expand or shift the date range.

### Key Entities *(include if feature involves data)*

- **User**: Represents an individual with a specific role (Owner, Account-level Admin, Regular User/Member), an association with an Account, and a `privacyTier` setting.
- **Account (Organization)**: Represents the top-level entity that owns a set of connections and users.
- **Connection**: A record of a networking event, linked to both a specific User (creator) and an Account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of completed connections belonging to an organization are visible to the Account Owner and Account-level Admins.
- **SC-002**: 0% of completed connections belonging to other users are visible to Regular Users (Members).
- **SC-003**: 100% compliance with individual privacy settings; no summary/transcript data is leaked to non-participants if a participant has restricted access.
- **SC-004**: The Connection Network map loads and renders all visible completed connections within 2 seconds for a typical account (up to 500 connections).
- **SC-005**: Zero instances of "cross-account" data leakage (Owner seeing connections from a different organization).
