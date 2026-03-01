# Phase 0: Research & Decisions

## Technology Choices & Best Practices

**Decision**: Next.js Server Actions for Privacy Preference Updates
**Rationale**: The app07 Constitution specifically mandates the use of Next.js Server Actions for "UI-driven Firestore reads and writes where tight component integration and simplicity matter." Since the privacy settings page and onboarding flow are UI-driven forms, Server Actions are the optimal and required choice.
**Alternatives considered**: Traditional API routes (rejected per constitution unless for webhooks/background tasks).

**Decision**: Global Layout Wrapper for Existing User Prompt
**Rationale**: To satisfy FR-007 ("prompt existing users who have not set a privacy tier"), we need to intercept users who have a missing `privacyTier`. Using a Client Component within the main dashboard layout to check the user profile and render a non-intrusive notification (e.g., a banner or toast) is the best pattern in Next.js App Router to avoid heavy middleware database queries.
**Alternatives considered**: Next.js Middleware (rejected due to complexity of running Firebase Admin in Edge runtime for every request).

**Decision**: Tier 3 Transcript Restriction Enforcement
**Rationale**: Tier 3 completely restricts transcript sharing and storage for subsequent sessions. This logic should be enforced at the service level (`lib/` or Cloud Functions) when transcripts are generated or processed. We will check the user's `privacyTier` before performing any write operations for transcripts.
**Alternatives considered**: Complex Firestore Security Rules (rejected because the restriction logic involves external processing and session state rather than just pure data access control).

**Decision**: In-App Notification Center for Tier 2 Approvals
**Rationale**: FR-008 requires an In-App Notification Center for manual approvals. We will implement this as a UI component (`components/dashboard/notification-center.tsx`) that queries a new `summaries_pending_approval` collection or filters summaries by `status == 'pending'`.
**Alternatives considered**: Email notifications (rejected during specification phase).
