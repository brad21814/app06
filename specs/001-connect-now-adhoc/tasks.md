# Tasks: Connect Now and Adhoc Connections

**Input**: Design documents from `/specs/001-connect-now-adhoc/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Tests are NOT explicitly requested in the spec, so implementation will focus on functional requirements and manual verification as outlined in `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify feature branch `001-connect-now-adhoc` and project environment

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Research existing Twilio token generation logic in `app/api/twilio/token/route.ts`
- [x] T003 [P] Research existing connection room joining logic in `app/(dashboard)/connect/[connectionId]/page.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Immediate Connection for Testing (Priority: P1) 🎯 MVP

**Goal**: As a user with a pending connection, I want to be able to jump into the connection room immediately without waiting for a scheduled time, so that I can test my audio/video setup.

**Independent Test**: Create a new connection, navigate to the dashboard, and click the "Connect Now" link to verify the video room opens successfully.

### Implementation for User Story 1

- [x] T004 [US1] Add "Actions" table head to `ConnectionTable` component in `components/dashboard/connections.tsx`
- [x] T005 [US1] Implement "Connect Now" link button in `ConnectionTable` rows for upcoming connections in `components/dashboard/connections.tsx`
- [x] T006 [P] [US1] Verify that `app/api/twilio/token/route.ts` allows token generation for connections in `scheduling`, `proposed`, or `scheduled` statuses
- [x] T007 [P] [US1] Verify that `app/(dashboard)/connect/[connectionId]/page.tsx` initializes correctly when joined ad-hoc (bypassing formal schedule)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Ad-hoc Connection (Priority: P2)

**Goal**: Two users who have an upcoming connection want to meet immediately instead of waiting for their scheduled slot.

**Independent Test**: Two participants click "Connect Now" for the same pending connection and verify they are placed in the same active room.

### Implementation for User Story 2

- [x] T008 [US2] Validate multi-participant room entry via "Connect Now" in `app/(dashboard)/connect/[connectionId]/page.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T009 [P] Verify "Connect Now" link visibility performance (SC-003) in `components/dashboard/connections.tsx`
- [x] T010 Final manual verification of all acceptance scenarios in `specs/001-connect-now-adhoc/spec.md`
- [x] T011 Run `quickstart.md` validation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2).

### Parallel Opportunities

- T003 and T002 in Phase 2 can run in parallel.
- T006 and T007 can run in parallel with T004/T005 in Phase 3.
- User Story 1 and User Story 2 can be worked on in parallel once the Foundation is ready.

---

## Parallel Example: User Story 1

```bash
# Verify backend access and frontend initialization together:
Task: "Verify that app/api/twilio/token/route.ts allows token generation..."
Task: "Verify that app/(dashboard)/connect/[connectionId]/page.tsx initializes correctly..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3: User Story 1.
3. **STOP and VALIDATE**: Test "Connect Now" UI and room entry for a single user.

### Incremental Delivery

1. Foundation ready.
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!).
3. Add User Story 2 → Test independently → Deploy/Demo.
4. Final polish.
