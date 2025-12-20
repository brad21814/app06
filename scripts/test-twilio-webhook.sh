#!/bin/bash

echo "🚀 Testing Twilio Webhook via ngrok"
echo "-----------------------------------"

# Try to find ngrok URL automatically
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -n 1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Could not auto-detect ngrok URL."
    read -p "👉 Please enter your ngrok URL manually (e.g. https://xyz.ngrok-free.app): " INPUT_URL
    NGROK_URL=$INPUT_URL
else
    echo "✅ Auto-detected ngrok URL: $NGROK_URL"
fi

# Clean up URL trailing slash
NGROK_URL=${NGROK_URL%/}

WEBHOOK_URL="$NGROK_URL/komandra-app06/us-central1/twilioWebhook"

echo ""
echo "📡 Sending 'recording-completed' event to: $WEBHOOK_URL"

curl -X POST "$WEBHOOK_URL" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "StatusCallbackEvent=recording-completed" \
     -d "RoomSid=RM_TEST_123456" \
     -d "RecordingSid=RE_TEST_987654" \
     -d "RecordingUrl=https://api.twilio.com/2010-04-01/Accounts/AC.../Recordings/RE...mp3" \
     -d "RecordingDuration=30" \
     -d "AccountSid=AC_TEST_ACCOUNT"

echo ""
echo ""
echo "📡 Sending 'room-ended' event to: $WEBHOOK_URL"

curl -X POST "$WEBHOOK_URL" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "StatusCallbackEvent=room-ended" \
     -d "RoomSid=RM_TEST_123456" \
     -d "RoomStatus=completed" \
     -d "RoomDuration=120" \
     -d "AccountSid=AC_TEST_ACCOUNT"

echo ""
echo "-----------------------------------"
echo "✅ Valid responses should be empty XML tags <Response></Response>"
