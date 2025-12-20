**Doodle-style two-step consensus flow**.

This pattern removes the difficult job of finding a time from the user and turns it into a simple selection task.

Here is how to design the low-friction scheduling flow for your two parties (Person A and Person B):

## 1. Optimize the User Experience Flow (The "Ritual")

The goal is to minimize the total number of clicks and decisions a user has to make.

### Phase 1: The Proposer (Person A - The Decision Taker)

* **Action:** System identifies Person A (the first person paired).
* **Low-Friction Design:** Instead of presenting a blank calendar, present a list of *pre-filtered* options.
    * **Display:** Show a **filtered 7-day view** of the next week (since the pairing is bi-weekly).
    * **Filtering:** Use **System-Defined Availability** (e.g., the standard work hours/time zone the user set up in their profile) to grey out impossible times.
    * **The Task:** Person A's single task is to **"Select 3 Best Times"** from the available blocks.
* **Prompt:** "You've been paired with [Person B] for your next **Nurture Run**! Please select 3 times that work best for your 15-minute **Segment**."
* **Output:** The system stores these 3 time slots.

### Phase 2: The Confirmer (Person B - The Decision Maker)

* **Action:** System emails/notifies Person B.
* **Low-Friction Design:** **The Poll Pattern.** This is the lowest-friction step because it's purely a choice, not an input.
    * **Display:** Person B receives a prompt showing only the 3 specific time slots selected by Person A, automatically converted to **Person B's local timezone**.
    * **The Task:** Person B's single task is to **"Choose 1 Time"** or request a reset.
* **Prompt:** "[Person A] has selected 3 times for your 15-minute **Segment**. Please choose the time that works for you by [Date/Time limit]."
* **Output:** The system locks in the time.

## 2. Technical and Notification Implementation (The System)

To make this feel frictionless, the system must handle all the complex logistics:

| Low-Friction Component | Implementation Detail | Rationale |
| :--- | :--- | :--- |
| **Timezone Management** | Store all availability and final booking times in **UTC** and only display them converted to the user's local timezone (from their profile). **This is non-negotiable for remote teams.** | Eliminates manual timezone calculation for users. |
| **ICS File Generation** | Immediately upon Person B's selection, use a Cloud Function (Node.js) to dynamically generate and email a standard **ICS file** (iCalendar file) to both users. | This allows the event to be added to *any* external calendar (Google, Outlook, Apple) without requiring API integration. |
| **Link Persistence** | The **Twilio Video Link** should be generated *at the pairing stage* and be included in every notification and the ICS file. It never changes for that event. | Simplifies the reminder and access—it's always the same link. |
| **Clear "Default" Times** | Define clear rules for the **Pairing Frequency** (e.g., must be completed within the 2-week interval) and use **time blocks** rather than exact 15-minute slots (e.g., 9:00, 9:15, 9:30, etc.) to limit choice. | Reduces decision fatigue by providing fewer, cleaner options. |

## 3. Handling Friction Points

* **Friction Point:** Person A's selected times don't work for Person B.
    * **Solution:** Give Person B one simple option: **"None of these work. Ask [Person A] to select 3 new times."** This prevents a back-and-forth email thread and puts the action back on the first user.
* **Friction Point:** The user forgets to show up.
    * **Solution:** Robust, well-timed notifications (24h and 10m before) across both email and Slack (if integrated) as defined in your PRD. The notification only needs to contain the time (in local time) and the link.