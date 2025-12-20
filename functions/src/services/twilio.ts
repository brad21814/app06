import twilio from 'twilio';
import https from 'https';
import { GoogleVideoService } from './googleVideo';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize client lazily or on demand to avoid errors if env vars missing in some contexts
const getClient = () => {
    if (!accountSid || !authToken) {
        throw new Error('Twilio credentials missing in Cloud Function environment');
    }
    return twilio(accountSid, authToken);
};

// Helper: Fetch signed S3 URL for Twilio Media (handles 302 Redirect)
const fetchSignedMediaUrl = (url: string, accountSid: string, authToken: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            auth: `${accountSid}:${authToken}`
        };

        const req = https.request(url, options, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301 || res.statusCode === 307) {
                if (res.headers.location) {
                    resolve(res.headers.location);
                } else {
                    reject(new Error(`Twilio Media Redirect missing location header. Status: ${res.statusCode}`));
                }
            } else {
                reject(new Error(`Failed to get redirect for Media URL. Status: ${res.statusCode}`));
            }
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
};

export class TwilioService {
    /**
     * Trigger a transcription for a given Recording SID using Twilio Intelligence.
     * Note: This uses the /v2/Transcripts endpoint (Conversational Intelligence).
     */
    static async createTranscription(recordingSid: string, callbackUrl: string, roomSid?: string): Promise<string> {
        const client = getClient();

        try {
            // Using the Twilio Intelligence API
            // Ref: https://www.twilio.com/docs/intelligence/api/transcripts
            // We need a Service SID usually, OR we can just create a Transcript for a media URL.
            // But wait, the standard "Video Recording" transcription might be different.
            // Actually, for Video Recordings, we can use the 'Compositions' API to get a file, 
            // OR use the 'Intelligence' API if it supports Recording SIDs directly.

            // Research correction: Twilio Intelligence often works with Service SIDs. 
            // However, simpler standard "Transcription" for a Recording might be what we want 
            // if we just want text.
            // BUT, standard /Transcriptions resource on Recordings is legacy/Voice? 
            // The modern way for Video is typically "Compositions" -> "Speech-to-Text" (Google) 
            // OR "Intelligence".

            // Let's assume we use the Intelligence API `v2.transcripts.create`.
            // It requires `serviceSid` (The Intelligence Service).
            // If the user hasn't set up a generic Service, this might fail.
            // Let's try to find a pre-configured service or use a default if possible.
            // If strictly using the "Recording" resource's subresource, that's often for Voice calls.

            // Re-evaluating based on "Twilio Native" plan:
            // The Search result said: "Initiate Transcription via Conversational Intelligence API".
            // So we need: `client.intelligence.v2.transcripts.create(...)`
            // We need a Service SID. I will check env vars for TWILIO_INTELLIGENCE_SERVICE_SID.
            // If not present, we can't proceed easily.

            // ALTERNATIVE: Use the older /v1/Rooms/{sid}/Transcriptions if it was 'Real-time' (but it wasn't).

            // Let's implement the generic call assuming a Service SID is available or we find one.
            const serviceSid = process.env.TWILIO_INTELLIGENCE_SERVICE_SID;
            if (!serviceSid) {
                console.warn("TWILIO_INTELLIGENCE_SERVICE_SID not set. Cannot trigger Intelligence transcription.");
                // Fallback or Error? 
                // For now, throw error to prompt configuration.
                throw new Error("TWILIO_INTELLIGENCE_SERVICE_SID is not configured.");
            }

            // Construct channel properties
            // For Video Recordings (RT...), we typically need to use 'source_url' because 'source_sid'
            // is often reserved for Voice Calls (CA...) or Voice Recordings (RE...).
            // Strategy:
            // 1. Try using `source_sid` (Preferred). This works for Voice Recordings (RE...) and Compositions.
            // 2. If that fails (e.g. for Video Track Recordings RT... which return 400 Invalid SID), 
            //    fall back to fetching the signed media URL manually and using `media_url`.

            try {
                const transcript = await client.intelligence.v2.transcripts.create({
                    serviceSid: serviceSid,
                    channel: {
                        media_properties: {
                            source_sid: recordingSid
                        }
                    }
                });
                console.log(`[TwilioService] Created transcription using source_sid: ${recordingSid}`);
                return transcript.sid;

            } catch (err: any) {
                // Check if we can fall back
                const isInvalidSid = err.code === 20404 || err.status === 400 || (err.message && err.message.includes('not a valid SID'));

                if (isInvalidSid && (recordingSid.startsWith('RT') || recordingSid.startsWith('CJ'))) {
                    console.warn(`[TwilioService] source_sid failed (${err.message}) or known unsupported type. Using signed media URL.`);

                    let protectedMediaUrl = '';
                    if (recordingSid.startsWith('CJ')) {
                        // Composition Media URL
                        protectedMediaUrl = `https://video.twilio.com/v1/Compositions/${recordingSid}/Media`;

                        // Use Google Cloud Video Intelligence for Compositions (MP4)
                        if (protectedMediaUrl) {
                            if (!accountSid || !authToken) throw new Error("Missing Credentials for Media Fetch");
                            console.log(`[TwilioService] Fetching signed media URL for Composition: ${recordingSid}`);
                            const signedMediaUrl = await fetchSignedMediaUrl(protectedMediaUrl, accountSid, authToken);

                            // Upload to GCS first (Google Video Intelligence requirement)
                            const { CloudStorageService } = require('./storage');
                            const gcsPath = `transcriptions/${recordingSid}.mp4`;
                            const gsUri = await CloudStorageService.uploadFileFromUrl(signedMediaUrl, gcsPath);

                            console.log(`[TwilioService] Uploaded to GCS: ${gsUri}`);
                            console.log(`[TwilioService] Starting Google Cloud Video Intelligence Job...`);

                            const operationName = await GoogleVideoService.transcribeVideo(gsUri);
                            console.log(`[TwilioService] Started Google Video Job: ${operationName}`);
                            return operationName;
                        }

                    } else if (recordingSid.startsWith('RT') && roomSid) {
                        // Recording Track Media URL -> Keep old logic OR switch?
                        // For now, keep old logic for RT if desired, but user focused on Composition.
                        protectedMediaUrl = `https://video.twilio.com/v1/Rooms/${roomSid}/Recordings/${recordingSid}/Media`;

                        if (protectedMediaUrl) {
                            if (!accountSid || !authToken) throw new Error("Missing Credentials for Media Fetch");
                            const signedMediaUrl = await fetchSignedMediaUrl(protectedMediaUrl, accountSid, authToken);

                            const transcript = await client.intelligence.v2.transcripts.create({
                                serviceSid: serviceSid,
                                channel: {
                                    media_properties: {
                                        media_url: signedMediaUrl
                                    }
                                }
                            });
                            console.log(`[TwilioService] Created transcription using media_url fallback for ${recordingSid}`);
                            return transcript.sid;
                        }
                    }
                }

                // If not a recoverable error or missing params, rethrow
                throw err;
            }
        } catch (error) {
            console.error("Error creating transcription:", error);
            throw error;
        }
    }

    static async getTranscriptText(transcriptSid: string): Promise<any> {
        const client = getClient();
        try {
            // Fetch the sentences (or paragraphs)
            // https://www.twilio.com/docs/intelligence/api/transcripts-sentences
            const sentences = await client.intelligence.v2.transcripts(transcriptSid)
                .sentences.list({ limit: 5000 });

            // Construct full text
            const fullText = sentences.map((s: any) => s.transcript).join(' ');
            return {
                text: fullText,
                sentences: sentences.map((s: any) => ({
                    sid: s.sid,
                    transcript: s.transcript,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    confidence: s.confidence
                }))
            };
        } catch (error) {
            console.error("Error fetching transcript text:", error);
            throw error;
        }
    }

    /**
     * Create an Audio Composition for a Room.
     * This merges all audio tracks into a single WAV file suitable for transcription.
     */
    static async createAudioComposition(roomSid: string, callbackUrl: string): Promise<string> {
        const client = getClient();
        try {
            const composition = await client.video.v1.compositions.create({
                roomSid: roomSid,
                audioSources: ['*'], // Capture all participants
                format: 'mp4',     // API requires mp4 or webm. wav is not supported directly by Composition.
                statusCallback: callbackUrl,
                statusCallbackMethod: 'POST',
                // videoLayout: { type: 'presentation' } // Not needed for audio-only, but good practice if mixed? 
                // Omitting videoLayout for audio-only composition is typically fine.
            });
            console.log(`[TwilioService] Created Composition: ${composition.sid}`);
            return composition.sid;
        } catch (error) {
            console.error("Error creating composition:", error);
            throw error;
        }
    }
}
