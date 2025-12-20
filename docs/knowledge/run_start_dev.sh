#!/bin/bash
cd frontend

# Function to check if ngrok is installed
check_ngrok() {
    if ! command -v ngrok &> /dev/null; then
        echo "❌ ngrok is not installed. Please install it first:"
        echo "   - Visit https://ngrok.com/download"
        echo "   - Or install via package manager:"
        echo "     brew install ngrok (macOS)"
        echo "     sudo snap install ngrok (Ubuntu)"
        echo "     choco install ngrok (Windows)"
        echo ""
        echo "After installation, authenticate with: ngrok authtoken YOUR_TOKEN"
        exit 1
    fi
}

# Function to kill existing ngrok processes
kill_ngrok() {
    echo "Killing any running ngrok processes ..."
    pkill -f "ngrok" > /dev/null 2>&1
    sleep 2
}

# Function to start ngrok
start_ngrok() {
    echo "Starting ngrok tunnel for HTTPS access..."
    # Start ngrok in background and capture the URL
    ngrok http 3000 > /tmp/ngrok.log 2>&1 &
    NGROK_PID=$!
    
    # Wait for ngrok to start and get the URL
    echo "Waiting for ngrok to start..."
    sleep 5
    
    # Try to get the HTTPS URL from ngrok
    NGROK_URL=""
    for i in {1..10}; do
        if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
            NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | grep -o 'https://[^"]*' | head -1)
            if [ ! -z "$NGROK_URL" ]; then
                break
            fi
        fi
        sleep 1
    done
    
    if [ ! -z "$NGROK_URL" ]; then
        echo "✅ ngrok tunnel created successfully!"
        echo "🌐 Public HTTPS URL: $NGROK_URL"
        echo "📧 Use this URL for testing email links: $NGROK_URL"
        echo ""
        
        # Update .env file with the ngrok URL
        ENV_FILE=".env"
        # Check if NEXT_PUBLIC_APP_URL already exists
        if grep -q "^NEXT_PUBLIC_APP_URL=" "$ENV_FILE"; then
            # Update existing line
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS requires different sed syntax
                sed -i '' "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=$NGROK_URL|" "$ENV_FILE"
            else
                # Linux/Unix sed syntax
                sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=$NGROK_URL|" "$ENV_FILE"
            fi
        else
            # Add new line
            echo "NEXT_PUBLIC_APP_URL=$NGROK_URL" >> "$ENV_FILE"
        fi
        echo "📝 Updated .env file with ngrok URL"
        
        # Store ngrok URL for later use
        echo "$NGROK_URL" > /tmp/ngrok_url.txt
    else
        echo "❌ Failed to get ngrok URL. Check ngrok status at http://localhost:4040"
        kill $NGROK_PID 2>/dev/null
        exit 1
    fi
}

# Function to wait for Supabase to be ready
wait_for_supabase() {
    echo "Waiting for Supabase to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:54321/health > /dev/null 2>&1; then
            echo "✅ Supabase is ready!"
            return 0
        fi
        sleep 2
    done
    echo "❌ Supabase failed to start within 60 seconds"
    exit 1
}

# Check if ngrok is installed
check_ngrok

echo ""
echo "Stopping supabase ..."
pnpx supabase stop
sleep 3
echo ""
echo "Starting supabase ..."
pnpx supabase start
wait_for_supabase

echo ""
echo "Killing any running pnpm dev processes ..."
pgrep -f ".*pnpm dev.*" | xargs kill > /dev/null 2>&1
sleep 3

echo ""
echo "Starting ngrok tunnel..."
kill_ngrok
start_ngrok

# Load environment variables AFTER ngrok has updated the .env file
echo "Loading environment variables..."
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo ""
echo "Running migrations ..."
pnpm db:migrate
sleep 3
echo ""
echo "Seeding database ..."
pnpm db:seed
sleep 3

echo ""
echo "Starting development server ..."
echo "🚀 Your app will be available at:"
echo "   Local: http://localhost:3000"
echo "   Public: $(cat /tmp/ngrok_url.txt 2>/dev/null || echo 'Check ngrok status at http://localhost:4040')"
echo ""
echo "📋 ngrok dashboard: http://localhost:4040"
echo ""

# Start the development server
pnpm dev
