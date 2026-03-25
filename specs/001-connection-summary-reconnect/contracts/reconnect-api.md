# Contract: Reconnect API

## Endpoint: `POST /api/connections/[connectionId]/reconnect`
Resets the connection state in Firestore to allow participants to restart the session.

### Request Headers
- `Content-Type`: `application/json`
- `Authorization`: Session cookie required.

### Request Path
- `connectionId`: The ID of the connection to reconnect.

### Request Body
- (Empty)

### Response (200 OK)
```json
{
  "success": true,
  "message": "Connection reset for reconnection"
}
```

### Error Responses
- **401 Unauthorized**: No active session.
- **403 Forbidden**: User is not a participant of this connection.
- **404 Not Found**: Connection document not found.
- **500 Internal Server Error**: Unexpected Firestore or server failure.
