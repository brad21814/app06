# Tasks: Connection Summary and Reconnect

**Input**: Design documents from `/specs/001-connection-summary-reconnect/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Update `Connection` interface in `types/firestore.ts` to include `endedAt?: Timestamp | null;`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T002 Create connection utility service in `lib/firestore/connections.ts` with `resetConnectionData` function (sets status to 'scheduled', clears startedAt, endedAt, questionEvents)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Post-Connection Reflection (Priority: P1) 🎯 MVP

**Goal**: Participants can review session metadata and question completion status after a session ends.

**Independent Test**: Complete a connection session and verify the summary view displays start/end times, participant list, and a list of questions with their completion status (Completed vs Skipped/Not Reached).

### Implementation for User Story 1

- [X] T003 [US1] Update session completion API in `app/api/connections/[connectionId]/complete/route.ts` to record the `endedAt` timestamp (Already present)
- [X] T004 [US1] Implement summary UI state in `app/(dashboard)/connect/[connectionId]/page.tsx` to display session metadata (duration, participants) when `isSessionEnded` is true
- [X] T005 [US1] Add question completion list to the summary view in `app/(dashboard)/connect/[connectionId]/page.tsx` by comparing `questions` array with `questionEvents`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Session Reset/Retry (Priority: P2)

**Goal**: Participants can restart a session from the summary page, clearing previous progress.

**Independent Test**: Click the "Reconnect" button on a completed summary page, verify the session resets to the "Join Room" state, and confirm Firestore data for that connection has been cleared.

### Implementation for User Story 2

- [X] T006 [US2] Implement Reconnect API route in `app/api/connections/[connectionId]/reconnect/route.ts` using the `resetConnectionData` utility
- [X] T007 [P] [US2] Add "Reconnect" button to the summary view in `app/(dashboard)/connect/[connectionId]/page.tsx`
- [X] T008 [US2] Integrate Reconnect button with the API and trigger local state reset to allow joining the room again

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T009 [P] Add loading and disabled states for the Reconnect button in `app/(dashboard)/connect/[connectionId]/page.tsx` (Done in US2)
- [X] T010 [P] Add toast notifications for success/failure of the Reconnect action in `app/(dashboard)/connect/[connectionId]/page.tsx` (Done in US2)
- [X] T011 Run final validation against `specs/001-connection-summary-reconnect/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on T001.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
- **Polish (Final Phase)**: Depends on US1 and US2 completion.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.
- **User Story 2 (P2)**: UI depends on the summary view created in US1.

### Parallel Opportunities

- T001 and T002 are sequential.
- T003 and T004 can start in parallel once T001 is done.
- T006 and T007 can start in parallel once T002 is done.
- T009 and T010 can run in parallel.

---

## Parallel Example: User Story 2

```bash
# Implement the backend API and the frontend button in parallel:
Task: "Implement Reconnect API route in app/api/connections/[connectionId]/reconnect/route.ts"
Task: "Add 'Reconnect' button to the summary view in app/(dashboard)/connect/[connectionId]/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Post-Connection Reflection)
4. **STOP and VALIDATE**: Test User Story 1 independently.

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready.
2. Add User Story 1 -> Test independently -> Deliver Reflection feature.
3. Add User Story 2 -> Test independently -> Deliver Reset/Retry feature.
4. Final Polish.
