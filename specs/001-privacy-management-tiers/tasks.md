# Tasks: Privacy Management Tiers

**Feature**: Privacy Management Tiers
**Branch**: `001-privacy-management-tiers`
**Implementation Strategy**: MVP first (US1), then incremental delivery of settings (US2) and data handling logic (US3).

## Phase 1: Setup

- [X] T001 Verify project structure and environment variables for Firestore emulators

## Phase 2: Foundational

- [X] T002 [P] Define `PrivacyTier` and `SummaryStatus` enums in `types/firestore.ts`
- [X] T003 [P] Update `User` and `Summary` interfaces in `types/firestore.ts` with new fields
- [X] T004 [P] Update Firestore converters in `lib/firebase/firestore.ts` (or relevant service) to handle `privacyTier`

## Phase 3: [US1] Initial Privacy Selection (Priority: P1)

- [X] T005 [US1] Create `updatePrivacyTier` server action in `lib/actions/privacy.ts`
- [X] T006 [P] [US1] Create `PrivacySelectionForm` component in `components/auth/privacy-selection-form.tsx`
- [X] T007 [US1] Integrate `PrivacySelectionForm` into the registration flow in `app/(login)/sign-up/page.tsx`
- [X] T008 [US1] Implement validation to ensure a tier is selected before account creation completes in `app/(login)/sign-up/page.tsx`

## Phase 4: [US2] Privacy Settings Management & Migration (Priority: P2)

- [X] T009 [P] [US2] Create `PrivacyManager` component in `components/settings/privacy-manager.tsx`
- [X] T010 [US2] Create Privacy Management settings page at `app/(dashboard)/profile/privacy/page.tsx`
- [X] T011 [P] [US2] Create `MissingTierNotification` component in `components/dashboard/missing-tier-notification.tsx`
- [X] T012 [US2] Integrate `MissingTierNotification` into the global dashboard layout in `app/(dashboard)/layout.tsx`

## Phase 5: [US3] Tier-Specific Data Handling & Tier 2 Approval UI (Priority: P3)

- [X] T013 [US3] Create `approveSummary` and `rejectSummary` server actions in `lib/actions/summary.ts`
- [X] T014 [P] [US3] Create `NotificationCenter` component in `components/dashboard/notification-center.tsx` for summary approvals
- [X] T015 [US3] Implement status logic for Tier 2 (PENDING_APPROVAL) in the summary generation service
- [X] T016 [US3] Implement storage restriction logic for Tier 3 users in the transcript service

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 Final UI/UX polish for all privacy-related components (Tailwind CSS)
- [ ] T018 Verify SC-001 to SC-004 through end-to-end testing as described in `quickstart.md`

## Dependencies

- Foundational tasks (Phase 2) MUST be completed before User Stories.
- US1 (Phase 3) is the primary entry point for new data.
- US2 (Phase 4) depends on the server actions created in Phase 3 or 4.
- US3 (Phase 5) implements the actual data handling logic based on tiers set in US1/US2.

## Parallel Execution Examples

- **Story 1 (US1)**: T006 (UI) can be developed in parallel with T005 (Action).
- **Story 2 (US2)**: T009 (UI) and T011 (Notification UI) can be developed in parallel.
- **Story 3 (US3)**: T014 (UI) can be developed in parallel with T013 (Actions).
