# Contract: Team Management Server Actions

## Action: `updateTeamMemberRole`
Updates the role of a team member in both the `team_members` and `users` collections.

### Input (FormData)
- `memberId`: The ID of the `TeamMember` record.
- `role`: The new role string ('admin' | 'member').

### Validation Rules
- `memberId` must exist and belong to the current user's account.
- `role` must be one of the allowed values.
- Target user must NOT be the account `ownerId`.
- Target user must NOT be the current logged-in user (Self-Demotion Block).

### Success Response
- `{ success: 'Role updated successfully' }`

### Error Response
- `{ error: 'string describing the failure' }`

---

## Action: `removeTeamMember` (Update)
Existing action to be updated with additional safety checks.

### Additional Validation
- MUST NOT allow removal from a team named 'All Members'.
- MUST NOT allow removal of the account `ownerId`.
