# Data Model & Interfaces

## Entities

### User Profile (`types/firestore.ts`)

The `User` document in Firestore will be extended with the `privacyTier` field.

```typescript
export enum PrivacyTier {
  TIER_1_STANDARD = 'TIER_1',
  TIER_2_CONTROLLED = 'TIER_2',
  TIER_3_PRIVATE = 'TIER_3'
}

export interface User {
  // Existing fields...
  uid: string;
  email: string;
  
  // New fields
  privacyTier?: PrivacyTier; // Optional for backwards compatibility (existing users)
}
```

### Transcript/Summary (`types/firestore.ts`)

For Tier 2, summaries require an approval state.

```typescript
export enum SummaryStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED'
  // Rejected summaries are deleted immediately per FR-008
}

export interface Summary {
  id: string;
  userId: string;
  transcriptId: string;
  content: string;
  status: SummaryStatus;
  createdAt: number; // Unix timestamp
}
```

## Contracts / Server Actions

The UI will communicate with Firestore via Next.js Server Actions (defined in e.g. `app/api/actions/privacy.ts` or `lib/actions/privacy.ts`).

### `updatePrivacyTier(tier: PrivacyTier): Promise<{ success: boolean, error?: string }>`
Updates the currently authenticated user's privacy tier in Firestore.

### `approveSummary(summaryId: string): Promise<{ success: boolean, error?: string }>`
Transitions a summary from `PENDING_APPROVAL` to `APPROVED`.

### `rejectSummary(summaryId: string): Promise<{ success: boolean, error?: string }>`
Deletes the summary and its associated data immediately.
