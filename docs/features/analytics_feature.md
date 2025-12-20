# Feature: Analytics Dashboard & Data Pipeline

## Overview
This feature implements the data pipeline and visualization layer for TeamPulp's Relationship Intelligence platform. It provides Owners and Admins with a high-level view of organizational health, connection quality, and participation metrics.

## 1. Data Tracking Strategy

We will track metrics at three specific stages in the application lifecycle:

### A. Scheduling & Operational (Hard Data)
*   **Where:** `functions/src/schedules.ts` (Scheduled Triggers) and `api/connections` (User Actions).
*   **Metrics:**
    *   *Participation Rate:* Connection Created vs. Connection Completed.
    *   *Missed Connections:* Connections remaining in 'scheduled' state past their time.
    *   *Schedule Adherence:* Time between "Proposal" and "Confirmation".

### B. In-Call Video Analytics
*   **Where:** Twilio Webhooks & Frontend Client (`/connect` page).
*   **Metrics:**
    *   *Duration:* Captured via Twilio "RoomEnded" webhook.
    *   *Participant Presence:* Tracked via "ParticipantConnected/Disconnected" events in Webhook.
    *   *Video Enabled:* (Optional) Tracked via client-side heartbeat or Twilio Track events.

### C. Post-Call AI Analysis (Soft Data)
*   **Where:** Cloud Function `processConnectionRecording`.
*   **Trigger:** Twilio `recording-completed` webhook.
*   **Process:**
    1.  Transcribe Audio (Deepgram/OpenAI Whisper).
    2.  LLM Extraction (OpenAI/Gemini): Sentiment, Topics, "Vibe" Score.
    3.  **Write to Firestore:** Update `connections/{connectionId}` with `analysis` object.

## 2. Twilio Configuration & Webhooks (Detailed)

To enable the AI pipeline, specific Twilio Video settings command the recording and data flow.

### A. Console Configuration
1.  **Room Settings:**
    *   **Room Type:** Group (Required for Recordings).
    *   **Record Participants on Connect:** `ENABLED` (Ensures nothing is missed).
    *   **Media Region:** `us1` (or closest to majority users).

2.  **Status Callback URL:**
    *   Set to: `https://[REGION]-[PROJECT].cloudfunctions.net/twilio-webhook`
    *   **Method:** `POST`
    *   **Events to subscribe:**
        *   `room-ended`: To calculate final duration and status.
        *   `recording-completed`: **CRITICAL**. Fires when a track is available.
        *   `participant-connected` / `participant-disconnected`: For auditing attendance.

### B. Recordings & Compositions API
Since Twilio records separate tracks (Video/Audio) for each participant (MKA/MKV containers), we cannot simply "download the mp4" immediately.

**Workflow:**
1.  **Event:** Receive `recording-completed` for all tracks.
2.  **Action:** Call Twilio **Compositions API** to mix the audio tracks.
    *   *Why?* Transcription engines (OpenAI Whisper) prefer a single mixed Audio file (MP3/WAV) rather than multiple individual MKA streams.
    *   *Endpoint:* `POST /v1/Compositions`
    *   *Body:*
        ```json
        {
          "RoomSid": "RMxxxx",
          "AudioSources": "*",
          "Format": "mp3" 
        }
        ```
    *   *Note:* Excluding video saves processing time and cost if we only need transcription.
3.  **Event:** Receive `composition-available` webhook.
4.  **Action:** Download the MP3 media -> Send to Deepgram/OpenAI -> Transcribe.

### C. Webhook Security
*   Validate the `X-Twilio-Signature` header in the Cloud Function to reject spoofed requests.

## 3. Storage & Aggregation

To ensure the dashboard loads instantly, we will use an **Aggregated-On-Write** pattern rather than querying raw connections on every page load.

### Schema Updates

#### `analytics/{analytics_id}` (New Collection)
Stores pre-computed stats for a specific entity (Team or Account) and time period (Month/Season).

```typescript
interface AnalyticsSnapshot {
  id: string; // e.g., "team_123_2025-01"
  entityType: 'team' | 'account';
  entityId: string;
  period: string; // "2025-01"
  
  // Aggregates
  totalConnections: number;
  completedConnections: number;
  avgSentiment: number;
  participationRate: number;
  
  // Graph Data (Pre-computed)
  relationshipDensity: number; // 0-1 score
  topTopics: Array<{ topic: string; count: number }>;
}
```

### Aggregation Trigger
*   **Cloud Function:** `onConnectionUpdate`
*   **Logic:**
    *   When a connection status changes to `completed` or `analysis` is added:
    *   Identify the Team and Account.
    *   Atomic Increment `totalConnections` / `completedConnections` in the current monthly `AnalyticsSnapshot`.
    *   Re-calculate running average for `avgSentiment`.

## 3. Analytics Dashboard (`/analytics`)

**Access:** Protected Route (Owner/Admin roles only).

### Layout Structure
1.  **Filters:**
    *   Date Range Picker (Last 30 days, Last Quarter).
    *   Team Dropdown (All Teams vs. Specific Team).

2.  **KPI Scorecards (Top Row):**
    *   **Relationship Health Score:** (0-100) Composite of sentiment + density.
    *   **Participation Rate:** % of pairs who actually met.
    *   **Feedback Score:** Avg rating from post-chat micro-survey.

3.  **Visualizations (Charts):**
    *   **"The Vibe" Chart:** Line chart of *Avg Sentiment* over time (Weekly buckets).
    *   **Network Graph:** Force-directed graph node link diagram.
        *   Nodes = Users (colored by Team).
        *   Links = Lines thickness based on # of connections.
        *   Goal: Visualise whether teams are siloing or mixing.

4.  **Leaderboards & Insights (Bottom Row):**
    *   **Trending Topics:** Word cloud or Bar chart of top discussed themes.
    *   **Most Connected:** List of "Super-connector" employees.
    *   **At-Risk:** List of individuals with 0 connections or low sentiment (Needs sensitive handling).

## Implementation Plan
1.  **Backend:** Setup `processRecording` Cloud Function & Twilio Webhook.
2.  **Data:** Implement `onConnectionUpdate` aggregator.
3.  **Frontend:** Build `/analytics` page using Recharts/Chart.js and React Force Graph.
