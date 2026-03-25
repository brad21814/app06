# Tasks: Manage Team Roles

**Input**: Design documents from `/specs/002-manage-team-roles/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and initial checks

- [X] T001 Review `types/firestore.ts` to ensure `ActivityType` has `UPDATE_TEAM_MEMBER_ROLE`
- [X] T002 [P] Review `app/(dashboard)/teams/page.tsx` component hierarchy for integration points

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and data access helpers

- [X] T003 Add `getAccount` helper to `lib/firestore/admin/queries.ts` to fetch account details by ID
- [X] T004 Update `app/api/team/route.ts` to include `ownerId` from the `Account` in the JSON response
- [X] T005 [P] Update `ActivityType` in `types/firestore.ts` if `UPDATE_TEAM_MEMBER_ROLE` was missing

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Role Update (Priority: P1) 🎯 MVP

**Goal**: Admins and Owners can change member roles via the Team management page.

**Independent Test**: Log in as an Admin, change another member's role to Admin, and verify the `role` field is updated in both `users` and `team_members` collections in Firestore.

### Implementation for User Story 1

- [X] T006 [US1] Implement `updateTeamMemberRoleSchema` and `updateTeamMemberRole` server action in `app/(login)/actions.ts`
- [X] T007 [US1] Implement logic in `updateTeamMemberRole` to update both `TeamMember.role` and `User.role` documents
- [X] T008 [US1] Add `UPDATE_TEAM_MEMBER_ROLE` logging to the `updateTeamMemberRole` action
- [X] T009 [US1] Implement role selection dropdown in `TeamMembers` component in `app/(dashboard)/teams/page.tsx`
- [X] T010 [US1] Integrate `updateTeamMemberRole` server action with the UI using `useActionState` in `app/(dashboard)/teams/page.tsx`

**Checkpoint**: At this point, basic role updates should be functional.

---

## Phase 4: User Story 2 - Team Membership Management (Priority: P1)

**Goal**: Admins/Owners can remove members from sub-teams but NOT from the 'All Members' team.

**Independent Test**: Try to remove a user from the 'All Members' team; the button should be disabled. Try removing from another team; it should succeed.

### Implementation for User Story 2

- [X] T011 [US2] Update `removeTeamMember` server action in `app/(login)/actions.ts` to fetch the team document and block removal if name is 'All Members'
- [X] T012 [US2] Update `TeamMembers` component in `app/(dashboard)/teams/page.tsx` to receive team name and disable "Remove" button if team is 'All Members'

**Checkpoint**: Team membership constraints should now be enforced.

---

## Phase 5: User Story 3 & Edge Cases - Protection (Priority: P2)

**Goal**: Protect the Owner role and prevent self-demotion.

**Independent Test**: Attempt to change the role of the user identified as `ownerId` or attempt to change your own role; the UI should block these actions and the server action should return an error.

### Implementation for User Story 3

- [X] T013 [US3] Implement `ownerId` and `self-demotion` checks in `updateTeamMemberRole` server action in `app/(login)/actions.ts`
- [X] T014 [US3] Implement `ownerId` protection check in `removeTeamMember` server action in `app/(login)/actions.ts`
- [X] T015 [US3] Update `TeamMembers` component in `app/(dashboard)/teams/page.tsx` to disable role editing and removal for the Owner and the current user

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: UI/UX improvements and final validation

- [X] T016 [P] Add success/error toast notifications for role updates in `app/(dashboard)/teams/page.tsx`
- [X] T017 [P] Add loading indicators to the role selection dropdown in `app/(dashboard)/teams/page.tsx`
- [X] T018 Run final validation against `specs/002-manage-team-roles/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Stories (Phase 3-5)**: All depend on Phase 2 completion.
- **Polish (Phase 6)**: Depends on completion of all User Stories.

### Parallel Opportunities

- T001, T002 can run in parallel.
- T003, T004, T005 can run in parallel.
- T016, T017 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Complete Phase 3: User Story 1 (Role Update).
3. **STOP and VALIDATE**: Verify role updates work for non-owner, non-self users.

### Incremental Delivery

1. Add Phase 4 (Team Membership Management) to enforce 'All Members' constraint.
2. Add Phase 5 (Protection) to secure the Owner role and prevent self-lockout.
3. Final polish for UX.
