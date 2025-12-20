import { CloudTasksClient } from "@google-cloud/tasks";
import { getApp } from "firebase-admin/app";

const client = new CloudTasksClient();

export class CloudTasksService {
    /**
     * Enqueues a task to check the status of a transcription job.
     * @param connectionId The ID of the connection/document to update.
     * @param operationName The Google Video Intelligence operation name.
     * @param delaySeconds How long to wait before executing the task (default 60s).
     */
    static async createTranscriptionCheckTask(connectionId: string, operationName: string, delaySeconds: number = 60) {
        const project = process.env.GCLOUD_PROJECT || getApp().options.projectId;
        const location = process.env.FUNCTION_REGION || "us-central1"; // Default to us-central1
        const queue = "default"; // Use the default queue

        if (!project) throw new Error("Project ID not found");

        const parent = client.queuePath(project, location, queue);
        const url = `${process.env.CLOUD_FUNCTIONS_URL}transcriptionTask`; // The HTTPS function URL

        const payload = {
            connectionId,
            operationName
        };

        const task = {
            httpRequest: {
                httpMethod: 'POST' as const,
                url,
                body: Buffer.from(JSON.stringify(payload)).toString('base64'),
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add OIDC token for authentication (so only our service accounts can call it)
                oidcToken: {
                    serviceAccountEmail: process.env.GCLOUD_SERVICE_ACCOUNT_EMAIL || `${project}@appspot.gserviceaccount.com`,
                }
            },
            scheduleTime: {
                seconds: Date.now() / 1000 + delaySeconds,
            },
        };

        try {
            const [response] = await client.createTask({ parent, task });
            console.log(`[CloudTasks] Enqueued task: ${response.name}`);
        } catch (error) {
            console.error("[CloudTasks] Error creating task:", error);
            // Don't throw? Or throw? If we fail to enqueue, we lose the job tracking.
            // Throw so we can see the error.
            throw error;
        }
    }
}
