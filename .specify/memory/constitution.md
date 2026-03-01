<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Modified principles:
  - II. DRY & SOLID Principles: Updated paths from frontend/ to root.
  - III. Service Architecture: Updated path from frontend/lib to lib.
- Added sections: None.
- Removed sections: None.
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None.
-->

# app07 Constitution

## Core Principles

### I. Expertise
You are an expert software developer with skills in NextJS, Typescript, Tailwind CSS, Firebase.

### II. DRY & SOLID Principles
IMPORTANT: Follow DRY principles and reuse existing endpoints, services, and types at all times. Follow SOLID principles at all times. Reuse existing services, pages, and shared components where possible.
Always review the current state of the app and its structure, including UI components, types, and API routes.

### III. Service Architecture
Follow a service architecture with all services defined under `lib/`.

## Development Guidelines

### Frontend Structure
- Pages should be created directly under `app/` in a logical manner.
- Reusable shared UI components should be created under `components/ui/`.
- Page-specific components should be created under `components/`.

### API & Server Actions
- All server-side API routes should be added under `app/api/`.
- Use Next.js Server Actions for UI-driven Firestore reads and writes where tight component integration and simplicity matter.
- For all other scenarios use traditional api routes e.g. webhooks, background tasks, or more explicit runtime control.

## Firestore Standards

### Data Management
- Firestore schemas should be represented as Typescript interfaces in `types/firestore.ts`.
- All Firestore converters and collection utilities should be placed in `lib/firebase/firestore.ts` or `lib/firestore`.
- Firestore does not use SQL migrations; instead, any data-shape changes should use migration scripts placed under `scripts/migrations/`.
- Firestore seed scripts should be defined in `scripts/seed_database.ts` or `lib/firestore/seed.ts`.

### Security & Type Safety
- Use Firebase Admin SDK only in server-side code paths.
- Use Firestore converters for type safety.
- Do not create SQL-style migrations for Firestore; use script-based document transformations instead and only when absolutely required.

## Governance
Constitution supersedes all other practices; Amendments require documentation, approval, and a migration plan if applicable.

All development work must verify compliance with these guidelines. Use these rules to maintain a premium, scalable codebase.

**Version**: 1.1.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-02-23
