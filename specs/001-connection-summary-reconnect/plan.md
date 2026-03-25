# Implementation Plan: Connection Summary and Reconnect

**Branch**: `001-connection-summary-reconnect` | **Date**: March 25, 2026 | **Spec**: [/specs/001-connection-summary-reconnect/spec.md](/specs/001-connection-summary-reconnect/spec.md)
**Input**: Feature specification from `/specs/001-connection-summary-reconnect/spec.md`

## Summary

This feature enhances the connection experience by providing a summary page after a session concludes and allowing participants to restart (reconnect) the session if desired. The summary will display when the session occurred, who participated, and which questions from the theme were completed or skipped. The "Reconnect" functionality will reset the connection state in Firestore, effectively allowing a fresh start while overwriting previous progress.

## Technical Context

**Language/Version**: TypeScript (Next.js 15+ App Router)  
**Primary Dependencies**: React, Tailwind CSS, Firebase (Firestore), Lucide React (Icons), Twilio Video (for room management)  
**Storage**: Firestore (Collections: `connections`, `users`, `themes`)  
**Testing**: Playwright (for E2E flows), Vitest (for utility functions if added)  
**Target Platform**: Web (Desktop/Mobile)
**Project Type**: Web Application  
**Performance Goals**: Summary page load < 1s, Reconnect reset < 2s  
**Constraints**: Firestore real-time updates for session state sync  
**Scale/Scope**: Impacts the connection session lifecycle and data model

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Expertise**: Follows NextJS, Typescript, Tailwind CSS, Firebase patterns.
- [x] **DRY & SOLID**: Reuses existing `Connection` types and Firestore collection utilities.
- [x] **Service Architecture**: Logic for summary generation and reconnection will be placed in `lib/firestore/connections.ts` (if needed) or handled via existing API routes.
- [x] **Firestore Standards**: Uses `types/firestore.ts` for schema and converters for safety.

## Project Structure

### Documentation (this feature)

```text
specs/001-connection-summary-reconnect/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   └── connect/
│       └── [connectionId]/
│           └── page.tsx      # Main UI for summary and reconnect button
├── api/
│   └── connections/
│       └── [connectionId]/
│           ├── complete/     # Already exists, might need minor update
│           └── reconnect/    # New route for resetting session
lib/
└── firestore/
    └── connections.ts        # Shared logic for connection state updates
types/
└── firestore.ts              # Update Connection interface if needed
```

**Structure Decision**: The primary changes will be in the connection page UI and a new API route for reconnection. Shared logic will be moved to `lib/firestore/connections.ts` to follow the Service Architecture principle.

## Complexity Tracking

*No violations identified.*
