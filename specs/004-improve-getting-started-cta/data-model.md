# Data Model: Improve Getting Started CTA

## Entity Updates

### User (Collection: `users`)
- `hasDismissedGettingStarted`: boolean (Already exists, per-user dismissal state)

### Account (Collection: `accounts`)
- `hasReviewedThemes`: boolean (NEW, marks if *anyone* in the account has viewed the themes page)

## Validation Rules
- `hasReviewedThemes` must be updated to `true` on the first visit to the `/themes` page by any Admin/Owner.
- `hasDismissedGettingStarted` must be updated to `true` when the user clicks the 'X' on the checklist.

## State Transitions
- **Invite Members**: `completed = true` if `invitations` collection where `accountId == currentAccountId` count > 0.
- **Review Connection Themes**: `completed = true` if `accounts[currentAccountId].hasReviewedThemes == true`.
- **Launch a Connection Schedule**: `completed = true` if `schedules` collection where `accountId == currentAccountId` AND `status == 'active'` count > 0.
