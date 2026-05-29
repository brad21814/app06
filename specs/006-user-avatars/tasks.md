# Tasks: User Avatars & Profile Photos

## Phase 1: Infrastructure & Fallbacks

- [ ] T1.1: Initialize Firebase Storage in `lib/firebase/config.ts`
  - Acceptance: `storage` object is exported and connected to emulator if enabled.
  - Verify: Check `console.log` for "Connected to Firebase Emulators" and export existence.
- [ ] T1.2: Create `components/ui/user-avatar.tsx` with tiered fallback logic
  - Acceptance: Component handles Firestore photoURL > Auth photoURL > Default asset > Initials.
  - Verify: Test with different combinations of user data.
- [ ] T1.3: Add default gender-neutral avatar SVG
  - Acceptance: Professional default avatar exists at `public/assets/avatars/default.svg`.

## Phase 2: Photo Upload Logic

- [ ] T2.1: Implement photo upload logic in `lib/firebase/storage.ts` or similar
  - Acceptance: Files are uploaded to unique paths and URLs are saved to User doc.
  - Verify: Check Firebase Console (Emulator) for the file existence after upload.
- [ ] T2.2: Implement photo removal logic
  - Acceptance: Deletes file from storage and clears URL from Firestore.

## Phase 3: Profile UI Integration

- [ ] T3.1: Create `PhotoUpload` component in `components/settings/photo-upload.tsx`
  - Acceptance: Intuitive UI for selecting and removing photos.
  - Verify: Manual test of the upload button and loading spinner.
- [ ] T3.2: Add `PhotoUpload` to `app/(dashboard)/profile/page.tsx`
  - Acceptance: Appears at the top of the profile page.

## Phase 4: Global Updates

- [ ] T4.1: Update Site Header to use `UserAvatar`
  - Acceptance: Personal photo reflects immediately in the header.
- [ ] T4.2: Update Connections Graph to use `UserAvatar` logic
  - Acceptance: Graph nodes show real photos instead of letters.
- [ ] T4.3: Update Team/User lists to use `UserAvatar`
  - Acceptance: Consistent visual identity across management tables.
