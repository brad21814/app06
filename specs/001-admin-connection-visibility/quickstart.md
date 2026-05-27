# Quickstart: Account-Wide Connection Visibility

## Goal
Enable Account Owners and Account-level Admins to see all completed connections within their organization, while respecting individual privacy settings and maintaining graph performance.

## Developer Steps

### 1. Schema & Migration
1. `Connection` interface in `types/firestore.ts` now includes `accountId: string`.
2. `User` interface includes `privacyTier` and support for `account_admin` role.
3. Migration script `scripts/migrations/001-backfill-connection-accounts.ts` backfills existing data and sets default privacy tiers.

### 2. Privacy Logic
The utility `checkConnectionVisibility(user, connection)` in `lib/firestore/admin/queries.ts` determines if a user can see detailed content.
- Participants always see details.
- Privileged users see details only if ALL participants' `privacyTier` is NOT `TIER_3_PRIVATE`.

### 3. Server-Side Data Fetching
- `getAccountConnections(accountId, dateLimit)` fetches aggregated completed connections for an organization.
- `getUserConnections(userId)` remains restricted to the user's own connections.

### 4. UI Components
- `DashboardContent` (Server Component) handles data aggregation and privacy gating.
- `RangeSelector` (Client Component) provides a date range filter via search params.
- `ConnectionsGraph` (Client Component) renders the visual network based on the selected range.
- `Connections` list redacts summaries and hides transcripts for restricted connections.

## Verification Steps
1. **Owner View**: Log in as Owner. Change range to "All time". Verify all account connections appear.
2. **Privacy Check**: As a different user, set `privacyTier` to "Private". As Owner, verify their connection appears on graph/list but "Summary" shows restricted message.
3. **Member View**: Log in as Regular Member. Verify only personal connections appear regardless of range.
4. **Admin View**: Assign a user the `account_admin` role. Verify they see the same account-wide view as the Owner.
