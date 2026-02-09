import { Storage } from '@google-cloud/storage';
import * as https from 'https';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export class CloudStorageService {
    static async uploadFileFromUrl(url: string, destinationPath: string): Promise<string> {
        console.log(`[CloudStorageService] Initializing Storage client...`);
        console.log(`[CloudStorageService] FIREBASE_STORAGE_EMULATOR_HOST: ${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`);
        console.log(`[CloudStorageService] Project ID: ${process.env.GCLOUD_PROJECT || 'komandra-app06'}`);
        console.log(`[CloudStorageService] Endpoint: https://storage.googleapis.com (Forced)`);
        console.log(`[CloudStorageService] Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);


        // Manual credential loading as requested:
        // verifying if we have a path, and if so, reading/parsing it.
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        let credentials;
        if (credentialsPath && fs.existsSync(credentialsPath)) {
            try {
                credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
                console.log('[CloudStorageService] Successfully loaded credentials from file.');
                if (credentials && credentials.client_email) {
                    console.log(`[CloudStorageService] Service Account Email: ${credentials.client_email}`);
                } else {
                    console.log('[CloudStorageService] Credentials loaded but no client_email found.');
                }
            } catch (error) {
                console.error('[CloudStorageService] Failed to parse credentials file:', error);
            }
        }

        const storage = new Storage({
            apiEndpoint: 'https://storage.googleapis.com',
            projectId: process.env.GCLOUD_PROJECT || 'komandra-app06',
            credentials: credentials
        });

        const bucketName = process.env.STORAGE_BUCKET || 'komandra-app06.firebasestorage.app';
        console.log(`[CloudStorageService] Target Bucket: ${bucketName}`);

        const bucket = storage.bucket(bucketName);

        console.log(`[CloudStorageService] Starting upload from URL to gs://${bucketName}/${destinationPath}`);
        console.log(`[CloudStorageService] Source URL: ${url}`);

        const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.mp4`);
        console.log(`[CloudStorageService] Temp file path: ${tempFilePath}`);

        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(tempFilePath);

            https.get(url, (response) => {
                console.log(`[CloudStorageService] Download response status: ${response.statusCode}`);

                if (response.statusCode !== 200) {
                    const error = new Error(`Source URL returned ${response.statusCode}`);
                    console.error(`[CloudStorageService] Download failed: ${error.message}`);
                    return reject(error);
                }

                response.pipe(fileStream);

                fileStream.on('finish', async () => {
                    fileStream.close();
                    console.log('[CloudStorageService] Download to temp file completed.');

                    try {
                        console.log(`[CloudStorageService] Uploading from temp file to gs://${bucketName}/${destinationPath}`);
                        await bucket.upload(tempFilePath, {
                            destination: destinationPath,
                            metadata: {
                                contentType: response.headers['content-type'] || 'video/mp4',
                            },
                            resumable: false
                        });

                        console.log('[CloudStorageService] Upload successfully completed.');
                        // Cleanup
                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                        }
                        resolve(`gs://${bucket.name}/${destinationPath}`);
                    } catch (uploadError) {
                        console.error('[CloudStorageService] Upload failed:', uploadError);
                        // Cleanup
                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                        }
                        reject(uploadError);
                    }
                });

                fileStream.on('error', (err) => {
                    console.error('[CloudStorageService] File stream error:', err);
                    fs.unlink(tempFilePath, () => { }); // Verify cleanup
                    reject(err);
                });

            }).on('error', (err) => {
                console.error('[CloudStorageService] HTTPS Request error:', err);
                fs.unlink(tempFilePath, () => { }); // Verify cleanup
                reject(err);
            });
        });
    }

    static async downloadJson(gcsUri: string): Promise<any> {
        // gcsUri is gs://bucket/path
        const match = gcsUri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
        if (!match) {
            throw new Error(`Invalid GCS URI: ${gcsUri}`);
        }
        const bucketName = match[1];
        const filePath = match[2];

        // Re-init storage (duplicate logic for now to keep it static/contained)
        // Ideally we refactor the client init, but for minimal changes:
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        let credentials;
        if (credentialsPath && fs.existsSync(credentialsPath)) {
            try {
                credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
            } catch (error) {
                console.error('[CloudStorageService] Failed to parse credentials file:', error);
            }
        }

        const storage = new Storage({
            apiEndpoint: 'https://storage.googleapis.com',
            projectId: process.env.GCLOUD_PROJECT || 'komandra-app06',
            credentials: credentials
        });

        console.log(`[CloudStorageService] Downloading JSON from ${gcsUri}`);
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(filePath);

        const [content] = await file.download();
        return JSON.parse(content.toString('utf-8'));
    }
}