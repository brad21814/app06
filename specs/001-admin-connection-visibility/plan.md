# Implementation Plan: Account-Wide Connection Visibility

**Branch**: `001-admin-connection-visibility` | **Date**: 2026-04-20 | **Spec**: `/specs/001-admin-connection-visibility/spec.md`
**Input**: Feature specification for Account-Wide Connection Visibility for Owners and Admins (with privacy and scaling).

## Summary
The primary requirement is to show all completed connections for an organization (Account) to Owners and Account-level Admins, while keeping regular users restricted to their own connections and respecting individual privacy. The technical approach is to:
1.  **Add `accountId` to `Connection`**: Update the schema and backfill for efficient account-wide queries.
2.  **Privacy Logic**: Fetch participant privacy tiers at runtime to gate access to detailed content (summaries, transcripts, sentiment analysis).
3.  **Scaling**: Apply a default 90-day filter for graph data in large accounts (>1000 connections).
4.  **UI Updates**: Modify the dashboard and connection graph to handle account-level datasets and add date-range controls.

## Technical Context

**Language/Version**: TypeScript (Next.js 15+ App Router)
**Primary Dependencies**: `firebase-admin`, `firebase`
**Storage**: Firestore (Collections: `connections`, `users`, `teams`)
**Testing**: `npm test`
**Target Platform**: Next.js App Router (Server Components and Actions)
**Project Type**: Web Application
**Performance Goals**: < 2s for 500+ connections on the graph.
**Constraints**: Zero cross-account data leakage; strict adherence to participant privacy settings.
**Scale/Scope**: Account-wide visibility for Owners/Account Admins across multiple teams.

## Constitution Check

- [x] **Expertise**: Using standard Next.js, TypeScript, and Firebase patterns.
- [x] **DRY & SOLID**: Reusing existing models and extending data access layer.
- [x] **Service Architecture**: Logic placed in `lib/actions/` and `lib/firestore/`.
- [x] **Firestore Standards**: Using Firestore converters and migration scripts.

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-connection-visibility/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
├── research.md          # Research on privacy and scaling
├── data-model.md        # Updated schema and visibility rules
├── quickstart.md        # Developer guide
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   └── dashboard/
│       └── page.tsx        # DashboardContent update with date filtering
lib/
├── actions/
│   └── connections.ts      # getConnectionGraphData update for account visibility
├── firestore/
│   └── admin/
│       ├── queries.ts      # New getAccountConnections and privacy check utility
│       └── collections.ts  # Connection converter update
scripts/
├── migrations/
│   └── 001-backfill-connection-accounts.ts # Migration script
types/
├── firestore.ts            # Connection interface update
```

**Structure Decision**: Maintain the current service architecture with server actions and server-side queries.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Schema Change (Add `accountId` to `Connection`) | To support efficient account-wide queries for Admins/Owners. | Joining teams in memory is less scalable and prone to cross-account data leakage. |
| Runtime Privacy Join | To ensure participant privacy is always respected without complex synchronization. | Denormalizing privacy to Connection requires many updates whenever a user changes their setting. |
