# Data Model: Connect Now and Adhoc Connections

## Entity: Connection (Existing)
Represents the link between two participants.

### Fields Used:
- `id` (string): Unique identifier for the connection.
- `status` (string): State of the connection (`scheduling`, `proposed`, `scheduled`, `in_progress`, `completed`).
- `proposerId` (string): ID of the first participant.
- `confirmerId` (string): ID of the second participant.
- `connectRoomUniqueName` (string): Unique Twilio room identifier (`connect-{connectionId}`).
- `createdAt` (Timestamp): Date of creation.

## State Transitions
1. **Initial**: `scheduling`, `proposed`, or `scheduled`.
2. **Action**: User clicks "Connect Now".
3. **Transition**: Navigation to `/connect/{connectionId}`.
4. **Intermediate State**: Status remains unchanged unless "Start Session Questions" is clicked (updates to `in_progress`).
5. **Final State**: Transition to `completed` happens only when all questions are answered and room ends (existing logic).
