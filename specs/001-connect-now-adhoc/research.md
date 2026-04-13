# Research: Connect Now and Adhoc Connections

## Decision: Room Entry and Access Logic
- **Chosen**: Use the existing `/connect/[connectionId]` page for the connection room.
- **Rationale**: The room logic (Twilio, question flow, participants) already exists. "Connect Now" is simply an additional entry point to this room.
- **Alternatives considered**: Creating a separate "test room". Rejected because the goal is to allow ad-hoc sessions that can be completed.

## Decision: UI Entry Point
- **Chosen**: Add a "Connect Now" link to the `ConnectionTable` in `components/dashboard/connections.tsx`.
- **Rationale**: This is the primary location where users view their connections. Adding the action here provides immediate access.

## Decision: Scheduling Bypass
- **Chosen**: Bypassing scheduling is handled by simply providing the link. The existing `/api/twilio/token` route only checks participant status, not time-based scheduling.
- **Rationale**: Minimal code changes required while maintaining security.

## Decision: Status Persistence
- **Chosen**: No status change on room entry. The "Completed" status transition remains tied to the `room-ended` webhook from Twilio, which checks if all questions were answered (existing logic).
- **Rationale**: Aligns with user requirement to not change the completion process.
