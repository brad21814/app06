# Quickstart: Improve Getting Started CTA

## Implementation Steps

1. **Update Firestore Utilities**:
    - Add `getAccount(accountId)` and `updateAccount(accountId, data)` to `lib/firebase/firestore.ts`.
    - Add `getAccountActiveSchedules(accountId)` to `lib/firebase/firestore.ts`.

2. **Refactor OnboardingChecklist Component**:
    - Update `components/dashboard/checklist.tsx` to handle the new checklist items.
    - Change completion logic to use the new Firestore queries.
    - Restrict visibility based on `userData.role` ('admin', 'owner').

3. **Make Checklist Global**:
    - Remove `<OnboardingChecklist />` from `app/(dashboard)/dashboard/page.tsx`.
    - Add `<OnboardingChecklist />` to `app/(dashboard)/layout.tsx` (ensure it's inside the main container).

4. **Add Theme Review Tracking**:
    - Add an `useEffect` to `app/(dashboard)/themes/page.tsx` that calls `updateAccount(accountId, { hasReviewedThemes: true })` if `hasReviewedThemes` is not already true.

## Local Verification

1. **Role Access**: Log in as a 'member' and ensure the checklist is hidden.
2. **Global Visibility**: Navigate to `/teams`, `/settings`, and `/analytics`. The checklist should remain visible.
3. **Completion States**:
    - Send an invite -> "Invite Members" should strike through.
    - Visit `/themes` -> "Review connection themes" should strike through.
    - Create/Start a schedule -> "Launch a connection schedule" should strike through.
4. **Dismissal**: Click the 'X' and ensure it disappears and does not reappear on page refresh or navigation.
