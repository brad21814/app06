# Quickstart: Connection Summary and Reconnect

## Development Setup
- **Dependencies**: Ensure Firebase Admin SDK and Twilio Service are correctly configured in `.env`.
- **Firestore**: Verify the `connections` collection contains `questionEvents` and (newly) `endedAt` fields.

## Verification Steps
1. **Join Session**: Navigate to `/connect/[connectionId]` and join the Twilio room.
2. **Start Questions**: Click "Start Session Questions" and advance through several questions.
3. **Complete Session**: Click "End Now" or wait for the timer to wrap up.
4. **View Summary**: Verify the session metadata (participants, time) and question completion status (indicator of completion) are displayed.
5. **Reconnect**: Click the "Reconnect" button on the summary page.
6. **Confirm Reset**: Verify you are returned to the initial state (Join Room) and the session data has been reset in Firestore.
