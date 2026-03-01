# Quickstart: Testing Privacy Management Tiers locally

1. **Start the local environment**
   Run the local development server and Firebase emulators.
   ```bash
   pnpm run dev
   # Ensure Firebase emulators are running if applicable in this workspace
   ```

2. **Test User Onboarding (Tier Selection)**
   - Navigate to `/sign-up`.
   - Complete the registration fields.
   - Verify that you are presented with the 3 privacy tiers and forced to select one before completing the flow.
   - Check the Firestore Emulator to ensure the user document contains the selected `privacyTier`.

3. **Test Existing User Notification (Default to Tier 1)**
   - Create a user directly in the Firestore Emulator without a `privacyTier` field.
   - Log in as that user.
   - Verify that the dashboard displays a non-intrusive notification informing you that you default to Tier 1.

4. **Test Settings Page (Privacy Management)**
   - Navigate to the Account/Profile settings.
   - Click on the "Privacy Management" section.
   - Change your tier to "Tier 3 (Private)" and save.
   - Refresh the page to ensure the setting persisted.

5. **Test Tier 2 Manual Approvals**
   - Set your account to Tier 2.
   - Manually insert a `Summary` document into Firestore with `status: "PENDING_APPROVAL"` linked to your `userId`.
   - Open the app and check the Notification Center.
   - Click "Approve" (verify status changes to `APPROVED`) or "Reject" (verify document is deleted immediately).
