import * as admin from 'firebase-admin';
import { GoogleVideoService } from '../src/services/googleVideo';
import { CloudStorageService } from '../src/services/storage';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock Firebase Admin if needed, or initialize it
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'komandra-app06',
        storageBucket: process.env.STORAGE_BUCKET || 'komandra-app06.firebasestorage.app'
    });
}

async function runTest() {
    const args = process.argv.slice(2);
    const input = args[0];

    if (!input) {
        console.error("Usage: ts-node functions/scripts/test-transcription.ts <local-file-path-or-url>");
        process.exit(1);
    }

    try {
        let gcsUri = input;

        // 1. Upload if local file
        if (!input.startsWith('gs://') && !input.startsWith('http')) {
            console.log(`[Test] Uploading local file: ${input}`);
            // Simulate upload logic if needed, or just warn
            // CloudStorageService.uploadFile expects a URL currently, 
            // so for local file we might need to physically upload or mock.
            // For this script, let's assume input is a URL or GS URI for simplicity 
            // unless we extend CloudStorageService to upload local files.
        } else if (input.startsWith('http')) {
            console.log(`[Test] Uploading from URL: ${input}`);
            const bucketName = process.env.STORAGE_BUCKET || 'komandra-app06.firebasestorage.app';
            const filename = `test_upload_${Date.now()}.mp4`;
            const destination = `tests/${filename}`;
            gcsUri = await CloudStorageService.uploadFileFromUrl(input, destination);
            console.log(`[Test] Uploaded to: ${gcsUri}`);
        }

        // 2. Start Transcription
        console.log(`[Test] Starting Transcription for: ${gcsUri}`);
        const { operationName, outputUri } = await GoogleVideoService.transcribeVideo(gcsUri);
        console.log(`[Test] Operation: ${operationName}`);
        console.log(`[Test] Output URI: ${outputUri}`);

        // 3. Poll
        console.log(`[Test] Polling status...`);
        let result = null;
        while (!result) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
            process.stdout.write('.');
            try {
                result = await GoogleVideoService.checkOperationStatus(operationName, outputUri);
            } catch (err: any) {
                if (err.message && err.message.includes('No outputUri provided')) {
                    // Should not happen with new code
                    console.warn("Legacy path triggered?");
                } else {
                    throw err;
                }
            }
        }

        console.log(`\n[Test] Transcription Complete!`);
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("[Test] Failed:", error);
    }
}

runTest();
