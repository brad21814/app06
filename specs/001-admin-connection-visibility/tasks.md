---
description: "Actionable, dependency-ordered tasks for Account-Wide Connection Visibility"
---

# Tasks: Account-Wide Connection Visibility

**Input**: Design documents from `/specs/001-admin-connection-visibility/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update schema and prepare migration tools.

- [X] T001 Update `Connection` interface in `types/firestore.ts` to include `accountId`
- [X] T002 [P] Ensure `User` interface in `types/firestore.ts` includes `privacyTier` and `role` (account_admin)
- [X] T003 [P] Create migration script `scripts/migrations/001-backfill-connection-accounts.ts` to populate `accountId` on existing connections
- [X] T003b [P] Update user creation/sign-up logic to default `privacyTier` to `TIER_1` in `app/(login)/sign-up/` or related actions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data and logic that MUST be complete before UI work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Execute migration script `scripts/migrations/001-backfill-connection-accounts.ts` to update existing data
- [X] T005 Implement `getAccountConnections` in `lib/firestore/admin/queries.ts` to fetch all connections for an account
- [X] T006 [P] Implement `checkConnectionVisibility` privacy utility in `lib/firestore/admin/queries.ts` to gate detail access
- [X] T007 Update `getConnectionGraphData` in `lib/actions/connections.ts` to support account-level fetching and date filters

**Checkpoint**: Foundation ready - connection data is now accessible at the account level.

---

## Phase 3: User Story 1 - Account Owner Overview (Priority: P1) 🎯 MVP

**Goal**: Enable Account Owners to see all completed connections in their organization.

**Independent Test**: Log in as Account Owner, verify map shows all connections, verify details are gated by participant privacy.

### Implementation for User Story 1

- [X] T008 [US1] Update `DashboardContent` in `app/(dashboard)/dashboard/page.tsx` to fetch account connections for Owners
- [X] T009 [US1] Update `ConnectionsGraph` in `components/dashboard/connections-graph.tsx` to handle account-level datasets
- [X] T010 [US1] Update `Connections` component in `components/dashboard/connections.tsx` to redact details based on privacy check
- [X] T011 [US1] Verify visibility: Log in as Owner, see all connections, verify privacy redaction for TIER_3 users

**Checkpoint**: User Story 1 (Owner visibility) is functional and respects privacy.

---

## Phase 4: User Story 2 - Account-level Admin Overview (Priority: P1)

**Goal**: Enable Account-level Administrators to have the same visibility as Owners.

**Independent Test**: Log in as Account-level Admin, verify same account-wide visibility as Owner.

### Implementation for User Story 2

- [X] T012 [US2] Update role check logic in `app/(dashboard)/dashboard/page.tsx` to include `account_admin`
- [X] T013 [P] [US2] Update role check logic in `lib/actions/connections.ts` to include `account_admin`
- [X] T014 [US2] Verify visibility: Log in as Account-level Admin and confirm access to all organization connections

**Checkpoint**: User Story 2 is functional; Admins share Owner's visibility.

---

## Phase 5: User Story 3 - Regular User (Member) Privacy (Priority: P2)

**Goal**: Ensure Members only see their own connections and their privacy settings are respected.

**Independent Test**: Log in as Regular User, verify map only shows personal connections, verify their own TIER_3 setting hides details from Owners.

### Implementation for User Story 3

- [X] T015 [US3] Ensure `getUserConnections` in `lib/firestore/admin/queries.ts` remains restricted to personal connections
- [X] T016 [US3] Verify Member restriction: Log in as Member and confirm they cannot see others' connections
- [X] T017 [US3] Verify Privacy enforcement: Set Member to TIER_3 and confirm Owner/Admin cannot see their connection details

**Checkpoint**: User Story 3 is functional; Member privacy is strictly enforced.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization and UI refinements.

- [X] T018 Implement default 90-day window for graph in `lib/actions/connections.ts` for large accounts (FR-009)
- [X] T019 [P] Add date range controls to dashboard in `app/(dashboard)/dashboard/page.tsx` for privileged users
- [X] T020 [P] Update `quickstart.md` with final implementation details and verification steps
- [X] T021 Run final project-wide build and lint: `npm run build && npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1. BLOCKS all user stories.
- **User Stories (Phases 3-5)**: Depend on Phase 2. Can proceed in parallel if needed.
- **Polish (Phase 6)**: Depends on Phase 3 and 4 completion.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T006 can run in parallel with T005 or T007.
- US1 (Phase 3) and US2 (Phase 4) share common logic but verification can be parallel.
- T013 can run in parallel with T012.
- Polish tasks T019 and T020 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Complete User Story 1 (Owner Overview).
3. Validate Owner visibility and privacy gating.

### Incremental Delivery

1. Foundation ready -> Data migrated, account-level queries available.
2. Add US1 -> Owners see all connections.
3. Add US2 -> Admins see all connections.
4. Add US3 -> Member restrictions and privacy settings verified.
5. Add Phase 6 -> Performance scaling and UI controls.
