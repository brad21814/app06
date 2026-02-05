#!/bin/bash

# Port usually used by Firebase Functions Emulator
FUNCTIONS_PORT=5001
# Pid file to track ngrok process
PID_FILE="/tmp/ngrok_functions.pid"

echo "🔍 Checking for ngrok..."
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Please install it first."
    exit 1
fi

if [ -f "$PID_FILE" ]; then
    if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo "⚠️  ngrok is already running (PID: $(cat $PID_FILE))."
        echo "Run './scripts/ngrok-stop.sh' first if you want to restart."
        exit 0
    else
        echo "⚠️  Stale PID file found. Cleaning up..."
        rm "$PID_FILE"
    fi
fi

echo "🚀 Starting ngrok tunnel on port $FUNCTIONS_PORT (Firebase Functions)..."

# Log file for ngrok output
NGROK_LOG="/tmp/ngrok.log"

# Start ngrok in the background
ngrok http $FUNCTIONS_PORT > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > "$PID_FILE"

echo "⏳ Waiting for ngrok to initialize..."
sleep 3

# Check if ngrok is still running
if ! ps -p $NGROK_PID > /dev/null; then
    echo "❌ ngrok failed to start."
    echo "Check the log below:"
    echo "---------------------------------------------------"
    cat "$NGROK_LOG"
    echo "---------------------------------------------------"
    rm "$PID_FILE"
    exit 1
fi

# Fetch the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -n 1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to retrieve ngrok URL. Ensure ngrok is running."
    # Check if process is running before killing
    if ps -p $NGROK_PID > /dev/null; then
        kill $NGROK_PID
    else
         echo "❌ ngrok process exited unexpectedly."
         echo "Log output:"
         cat "$NGROK_LOG"
    fi
    rm "$PID_FILE"
    exit 1
fi

echo ""
echo "✅ ngrok is running! (PID: $NGROK_PID)"
echo "---------------------------------------------------"
echo "🌐 Public Webhook Base URL: $NGROK_URL"
echo ""
echo "👉 Twilio Webhook URL (us-central1):"
echo "   $NGROK_URL/komandra-app06/us-central1/twilioWebhook"

FULL_URL="$NGROK_URL/komandra-app06/us-central1/"
echo ""
echo "---------------------------------------------------"

# Paths to env files (relative to script location)
SCRIPT_DIR="$(dirname "$0")"
FUNCTIONS_ENV="$SCRIPT_DIR/../functions/.env"
FRONTEND_ENV="$SCRIPT_DIR/../.env.local"

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
update_env_var "$FUNCTIONS_ENV" "CLOUD_FUNCTIONS_URL" "$FULL_URL"

# Inject Storage Bucket
update_env_var "$FUNCTIONS_ENV" "STORAGE_BUCKET" "komandra-app06.firebasestorage.app"

# Inject Credentials Path (Ensure absolute path)
update_env_var "$FUNCTIONS_ENV" "GOOGLE_APPLICATION_CREDENTIALS" "$HOME/.config/gcloud/application_default_credentials.json"
update_env_var "$FRONTEND_ENV" "CLOUD_FUNCTIONS_URL" "$FULL_URL"

echo ""
echo "---------------------------------------------------"
echo "Run './scripts/ngrok-stop.sh' to stop ngrok."
