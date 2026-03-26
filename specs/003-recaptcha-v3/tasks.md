# Tasks: Implement reCAPTCHA v3 Protection

**Feature**: [Implement reCAPTCHA v3 Protection](specs/003-recaptcha-v3/spec.md)
**Plan**: [Implementation Plan](specs/003-recaptcha-v3/plan.md)
**Branch**: `003-recaptcha-v3`

## Implementation Strategy

We will follow an incremental approach:
1.  **Setup & Foundational**: Install dependencies, create the shared `RecaptchaProvider`, and implement the server-side verification logic.
2.  **MVP (User Story 1)**: Protect the Sign-up form. This is the highest priority for preventing bot registrations.
3.  **Iteration (User Story 2 & 3)**: Protect the Sign-in and Password Reset forms.
4.  **Verification**: Conduct manual and automated tests (if applicable) to ensure the threshold is correctly enforced and the user experience remains seamless.

## Phase 1: Setup

- [x] T001 Install client-side reCAPTCHA v3 library `npm install react-google-recaptcha-v3`
- [x] T002 [P] Create the `RecaptchaProvider` component in `components/auth/RecaptchaProvider.tsx`
- [x] T003 Wrap the main layout with the `RecaptchaProvider` in `app/layout.tsx`

## Phase 2: Foundational

- [x] T004 Implement the server-side reCAPTCHA verification utility in `lib/auth/recaptcha.ts`
- [x] T005 [P] Add reCAPTCHA site and secret keys to the project's environment configuration (verify `.env` usage)

## Phase 3: User Story 1 - Secure Account Creation (Priority: P1)

**Story Goal**: Protect the sign-up process from automated bot registrations.
**Independent Test**: Successfully create a human account; ensure bot-like submissions (simulated by low score if possible) are blocked.

- [x] T006 [US1] Update the Sign-up UI in `app/(login)/login.tsx` to execute reCAPTCHA on form submission
- [x] T007 [US1] Update the Sign-up API route in `app/api/auth/sign-up/route.ts` to verify the reCAPTCHA token before processing

## Phase 4: User Story 2 - Secure Login (Priority: P1)

**Story Goal**: Protect existing user accounts from automated brute-force or credential stuffing attacks.
**Independent Test**: Successfully log in as a human; ensure suspicious login attempts are blocked.

- [x] T008 [US2] Update the Sign-in UI in `app/(login)/login.tsx` to execute reCAPTCHA on form submission
- [x] T009 [US2] Update the Sign-in API route in `app/api/auth/sign-in/route.ts` to verify the reCAPTCHA token before processing

## Phase 5: User Story 3 - Secure Password Reset (Priority: P2)

**Story Goal**: Prevent mass password reset requests and account enumeration.
**Independent Test**: Successfully request a reset link; ensure automated mass requests are blocked.

- [x] T010 [US3] Update the Forgot Password UI in `app/(login)/forgot-password/page.tsx` to execute reCAPTCHA on submission
- [x] T011 [US3] Update the Forgot Password API route in `app/api/auth/forgot-password/route.ts` to verify the token
- [x] T012 [US3] Update the Reset Password UI in `app/(login)/reset-password/page.tsx` to execute reCAPTCHA on submission
- [x] T013 [US3] Update the Reset Password API route in `app/api/auth/reset-password/route.ts` to verify the token

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T014 Ensure reCAPTCHA badge is properly positioned or attribution is provided according to Google's terms
- [x] T015 Verify error messages for reCAPTCHA failures are user-friendly across all forms
- [x] T016 [P] Final audit of all protected endpoints to ensure token verification is enforced as the first step

## Dependencies

1.  **Phase 2** depends on **Phase 1** (Utility needs keys and library patterns)
2.  **Phase 3 (US1)** depends on **Phase 2** (Sign-up needs verification utility)
3.  **Phase 4 (US2)** depends on **Phase 2** (Sign-in needs verification utility)
4.  **Phase 5 (US3)** depends on **Phase 2** (Password Reset needs verification utility)

## Parallel Execution Examples

- **T002** and **T005** can be done in parallel (UI component vs. environment setup)
- **T006** and **T007** (Frontend vs. Backend for US1) can be done in parallel once the utility is ready.
