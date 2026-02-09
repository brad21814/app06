import { v1 } from "@google-cloud/video-intelligence";
import { CloudStorageService } from "./storage";

const client = new v1.VideoIntelligenceServiceClient();

export class GoogleVideoService {
    /**
     * Start a video transcription job.
     * @param gcsOrUrl The GCS URI (gs://...) or a public/signed HTTP URL of the video.
     * @returns The long-running operation name and the output URI.
     */
    static async transcribeVideo(gcsOrUrl: string): Promise<{ operationName: string, outputUri: string }> {
        // Construct Output URI
        // We need a bucket. Use the default one.
        const bucketName = process.env.STORAGE_BUCKET || 'komandra-app06.firebasestorage.app';
        // Create a unique filename for the output
        const timestamp = Date.now();
        // Extract filename from input if possible, or random
        const filename = `transcription_${timestamp}.json`;
        const outputUri = `gs://${bucketName}/transcriptions/${filename}`;

        // Construct the request
        const request = {
            inputUri: gcsOrUrl,
            outputUri: outputUri, // Store results in GCS
            features: [6] as any, // 6 = SPEECH_TRANSCRIPTION
            videoContext: {
                speechTranscriptionConfig: {
                    languageCode: "en-US",
                    enableSpeakerDiarization: true, // Identify different speakers
                    maxAlternatives: 1,
                },
            },
        };

        try {
            console.log(`[GoogleVideoService] Sending request:`, JSON.stringify({ ...request, inputUri: request.inputUri.substring(0, 50) + "..." }));
            // AnnotateVideo returns a Promise that resolves to an Operation [operation, initialResponse]
            const [operation] = await client.annotateVideo(request as any);
            console.log(`[GoogleVideoService] Started operation: ${operation.name}`);
            console.log(`[GoogleVideoService] Output will be written to: ${outputUri}`);
            return { operationName: operation.name!, outputUri };
        } catch (error) {
            console.error("[GoogleVideoService] Error starting transcription:", error);
            throw error;
        }
    }

    /**
     * Check the status of a long-running operation.
     * If complete, process and return the transcript data.
     * Returns null if still running.
     */
    static async checkOperationStatus(operationName: string, outputUri?: string): Promise<any | null> {
        try {
            // Check operation status
            // Cast strictly or use 'any' for the request to avoid protobuf type issues in this context
            const [operation] = await client.operationsClient.getOperation({ name: operationName } as any);

            if (!operation.done) {
                return null; // Still running
            }

            if (operation.error) {
                console.error(`[GoogleVideoService] Operation failed:`, operation.error);
                throw new Error(operation.error.message || "Unknown Google Video Error");
            }

            // Operation is done.
            if (outputUri) {
                console.log(`[GoogleVideoService] Operation complete. Fetching results from GCS: ${outputUri}`);
                try {
                    const results = await CloudStorageService.downloadJson(outputUri);
                    // The GCS JSON structure is slightly different or same as annotationResults
                    // It usually wraps it in { annotation_results: [...] }
                    // Let's inspect/normalize
                    return parseTranscriptionResponse(results);
                } catch (err) {
                    console.error(`[GoogleVideoService] Failed to download/parse GCS results:`, err);
                    throw err;
                }
            } else {

                // Legacy Fallback (Inline)
                console.warn("[GoogleVideoService] No outputUri provided. Attempting legacy inline response parsing.");

                // If there's a response field and it looks decoded:
                const opAny = operation as any;
                if (opAny.response && opAny.response.annotationResults) {
                    return parseTranscriptionResponse(opAny.response);
                }

                // If it has 'response' but maybe encoded
                if (operation.response) {
                    const resp: any = operation.response;
                    if (resp.annotationResults) {
                        return parseTranscriptionResponse(resp);
                    }
                    if (resp.value) {
                        console.error("Google Video Operation returned raw buffer and no outputUri was provided.");
                        throw new Error("Operation returned raw buffer. Switch to GCS output required.");
                    }
                }
                return null;
            }

        } catch (error) {
            console.error(`[GoogleVideoService] Error checking status:`, error);
            throw error;
        }
    }
}

function parseTranscriptionResponse(response: any): any {
    // GCS JSON output usually has snake_case keys like "annotation_results"
    // API inline response usually has camelCase "annotationResults"

    const results = response.annotationResults || response.annotation_results || [];
    if (results.length === 0) return null;

    const annotation = results[0];
    const speechTranscriptions = annotation.speechTranscriptions || annotation.speech_transcriptions || [];

    if (speechTranscriptions.length === 0) return { text: "", sentences: [] };

    // Combine results
    let fullText = "";
    const sentences: any[] = [];

    speechTranscriptions.forEach((trans: any) => {
        // Each 'trans' has alternatives. We took maxAlternatives=1
        const alt = trans.alternatives ? trans.alternatives[0] : null;
        if (alt) {
            const transcript = alt.transcript || "";
            fullText += transcript + " ";

            // Normalize words if present
            // GCS JSON might use snake_case, Proto camelCase
            let words: any[] = [];
            const rawWords = alt.words || [];
            if (Array.isArray(rawWords)) {
                words = rawWords.map((w: any) => ({
                    word: w.word || "",
                    startTime: w.startTime || w.start_time || null,
                    endTime: w.endTime || w.end_time || null,
                    confidence: w.confidence || 0
                }));
            }

            sentences.push({
                transcript: transcript,
                confidence: alt.confidence || 0,
                words: words
            });
        }
    });

    return {
        text: fullText.trim(),
        sentences: sentences
    };
}
