# Feature Specification: Manage Team Roles

**Feature Branch**: `002-manage-team-roles`  
**Created**: March 25, 2026  
**Status**: Draft  
**Input**: User description: "Allow Admins and Owners to change existing team member roles from the Team management page. They cannot be removed from the 'All Members' team. They can be removed from other teams. The owner cannot be changed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Role Update (Priority: P1)

As an Admin or Owner, I want to update the role of an existing team member from the Team management page so that I can delegate responsibilities or restrict access as needed.

**Why this priority**: Core functionality requested to manage user permissions within the organization.

**Independent Test**: Can be tested by an Admin user selecting another team member and successfully changing their role from 'member' to 'admin' (or vice versa) and verifying the change persists in Firestore.

**Acceptance Scenarios**:

1. **Given** I am logged in as an 'admin' or 'owner', **When** I visit the Team management page, **Then** I should see an option to change the role for other team members.
2. **Given** I am changing a member's role, **When** I select a new role and save, **Then** the `TeamMember` record's `role` field is updated in Firestore.

---

### User Story 2 - Team Membership Management (Priority: P1)

As an Admin or Owner, I want to remove members from specific sub-teams while ensuring they remain part of the "All Members" group.

**Why this priority**: Essential for maintaining organizational structure while preserving base account access for all users.

**Independent Test**: Can be tested by attempting to remove a user from a custom team (should succeed) and attempting to remove them from the "All Members" team (should fail/be disabled).

**Acceptance Scenarios**:

1. **Given** a user is in multiple teams, **When** I attempt to remove them from a specific team that is NOT 'All Members', **Then** the removal should succeed.
2. **Given** a user is in the 'All Members' team, **When** I attempt to remove them from 'All Members', **Then** the action should be blocked or the option should be unavailable.

---

### User Story 3 - Owner Protection (Priority: P2)

As the system, I must ensure that the 'Owner' role remains unchanged to prevent accidental lockouts or security breaches.

**Why this priority**: Critical for security and account stability.

**Independent Test**: Can be tested by an Admin or the Owner attempting to change the Owner's role on the Team page and verifying the action is impossible.

**Acceptance Scenarios**:

1. **Given** I am on the Team management page, **When** I view the account 'Owner', **Then** the role selection should be disabled and clearly marked as unchangeable.

---

### Edge Cases

- **Self-Demotion**: Admins and Owners cannot change their own roles; another user with appropriate permissions (another Admin or Owner) must perform the action.
- **Stripe Tier Limits**: Does changing a role affect user count limits? (Assumption: No, role changes do not impact the total seat count).
- **Pending Invitations**: Can a role be changed for a user who hasn't accepted their invite yet? (Requirement: Update the `Invitation` record's `role` field).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a UI component on the Team management page for Admins/Owners to select a new role ('admin' or 'member') for team members.
- **FR-002**: System MUST validate that the 'All Members' team (default team) membership cannot be revoked for any user.
- **FR-003**: System MUST permit the removal of users from non-default teams.
- **FR-004**: System MUST strictly prevent any modification to the role of the account 'Owner'.
- **FR-005**: System MUST update the corresponding `TeamMember` and/or `Invitation` records in Firestore upon role modification.
- **FR-006**: Role management actions MUST be restricted to users with 'admin' or 'owner' roles.

### Key Entities *(include if feature involves data)*

- **TeamMember**: Represents a user's role and membership within a specific team.
- **Invitation**: Represents a pending request for a user to join the organization with a specific role.
- **Account**: Used to identify the 'Owner' of the organization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of role updates by authorized users are persisted within 1 second.
- **SC-002**: 0% of attempts to change the 'Owner' role succeed.
- **SC-003**: 0% of users are successfully removed from the 'All Members' team through the management UI.
- **SC-004**: Team management UI updates reflect the new roles immediately upon successful Firestore write.
