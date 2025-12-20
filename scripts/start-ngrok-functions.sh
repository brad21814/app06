#!/bin/bash

# Port usually used by Firebase Functions Emulator
FUNCTIONS_PORT=5001

echo "🔍 Checking for ngrok..."
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Please install it first."
    exit 1
fi

echo "🚀 Starting ngrok tunnel on port $FUNCTIONS_PORT (Firebase Functions)..."

# Start ngrok in the background
ngrok http $FUNCTIONS_PORT > /dev/null 2>&1 &
NGROK_PID=$!

echo "⏳ Waiting for ngrok to initialize..."
sleep 3

# Fetch the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -n 1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to retrieve ngrok URL. Ensure ngrok is running."
    kill $NGROK_PID
    exit 1
fi

echo ""
echo "✅ ngrok is running!"
echo "---------------------------------------------------"
echo "🌐 Public Webhook Base URL: $NGROK_URL"
echo ""
echo "👉 Twilio Webhook URL (us-central1):"
echo "   $NGROK_URL/komandra-app06/us-central1/twilioWebhook"
# ... inside the file later ...
FULL_URL="$NGROK_URL/komandra-app06/us-central1/"
echo ""
echo "---------------------------------------------------"

# Paths to env files
FUNCTIONS_ENV="../functions/.env"
FRONTEND_ENV="../.env.local"

# Function to update or add env var
update_env_var() {
    local file=$1
    local key=$2
    local value=$3

    if [ -f "$file" ]; then
        if grep -q "^$key=" "$file"; then
            # Key exists, update it using a temp file for safety
            grep -v "^$key=" "$file" > "${file}.tmp"
            echo "$key=$value" >> "${file}.tmp"
            mv "${file}.tmp" "$file"
            echo "updated $key in $file"
        else
            # Key doesn't exist, append it
            echo "$key=$value" >> "$file"
            echo "added $key to $file"
        fi
    else
        echo "⚠️  File $file not found. Skipping update."
    fi
}

echo "📝 Updating Environment Variables..."
FULL_URL="$NGROK_URL/komandra-app06/us-central1/"
update_env_var "$FUNCTIONS_ENV" "CLOUD_FUNCTIONS_URL" "$FULL_URL"

# Inject Storage Bucket
update_env_var "$FUNCTIONS_ENV" "STORAGE_BUCKET" "komandra-app06.firebasestorage.app"

# Inject Credentials Path (Ensure absolute path)
update_env_var "$FUNCTIONS_ENV" "GOOGLE_APPLICATION_CREDENTIALS" "$HOME/.config/gcloud/application_default_credentials.json"
update_env_var "$FRONTEND_ENV" "CLOUD_FUNCTIONS_URL" "$FULL_URL"

echo ""
echo "---------------------------------------------------"
echo "Press Ctrl+C to stop."

# Wait for user to terminate
wait $NGROK_PID
