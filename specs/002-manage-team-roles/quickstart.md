# Quickstart: Manage Team Roles

## Development Setup
- Ensure Firestore emulator is running or connected to a development project.
- Seed data with at least one 'owner', one 'admin', and one 'member'.
- Create a sub-team in addition to the default 'All Members' team.

## Verification Steps

### 1. Update Role
- Log in as an **Admin**.
- Navigate to `/teams`.
- Change a user's role from **Member** to **Admin**.
- Refresh the page and verify the role change persists in the UI and Firestore.

### 2. Remove from Sub-team
- Ensure a user is in both 'All Members' and a custom 'Sub-team'.
- Log in as an **Owner**.
- Remove the user from the 'Sub-team'.
- Verify the user is still listed in 'All Members'.

### 3. Safety Constraints
- Try to remove a user from 'All Members' (Button should be disabled or action should fail).
- Try to change the role of the **Owner** (Action should be blocked).
- Try to demote yourself (Action should be blocked).
