# Feature Specification: Connection Summary and Reconnect

**Feature Branch**: `001-connection-summary-reconnect`  
**Created**: March 25, 2026  
**Status**: Draft  
**Input**: User description: "Modify the connections page once a connection is completed it should show a summary of the questions and answers. e.g. when did it happen, what questions were asked, who were the participants and a summary of the responses per question. Maybe keep a Reconnect button that would start the session again and overwrite any assets recorded from the old session."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Post-Connection Reflection (Priority: P1)

After a connection session concludes, participants want to review the progress of their conversation. They need a centralized view that reminds them of who they talked to, when, and which questions from the theme were successfully addressed.

**Why this priority**: This is the core value proposition of the task—providing a record of the connection. It allows participants to see their completion progress.

**Independent Test**: Can be tested by completing a connection with multiple questions, then verifying the summary page displays the session metadata and the completion status for each question.

**Acceptance Scenarios**:

1. **Given** a connection session has just ended, **When** I view the connection details, **Then** I see the timestamp of when the session occurred.
2. **Given** a connection summary page, **When** I look at the participants section, **Then** I see a list of everyone who joined the session.
3. **Given** a connection summary page, **When** I review the conversation section, **Then** I see each question that was part of the session and an indicator of whether it was completed or skipped.

---

### User Story 2 - Session Reset/Retry (Priority: P2)

Sometimes a session might not go as planned, or participants want to experience the same theme again with a fresh start. They want to be able to "wipe the slate clean" and restart the session immediately from the summary page.

**Why this priority**: Provides flexibility and error recovery. While the summary is the primary goal, the ability to redo the session ensures users aren't stuck with "bad" data or accidental completions.

**Independent Test**: Can be tested by clicking "Reconnect" on a completed summary, finishing the new session, and verifying the summary now shows the *new* session's data instead of the original.

**Acceptance Scenarios**:

1. **Given** a completed connection summary, **When** I click the "Reconnect" button, **Then** I am taken back to the start of the connection session.
2. **Given** I have reconnected and completed a new session, **When** I view the summary again, **Then** the previous session's assets (responses, summaries) have been replaced by the new session's data.

---

### Edge Cases

- **No Responses**: What happens if a question was asked but no one responded or the session ended before anyone could answer? (Requirement: Show "No response recorded" or skip the question in the summary).
- **Incomplete Session**: How is the summary handled if the session was abandoned? (Requirement: Show summary for whatever progress was made, or a "Session incomplete" status).
- **Missing Participants**: If a participant leaves mid-session, are they still listed? (Requirement: List everyone who joined at any point).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the start and end date/time of the connection session.
- **FR-002**: System MUST list all participants who joined the connection.
- **FR-003**: System MUST list every question that was part of the connection session's theme.
- **FR-004**: System MUST indicate the completion status (e.g., Completed, Skipped, Not Reached) for each question in the session.
- **FR-005**: System MUST provide a visible "Reconnect" button on the connection summary page.
- **FR-006**: The "Reconnect" action MUST reset the connection state (current question, completion status) to allow for a fresh start.
- **FR-007**: System MUST ensure that completing a reconnected session overwrites the previous session's progress and status data to prevent duplicate or conflicting records for that connection instance.

### Key Entities *(include if feature involves data)*

- **Connection**: The central record of the session, tracking status, time, and links to progress.
- **Participant**: A record of a user's involvement in a specific connection instance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of completed connections generate a summary page containing time, participant, and question completion data.
- **SC-002**: Users can navigate from the end of a session to the summary page in less than 2 seconds.
- **SC-003**: The "Reconnect" button successfully resets the session for 100% of users who trigger it.
- **SC-004**: Data from a previous session is successfully removed/overwritten by the new session progress upon completion of a "Reconnect" flow.
