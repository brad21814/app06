# Twilio Integration Testing Guide

This guide covers multiple ways to test the Twilio video integration in your application.

## 🚀 Quick Start Testing

### 1. Browser Testing (Recommended)
Visit the test page in your browser:
```
http://localhost:3000/test-twilio
```

This provides a user-friendly interface to test:
- Environment variable validation
- Token generation
- API endpoint functionality

### 2. Command Line Testing

#### Basic API Testing
```bash
npm run test:twilio-api
```
This tests:
- Server connectivity
- API endpoint responses
- Environment variable validation
- Error handling

#### Full Integration Testing
```bash
npm run test:twilio
```
This tests:
- Twilio service functionality
- Room creation and management
- Token generation
- Participant tracking

## 🔧 Manual Testing Steps

### Step 1: Environment Setup
1. Add Twilio credentials to `.env.local`:
```bash
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY_SID=your_api_key_sid_here
TWILIO_API_KEY_SECRET=your_api_key_secret_here
```

2. Start your development server:
```bash
npm run dev
```

### Step 2: Test API Endpoints

#### Test Token Generation (Unauthenticated)
```bash
curl -X POST http://localhost:3000/api/twilio/token \
  -H "Content-Type: application/json" \
  -d '{"roomName": "test-room"}'
```
**Expected**: 401 Unauthorized (requires authentication)

#### Test Token Generation (Authenticated)
1. Log into your application
2. Use the browser test page or make an authenticated request
3. **Expected**: 200 OK with JWT token

#### Test Invalid Requests
```bash
# Missing roomName
curl -X POST http://localhost:3000/api/twilio/token \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid JSON
curl -X POST http://localhost:3000/api/twilio/token \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```
**Expected**: 400 Bad Request

### Step 3: Test Twilio Service Directly

Create a test script to run the Twilio service functions:

```javascript
// test-service.js
const { TwilioService } = require('./lib/services/twilio/twilio.service');

async function testService() {
  try {
    // Test credential validation
    const isValid = await TwilioService.validateCredentials();
    console.log('Credentials valid:', isValid);

    if (isValid) {
      // Test room creation
      const room = await TwilioService.createRoom('test-room-' + Date.now());
      console.log('Room created:', room.sid);

      // Test token generation
      const token = TwilioService.generateToken({
        identity: 'test-user',
        roomName: room.name
      });
      console.log('Token generated:', token.substring(0, 50) + '...');

      // Test room completion
      await TwilioService.completeRoom(room.sid);
      console.log('Room completed');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testService();
```

Run with:
```bash
node test-service.js
```

## 🧪 Testing Scenarios

### Scenario 1: Basic Functionality
1. ✅ Environment variables are set
2. ✅ Server is running
3. ✅ API endpoints respond correctly
4. ✅ Authentication is required
5. ✅ Token generation works

### Scenario 2: Error Handling
1. ✅ Missing environment variables
2. ✅ Invalid Twilio credentials
3. ✅ Network connectivity issues
4. ✅ Invalid request data
5. ✅ Authentication failures

### Scenario 3: Room Management
1. ✅ Room creation
2. ✅ Room information retrieval
3. ✅ Participant tracking
4. ✅ Room completion
5. ✅ Room cleanup

## 🔍 Debugging Common Issues

### Issue: "Twilio credentials not configured"
**Solution**: Check your `.env.local` file has all required variables

### Issue: "Unauthorized" when testing token generation
**Solution**: This is expected - you need to be logged in to test token generation

### Issue: "Network error" when testing API
**Solution**: Make sure your Next.js server is running (`npm run dev`)

### Issue: "Twilio API error" when creating rooms
**Solution**: 
1. Verify your Twilio account is active
2. Check your API key has Video permissions
3. Ensure you have sufficient Twilio credits

### Issue: "Module not found" errors
**Solution**: Make sure you've installed the Twilio package:
```bash
npm install twilio
```

## 📊 Test Results Interpretation

### Browser Test Page Results
- **Environment Variables**: ✅ = All required vars are set
- **Token Generation**: ✅ = Can generate tokens (requires auth)
- **Room Creation**: ✅ = Can create Twilio video rooms

### Command Line Test Results
- **Server connectivity**: ✅ = Next.js server is running
- **Authentication check**: ✅ = API requires authentication
- **Invalid JSON handling**: ✅ = Properly rejects invalid requests
- **Missing field validation**: ✅ = Validates required fields
- **Environment variables**: ✅ = All Twilio vars are set

## 🎯 Next Steps After Testing

Once your tests pass:

1. **Integration**: The Twilio service is ready to be integrated with your room system
2. **Video Components**: You can now build video call components using the generated tokens
3. **Room Management**: Use the service to manage video rooms during challenges
4. **Production**: Deploy with proper environment variables

## 📞 Getting Help

If you encounter issues:

1. Check the Twilio Console for account status
2. Verify your API key has the correct permissions
3. Review the error messages in the test output
4. Check the browser console for detailed error information
5. Ensure your Twilio account has sufficient credits

## 🔐 Security Notes

- Tokens are generated server-side with user authentication
- Room names are validated and sanitized
- All API endpoints require authentication
- Environment variables should be kept secure
- Never expose Twilio credentials in client-side code 