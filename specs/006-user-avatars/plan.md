# Plan: User Avatars & Profile Photos

## Phase 1: Infrastructure & Fallbacks
- **T1.1**: Initialize Firebase Storage in `lib/firebase/config.ts`.
- **T1.2**: Create `components/ui/user-avatar.tsx`. This component will accept a `User` object (or props) and implement the following logic:
    ```typescript
    const effectivePhotoURL = user.photoURL || authUser?.photoURL || DEFAULT_AVATAR_PATH;
    ```
- **T1.3**: Add a gender-neutral default avatar asset to `public/assets/avatars/default.svg`.

## Phase 2: Photo Upload Logic
- **T2.1**: Implement `uploadUserProfilePhoto(userId, file)` server action or client-side logic.
    - Upload to `avatars/{userId}/profile_{timestamp}.jpg`.
    - Get the Download URL.
    - Update Firestore `users` collection.
    - Update Firebase Auth profile.
- **T2.2**: Implement `deleteUserProfilePhoto(userId)` to remove the custom photo and clear the URLs.

## Phase 3: Profile UI Integration
- **T3.1**: Create `components/settings/photo-upload.tsx`.
    - Display current avatar.
    - "Upload New Photo" button (triggers hidden file input).
    - "Remove" button (if custom photo exists).
    - Loading states for upload.
- **T3.2**: Add the `PhotoUpload` component to the top of the Profile page (`app/(dashboard)/profile/page.tsx`).

## Phase 4: Global Updates
- **T4.1**: Replace all manual `Avatar` implementations with the new `UserAvatar` component:
    - `components/site-header.tsx`
    - `components/dashboard/connections-graph.tsx`
    - `app/(dashboard)/teams/users/page.tsx`
    - `app/(dashboard)/teams/users/[userId]/page.tsx`
    - `app/(dashboard)/connect/[connectionId]/page.tsx`

## Risks & Mitigations
- **Cache Invalidation**: Storage URLs might be cached. We will append a timestamp query param or use unique filenames to ensure updates are immediate.
- **Storage Rules**: We must configure `storage.rules` to ensure users can only write to their own `/avatars/{userId}/` path.
