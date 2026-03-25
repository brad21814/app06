# Tasks: Video Call Backgrounds

**Input**: Design documents from `/specs/001-video-call-backgrounds/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Install `@twilio/video-processors` dependency using `npm install`
- [X] T002 Create background asset directory in `public/assets/backgrounds/`
- [X] T003 [P] Source and add 3 "Team Pulp" themed images to `public/assets/backgrounds/`
- [X] T004 [P] Source and add 3 "Juicy Pulpy" themed images to `public/assets/backgrounds/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T005 Implement `VideoBackgroundManager` service in `lib/video/processor-manager.ts` including `checkCompatibility`, `applyEffect`, and `clearEffects`
- [X] T006 Define `BackgroundOption` constants and categories in `lib/video/processor-manager.ts` per data-model.md

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Default Privacy (Priority: P1) 🎯 MVP

**Goal**: Participants join calls with a blurred background by default.

**Independent Test**: Join a connection session and verify that the self-preview video track is blurred immediately without manual intervention.

### Implementation for User Story 1

- [X] T007 [US1] Integrate `VideoBackgroundManager` into `app/(dashboard)/connect/[connectionId]/page.tsx`
- [X] T008 [US1] Automatically apply "Blur" effect in `toggleVideo` or a `useEffect` within `app/(dashboard)/connect/[connectionId]/page.tsx` when `localVideoTrack` is initialized

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Background Customization (Priority: P1)

**Goal**: Participants can select themed backgrounds from a gallery.

**Independent Test**: Use the background selection UI to switch between various themed images and verify the change reflects on the video track in < 1s.

### Implementation for User Story 2

- [X] T009 [US2] Create `BackgroundSettings` component in `components/video/background-settings.tsx` with gallery UI
- [X] T010 [US2] Implement `handleBackgroundChange` logic in `app/(dashboard)/connect/[connectionId]/page.tsx` using `processorManager.applyEffect`
- [X] T011 [US2] Integrate `BackgroundSettings` component into the video controls header in `app/(dashboard)/connect/[connectionId]/page.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Toggle and Performance (Priority: P2)

**Goal**: Allow users to disable effects and handle unsupported devices gracefully.

**Independent Test**: Select "None" in the background settings and verify all processors are removed. Verify a toast appears if advanced video processing is simulated as "unsupported".

### Implementation for User Story 3

- [X] T012 [US3] Add "None" option to `BackgroundSettings` gallery to trigger `clearEffects` in `lib/video/processor-manager.ts`
- [X] T013 [US3] Implement browser compatibility check and error handling with `sonner` toast notifications in `app/(dashboard)/connect/[connectionId]/page.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T014 [P] Add loading indicators for background switching using `onProcessorLoading` event in `components/video/background-settings.tsx`
- [X] T015 Performance check: Verify browser memory usage remains under 500MB additional RAM during active processing
- [X] T016 Run final validation against `specs/001-video-call-backgrounds/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.
- **User Story 2 (P2)**: UI depends on the manager integration from US1.
- **User Story 3 (P3)**: Depends on the customization UI from US2.

### Parallel Opportunities

- T003 and T004 (Image sourcing) can run in parallel.
- Once Phase 2 is complete, US1 can be worked on while assets for US2 are finalized.
- T014 and T015 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Manager implementation)
3. Complete Phase 3: User Story 1 (Default Blur)
4. **STOP and VALIDATE**: Verify auto-blur on join.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready.
2. Add User Story 1 → Test independently → Privacy feature ready.
3. Add User Story 2 → Test independently → Customization feature ready.
4. Add User Story 3 → Test independently → Toggle and Fallback ready.
5. Final Polish.
