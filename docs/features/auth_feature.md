## 🧩 Feature: User Registration & Authentication

### Overview
Secure and seamless user onboarding and authentication using Firebase Authentication. This is the entry point for all users (Owners, Admins, Members) to access the TeamPulp platform.

### Goals
- Secure authentication via Email/Password and Google Workspace SSO.
- Capture essential user profile information (Role, Team, Timezone) during onboarding.
- Support role-based access control (RBAC) initialization.

### User Stories
- As an admin, I want to create an account and set up teams so my company can start using the platform.
- As an admin, I want to invite team members individually or via CSV upload to save time.
- As a team member, I want to join my account via an invite link and easily set up my profile and team during onboarding so that I can be paired correctly.
- As an admin, I want to ensure only users with company email domains can join (optional future requirement, good to consider).
- As a returning user, I want to log in quickly to check my dashboard.
- As a user, I want to reset my password if I forget it.

### Workflows
1. **Sign Up / Login**
   - User lands on Welcome Page.
   - Chooses "Sign in with Google" or enters Email/Password.
   - If new user -> Redirect to Onboarding Flow.
   - If existing user -> Redirect to Dashboard.
   - **Dashboard Onboarding Checklist:**
     - Create Teams (Admin only)
     - Invite Members (Admin only)
     - Complete Profile (All users)

2. **Admin Onboarding Flow (Creator)**
   - **Step 1: Sign Up** -> Standard auth (Email/Password or Google).
   - **Step 2: Create Account** -> Enter Account Name (e.g., "Acme Corp").
   - **Step 3: Create Teams** -> Define initial teams (e.g., "Engineering", "Design", "Marketing").
   - **Step 3: Create Teams** -> Define initial teams (e.g., "Engineering", "Design", "Marketing").
   - **Step 4: Completion** -> Redirect to Admin Dashboard.

   > **Note:** Member invitation is moved to the Dashboard as an onboarding checklist item.

3. **Member Onboarding Flow (Invitee)**
   - **Step 1: Click Invite Link** -> Land on "Join [Account Name]" page (link contains `invite_id`).
   - **Step 2: Sign Up / Auth** -> Authenticate with Google or Email (email pre-filled).
   - **Step 3: Profile Setup** -> Confirm Name, Role, Upload Avatar, Set Timezone.
   - **Step 4: Team Confirmation** -> Confirm assigned team (from invite) or select if open.
   - **Step 5: Completion** -> Redirect to User Dashboard.

4. **Password Reset**
   - User clicks "Forgot Password" on login screen.
   - Enters email -> receives Firebase password reset email.
   - Clicks link -> sets new password -> logs in.

### Screens Required
- **Login / Sign Up Page:** Clean interface with branding, Google Auth button, and Email form.
- **Onboarding Wizard (Admin):**
    - Account Creation Form
    - Team Setup Input
    - Bulk Invite Uploader (CSV drag & drop)
- **Onboarding Wizard (Member):**
    - Profile Setup (Avatar, Timezone)
    - Team Selector (if not pre-assigned)
- **Forgot Password Modal/Page:** Simple email input.
- **User Profile Settings:** (Post-login) to edit these details later.

### Technical Notes
- **Auth Provider:** Firebase Authentication.
- **Database:** Firestore `users` collection to store profile data (role, team, timezone) linked to `uid`.
- **Middleware:** Use `auth_middleware` to protect routes and redirect unauthenticated users.
- **SDKs:** 
  - Use **Firebase Admin SDK** for server-side operations (creating accounts, verifying invites).
  - Use **Firebase Client SDK** for client-side auth and direct Firestore reads/writes where appropriate.
- **Security:** Firestore security rules to ensure users can only read/write their own data (unless Admin).
