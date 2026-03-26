# Implementation Plan: Implement reCAPTCHA v3 Protection

**Branch**: `003-recaptcha-v3` | **Date**: Friday, March 27, 2026 | **Spec**: [specs/003-recaptcha-v3/spec.md](specs/003-recaptcha-v3/spec.md)
**Input**: Feature specification from `/specs/003-recaptcha-v3/spec.md`

## Summary
The goal is to implement bot protection using reCAPTCHA v3 for Login, Sign-up, and Password Reset forms. This involves client-side token generation, server-side verification via a new utility in `lib/auth/recaptcha.ts`, and enforcing a score threshold (default 0.5) to block bot submissions.

## Technical Context

**Language/Version**: TypeScript / Next.js 16 (App Router)
**Primary Dependencies**: `react-google-recaptcha-v3`, `firebase-admin`, `zod`
**Storage**: N/A (Verification is stateless)
**Testing**: Playwright integration tests (optional but recommended)
**Target Platform**: Web (Linux server via Next.js)
**Project Type**: Web Service / Application
**Performance Goals**: < 1s additional latency for verification
**Constraints**: < 1% false positive rate (blocking legitimate users)
**Scale/Scope**: Login, Sign-up, and Password Reset forms ONLY

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Expertise: NextJS, Typescript, Tailwind CSS, Firebase (matches)
- [x] DRY & SOLID Principles: Reusing `lib/auth` structure and centralizing verification logic.
- [x] Service Architecture: All services defined under `lib/`. (Matches `lib/auth/recaptcha.ts`)
- [x] Frontend Structure: Page-specific components under `components/`. (Matches `components/auth/RecaptchaProvider.tsx`)
- [x] API & Server Actions: Using traditional API routes under `app/api/auth/`. (Matches existing project structure)
- [x] Security & Type Safety: Using Zod for validation and server-side verification.

## Project Structure

### Documentation (this feature)

```text
specs/003-recaptcha-v3/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── (login)/
│   ├── login.tsx                 # Updated to execute reCAPTCHA
│   ├── forgot-password/page.tsx # Updated to execute reCAPTCHA
│   └── reset-password/page.tsx  # Updated to execute reCAPTCHA
└── api/
    └── auth/
        ├── sign-in/route.ts      # Updated to verify token
        ├── sign-up/route.ts      # Updated to verify token
        ├── forgot-password/route.ts # Updated to verify token
        └── reset-password/route.ts # Updated to verify token

components/
└── auth/
    └── RecaptchaProvider.tsx    # New component to wrap app with Provider

lib/
└── auth/
    └── recaptcha.ts             # New server-side verification utility
```

**Structure Decision**: Single project layout, maintaining existing patterns for authentication and API routes.

## Complexity Tracking

*No Constitution Check violations.*
