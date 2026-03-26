# Research: reCAPTCHA v3 Integration

## Decision: reCAPTCHA v3 Implementation Strategy

### What was chosen
- **Library**: `react-google-recaptcha-v3` for client-side integration.
- **Verification**: Server-side verification using a custom utility in `lib/auth/recaptcha.ts` that calls Google's `siteverify` API.
- **Threshold**: A default score threshold of `0.5` will be used, as per industry standards for reCAPTCHA v3.
- **Integration Points**: 
    - **Frontend**: `app/(login)/login.tsx`, `app/(login)/forgot-password/page.tsx`, `app/(login)/reset-password/page.tsx`.
    - **Backend**: `/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/forgot-password`, `/api/auth/reset-password`.

### Rationale
- `react-google-recaptcha-v3` is the most widely used and well-maintained library for integrating reCAPTCHA v3 into React/Next.js applications.
- Server-side verification is mandatory to prevent attackers from bypassing the check on the client-side.
- Using a centralized utility in `lib/auth/recaptcha.ts` ensures consistency across all protected endpoints.
- reCAPTCHA v3 provides a seamless user experience (no "I'm not a robot" checkbox) while still offering strong bot protection.

### Alternatives considered
- **reCAPTCHA v2**: Rejected because it requires user interaction (checkbox/images), which negatively impacts the user experience.
- **hCaptcha**: Considered as a more privacy-focused alternative, but the user specifically requested reCAPTCHA v3 and provided Google keys.
- **Cloudflare Turnstile**: Similar to reCAPTCHA v3 but rejected due to the specific request for Google reCAPTCHA.

### Technical Details
- **Environment Variables**:
    - `NEXT_PUBLIC_GOOGLE_RECAPTCHA_V3_SITE_KEY`: Public key for the frontend.
    - `GOOGLE_RECAPTCHA_V3_SECRET_KEY`: Secret key for the backend.
- **Verification API**: `https://www.google.com/recaptcha/api/siteverify`
- **Payload**: `secret`, `response` (token), and optionally `remoteip`.

## Implementation Plan Adjustments
- Need to add `react-google-recaptcha-v3` to `package.json`.
- Need to ensure `NEXT_PUBLIC_GOOGLE_RECAPTCHA_V3_SITE_KEY` is available to the client. The user provided `GOOGLE_RECAPTCHA_V3_SITE_KEY` in `.env`, so I may need to use `process.env.GOOGLE_RECAPTCHA_V3_SITE_KEY` if Next.js allows it or rename it if needed (but I should follow user's naming first). *Correction*: Next.js requires `NEXT_PUBLIC_` prefix for client-side variables unless they are passed through server-side props/actions. Since these are client components, I'll need to handle this carefully. Actually, the user said they are in `.env`, so I'll check if I can use them or if I should recommend a rename. I'll stick to the user's names for now and see if they work or if I need to pass them down.
