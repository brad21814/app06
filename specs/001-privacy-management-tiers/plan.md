# Implementation Plan: Privacy Management Tiers

**Branch**: `001-privacy-management-tiers` | **Date**: 2026-03-01 | **Spec**: [specs/001-privacy-management-tiers/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-privacy-management-tiers/spec.md`

## Summary

Implement a 3-tier privacy management system where users select their data sharing preferences during onboarding or via settings. Tier 1 allows full access, Tier 2 requires manual approval for summaries, and Tier 3 strictly prohibits transcript storage/sharing. Existing users will default to Tier 1 and receive a notification.

## Technical Context

**Language/Version**: TypeScript (Next.js)
**Primary Dependencies**: Next.js App Router, Firebase (Firestore, Auth), Tailwind CSS
**Storage**: Firestore
**Testing**: Playwright for E2E, Jest/Vitest for unit
**Target Platform**: Web
**Project Type**: Web Application
**Performance Goals**: Fast UI updates for settings, low-latency checking of privacy tier on dashboard load.
**Constraints**: Follow Firestore document schema structure; use Server Actions for UI writes; no SQL migrations.
**Scale/Scope**: Affects user onboarding flow, account settings, and downstream AI processing tasks.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **DRY & SOLID Principles**: Follows DRY by reusing existing UI components (`components/ui/`) and adding privacy fields to existing user definitions.
- **Service Architecture**: Backend logic for privacy tier enforcement will be placed in `lib/` and executed via Server Actions.
- **Frontend Structure**: Settings page will be placed in `app/(dashboard)/settings/` (or existing profile path), components in `components/`.
- **API & Server Actions**: Next.js Server Actions will be used for saving privacy tier preferences and approving/rejecting summaries.
- **Firestore Standards**: Data shape changes (`privacyTier`, `SummaryStatus`) defined in `types/firestore.ts`. Migration strategy: Existing users are handled gracefully via codebase default fallback (Tier 1) and notifications, avoiding large-scale backend migrations where possible.

## Project Structure

### Documentation (this feature)

```text
specs/001-privacy-management-tiers/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
└── tasks.md             
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   ├── layout.tsx                  # Add global check for missing tier (notification)
│   └── profile/
│       └── privacy/
│           └── page.tsx            # New Privacy Management settings page
├── (login)/
│   └── sign-up/
│       └── page.tsx                # Update to include privacy tier selection
lib/
├── actions/
│   ├── privacy.ts                  # Server actions for updating tier
│   └── summary.ts                  # Server actions for approve/reject summary
├── firestore/
│   └── converters.ts               # Ensure User converter handles optional privacyTier
components/
├── dashboard/
│   └── notification-center.tsx     # UI for Tier 2 summary approvals
└── settings/
    └── privacy-manager.tsx         # UI form for selecting/changing tiers
types/
└── firestore.ts                    # Enums for PrivacyTier and SummaryStatus
```

**Structure Decision**: Integrated directly into the existing Next.js web application structure, utilizing the App Router and Server Actions per the Constitution.

## Complexity Tracking

*No Constitution violations detected. Structure adheres to standard project guidelines.*
