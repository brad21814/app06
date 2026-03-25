# Implementation Plan: Manage Team Roles

**Branch**: `002-manage-team-roles` | **Date**: March 25, 2026 | **Spec**: [/specs/002-manage-team-roles/spec.md](/specs/002-manage-team-roles/spec.md)
**Input**: Feature specification from `/specs/002-manage-team-roles/spec.md`

## Summary

This feature adds administrative capabilities to the Team Management page, allowing Admins and Owners to update the roles of team members and manage their team memberships. Key constraints include protecting the account 'Owner' role from modification and ensuring all users remain in the default 'All Members' team.

## Technical Context

**Language/Version**: TypeScript (Next.js 15+ App Router)  
**Primary Dependencies**: React, Tailwind CSS, Lucide React, Firebase (Firestore, Auth), `useActionState` for server actions.  
**Storage**: Firestore (Collections: `users`, `teams`, `team_members`, `invitations`, `accounts`).  
**Testing**: Manual verification using the Team Management UI; Playwright for E2E flows (if existing).  
**Target Platform**: Web (Desktop/Mobile).
**Project Type**: Web Application.  
**Performance Goals**: UI updates should reflect Firestore changes within 1 second.  
**Constraints**: Admins/Owners cannot demote themselves; 'All Members' team is immutable for all users.  
**Scale/Scope**: Impacts team management workflow and role-based access control.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Expertise**: NextJS, TypeScript, Tailwind, Firebase are used.
- [x] **DRY & SOLID**: Reuses existing server actions and Firestore queries where possible.
- [x] **Service Architecture**: Logic for role updates will be added to `app/(login)/actions.ts` or a new service in `lib/firestore`.
- [x] **Firestore Standards**: Adheres to existing collection structures and type definitions.

## Project Structure

### Documentation (this feature)

```text
specs/002-manage-team-roles/
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
│   └── teams/
│       └── page.tsx      # Update UI for role editing and team removal
├── (login)/
│   └── actions.ts        # Add updateTeamMemberRole action; update removeTeamMember
lib/
└── firestore/
    └── admin/
        └── queries.ts    # Verify/Update team member retrieval logic
```

**Structure Decision**: Single project structure (Option 1). Logic resides in server actions and existing page components.

## Complexity Tracking

*No violations identified.*
