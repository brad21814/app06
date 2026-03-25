# Data Model: Connection Summary and Reconnect

## Entity: Connection (Update)
The `Connection` entity in Firestore will be updated to include `endedAt` for session duration calculation and better summary reporting.

| Field | Type | Description |
|-------|------|-------------|
| `startedAt` | `Timestamp` | (Existing) When the question session actually started. |
| `endedAt` | `Timestamp` | (New) When the session was marked as completed. |
| `questionEvents` | `Array<QuestionEvent>` | (Existing) Log of question ask events. |
| `status` | `string` | (Existing) Status transitions: `scheduled` -> `in_progress` -> `completed`. |

## State Transitions: Reconnect
When a user clicks "Reconnect", the following state changes occur on the `Connection` document:
1. `status`: Set to `scheduled`.
2. `startedAt`: Set to `null` (or removed).
3. `endedAt`: Set to `null` (or removed).
4. `questionEvents`: Set to `[]` (or removed).
5. `updatedAt`: Updated to current time.

## Relationship: Question Completion
Question completion is derived by comparing the `questions` array (total list) with the `questionEvents` array (actually asked list).
- **Completed**: Question exists in `questionEvents`.
- **Skipped/Not Reached**: Question exists in `questions` but not in `questionEvents`.
