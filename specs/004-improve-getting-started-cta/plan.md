# Implementation Plan: Improve Getting Started CTA

**Branch**: `004-improve-getting-started-cta` | **Date**: 2026-03-27 | **Spec**: [/specs/004-improve-getting-started-cta/spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-improve-getting-started-cta/spec.md`

## Summary
Refactor the "Getting Started" onboarding checklist to be a global component visible only to Admins/Owners. It will track account-wide progress for inviting members, reviewing themes, and launching a schedule, while supporting persistent per-user dismissal.

## Technical Context

**Language/Version**: TypeScript (Next.js 15+ App Router)
**Primary Dependencies**: React, Tailwind CSS, Lucide React, Firebase (Auth/Firestore)
**Storage**: Firebase Firestore (Collections: `accounts`, `users`, `invitations`, `schedules`)
**Testing**: Manual verification and integration tests for role-based visibility and completion states.
**Target Platform**: Web application (Desktop/Mobile)
**Project Type**: web-service/UI application
**Performance Goals**: Onboarding state must be resolved within 1 second of dashboard load.
**Constraints**: Visibility must be strictly enforced for Admin/Owner roles only.
**Scale/Scope**: 1 Global component, 3 new/updated Firestore queries, 1 new account flag.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Follows DRY & SOLID principles by reusing existing `OnboardingChecklist` component and Firestore logic.
- [x] Adheres to Service Architecture by adding/updating functions in `lib/firebase/firestore.ts`.
- [x] Uses Firestore converters and standard collection utilities.

## Project Structure

### Documentation (this feature)

```text
specs/004-improve-getting-started-cta/
├── plan.md              # This file
├── research.md          # Implementation strategy and rationale
├── data-model.md        # Changes to Account and User entities
├── quickstart.md        # Step-by-step developer implementation guide
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   ├── layout.tsx       # Integrate global checklist here
│   ├── dashboard/
│   │   └── page.tsx     # Remove checklist from here
│   └── themes/
│       └── page.tsx     # Add theme review tracking logic
components/
└── dashboard/
    └── checklist.tsx    # Refactor visibility and completion logic
lib/
└── firebase/
    └── firestore.ts     # Add getAccount, updateAccount, getAccountActiveSchedules
types/
└── firestore.ts         # Add hasReviewedThemes to Account interface
```

**Structure Decision**: Standard Next.js App Router structure with shared components and Firebase services.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |
