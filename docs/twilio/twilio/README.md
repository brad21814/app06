# Twilio Video Service

This service provides video call functionality for team challenges using Twilio Video API.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here

# Twilio API Key (for token generation)
TWILIO_API_KEY_SID=your_api_key_sid_here
TWILIO_API_KEY_SECRET=your_api_key_secret_here
```

### 2. Getting Twilio Credentials

1. **Account SID & Auth Token**: Available in your Twilio Console dashboard
2. **API Key**: Create a new API key in the Twilio Console:
   - Go to Console > Settings > API Keys
   - Create a new API key with "Video" permissions
   - Save both the SID and Secret

## Usage

### Generate Access Token

```typescript
import { TwilioService } from '@/lib/services/twilio';

const token = TwilioService.generateToken({
  identity: 'user-id',
  roomName: 'room-name'
});
```

### Create Video Room

```typescript
const room = await TwilioService.createRoom('room-name');
```

### Get Room Information

```typescript
const roomInfo = await TwilioService.getRoomInfo(roomSid);
```

### Get Room Participants

```typescript
const participants = await TwilioService.getRoomParticipants(roomSid);
```

## API Endpoints

### Generate Token
- **POST** `/api/twilio/token`
- **Body**: `{ "roomName": "string" }`
- **Returns**: `{ "token": "string" }`

## Testing

Run the test function to validate your setup:

```typescript
import { testTwilioSetup, checkTwilioEnvironment } from '@/lib/services/twilio/twilio.test';

// Check environment variables
checkTwilioEnvironment();

// Test full functionality
await testTwilioSetup();
```

## Integration with Room System

The Twilio service integrates with the existing room system:

1. **Room Creation**: When a room is created in the database, a corresponding Twilio video room is created
2. **Token Generation**: Users get access tokens to join the video call
3. **Participant Tracking**: Track who joins/leaves the video call
4. **Room Management**: Complete rooms when challenges end

## Security

- Tokens are generated server-side with user authentication
- Room names are validated and sanitized
- Participant access is controlled through the room system
- All API calls require user authentication

## Error Handling

The service includes comprehensive error handling for:
- Missing credentials
- Invalid room names
- Network issues
- Twilio API errors
- Authentication failures 