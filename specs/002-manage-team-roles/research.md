# Research: Manage Team Roles

## Decision: Identifying 'All Members' Team
- **Action**: Identify the default team by checking for the name 'All Members' (case-insensitive) on the team document associated with the `TeamMember` record.
- **Rationale**: Based on migration scripts and `TASK010`, the default team was renamed from 'General' to 'All Members'. Checking by name ensures consistency across the UI and server logic.
- **Alternatives considered**: 
    - Using a boolean flag like `isDefault`: Rejected as it requires a schema change and migration for existing teams.

## Decision: Role Source of Truth
- **Action**: Update both `User.role` and `TeamMember.role` when a role change occurs.
- **Rationale**: `User.role` is typically used for account-wide access (Admin vs Member), while `TeamMember.role` might be used for team-specific contexts. Keeping them in sync prevents authorization discrepancies.
- **Alternatives considered**: 
    - Updating only `TeamMember.role`: Rejected as most auth checks in the current codebase (`getUser`) rely on `User.role`.

## Decision: Protecting the Owner
- **Action**: The user identified by `Account.ownerId` is the "Source of Truth" for the owner. Their role is immutable.
- **Rationale**: This follows the requirement that the "owner cannot be changed" and prevents accidental removal of the primary account controller.
- **Alternatives considered**: 
    - Checking for role string 'owner': Rejected as multiple users might have 'owner' role string, but only one is the primary account owner defined in the `Account` document.

## Best Practices: Server Actions
- **Task**: Use `zod` for input validation and `useActionState` for UI feedback.
- **Rationale**: Consistent with existing patterns in `app/(login)/actions.ts` and `app/(dashboard)/teams/page.tsx`.
