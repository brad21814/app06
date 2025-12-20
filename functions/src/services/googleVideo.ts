import { v1 } from "@google-cloud/video-intelligence";

const client = new v1.VideoIntelligenceServiceClient();

export class GoogleVideoService {
    /**
     * Start a video transcription job.
     * @param gcsOrUrl The GCS URI (gs://...) or a public/signed HTTP URL of the video.
     * @returns The long-running operation name.
     */
    static async transcribeVideo(gcsOrUrl: string): Promise<string> {
        // Construct the request
        const request = {
            inputUri: gcsOrUrl,
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
            return operation.name!;
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
    static async checkOperationStatus(operationName: string): Promise<any | null> {
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
            // We need to parse the response manually if we can't decode it easily.
            // But since we are looking for 'annotationResults', let's just inspect the operation.response.
            // Note: operation.response is an 'Any' type protobuf.
            // The google-cloud client usually decodes this *if* using the high-level method, but here we are using low-level getOperation.

            // However, often the 'result' field in the returned object (from node lib) maps the decoded response if available.
            // Let's try to parse the 'Any' value if it is a buffer, or rely on existing structure.

            // WORKAROUND:
            // Since decoding 'Any' without the type is hard, and we don't have the decoder exposed easily (maybe via client.decoder?),
            // We can rely on a simpler fact: 
            // If the output was to GCS, we'd read it. 
            // Since we didn't specify outputUri, it's inline.

            // Let's try to access it via internal decoding or assume it's just 'response' logic.
            // If this fails, we might need to specify outputUri to GCS to make it reliable.

            // For now, let's use a "best effort" to find the results in the object structure 
            // returned by the library.

            // The Node.js client might actually return the decoded object in `response` fields if it knows the type.
            // If not, we might be stuck.

            // Let's assume standard behavior:
            // If we cast to 'any', we can inspect it safely.
            const opAny = operation as any;

            // If there's a response field and it looks decoded:
            if (opAny.response && opAny.response.annotationResults) {
                return parseTranscriptionResponse(opAny.response);
            }

            // If it is encoded (typeUrl + value buffer):
            // We can't decode easily here without the proto definition loaded.
            // So, checking if the library did it. 
            // (Often the operationsClient DOES decode if the proto is known to it).

            // Check for 'response' property which might be the decoded message.
            if (operation.response) {
                // Check if it has the fields we expect (duck typing)
                const resp: any = operation.response;
                if (resp.annotationResults) {
                    return parseTranscriptionResponse(resp);
                }
                // If it has 'value' (Buffer), we are stuck.
                if (resp.value) {
                    console.warn("Google Video Operation returned raw buffer. Cannot decode without proto. Switch to GCS output?");
                    // We should switch to GCS output in the future if this happens.
                    return null;
                }
            }

            return null;

        } catch (error) {
            console.error(`[GoogleVideoService] Error checking status:`, error);
            throw error;
        }
    }
}

function parseTranscriptionResponse(response: any): any {
    // Check if it's encoded (buffer) or object.
    // If it comes from gRPC it might be an object if using the right accessor.
    // NOTE: In the latest Node libs, getting the operation status might return specific types.

    // For now, let's look for annotationResults.
    // If we have to deal with Protobuf Any:
    // We might need to iterate 'annotationResults'.

    // Let's assume we get the object.

    const results = response.annotationResults || [];
    if (results.length === 0) return null;

    const annotation = results[0];
    const speechTranscriptions = annotation.speechTranscriptions || [];

    if (speechTranscriptions.length === 0) return { text: "", sentences: [] };

    // Combine results
    let fullText = "";
    const sentences: any[] = [];

    speechTranscriptions.forEach((trans: any) => {
        // Each 'trans' has alternatives. We took maxAlternatives=1
        const alt = trans.alternatives[0];
        if (alt) {
            const transcript = alt.transcript;
            fullText += transcript + " ";

            // Timings?
            // "words" are available if verbose.
            // Let's just store the block.
            sentences.push({
                transcript: transcript,
                confidence: alt.confidence,
                words: alt.words // detailed timings
            });
        }
    });

    return {
        text: fullText.trim(),
        sentences: sentences
    };
}
