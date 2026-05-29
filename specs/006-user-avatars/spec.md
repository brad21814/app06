# Spec: User Avatars & Profile Photos

## Objective
Enhance the user experience by providing a personalized and professional visual identity across the platform. Implement a robust avatar system that automatically leverages social identity when available, falls back gracefully to standard defaults, and allows for custom photo uploads.

## Requirements
- **Tiered Fallback System**:
    1. Custom Upload: Use the `photoURL` stored in the Firestore `User` document.
    2. Social Identity: Use the `photoURL` from the Firebase Auth user object (provided by Google/SSO).
    3. Default Asset: Use a standard gender-neutral stock avatar if no photo is available.
    4. Initials: Use user initials as the ultimate fallback if the stock image fails to load.
- **Photo Upload**:
    - Allow users to upload, replace, or remove their profile photo.
    - Store custom photos in Firebase Storage under `/avatars/{userId}/profile.jpg`.
    - Automatically update both the Firestore `User.photoURL` and the Firebase Auth `photoURL`.
- **Global Consistency**:
    - Ensure avatars are updated everywhere: Site Header, Dashboard Network Graph, Team Management, and Connection Rooms.

## Tech Stack
- **Storage**: Firebase Storage
- **UI Components**: Shadcn UI Avatar, Lucide Icons
- **Image Processing**: Basic client-side resizing/cropping (standard browser `<input type="file">`).

## Project Structure
- `lib/firebase/config.ts` → Initialize Firebase Storage.
- `components/ui/user-avatar.tsx` → Reusable component for the tiered fallback logic.
- `components/settings/photo-upload.tsx` → UI for uploading and managing profile photos.
- `app/(dashboard)/profile/page.tsx` → Integration of the photo upload feature.

## Boundaries
- **Always do**: Enforce file size limits (e.g., 2MB). Use consistent circular cropping across the UI.
- **Ask first**: If we need complex image manipulation (like server-side resizing).
- **Never do**: Store photos in Firestore as Base64 strings.

## Success Criteria
- [ ] Users can see their Google/SSO profile photo automatically upon sign-up.
- [ ] Users can upload a custom JPG/PNG from their Profile page.
- [ ] Uploaded photos immediately reflect in the Site Header and Dashboard Graph.
- [ ] Users can remove their custom photo and revert to the social/default avatar.
- [ ] System handles empty states (new users with no social photo) with a professional neutral avatar.
