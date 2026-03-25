# Data Model: Manage Team Roles

## Entity Updates

### TeamMember
- `role`: (Existing) String field representing the user's role in the team ('admin' | 'member').
- **Constraint**: Cannot be removed from teams named 'All Members'.

### User
- `role`: (Existing) String field representing account-level role.
- **Update**: Sync with `TeamMember.role` when changes are made via Team Management.

### Account
- `ownerId`: (Existing) String UID of the primary account owner.
- **Constraint**: User with this ID cannot have their role modified.

## State Transitions

### Role Update
- **Trigger**: Admin/Owner selects new role in UI.
- **Action**: Update `TeamMember.role` and `User.role`.
- **Pre-condition**: Current user is Admin/Owner; Target user is not Account Owner; Target user is not current user (Self-Demotion Block).

### Team Removal
- **Trigger**: Admin/Owner clicks "Remove" in UI.
- **Action**: Delete `TeamMember` record.
- **Pre-condition**: Current user is Admin/Owner; Team name is not 'All Members'; Target user is not Account Owner.
