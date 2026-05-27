# Plan: Admin User Insights (TASK015)

## Phase 1: Foundational (Queries & API)
- **T1.1**: Implement `getAccountUsers(accountId: string)` in `lib/firestore/admin/queries.ts`. This should join `users` with their `team_members` record (from the 'All Members' team) to get their stats.
- **T1.2**: Implement `getUserStats(userId: string)` in `lib/firestore/admin/queries.ts` to fetch detailed stats and recent connections for a specific user.
- **T1.3**: Create `/api/account/users` endpoint to return the account user list.
- **T1.4**: Create `/api/account/users/[userId]` endpoint to return detailed user stats.

## Phase 2: User List UI (US1)
- **T2.1**: Create `app/(dashboard)/teams/users/page.tsx`.
- **T2.2**: Implement the user table with columns: Name, Role, Last Connected, Total Connections, Avg Sentiment.
- **T2.3**: Add sorting logic and "At Risk" highlighting (e.g., red text for users with 0 connections or low sentiment).

## Phase 3: User Drill-down UI (US2 & US3)
- **T3.1**: Create `app/(dashboard)/teams/users/[userId]/page.tsx`.
- **T3.2**: Create `components/dashboard/user-health-chart.tsx` using Recharts to show sentiment trend.
- **T3.3**: Implement User Profile header with summary metrics.
- **T3.4**: Implement Recent Connections list for the specific user (respecting privacy tiers).

## Phase 4: Integration & Security
- **T4.1**: Add link to "View All Users" in the `TeamManagement` page or sidebar.
- **T4.2**: Ensure middleware/layout blocks `member` role from these new routes.
- **T4.3**: Final validation against success criteria.

## Risks & Mitigations
- **Data Privacy**: We must strictly respect `privacyTier` when showing the drill-down. If a user is `TIER_3`, we should only show their aggregated sentiment score, not the details of their individual connections to someone who wasn't in them.
- **Data Consistency**: Users might be in multiple teams. We should decide which "team stats" to show or aggregate them. (Recommendation: Focus on the "All Members" team membership for account-wide stats).
