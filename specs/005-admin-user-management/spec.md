# Spec: Admin User Insights (TASK015)

## Objective
Allow Account Owners and Admins to view a comprehensive list of all users in their organization and drill into individual profiles to gauge relationship health, sentiment trends, and engagement levels. This helps identify isolated employees or declining team cohesion.

## User Stories
- **US1: Account-wide User List**: As an Admin, I want to see all users in my organization in one table, sorted by their "Health" or "Last Active" status.
- **US2: Individual Health Drill-down**: As an Admin, I want to click a user and see their personal sentiment trend and connection history.
- **US3: Sentiment Visualization**: As an Admin, I want to see a chart of a user's sentiment score over time to detect burnout or engagement issues.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide React, Recharts (for sentiment charts).
- **Backend**: Firebase Firestore, Firebase Admin SDK.
- **Data Access**: SWR for client-side fetching.

## Commands
- Build: `npm run build`
- Lint: `npm run lint`
- Dev: `npm run dev`

## Project Structure
- `app/(dashboard)/teams/users/page.tsx` → Account-wide user list.
- `app/(dashboard)/teams/users/[userId]/page.tsx` → Individual user drill-down.
- `components/dashboard/user-health-chart.tsx` → Chart for individual sentiment/health.
- `lib/firestore/admin/queries.ts` → `getAccountUsers`, `getUserHealthStats`.

## Code Style
Standard TypeScript/Next.js conventions as seen in the project. Use Shadcn UI components (already present in `components/ui`).

## Testing Strategy
- Manual verification of data accuracy for specific users.
- Verify role-based access (members should not be able to access these pages).

## Boundaries
- **Always do**: Check `accountId` matching for all queries. Check user role before rendering.
- **Ask first**: If we need to add new fields to the Firestore `User` or `TeamMember` documents.
- **Never do**: Expose raw transcripts in the drill-down unless the user's privacy tier allows it.

## Success Criteria
- [ ] Admins can view a table of all organization users.
- [ ] Users can be sorted by "Last Connected" and "Avg Sentiment".
- [ ] Clicking a user opens a profile with a sentiment trend line chart.
- [ ] Profile shows a list of the user's recent connections.
- [ ] Unauthorized users (members) are redirected or see a forbidden message.

## Open Questions
1. Should "Health" be a single calculated score or just a display of several metrics? (Recommendation: Keep metrics separate for now: Recency, Frequency, Sentiment).
2. How far back should the sentiment trend go? (Recommendation: 90 days default).
