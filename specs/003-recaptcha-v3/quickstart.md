# Quickstart: reCAPTCHA v3 Implementation

## 1. Environment Variables
Ensure these are in your `.env` file (User already provided them, but for reference):
```env
GOOGLE_RECAPTCHA_V3_SITE_KEY=your_site_key
GOOGLE_RECAPTCHA_V3_SECRET_KEY=your_secret_key
```

## 2. Install Dependency
```bash
npm install react-google-recaptcha-v3
```

## 3. Server-side Utility
Create `lib/auth/recaptcha.ts` to verify tokens with Google's API.

## 4. Frontend Integration
1. Wrap the application in `components/auth/RecaptchaProvider.tsx`.
2. Use the `useGoogleReCaptcha` hook in Login, Sign-up, and Reset Password forms.
3. Pass the generated token to the server in the form submission request body.

## 5. Backend Integration
In each protected API route:
1. Extract `recaptchaToken` from the request body.
2. Call `verifyRecaptcha(token, action)`.
3. If verification fails or score < 0.5, return a 403 Forbidden error.
