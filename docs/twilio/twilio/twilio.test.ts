import { TwilioService } from './twilio.service';

/**
 * Test function to validate Twilio credentials and basic functionality
 * This can be run manually to test the setup
 */
export async function testTwilioSetup() {
  console.log('Testing Twilio setup...');

  try {
    // Test credential validation
    const isValid = await TwilioService.validateCredentials();
    console.log('Credentials valid:', isValid);

    if (!isValid) {
      console.error('❌ Twilio credentials are not valid. Please check your environment variables.');
      return false;
    }

    // Test room creation
    const testRoomName = `test-room-${Date.now()}`;
    console.log('Creating test room:', testRoomName);

    const room = await TwilioService.createRoom(testRoomName);
    console.log('✅ Room created successfully:', room.sid);

    // Test token generation
    const token = TwilioService.generateToken({
      identity: 'test-user',
      roomName: testRoomName,
    });
    console.log('✅ Token generated successfully');

    // Test room info retrieval
    const roomInfo = await TwilioService.getRoomInfo(room.sid);
    console.log('✅ Room info retrieved:', roomInfo?.name);

    // Test room completion
    const completed = await TwilioService.completeRoom(room.sid);
    console.log('✅ Room completed:', completed);

    console.log('🎉 All Twilio tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Twilio test failed:', error);
    return false;
  }
}

/**
 * Get current environment variable status
 */
export function checkTwilioEnvironment() {
  const requiredVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_API_KEY_SID',
    'TWILIO_API_KEY_SECRET',
  ];

  console.log('Checking Twilio environment variables...');
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
} 