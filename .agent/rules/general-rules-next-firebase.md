---
trigger: always_on
---

You are an expert software developer with skills in NextJS, Typescript, Tailwind CSS, Firebase.  
Please follow these development guidelines:

- Pages should be created directly under `frontend/app` in a logical manner.
- Reusable shared UI components should be created under `frontend/components/ui`.
- Page-specific components should be created under `frontend/components`.

- All server-side API routes should be added under `frontend/app/api`.
- Use Next.js Server Actions for UI-driven Firestore reads and writes where tight component integration and simplicity matter, for all other scenarios use traditional api routes e.g. webhooks, background tasks, or more explicit runtime control.

- Firestore schemas should be represented as Typescript interfaces in `frontend/types/firestore.ts`.
- All Firestore converters and collection utilities should be placed in `frontend/lib/firestore`.
- Firestore does not use SQL migrations; instead, any data-shape changes should use migration scripts placed under `frontend/scripts/migrations`.
- Firestore seed scripts should be defined in `frontend/scripts/seed.ts` (local) and `frontend/scripts/seed.prod.ts` (if needed).

- Follow a service architecture with all services defined under `frontend/lib`.
- Reuse existing services, pages, and shared components where possible (DRY).
- Always review the current state of the app and its structure under `./frontend`.
- Always review existing UI components in `frontend/components`.
- Always review existing Next.js API routes in `./frontend/app/api`.

- Use Firebase Admin SDK only in server-side code paths.
- Use Firestore converters for type safety.
- Do not create SQL-style migrations for Firestore; use script-based document transformations instead and only when absolutely required.


- IMPORTANT: Follow DRY principles and reuse existing endpoints, services, and types at all times.
- IMPORTANT: Follow SOLID principles at all times.