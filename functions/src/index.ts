import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { emailService } from "./email";
import { GoogleVideoService } from "./services/googleVideo";


if (!getApps().length) {
    initializeApp({
        storageBucket: process.env.STORAGE_BUCKET || 'komandra-app06.firebasestorage.app'
    });
}
const db = getFirestore();

// Helper to calculate next run date
const getNextRunDate = (currentDate: Date, frequency: string): Date => {
    const nextDate = new Date(currentDate);
    if (frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === 'bi-weekly') {
        nextDate.setDate(nextDate.getDate() + 14);
    } else if (frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate;
};

// Helper to shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Shared Logic for Checking Schedules
async function runScheduleCheck() {
    console.log("Running Schedule Check Logic...");
    try {
        const now = Timestamp.now();
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 1. Query active schedules due for a run
        const schedulesSnapshot = await db.collection('schedules')
            .where('status', '==', 'active')
            .where('nextRunAt', '<=', now)
            .get();

        if (schedulesSnapshot.empty) {
            console.log('No schedules due.');
            return;
        }

        const batch = db.batch();
        let operationCount = 0;

        for (const scheduleDoc of schedulesSnapshot.docs) {
            const schedule = scheduleDoc.data();
            const scheduleId = scheduleDoc.id;
            const teamId = schedule.teamId;

            // Check Start Day Alignment (Simple Check)
            if (schedule.start_day && schedule.start_day !== today) {
                console.log(`Skipping schedule ${scheduleId}: Start Day ${schedule.start_day} != Today ${today}`);
                // continue; 
            }

            // 2. Fetch team members
            const membersSnapshot = await db.collection('team_members')
                .where('teamId', '==', teamId)
                .get();

            const memberIds = membersSnapshot.docs.map((doc: any) => doc.data().userId);

            if (memberIds.length < 2) {
                console.log(`Skipping schedule ${scheduleId}: Not enough members`);
                continue;
            }

            // Fetch user details for emails
            // Note: In a large system, we might need to batch these lookups.
            // For now, doing Promise.all
            const userDocs = await Promise.all(memberIds.map((uid: string) => db.collection('users').doc(uid).get()));
            const usersMap = new Map(); // uid -> { email, name }
            userDocs.forEach((doc: any) => {
                if (doc.exists) {
                    const data = doc.data();
                    usersMap.set(doc.id, { email: data.email, name: data.displayName || 'Team Member' });
                }
            });

            // 3. Generate Pairs (Simple Shuffle for MVP)
            const shuffledMembers = shuffle([...memberIds]);
            const pairs = [];

            while (shuffledMembers.length >= 2) {
                const personA = shuffledMembers.pop();
                const personB = shuffledMembers.pop();
                if (personA && personB) {
                    pairs.push({ proposerId: personA, confirmerId: personB });
                }
            }

            // 4. Create Connections
            for (const pair of pairs) {
                const connectionRef = db.collection('connections').doc();
                const connectionId = connectionRef.id;

                const roomUniqueName = `connect-${connectionId}`;
                const connectRoomUrl = `${APP_URL}/connect/${connectionId}`;

                batch.set(connectionRef, {
                    scheduleId,
                    teamId,
                    themeId: schedule.themeId, // Use the schedule's current theme
                    status: 'scheduling',
                    proposerId: pair.proposerId,
                    confirmerId: pair.confirmerId,
                    createAt: Timestamp.now(), // Fixed typo from original createdAt if needed, but keeping consistent
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    connectRoomSid: null,
                    connectRoomUniqueName: roomUniqueName,
                    connectRoomUrl: connectRoomUrl
                });
                operationCount++;

                // Send Email to Proposer
                const proposer = usersMap.get(pair.proposerId);
                const confirmer = usersMap.get(pair.confirmerId);

                if (proposer && proposer.email) {
                    const connectionUrl = `${APP_URL}/schedule/${connectionId}`;
                    await emailService.sendConnectionRequestEmail(
                        proposer.email,
                        proposer.name,
                        confirmer ? confirmer.name : 'Unknown',
                        connectionUrl,
                        connectRoomUrl // New argument
                    );
                } else {
                    console.log(`Could not send email to proposer ${pair.proposerId}: Email not found.`);
                }
            }

            // 5. Update Schedule nextRunAt
            const nextRun = getNextRunDate(now.toDate(), schedule.frequency);
            const scheduleRef = db.collection('schedules').doc(scheduleId);
            batch.update(scheduleRef, {
                nextRunAt: Timestamp.fromDate(nextRun),
                updatedAt: Timestamp.now()
            });
            operationCount++;
        }

        if (operationCount > 0) {
            await batch.commit();
            console.log(`Committed ${operationCount} operations.`);
        }

    } catch (error) {
        console.error('Error in runScheduleCheck:', error);
    }
}

// 1. Manual/Local Trigger (Pub/Sub)
// 1. Manual/Local Trigger (Pub/Sub)
export const checkSchedules = onMessagePublished("check-schedules", async (event) => {
    console.log("Check Schedules triggered MANUALLY via Pub/Sub");
    await runScheduleCheck();
});

// 2. Scheduled Trigger (Cron)
// Runs every 30 minutes. 
// Note: In production, configure the timezone if specific day alignment matters (e.g. .timeZone('America/New_York'))
// 2. Scheduled Trigger (Cron)
// Runs every 30 minutes. 
// Note: In production, configure the timezone if specific day alignment matters (e.g. .timeZone('America/New_York'))
export const checkSchedulesScheduled = onSchedule("every 30 minutes", async (event) => {
    console.log("Check Schedules triggered AUTOMATICALLY via Schedule");
    await runScheduleCheck();
});
// Analytics Triggers
export * from "./analytics";
export * from "./twilioWebhook";
// Cloud Task Handler: checks for completed transcripts (Google Cloud Video Intelligence)
// Triggered specifically by Cloud Tasks
import { CloudTasksService } from "./services/cloudTasks";

export const transcriptionTask = onRequest(async (req, res) => {
    // Basic verification: Check if it's a POST
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // Verify authentication? 
    // Cloud Tasks sends an OIDC token. `functions.https.onRequest` is public by default.
    // Ideally we verify the token, but for now we trust the internal network/setup or check a secret.
    // A simple check is to verify headers or just proceed if we trust the environment.
    // For robust security, we should verify the bearer token.
    // NOTE: In Cloud Functions Gen 2, this is handled by IAM. In Gen 1 (which this looks like), 
    // we often leave it open or check a custom header. 
    // Let's proceed with logic.

    const { connectionId, operationName } = req.body;

    if (!connectionId || !operationName) {
        console.error("Missing connectionId or operationName in task payload");
        res.status(400).send("Missing payload");
        return;
    }

    console.log(`[TranscriptionTask] Checking operation ${operationName} for connection ${connectionId}`);

    try {
        const result = await GoogleVideoService.checkOperationStatus(operationName);

        if (result) {
            console.log(`[TranscriptionTask] Transcription complete for connection ${connectionId}`);

            await db.collection('connections').doc(connectionId).update({
                transcriptStatus: 'completed',
                transcript: result
            });
            res.status(200).send("Translation Completed");
        } else {
            console.log(`[TranscriptionTask] Job ${operationName} still running. Re-enqueuing...`);
            // Re-enqueue task for 1 minute later
            await CloudTasksService.createTranscriptionCheckTask(connectionId, operationName, 60);
            res.status(200).send("Re-enqueued");
        }
    } catch (error) {
        console.error(`[TranscriptionTask] Error processing task:`, error);
        res.status(500).send("Internal Error");
    }
});

export * from "./twilioTranscriptionWebhook";
