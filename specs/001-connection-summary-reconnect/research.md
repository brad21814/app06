# Research: Connection Summary and Reconnect

## Decision: Connection State Reset
- **Action**: Reset `status` to `scheduled`, clear `startedAt`, `endedAt`, and `questionEvents`.
- **Rationale**: This allows the connection page to treat the session as "not started", enabling the "Join Room" and "Start Session" flow again.
- **Alternatives considered**: 
    - Creating a new connection document: Rejected because it would break existing schedule links and history.
    - Keeping `startedAt` but adding a `resetCount`: Rejected as it adds unnecessary complexity to the UI logic.

## Decision: Question Persistence
- **Action**: Keep the `questions` array on the connection document during reconnect.
- **Rationale**: The questions are already randomized/selected for this specific connection instance. Reconnecting should ideally use the same set of questions unless the user explicitly wants a new theme (which is out of scope for this task).
- **Alternatives considered**: 
    - Re-shuffling questions: Rejected to maintain consistency for the specific connection's intent.

## Decision: Twilio Room Management
- **Action**: Reuse the existing `connectRoomUniqueName`.
- **Rationale**: `connectRoomUniqueName` is a stable identifier for the connection. When `complete` is called, the room is closed on Twilio's side. Re-joining will simply create a new instance of the room with the same name.
- **Alternatives considered**: 
    - Generating a new `connectRoomUniqueName`: Rejected as it requires updating more fields and provides no benefit.

## Best Practices: Firestore Updates
- **Task**: Use `FieldValue.delete()` (in Admin SDK) or set to `null` to clear fields.
- **Rationale**: Ensures the document is clean and previous timestamps don't interfere with the new session logic.
