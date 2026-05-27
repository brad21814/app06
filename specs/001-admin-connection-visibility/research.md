# Research: Account-Wide Connection Visibility (Updated)

## Decision: Enhance Queries and Privacy Logic for Account-Wide Visibility

### Rationale
To support account-wide visibility for Owners and Account-level Admins while respecting individual privacy, we need to:
1.  **Schema Update**: Add `accountId` to the `Connection` entity to enable efficient account-wide queries.
2.  **Privacy Logic**: Implement a mechanism to check participants' privacy settings before exposing detailed content (summaries, transcripts, sentiment analysis).
3.  **Default Settings**: Default unconfigured users to `TIER_1` (Standard).
4.  **Scaling**: Implement a default 90-day window for the Connection Network graph to ensure performance (SC-004).

### Alternatives Considered
1.  **Runtime Join for Privacy**: Fetch all participant user objects for each connection to check privacy tiers.
    *   *Pros*: Always accurate.
    *   *Cons*: High latency for large graphs.
2.  **Denormalizing Privacy Tiers to Connection**: Store the "most restrictive privacy tier" on the `Connection` document itself.
    *   *Pros*: Extremely fast queries.
    *   *Cons*: Requires updating all related connections whenever a user changes their privacy tier.

### Chosen Approach
We will proceed with **Alternative 1 (Runtime Join/Fetch)** but optimized with caching or batch fetching for participant details. This ensures privacy changes are reflected immediately without complex sync logic.

For visibility, we will add `accountId` to `Connection` and use a migration script.

## Technical Details

### New/Modified Queries
-   `getAccountConnections(accountId: string, dateLimit?: Date)`: Fetches completed connections where `accountId === accountId` and `createdAt >= dateLimit`.
-   Privacy Enforcement: Wrap connection detail access in a utility that checks the `privacyTier` of all participants.

### Schema Update
-   `Connection`: Add `accountId: string`.
-   `User`: Ensure `privacyTier` exists (it already does in `types/firestore.ts`).

### Migration Plan
-   Update all existing `Connection` documents with the `accountId` from their corresponding `Team`.
-   Ensure all `User` documents have a `privacyTier` (defaulting to `TIER_1` if missing).

## Dependencies
-   `firebase-admin` for backfill migration.
-   Existing `PrivacyTier` enum in `types/firestore.ts`.
