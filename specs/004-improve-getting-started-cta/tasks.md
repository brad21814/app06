# Tasks: Improve Getting Started CTA

**Input**: Design documents from `/specs/004-improve-getting-started-cta/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Update Account interface in types/firestore.ts to include `hasReviewedThemes: boolean`
- [x] T002 Update User interface in types/firestore.ts to ensure `hasDismissedGettingStarted: boolean` is present

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and data access functions

- [x] T003 [P] Implement `getAccount(accountId: string)` in lib/firebase/firestore.ts
- [x] T004 [P] Implement `updateAccount(accountId: string, data: Partial<Account>)` in lib/firebase/firestore.ts
- [x] T005 [P] Implement `getAccountActiveSchedules(accountId: string)` in lib/firebase/firestore.ts

---

## Phase 3: User Story 1 - Admin/Owner Global Visibility (Priority: P1) 🎯 MVP

**Goal**: Ensure the checklist is visible on all dashboard pages for authorized roles.

**Independent Test**: Log in as 'admin' or 'owner', navigate to any `/dashboard/*` sub-page, and verify the checklist appears. Log in as 'member' and verify it is hidden.

### Implementation for User Story 1

- [x] T006 [P] Update OnboardingChecklist visibility logic in components/dashboard/checklist.tsx to check for 'admin' or 'owner' roles
- [x] T007 Remove OnboardingChecklist from dashboard home in app/(dashboard)/dashboard/page.tsx
- [x] T008 Add OnboardingChecklist to global dashboard layout in app/(dashboard)/layout.tsx

**Checkpoint**: User Story 1 functional - checklist is global and role-restricted.

---

## Phase 4: User Story 2 - Account-Wide Progress Tracking (Priority: P1)

**Goal**: Update checklist items to reflect progress of the entire account.

**Independent Test**: Complete a task (e.g., send an invite) and verify it shows as completed (strike-through) for all admins in the account.

### Implementation for User Story 2

- [x] T009 Update "Invite Members" completion logic in components/dashboard/checklist.tsx to use account-wide invitations check
- [x] T010 Add "Review connection themes" item to checklist in components/dashboard/checklist.tsx with completion logic based on `account.hasReviewedThemes`
- [x] T011 Add "Launch a connection schedule" item to checklist in components/dashboard/checklist.tsx with completion logic based on active schedules for the account
- [x] T012 Implement theme review tracking trigger in app/(dashboard)/themes/page.tsx using `updateAccount`
- [x] T013 Update checklist UI in components/dashboard/checklist.tsx to use strike-through formatting for completed items

**Checkpoint**: User Story 2 functional - checklist correctly reflects account-wide progress.

---

## Phase 5: User Story 3 - Persistent User Dismissal (Priority: P2)

**Goal**: Allow users to permanently dismiss the checklist.

**Independent Test**: Click 'X' on the checklist and verify it disappears and stays hidden across page reloads and different routes.

### Implementation for User Story 3

- [x] T014 Ensure `handleDismiss` in components/dashboard/checklist.tsx correctly updates the user document and hides the component globally

**Checkpoint**: User Story 3 functional - dismissal is persistent per user.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T015 Verify checklist behavior on mobile/responsive views
- [x] T016 Run quickstart.md validation to ensure all implementation steps were followed
- [x] T017 [P] Clean up any console logs or debugging code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1).
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2).
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) and User Story 1 (Phase 3) for component structure.
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3).
- **Polish (Phase 6)**: Depends on all user stories.

### Parallel Opportunities

- T003, T004, T005 can run in parallel.
- T006, T007, T008 can be started together as part of the global layout migration.
- T017 can run in parallel with polish tasks.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Implement global visibility and role restriction (User Story 1).
3. Validate that admins see the checklist everywhere and members do not.

### Incremental Delivery

1. Foundation ready.
2. Global role-based checklist added (MVP).
3. Account-wide tracking items updated/added.
4. User dismissal persistence verified.
