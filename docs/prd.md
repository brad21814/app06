# TeamPulp - Relationship Intelligence Platform - Product Requirements Document

## Project Title
TeamPulp - Relationship Intelligence Platform for Remote Teams

## Project Overview
TeamPulp is a remote team-bonding platform that transforms 1:1 connections between teammates into organizational relationship intelligence. It pairs employees for guided 15-minute video connections, records and analyzes them using AI, and generates actionable insights for individuals and managers. It solves the problem of isolation, siloed teams, and lack of trust in distributed accounts by turning "connections" into a data layer for culture and retention.

## Business Objectives
- **Launch MVP** to a pilot group of remote-first tech teams within 3 months.
- **Prove Value** by demonstrating an increase in "relationship density" and positive user feedback (NPS > 40).
- **Monetize** via a B2B SaaS model (per-user or per-team pricing) after the pilot phase.
- **Retention** Reduce employee churn and improve onboarding speed for customer accounts.

## Target Users
- **Primary Buyer:** CTOs, Heads of Engineering, People & Culture (HR) leaders in remote-first tech companies (50-300 employees).
- **End Users:** Remote employees (Engineers, PMs, Designers) who need to build trust and connections.

## Core Features (Functional Requirements)

### 1. User Registration & Authentication
- **Firebase Authentication:** Email/password, Google Workspace SSO.
- **Profile Creation:** Basic details (Role, Team, Timezone).

### 2. Automated Connection & Scheduling (The Ritual)
- **Smart Pairing:** Algorithm to pair users cross-functionally (e.g., Backend Dev + Designer) every 2 weeks.
- **Low-Friction Scheduling:**
    - System emails Person A to pick 3 time slots.
    - System emails Person B to confirm one slot.
    - System sends calendar invites (ICS) with the video link.
    - No direct Calendar API integration required for MVP.

### 3. Guided Video Connection (PTI Style)
- **High-Energy Format:** Modeled after "Pardon The Interruption" (PTI). A quick-fire conversational engagement.
- **Structured & Timed Prompts:** Each question has a defined **Minimum Discussion Time** (to ensure depth) and **Maximum Discussion Time** (to ensure pace).
- **Video Interface:** Integrated video call using Twilio (or WebRTC).
- **Timeboxing:** 15-minute total timer, with individual question timers to keep it lightweight and energetic.
- **Recording:** Automatic recording of video and audio for analysis.

### 4. AI Analysis & Insight Generation
- **Transcription:** Speech-to-text processing of the connection.
- **Insight Extraction (AI):**
    - Identify shared interests, values, and working styles.
    - Detect sentiment and energy levels.
    - Generate a "Bond Card" summary for the pair.
    - Create a short "Highlight Reel" (15-30s video clip).

### 5. Dashboards
- **Individual Dashboard:**
    - View past connections and "Bond Cards".
    - See personal insights ("What others learned about you").
- **Manager/Admin Dashboard:**
    - **Relationship Graph:** Visual map of connections and silos.
    - **Culture Health:** Aggregated sentiment and engagement metrics.
    - **Participation Stats:** Who is connecting, who is isolated.

### 6. Notifications & Feedback
- **Reminders:** Email/Slack reminders 24h and 10m before chats.
- **Post-Connection Feedback:** Simple 2-question micro-survey (Psychological safety pulse).

## Connection Structure & Relationship Data Model

To ensure simplicity for the MVP, we will implement a flat data model where connections are generated based on a recurring **Schedule** defined for each Team.

### Data Model (Simpler Approach)

- **Schedule:** Defines the frequency (e.g., bi-weekly) and the current theme for a Team.
- **Connection:** The individual event containing the transcription, AI analysis, and feedback.

### Technical Mapping (Firestore)

- `accounts/{accountId}/`
    - `teams/{teamId}/`
        - `schedules/{scheduleId}/` (Defines rules)
    - `connections/{connectionId}/` (Flat collection for all connections, linked by teamId/scheduleId)

#### Analytics Benefits:

- **Manager Dashboard:** Queries connections by `teamId` and filters by date range (e.g., "Last 30 Days") to show trends.
- **Flexibility:** Allows changing frequency or themes without rigid "Season" structures.

## Non-Functional Requirements
- **Privacy & Security:** Strict data handling for recordings and transcripts. GDPR/SOC 2 readiness.
- **Reliability:** High quality video/audio (Twilio).
- **Scalability:** Firebase backend to handle growing data and concurrent calls.
- **Usability:** "Zero admin effort" for the users; seamless scheduling flow.

## Technical Stack
- **Frontend:** Next.js + Tailwind CSS based from a starter template https://github.com/nextjs/saas-starter
- **Backend:** Firebase (Auth, Firestore, Cloud Functions)
- **Hosting:** Firebase App Hosting
- **Video Infrastructure:** Twilio Video API
- **Email Delivery:** Postmark
- **Payments & Subscriptions:** Stripe
- **AI/ML:** OpenAI API (or Google Gemini) via Cloud Functions for transcription and analysis
- **Scheduling:** Custom email-based flow (Node.js/Cloud Functions)

## User Roles & Permissions
| Role | Capabilities |
|---|---|
| **Owner/Admin** | Manage billing, view account-wide insights, configure pairing frequency. |
| **Manager** | View team-level relationship graphs and health signals. |
| **Member** | Participate in pairings, view own history and insights. |

## Milestones
| Milestone | Target Date | Description |
|---|---|---|
| **Requirements & Design** | Week 1-2 | Finalize UI/UX for scheduling and video room. |
| **MVP Development (Core)** | Week 3-6 | Build Auth, Scheduling Loop, and Video Interface. |
| **AI Integration** | Week 7-8 | Implement transcription and insight extraction pipeline. |
| **Internal Testing** | Week 9 | Dogfooding with internal team. |
| **Pilot Launch** | Week 10 | Onboard first external pilot customer. |

## Assumptions
- Users are willing to record their connections for AI analysis (requires clear consent/privacy policy).
- Email-based scheduling is sufficient for MVP (no calendar read access needed).
- 15 minutes is the optimal duration for high participation.

## Constraints
- **Budget:** Limited initial budget, leveraging Firebase and usage-based AI costs.
- **Team:** Small dev team.

## Success Criteria
- **Participation Rate:** >80% of paired users complete the chat.
- **Relationship Density:** Measurable increase in cross-team connections after 3 months.
- **User Satisfaction:** Users report feeling "more connected" to their peers.





