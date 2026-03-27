# Research: Improve Getting Started CTA

## Decision: Implementation Strategy for Global Checklist

- **Component Location**: Keep `OnboardingChecklist` in `components/dashboard/checklist.tsx` but move its invocation from `app/(dashboard)/dashboard/page.tsx` to `app/(dashboard)/layout.tsx`.
- **Visibility Logic**: Update `OnboardingChecklist` to only render if `userData.role` is 'admin' or 'owner'.
- **Account-Wide Tracking**:
    - **Invite Members**: Use existing `getAccountInvitations(accountId)` to check for any invitations.
    - **Review Connection Themes**: Add `hasReviewedThemes: boolean` to the `Account` entity. Update the themes page (`app/(dashboard)/themes/page.tsx`) to trigger an update to the account document on first load.
    - **Launch a Connection Schedule**: Query the `schedules` collection for any document where `accountId == currentAccountId` and `status == 'active'`.
- **Dismissal**: Use existing `hasDismissedGettingStarted` on the `User` entity.

## Rationale
- Moving the component to the dashboard layout ensures it appears on all protected screens without duplicating code.
- Reusing existing Firestore utilities like `getAccountInvitations` and `updateUser` minimizes new code.
- Adding `hasReviewedThemes` to the `Account` document is the most reliable way to track this state for the entire organization.

## Alternatives Considered
- **Local State**: Rejected because completion state must persist across sessions and be shared across admins.
- **Separate Collection for Progress**: Rejected as overkill; adding fields to `Account` and `User` is simpler and more performant for these few flags.

## Dependencies
- `lib/firebase/firestore.ts`: Needs update to include `getAccount(accountId)` and `updateAccount(accountId, data)`.
- `app/(dashboard)/themes/page.tsx`: Needs a client-side effect to mark themes as reviewed.
