# Feature Specification: Connect Now and Adhoc Connections

**Feature Branch**: `001-connect-now-adhoc`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "when a connection is first created, we list the users connections as pending in a list. we should add a link to 'connect now' allowing both users to connect at any time, this allows them to test their connection. it also allows for adhoc connection by passing the scheduling. do not change the process with whihc we determine the connection to be completed. This should remain the same (which i think is only on completition of all the questions)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Immediate Connection for Testing (Priority: P1)

As a user with a pending connection, I want to be able to jump into the connection room immediately without waiting for a scheduled time, so that I can test my audio/video setup and ensure everything is working correctly.

**Why this priority**: Testing the connection is critical for user confidence and reducing technical issues during scheduled sessions.

**Independent Test**: Can be tested by creating a new connection and immediately clicking "Connect Now" to verify the room opens successfully.

**Acceptance Scenarios**:

1. **Given** I have a connection in "Pending" status, **When** I view my connections list, **Then** I should see a "Connect Now" link or button for that connection.
2. **Given** I am on the connections list, **When** I click "Connect Now", **Then** I should be taken directly to the connection room (video/audio interface).

---

### User Story 2 - Ad-hoc Connection (Priority: P2)

As two users who have an upcoming connection, we want to meet immediately ("adhoc") instead of waiting for our scheduled slot, so that we can have our session whenever we are both ready.

**Why this priority**: Provides flexibility for users who don't want to be strictly bound by the scheduling system.

**Independent Test**: Can be tested by two users clicking "Connect Now" for the same pending connection at the same time and verifying they are placed in the same room.

**Acceptance Scenarios**:

1. **Given** both users are online, **When** both users click "Connect Now" for their shared pending connection, **Then** they should both enter the same active connection room.
2. **Given** one user is already in the room via "Connect Now", **When** the second user clicks "Connect Now", **Then** the second user should join the first user in the room.

---

### Edge Cases

- **Scheduling Conflict**: What happens if users "Connect Now" while a different session is scheduled? (Assumption: "Connect Now" always takes priority for that specific connection pair).
- **Completion Mid-Session**: If users complete all questions during an ad-hoc session, does the connection status update correctly? (Requirement: Yes, completion logic must remain unchanged).
- **Multiple "Connect Now" sessions**: Can users leave and re-enter via "Connect Now" multiple times? (Requirement: Yes, until the connection is marked as completed).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a "Connect Now" action for every connection currently in a "Pending" or "Incomplete" state in the user's dashboard/connection list.
- **FR-002**: Clicking "Connect Now" MUST bypass any current scheduling restrictions for that specific connection. Scheduling is optional; users may choose to use "Connect Now" as an alternative to formal scheduling.
- **FR-003**: The system MUST direct users to the standard connection room interface when "Connect Now" is activated.
- **FR-004**: The system MUST NOT change the connection status to "Completed" solely based on using "Connect Now".
- **FR-005**: The system MUST continue to use the existing completion logic (e.g., answering all required questions) to transition a connection from "Pending" to "Completed".
- **FR-006**: The "Connect Now" link MUST be unique to each connection pair and only accessible to the authorized participants.
- **FR-007**: Formal scheduling steps MAY still trigger their own internal status changes for the connection (e.g., marking as 'Scheduled'), but these must not conflict with the "Connect Now" availability.

### Key Entities

- **Connection**: Represents the link between two users. Status includes "Pending", "Completed".
- **User**: The participants in a connection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully enter their connection room via "Connect Now" regardless of the time of day or scheduled slot.
- **SC-002**: 100% of connections started via "Connect Now" retain their "Pending" status until the existing completion criteria are met.
- **SC-003**: The "Connect Now" link is visible and functional within 2 seconds of the connections list page loading.
