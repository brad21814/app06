#!/bin/bash

# Default values
PROJECT_ID="komandra-app06"
MODE="local"
TOPIC="check-schedules"
PORT=8085

# Parse arguments
for arg in "$@"
do
    case $arg in
        --live)
        MODE="live"
        ;;
        *)
        if [[ $arg != --* ]]; then
            PROJECT_ID=$arg
        fi
        ;;
    esac
done

if [ "$MODE" == "live" ]; then
    echo "Triggering LIVE Pub/Sub topic '$TOPIC' for project '$PROJECT_ID'..."
    gcloud pubsub topics publish $TOPIC --message='{"data": "e30="}' --project=$PROJECT_ID
    echo -e "\nRequest sent to Google Cloud Pub/Sub."
else
    echo "Triggering LOCAL Pub/Sub topic '$TOPIC' for project '$PROJECT_ID' on port $PORT..."
    curl -X POST \
      http://127.0.0.1:$PORT/v1/projects/$PROJECT_ID/topics/$TOPIC:publish \
      -H "Content-Type: application/json" \
      -d '{"messages": [{"data": "e30="}]}'
    echo -e "\n\nRequest sent. Check the functions emulator logs for output."
fi
