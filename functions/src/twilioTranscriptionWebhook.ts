import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();
const db = getFirestore();

export const twilioTranscriptionWebhook = onRequest(async (req, res) => {
    try {
        console.log(`[TwilioTranscriptionWebhook] Received event: ${req.body.Status || req.query.Status}`);

        const event = req.body;
        console.log(`[TwilioTranscriptionWebhook] Payload:`, JSON.stringify(event, null, 2));
        // Basic check for Transcription status
        // Twilio Intelligence callbacks usually send data in the body
        if (event.TranscriptSid && event.Status === 'completed') {
            const transcriptSid = event.TranscriptSid;
            console.log(`[TwilioTranscriptionWebhook] Transcript Completed: ${transcriptSid}`);

            try {
                const { TwilioService } = require('./services/twilio');
                // Fetch content
                const data = await TwilioService.getTranscriptText(transcriptSid);

                // We need to find the connection. 
                // If we stored transcriptSid in the connection doc, we can query by it.
                const connectionsRef = db.collection('connections');
                const snapshot = await connectionsRef.where('transcriptSid', '==', transcriptSid).limit(1).get();

                if (!snapshot.empty) {
                    const connectionDoc = snapshot.docs[0];
                    const connectionId = connectionDoc.id;

                    // Store in subcollection
                    const transcriptRef = connectionDoc.ref.collection('transcripts').doc(transcriptSid);
                    await transcriptRef.set({
                        sid: transcriptSid,
                        connectionId: connectionId,
                        status: 'completed',
                        text: data.text,
                        sentences: data.sentences, // Store detailed sentences if needed
                        dateCreated: Timestamp.now(),
                        dateUpdated: Timestamp.now(),
                    });

                    // Update main connection doc
                    await connectionDoc.ref.update({
                        transcriptStatus: 'completed',
                        summary: data.text.substring(0, 200) + '...' // plain text preview
                    });

                    console.log(`[TwilioTranscriptionWebhook] Stored Transcript for Connection: ${connectionId}`);
                } else {
                    console.warn(`[TwilioTranscriptionWebhook] No Connection found for TranscriptSid: ${transcriptSid}`);
                }
            } catch (err: any) {
                console.error(`[TwilioTranscriptionWebhook] Failed to process transcript:`, err);
                if (err.response) {
                    console.error(`[TwilioTranscriptionWebhook] Error Response:`, JSON.stringify(err.response.data, null, 2));
                }
            }
        } else {
            console.log(`[TwilioTranscriptionWebhook] Ignored event (Status: ${event.Status})`);
        }

        res.status(200).send("<Response></Response>");

    } catch (error) {
        console.error("[TwilioTranscriptionWebhook] Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
