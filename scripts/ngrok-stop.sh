#!/bin/bash

# Pid file to track ngrok process
PID_FILE="/tmp/ngrok_functions.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "🛑 Stopping ngrok (PID: $PID)..."
        kill $PID
        echo "✅ ngrok stopped."
    else
        echo "⚠️  ngrok process $PID not found. Cleaning up stale PID file."
    fi
    rm "$PID_FILE"
else
    echo "❌ No PID file found. Is ngrok running?"
fi
