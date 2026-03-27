# app06 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-01

## Active Technologies
- TypeScript (Next.js 15+ App Router) + `stripe`, `firebase-admin`, `firebase` (001-stripe-subscription-management)
- Firestore (Organizations, Subscriptions, Users) (001-stripe-subscription-management)
- TypeScript (Next.js 15+ App Router) + React, Tailwind CSS, Firebase (Firestore), Lucide React (Icons), Twilio Video (for room management) (001-connection-summary-reconnect)
- Firestore (Collections: `connections`, `users`, `themes`) (001-connection-summary-reconnect)
- TypeScript (Next.js 15+ App Router) + React, Tailwind CSS, Lucide React, Firebase (Firestore, Auth), `useActionState` for server actions. (002-manage-team-roles)
- Firestore (Collections: `users`, `teams`, `team_members`, `invitations`, `accounts`). (002-manage-team-roles)
- TypeScript (Next.js 15+ App Router) + `twilio-video`, `@twilio/video-processors`, `lucide-react`, `sonner` (for notifications) (001-video-call-backgrounds)
- N/A (Static image assets in `public/assets/backgrounds/`) (001-video-call-backgrounds)
- TypeScript / Next.js 16 (App Router) + `react-google-recaptcha-v3`, `firebase-admin`, `zod` (003-recaptcha-v3)
- N/A (Verification is stateless) (003-recaptcha-v3)

- TypeScript (Next.js) + Next.js App Router, Firebase (Firestore, Auth), Tailwind CSS (001-privacy-management-tiers)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint
stripe listen --forward-to localhost:3000/api/stripe/webhook

## Code Style

TypeScript (Next.js): Follow standard conventions

## Recent Changes
- 004-improve-getting-started-cta: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
- 003-recaptcha-v3: Added TypeScript / Next.js 16 (App Router) + `react-google-recaptcha-v3`, `firebase-admin`, `zod`
- 001-video-call-backgrounds: Added TypeScript (Next.js 15+ App Router) + `twilio-video`, `@twilio/video-processors`, `lucide-react`, `sonner` (for notifications)



<!-- MANUAL ADDITIONS START -->
## Important

- After each completed plan or change run the qa skill to validate there are no build errors
- If the qa skill succeeds run the commit and push skill to commit the changes
- If the qa skill fails fix the errors and try again
- If you find you are on a feature branch and not the main branch
    - Commit the changes to the feature. 
    - Checkout main and merge to main. 
    - Perform the qa and commit skills on main
<!-- MANUAL ADDITIONS END -->
