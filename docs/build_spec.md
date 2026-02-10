# Team Pulp Web Application Build Spec

\[document summary goes here\]

# Structure

Defines the pages that should exist and the components within those pages

- PAGE: / (public access)  
  - Public landing page with typical promotional cards, screenshots and slideshows   
- PAGE: /pricing (Public access)  
  - Subscription pricing details and options  
  - TeamPulp will utilize a tiered, per-user subscription model to incentivize growth and commitment.
  - **Launchpad:** Up to 9 users ($12/user/month). Ideal for pilots.
  - **Growth Engine:** 10-49 users ($10/user/month). For expanding teams.
  - **Culture Catalyst:** 50+ users ($8/user/month). For org-wide adoption.
  - TeamPulp will provide a 30-day free trial period (Launchpad tier equivalent) which allows for 2 full Connection cycles.
  - Components
    - Pricing Cards (displaying the 3 tiers)  
- PAGE: /profile (All Roles)  
  - Description: Shows the users individual profiles  
  - Components  
    - Profile Details Card  
- PAGE: /account (All Roles)  
  - Description: Shows information to the owner regarding subscription and trial information. For all users you can manage your email and password account details.  
  - Components  
    - Subscription Details Card (only for account owner)  
    - Account Details Card (Only for account member)  
    - Password Update Card  
    - Delete Account Card  
- PAGE: /teams (only for Admins and Owner roles)  
  - Description: allows inviting members to your account and assigning teams.  
  - Invite Form Card \- card element to invite new members to the account.   
  - Invite List Card \- card showing current and past invites and their status  
  - Team Members Card \- listing of current team members and their ‘team’ labels. When a user is invited to an account they must be a member of a team.  
- PAGE: /settings  
  - Description: Placeholder for application settings  
  - Components:  
    - Schedules Card (only for Admins and Owners)  
      - Defines name, pairing frequency, duration of connects, interval, start date and end date (or forever).
      - Defines per-question timing rules (Min Time, Max Time) to enforce the PTI-style "quick fire" format.
      - Provide CRUD features for Connect Schedules  
    - Themes (only for Admins and Owners)  
      - A theme is a discussion topic with a bank of approved questions.  
      - Define question sets to direct the connect and break the ice and encourage deep story telling and connection  
      - We want to avoid asking the same questions. So once all participants have had a connect with each other  
      - Provide CRUD features for Connect Themes  
      - Provide default themes and allow the user to create their own themes and prompt questions.  
- PAGE: /connect  
  - Description: View and manage active connects   
  - Select a team, connection schedule and connect theme  
  - List of active team connect schedules  
  - Components  
    - Grid style list of connect schedules, showing status, and basic stats e.g. connect count, missed count etc.  
    - Dialogs to CRUD connect Schedules  
- PAGE: /analytics (only for Admins and Owner roles)  
  - Show graph vis of connect sentiment between individuals and teams  
  - Show   
- PAGE: /dashboard  
  - Show sample analytics  
  - Show quick link to core parts of the application teams and connects

# Workflows

Defines Critical workflows within the web application

## 

## Sign-Up

1. Click sign up from the top nav bar  
2. Opens the /signup page  
3. Enter email address and password or select from a third party auth provider.  
4. If this is an invite the referring url will contain your invite id which will be used to retrieve the account\_id that your account will be added to.  
5. User completes their profile by providing their Name, Role, Team, and Timezone. If they are the first user (Owner), they also create the Account.

## Invite

1. Admin/Owner navigates to the Teams page and clicks "Invite Member".
2. Admin enters email addresses (or uploads CSV) and assigns a Team to each invitee.
3. System sends an email invitation with a unique link containing the `invite_id`.
4. Invitee clicks the link, which redirects to the Sign-Up flow (pre-filling email and linking to the correct Account/Team).

## Starting a Connection Schedule

1. When you create a team connection window; you need to select a connection schedule and a connection theme.
2. The initial status is draft. When you click launch, it changes to active. There can only be one active schedule per team.
3. A cloud function runs hourly to check for any active team schedules that need to trigger a new connection round.
   1. The system generates new pairs (avoiding recent repeats) and identifies **Person A (Proposer)** and **Person B (Confirmer)**.
   2. The schedule defines the frequency (e.g., bi-weekly) and the theme for the current round.
   3. Pairs are generated randomly but weighted to avoid repeating the same partner recently.
   4. Rooms are created wiht twilio for each connection and the connection document the roomUrl is updated along with any identifying information.
   

## Participant Scheduling of a Connect Session

1. **Phase 1: The Proposer (Person A):**
   - Receives an email: "You've been paired with [Person B]! Select 3 times."
   - Clicks link to view a **filtered 7-day view** (based on their profile availability).
   - Selects 3 potential time slots.
   - **Technical Implementation:**
     - `POST /api/schedule/propose`: Updates connection status to `proposed` and stores `proposedTimes`.
     - Triggers `emailService.sendProposalEmail` to notify Person B.
2. **Phase 2: The Confirmer (Person B):**
   - Receives an email: "[Person A] has selected 3 times."
   - Clicks link to see the 3 options converted to **their local timezone**.
   - Selects **one time** (or requests a reset).
   - **Technical Implementation:**
     - `POST /api/schedule/confirm`: Updates connection status to `scheduled` and stores `confirmedTime`.
     - Generates ICS file using `ics` library.
     - **Critical Detail**: ICS generation includes fallbacks for missing names (defaults to 'Participant' to prevent validation errors).
     - Triggers `emailService.sendCalendarInvite` with the ICS file as an attachment.
     - **Critical Detail**: Postmark attachment object requires `"ContentID": null` for non-inline attachments to function correctly.
3. **Phase 3: Confirmation:**
   - System locks the time.
   - Automatically generates and emails an **ICS calendar file** to both parties via `sendCalendarInvite`.
   - The ICS file includes the persistent **Twilio Video Link**.




## Conducting a Connect Session

1. A meeting room is created using Twilio video when the schedule is first arranged.,  
2. **PTI Style Format:** When both parties join, the "quick fire" session begins.
   - Questions are displayed one by one.
   - Each question has a **Max Time** countdown (e.g., 3 mins).
   - Participants must discuss for at least **Min Time** before the "Next" button becomes active.
   - When time expires, the system prompts to move to the next topic.
   - **Timestamps:** The system logs the timestamp when each question is presented (`questionEvents`) to align with the transcript later.
3. When the session is finished the transcript is stored  
4. An LLM processes the transcript and measures overall sentiment and stores this for later analysis  
5. The connect results are recorded /connects/{connect\_id}

## Post Connect Session and Analytics Aggregation

1. **Recording & Status:** 
   - When the Twilio Room ends, a webhook (`twilioWebhook`) triggers.
   - It verifies the `room-ended` event and updates the Connection status to `completed` in Firestore.
   - It captures the `duration` and `endedAt` timestamp.
2. **Transcription & Analysis (Planned):** 
   - A separate `recording-completed` webhook triggers the analysis pipeline.
   - Transcripts are generated and processed by LLM for summary and sentiment.
3. **Data Aggregation:** 
   - The `onConnectionUpdate` Cloud Function detects changes to Connection status or analysis.
   - It aggregates metrics (Count, Sentiment, Participation) into the `AnalyticsSnapshot` collection.
   - Statistics are rolled up by Team and Account for the Dashboard.

# Data Dictionary

Describes a suggested schema for the firestore NoSQL document collections supporting the web application.

## /accounts/{account\_id}

Account level information accessible by the account owner, including stripe subscription status and customer information

| Field | Description | Example |
| :--- | :--- | :--- |
| id | Account ID | "550e8400-e29b-41d4-a716-446655440000" |
| name | Organization/Account Name | "Acme Corp" |
| owner_id | User ID of the account owner | "a1b2c3d4-e5f6-7890-1234-567890abcdef" |
| stripe_customer_id | Stripe Customer ID | "cus_789" |
| subscription_status | Status of subscription | "active", "trialing", "past_due" |
| created_at | Creation timestamp | 2025-01-01T12:00:00Z |

## /users/{user\_id}

Restricted user information email address etc

| Field | Description | Example |
| :--- | :--- | :--- |
| id | User ID | "a1b2c3d4-e5f6-7890-1234-567890abcdef" |
| auth_uid | Firebase Auth UID | "f1r3b4s3-u1d-5678-90ab-cdef12345678" |
| email | User Email | "jane@acme.com" |
| created_at | Creation timestamp | 2025-01-01T12:00:00Z |

## /profiles/{profile\_id}

Stores user profile information, username, timezone

| Field | Description | Example |
| :--- | :--- | :--- |
| id | Profile ID | "c2d3e4f5-g6h7-8901-2345-678901abcdef" |
| user_id | Linked User ID | "a1b2c3d4-e5f6-7890-1234-567890abcdef" |
| full_name | Display Name | "Jane Doe" |
| role | Job Title/Role | "Senior Engineer" |
| team_id | Assigned Team ID | "b2c3d4e5-f6g7-8901-2345-678901abcdef" |
| timezone | IANA Timezone | "America/New_York" |
| avatar_url | URL to profile picture | "https://..." |

## /teams/{team\_id}

Team records each account can have multiple teams, each team is related to one account.  Every account must have at least one default team named ‘\<account name\> team’

| Field | Description | Example |
| :--- | :--- | :--- |
| id | Team ID | "b2c3d4e5-f6g7-8901-2345-678901abcdef" |
| account_id | Parent Account ID | "550e8400-e29b-41d4-a716-446655440000" |
| name | Team Name | "Engineering" |
| created_at | Creation timestamp | 2025-01-01T12:00:00Z |

## /connections/{connect_id}

Stores data about a single connect session.

| Field | Description | Example |
| :--- | :--- | :--- |
| id | Id of the connect | "..." |
| status | Status of the connect | "completed" |
| durationSeconds | Duration in seconds | 900 |
| endedAt | Timestamp when call ended | 2025-01-01T12:15:00Z |
| analysis | Object containing AI analysis | `{ ... }` **(Admin Only)** |
| questionEvents | Log of question timestamps | `[{ question: "...", askedAt: "..." }]` |

## /relationships/{relationship_id}

Tracks the evolving connection strength between two users.
ID Format: `min(uid1, uid2)_max(uid1, uid2)`

| Field | Description | Example |
| :--- | :--- | :--- |
| id | Composite User IDs | "uidA_uidB" |
| users | Array of User IDs | `["uidA", "uidB"]` |
| strengthScore | 0-100 Connection Strength | 75 |
| connectionCount | Number of sessions | 5 |
| lastConnectedAt | Timestamp of last session | 2025-01-01T12:00:00Z |
| tags | Shared topics/interests | `["hiking", "react"]` |

## /transcripts/{transcript_id}

Stores transcript from video connect calls.

| id | ID of the connect | 61f0c404-5cb3-11e7-907b-a6006ad3dba0 |
| :---- | :---- | :---- |
| raw\_json | Raw JSON from Twilio transcript. | {} |
| summary | LLM generated summary of conversation | “Some summary text” |
| participant\_a | ID of the user who is participant\_a | 61f0c404-5cb3-11e7-907b-a6006ad3dba0 |
| participant\_b | ID of the user who is participant\_b | 61f0c404-5cb3-11e7-907b-a6006ad3dba0 |
| created\_at | Date this record was created |  |
| updated\_at | Date this record was updated |  |

## /invites/{invite_id}

Stores status and information regarding an invite for users to join a team.

| id | Id of the invite | 61f0c404-5cb3-11e7-907b-a6006ad3dba0 |
| :---- | :---- | :---- |
| invited\_by | ID of the user who invited the member | 61f0c404-5cb3-11e7-907b-a6006ad3dba0 |
| account\_id | ID of the account that this member will join | 61f0c404-5cb3-11e7-907b-a6006ad3dba0 |
| team\_id | ID of the team within the account that this member will join | 61f0c404-5cb3-11e7-907b-a6006ad3dba0 |
| email | Email address of the invited user | john.doe@email.com |
| status | Status of the invited user \[Pending, accepted, expired, cancelled\] | ‘accepted’ |
| created\_at | Time this document was created | 2024-03-15T14:30:00Z |
| updated\_at | Time this document was updated | 2024-03-15T14:30:00Z |

## /schedules/{schedule_id}

Defines the recurring connection rules for a team.

| Field | Description | Example |
| :--- | :--- | :--- |
| id | Schedule ID | "d3e4f5g6-h7i8-9012-3456-789012abcdef" |
| team_id | ID of the team | "b2c3d4e5-f6g7-8901-2345-678901abcdef" |
| theme_id | ID of the current/active theme | "e4f5g6h7-i8j9-0123-4567-890123abcdef" |
| frequency | Frequency of connections | "bi-weekly" |
| min_time_per_question | Minimum seconds to discuss a topic | 60 |
| max_time_per_question | Maximum seconds to discuss a topic | 180 |
| status | Status of the schedule | "active", "paused" |
| next_run_at | Timestamp for next generation | 2026-02-01T09:00:00Z |

## /themes/{theme_id}

Defines discussion topics and question banks for connections.

| Field | Description | Example |
| :--- | :--- | :--- |
| id | Theme ID | "e4f5g6h7-i8j9-0123-4567-890123abcdef" |
| account_id | Account ID (null for system defaults) | "550e8400-e29b-41d4-a716-446655440000" |
| name | Theme Name | "Trust & Safety" |
| description | Brief description | "Questions to build psychological safety." |
| questions | Array of question prompts | ["What is your favorite food?", "Describe a challenge..."] |
| created_by | User ID of creator | "a1b2c3d4-e5f6-7890-1234-567890abcdef" |
| created_at | Creation timestamp | 2025-01-01T12:00:00Z |

## /analytics/{analytics_id}

Stores aggregated analytical information.
ID Format: `{entityType}_{entityId}_{period}` (e.g., `team_123_2025-01`)

| Field | Description | Example |
| :--- | :--- | :--- |
| id | Analytics ID | "team_123_2025-01" |
| entityType | "team" or "account" | "team" |
| entityId | ID of the team or account | "123" |
| period | YYYY-MM | "2025-01" |
| totalConnections | Count of connections | 15 |
| completedConnections | Count of completed connections | 12 |
| sumSentiment | Sum of sentiment scores | 1020 |
| countSentiment | Count of scored connections | 12 |
| topTopics | Map of topic counts | `{ "leadership": 5, "hobbies": 3 }` |
| updatedAt | Last aggregation timestamp | ... |

# Business Rules

## Users and Accounts

- **Roles:**
  - **Owner:** Full access to Billing, Account Settings, and Account-wide Analytics. Created upon initial sign-up.
  - **Manager:** Can view Team-level analytics and manage Team members.
  - **Member:** Can only view their own stats, history, and manage their profile.
- **Account:** A user belongs to exactly one Account (MVP limitation).
- **Teams:** Users must be assigned to a Team to participate in connections.

## Subscriptions and Trials

- **Trial:**
  - Length: 30 Days (No credit card required).
  - Features: Full access to all features (Launchpad tier equivalent, limit 9 seats).
  - Expiry: On Day 30, access is locked until a subscription is active.
- **Tiers (Per User Pricing):**
  - **Launchpad:** Up to 9 users - $12/user/month.
  - **Growth Engine:** 10-49 users - $10/user/month.
  - **Culture Catalyst:** 50+ users - $8/user/month.
- **Billing:** Stripe subscription based on active seat count.

## Connections/Connects

- **Frequency:** Bi-weekly (every 2 weeks)
- **Duration:** 15 minutes (hard limit recommendation, soft limit in UI).
- **Pairing Logic:**
  - Prioritize cross-functional pairs (different roles/teams).
  - Avoid repeating pairs within a "Season" if possible.
- **Scheduling:**
  - **Proposer (Person A):** Selects 3 slots from a filtered 7-day view.
  - **Confirmer (Person B):** Picks 1 slot (converted to local timezone).
  - **ICS Generation:** System sends calendar invites immediately upon confirmation.
  - **Reset:** Confirmer can reject all 3 and request new times.
  - **Access:** Only the scheduled participants can join this video session.
  - The proposeser can choose to skip the scheduling workflow and simply propose a calender invite.

  - Recording is enabled by default.
  - Once the room is closed we
    - record some metrics
      - duration
      - number of participants
      - number of questions asked
      - number of questions answered
      - number of questions skipped
    - transcribe the recording then
      - use genai to generate a summary
      - use genai to generate a sentiment analysis
      - use genai to generate a topic analysis
      - use genai to generate a key takeaways
      - if there was at least 30seconds of dialig we will track that connection as completed.
  - **Completion Logic:** 
    - A connection is marked "completed" via `room-ended` webhook.
    - Duration > 30s is a soft requirement for "valid" connections in analysis.

## Analytics and Reporting

- **Aggregation:** "Aggregated-on-Write" via Cloud Functions (`onConnectionUpdate`).
- **Access:**
  - **Dashboard (/analytics):** Accessible by Owners and Admins.
  - **Metrics:**
    - **Vibe Check:** Average Sentiment Score over time.
    - **Participation:** Completed vs Scheduled connections.
    - **Participation:** Completed vs Scheduled connections.
    - **Network Density:** (Planned) Graph of unique connections within a team. **Note:** Individual edges are hidden from managers to preserve privacy; only aggregate density scores are shown.

# Feature Build Priority

## 1. Framework and Auth (Core Skeleton)

- **Project Setup:**
  - Initialize Next.js 14+ (App Router) with Tailwind CSS.
  - Configure Firebase Admin SDK (Server) and Client SDK.
- **Authentication:**
  - Implement Firebase Auth (Email/Password + Google SSO).
  - Create `auth_middleware` for protected routes.
- **Onboarding Flow:**
  - Build `/signup` and `/login` pages.
  - Implement **Onboarding Wizard** (Profile Creation: Name, Role, Timezone).
  - Implement **Account Creation** (for Owners) and **Team Setup).
  - Build `/teams` page for inviting members (Postmark email integration).

## 2. Connection Settings and Scheduling Engine

- **Settings UI:**
  - Build `/settings` page for managing **Schedules** (Frequency, Start Date) and **Themes** (Question Banks).
  - Implement CRUD operations for Schedules and Themes in Firestore.
- **Scheduling Logic (The "Ritual"):**
  - Develop Cloud Function (Cron Job) to check active schedules hourly.
  - **Scheduling Logic:**
    - Query active schedules where `status` is 'active'.
    - Check if "Today" matches `start_day`.
    - Check if `next_run_at` <= Now (to handle frequency interval).
  - **Pairing Algorithm:**
    - Fetch all Team Members for the schedule's team.
    - Fetch past `connections` for this team to build a history graph.
    - **Optimization Goal:** Minimize repeat connections.
    - **Logic:**
        1. Shuffle participants.
        2. For each unpaired user (A), find a partner (B) from the pool who A has met the fewest times (ideally 0).
        3. Create a Connection document with `status: scheduling` and include the `themeId`.
  - Build **Proposer Email Trigger** (Person A receives "Select 3 Times" email).
  - Build **Confirmer Email Trigger** (Person B receives "Confirm Time" email).
  - Implement **ICS Generation** (Node.js library) to attach calendar files to confirmation emails.

## 3. Connect Room and Video Experience

- **Video Infrastructure:**
  - Integrate Twilio Video API (Token generation endpoint).
  - Build `/connect/[connect_id]` page.
  - Implement "Pre-flight check" (Camera/Mic test).
- **In-Call Experience:**
  - Build **Slideshow Component** for Theme Questions (synced between peers if possible, or local).
  - Implement **Timer Component** (15-minute countdown with soft warning).
  - **Recording:** Enable Twilio Cloud Recording.

## 4. AI Pipeline and Analytics (In Progress)

- **Ingestion:**
  - [x] Webhook for `recording-completed` and `room-ended` (`functions/src/twilioWebhook.ts`).
  - [ ] Composition API integration for audio mixing.
- **Processing:**
  - [x] Aggregation Trigger (`onConnectionUpdate`).
  - [ ] LLM Intelligence Worker (Transcription -> Sentiment/Topics).
- **Dashboards:**
  - [x] Analytics Page (`/analytics`) with Recharts.
  - [x] KPI Cards (Sentiment, Participation).
  - [ ] Network Graph Visualization.

## 5. Subscription and Trials

- **Stripe Integration:**
  - Set up Stripe Products (Launchpad, Growth, Culture).
  - Implement Stripe Checkout for subscription upgrades.
  - Build **Customer Portal** link for billing management.
- **Access Control:**
  - Implement **Trial Logic** (Middleware check: `created_at` < 30 days OR `subscription_status` = active).
  - Build "Trial Expired" paywall.

## 6. Polish and Launch

- **UI/UX Refinement:**
  - Empty states for Dashboards.
  - Loading skeletons and error handling (Toast notifications).
  - Mobile responsiveness check.
- **Marketing & SEO:**
  - Build public `/pricing` page with tier comparison.
  - Optimize Landing Page (`/`) with value props and screenshots.
  - Configure SEO metadata (OpenGraph tags).
  - Set up Analytics (PostHog/Google Analytics).
