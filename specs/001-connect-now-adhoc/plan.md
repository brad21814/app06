# Implementation Plan: Connect Now and Adhoc Connections

**Branch**: `001-connect-now-adhoc` | **Date**: 2026-04-13 | **Spec**: [specs/001-connect-now-adhoc/spec.md](specs/001-connect-now-adhoc/spec.md)
**Input**: Feature specification from `/specs/001-connect-now-adhoc/spec.md`

## Summary

Add a "Connect Now" action to the connections list in the user dashboard. This allows participants of a pending connection to enter the video call room immediately for testing or ad-hoc sessions, bypassing formal scheduling requirements. The existing completion logic (answering all questions) remains the gate for transitioning to a "Completed" status.

## Technical Context

**Language/Version**: TypeScript (Next.js 15+ App Router)
**Primary Dependencies**: `twilio-video`, `firebase`, `firebase-admin`, `lucide-react`, `date-fns`
**Storage**: Firestore (Connections collection)
**Testing**: Vitest / Playwright (Existing setup)
**Target Platform**: Web (Desktop/Mobile)
**Project Type**: Web Application
**Performance Goals**: "Connect Now" link visible within 2s of dashboard load.
**Constraints**: Only authorized participants (proposer/confirmer) can access the room.
**Scale/Scope**: Dashboard UI update and potential minor room logic adjustments.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Expertise: NextJS, TypeScript, Tailwind, Firebase are being used.
- [x] DRY & SOLID: Reusing `components/dashboard/connections.tsx` and the existing `/connect/[connectionId]` room.
- [x] Service Architecture: Logic stays in UI components and existing API routes/services.
- [x] Firestore Standards: No schema changes required. Reusing existing connection document structure.
- [x] Security: Access is restricted by existing `/api/twilio/token` participant verification.

## Project Structure

### Documentation (this feature)

```text
specs/001-connect-now-adhoc/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for this feature)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   └── connect/
│       └── [connectionId]/
│           └── page.tsx      # Video room logic
├── api/
│   └── twilio/
│       └── token/
│           └── route.ts      # Token generation and room access
components/
└── dashboard/
    └── connections.tsx       # Connections list UI
```

**Structure Decision**: Standard Next.js App Router structure. Adding UI to dashboard components and verifying room logic in the connect page.

## Complexity Tracking

*No violations identified.*
