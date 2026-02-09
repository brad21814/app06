import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import twilio from "twilio";

if (!getApps().length) initializeApp();
const db = getFirestore();

export const twilioWebhook = onRequest(async (req, res) => {
    try {
        const signature = req.headers["x-twilio-signature"] as string;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        let url = "";
        // if (process.env.FUNCTION_REGION && process.env.GCLOUD_PROJECT) {
        //     url = `https://${process.env.FUNCTION_REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/twilioWebhook`;
        // } else if (process.env.FUNCTIONS_URL) {
        url = `${process.env.FUNCTIONS_URL}twilioWebhook`;
        // }

        const event = req.body;
        console.log(`[TwilioWebhook] Validating against URL: ${url}`);
        console.log(`[TwilioWebhook] Received event: ${event.StatusCallbackEvent || event.EventType}`);
        console.log(`[TwilioWebhook] Payload:`, JSON.stringify(event, null, 2));

        // Validate Request (Optional in Dev/Emulator, Strict in Prod)
        if (process.env.NODE_ENV === 'production' && authToken) {
            const isValid = twilio.validateRequest(
                authToken,
                signature,
                url,
                req.body
            );

            if (!isValid) {
                console.warn("[TwilioWebhook] Invalid Signature");
                res.status(403).send("Forbidden");
                return;
            }
        }

        // Handle specific events

        // 1. Composition Available -> Trigger Transcription
        // This is the new flow: Room Ends -> Create Composition -> Composition Available -> Create Transcription
        if (event.StatusCallbackEvent === 'composition-available') {
            const compositionSid = event.CompositionSid;
            const roomSid = event.RoomSid;
            // The composition URL is not directly in the webhook usually, but we have the SID.
            // Intelligence can take the source_sid = CompositionSid (because Compositions are Recordings).

            console.log(`[TwilioWebhook] Composition Available: ${compositionSid} for Room: ${roomSid}`);

            // Find the connection associated with this Room
            const connectionsRef = db.collection('connections');
            const snapshot = await connectionsRef.where('connectRoomSid', '==', roomSid).limit(1).get();

            if (!snapshot.empty) {
                const connectionDoc = snapshot.docs[0];
                const connectionId = connectionDoc.id;
                console.log(`[TwilioWebhook] Found Connection: ${connectionId}`);

                // Trigger Transcription using the Composition SID
                const callbackUrl = url.replace('twilioWebhook', 'twilioTranscriptionWebhook');

                try {
                    const { TwilioService } = require('./services/twilio');
                    // Treat CompositionSid as the RecordingSid/SourceSid
                    const result = await TwilioService.createTranscription(compositionSid, callbackUrl, roomSid);

                    let transcriptSid = '';
                    let outputUri = '';

                    if (typeof result === 'object') {
                        transcriptSid = result.operationName;
                        outputUri = result.outputUri;
                    } else {
                        transcriptSid = result as string;
                    }

                    console.log(`[TwilioWebhook] Triggered Transcription for Composition: ${transcriptSid}`);

                    await connectionDoc.ref.update({
                        transcriptSid: transcriptSid,
                        transcriptStatus: 'processing',
                        compositionSid: compositionSid, // Track composition too
                        transcriptOutputUri: outputUri || null
                    });

                    // If this is a Google Operation, start the polling task
                    if (transcriptSid.startsWith('projects/')) {
                        console.log(`[TwilioWebhook] Enqueuing Cloud Task for Google Operation: ${transcriptSid}`);
                        const { CloudTasksService } = require('./services/cloudTasks');
                        await CloudTasksService.createTranscriptionCheckTask(connectionId, transcriptSid, 60, outputUri);
                    }

                } catch (err: any) {
                    console.error(`[TwilioWebhook] Failed to trigger transcription for composition:`, err);
                    if (err.response) {
                        console.error(`[TwilioWebhook] Error Response:`, JSON.stringify(err.response.data, null, 2));
                    }
                }
            } else {
                console.warn(`[TwilioWebhook] No Connection found for Composition RoomSid: ${roomSid}`);
            }
        }

        // 2. Recording Completed -> IGNORE for transcription (using Composition instead)
        if (event.StatusCallbackEvent === 'recording-completed') {
            // ... We might want to keep some logging or just ignore. 
            // We disable the transcription trigger here.
            console.log(`[TwilioWebhook] Recording Completed: ${event.RecordingSid}. Ignoring for transcription (waiting for Composition).`);
        }

        // 3. Room Ended -> Update Connection Status AND Trigger Composition
        if (event.StatusCallbackEvent === 'room-ended') {
            console.log(`[TwilioWebhook] Room Ended: ${event.RoomSid} (Name: ${event.RoomName})`);

            // The RoomName is `connect-{connectionId}`
            // We need to extract connectionId
            const roomName = event.RoomName;
            if (roomName && roomName.startsWith('connect-')) {
                const connectionId = roomName.replace('connect-', '');

                const connectionRef = db.collection('connections').doc(connectionId);
                const connectionSnap = await connectionRef.get();

                if (connectionSnap.exists) {
                    // Duration is in seconds
                    const duration = event.RoomDuration ? parseInt(event.RoomDuration) : 0;

                    await connectionRef.update({
                        status: 'completed',
                        endedAt: Timestamp.now(),
                        durationSeconds: duration,
                        // Store Twilio Room SID so we can match the Recording webhook later
                        connectRoomSid: event.RoomSid,
                        updatedAt: Timestamp.now()
                    });
                    console.log(`[TwilioWebhook] Updated connection ${connectionId} to completed.`);

                    // TRIGGER AUDIO COMPOSITION
                    try {
                        const { TwilioService } = require('./services/twilio');
                        // StatusCallback for composition is THIS webhook (so we get composition-available)
                        // Note: If you want a different webhook, change it. But reusing this one is fine if we handle the event.
                        const compositionSid = await TwilioService.createAudioComposition(event.RoomSid, url);
                        console.log(`[TwilioWebhook] Triggered Audio Composition: ${compositionSid}`);

                        await connectionRef.update({
                            compositionSid: compositionSid,
                            transcriptStatus: 'composing' // intermediate status
                        });

                    } catch (err) {
                        console.error(`[TwilioWebhook] Failed to trigger composition:`, err);
                    }

                } else {
                    console.warn(`[TwilioWebhook] Connection ${connectionId} not found.`);
                }
            } else {
                console.warn(`[TwilioWebhook] Invalid Room Name format: ${roomName}`);
            }
        }

        res.status(200).send("<Response></Response>");

    } catch (error) {
        console.error("[TwilioWebhook] Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
