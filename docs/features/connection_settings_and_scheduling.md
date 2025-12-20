## 🧩 Feature: Connection Settings & Scheduling

### Overview
The core engine of TeamPulp, often referred to as "The Ritual". This feature handles the configuration of connection schedules for teams, the automated generation of user pairs, and the low-friction email-based scheduling flow that results in a booked video call.

### Goals
- **Automate "The Ritual":** Remove manual administrative burden from managers.
- **Low-Friction Scheduling:** Eliminate the need for calendar integration by using a simple "Propose 3 / Pick 1" flow.
- **Flexible Configuration:** Allow admins to define frequency and discussion themes for different teams.
- **Reliable Delivery:** Ensure calendar invites (ICS) and video links are delivered accurately.

### User Stories
- As an admin, I want to set up a bi-weekly connection schedule for my "Engineering" team so they bond regularly.
- As an admin, I want to assign a specific "Theme" (e.g., Trust & Safety) to a schedule to guide the conversation.
- As a user (Proposer), I want to easily select 3 time slots that work for me without logging into a complex dashboard.
- As a user (Confirmer), I want to pick one time slot from my partner's suggestions and have it automatically added to my calendar.
- As a manager, I want to pause a schedule during holidays so people aren't bothered.

### Workflows

1. **Configure Schedule (Admin)**
   - Admin navigates to `/settings`.
   - Selects a **Team** (e.g., Engineering).
   - Defines **Frequency** (e.g., Bi-weekly).
   - Selects a **Theme** (e.g., "Getting to Know You") from the library or creates a custom one.
   - Sets Status to **Active**.
   - **Outcome:** A `schedule` document is created/updated in Firestore.

2. **Automated Pairing (System)**
   - **Trigger:** Cloud Function (Cron Job) runs hourly.
   - **Logic:**
     - Finds active schedules due for a new round.
     - Fetches team members.
     - Generates pairs using a weighted random algorithm (prioritizing those who haven't met recently).
     - Assigns roles: **Person A (Proposer)** and **Person B (Confirmer)**.
   - **Outcome:** `connection` documents created with status `scheduling`. Emails sent to Proposers.

3. **Participant Scheduling (The Negotiation)**
   - **Step 1: Proposal (Person A)**
     - Receives email: "Time to connect with [Person B]! Pick 3 times."
     - Clicks link -> Lands on simple scheduling page.
     - Selects 3 time slots (7-day window).
     - Submits.
     - **Outcome:** Connection status updates to `proposed`. Email sent to Person B.
   
   - **Step 2: Confirmation (Person B)**
     - Receives email: "[Person A] suggested 3 times."
     - Clicks link -> Lands on simple scheduling page (times converted to local timezone).
     - Selects **one** slot (or requests reset).
     - Submits.
     - **Outcome:** Connection status updates to `scheduled`.

   - **Step 3: Finalization**
     - System generates a unique **Twilio Video Room** token/URL.
     - System generates an **ICS calendar file** containing the video link.
     - Sends confirmation email with ICS attachment to both parties.

### Screens Required
- **Settings Page (`/settings`):**
    - **Schedule Manager:** List active schedules, Edit/Pause/Resume buttons.
    - **Theme Builder:** Create/Edit themes and question banks.
- **Scheduling Interface (Public/Private Link):**
    - **Proposer View:** Calendar/List view to pick 3 slots.
    - **Confirmer View:** List of 3 options to pick 1.
    - **Success State:** "Confirmed! Check your email."

### Technical Notes
- **Database:**
    - `schedules`: Stores configuration (frequency, theme, next_run).
    - `themes`: Stores question banks.
    - `connections`: Stores the state of each 1:1 (status, proposed_times, confirmed_time).
- **Cloud Functions:**
    - `checkSchedules`: Cron job to trigger pairing.
    - `sendSchedulingEmails`: Triggers Postmark emails.
    - `generateICS`: Node.js utility to create .ics files.
- **External APIs:**
    - **Postmark:** For transactional email delivery.
    - **Twilio:** For generating video room rooms/tokens (at confirmation time).
- **Security:**
    - Scheduling links should contain a signed token or unique ID to allow access without full login (low-friction).
