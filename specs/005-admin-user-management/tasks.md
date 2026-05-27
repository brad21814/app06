# Tasks: Admin User Insights (TASK015)

## Phase 1: Foundational (Queries & API)

- [ ] T001 Implement `getAccountUsers(accountId: string)` in `lib/firestore/admin/queries.ts`
  - Acceptance: Returns an array of users with their associated 'All Members' team stats.
  - Verify: Call the function in a test script or check API output.
- [ ] T002 Implement `getUserStats(userId: string)` in `lib/firestore/admin/queries.ts`
  - Acceptance: Returns detailed stats and recent connections for a user.
  - Verify: Call the function in a test script.
- [ ] T003 Create GET `/api/account/users` in `app/api/account/users/route.ts`
  - Acceptance: Returns JSON list of account users.
- [ ] T004 Create GET `/api/account/users/[userId]` in `app/api/account/users/[userId]/route.ts`
  - Acceptance: Returns JSON of individual user stats.

## Phase 2: User List UI (US1)

- [ ] T005 Create `app/(dashboard)/teams/users/page.tsx`
  - Acceptance: Page renders and fetches user list.
- [ ] T006 Implement user table in `app/(dashboard)/teams/users/page.tsx`
  - Acceptance: Table shows Name, Role, Last Connected, Total Connections, Avg Sentiment.
- [ ] T007 Add "At Risk" visual indicators to the user table
  - Acceptance: Users with low engagement or sentiment are highlighted.

## Phase 3: User Drill-down UI (US2 & US3)

- [ ] T008 Create `app/(dashboard)/teams/users/[userId]/page.tsx`
  - Acceptance: Page renders with user name and basic info.
- [ ] T009 Create `components/dashboard/user-health-chart.tsx`
  - Acceptance: Renders a line chart of sentiment over time.
- [ ] T010 Implement sentiment trend chart in user drill-down page
  - Acceptance: User profile shows the chart with real data.
- [ ] T011 Implement recent connections list in user drill-down page
  - Acceptance: Shows list of recent connections for that user, respecting privacy.

## Phase 4: Integration & Polish

- [ ] T012 Add "View All Users" button to `app/(dashboard)/teams/page.tsx` header
  - Acceptance: Link correctly navigates to `/teams/users`.
- [ ] T013 Update sidebar/navigation to include "Users" link if role is admin/owner
  - Acceptance: Easy access for privileged users.
- [ ] T014 Final security audit and role check verification
  - Acceptance: Members cannot access `/teams/users` or drill-downs.
