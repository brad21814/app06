import { onDocumentUpdated, FirestoreEvent } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";


const db = admin.firestore();

export const onConnectionUpdate = onDocumentUpdated("connections/{connectionId}", async (event: FirestoreEvent<any>) => {
    const change = event.data;
    if (!change) return null;

    const newData = change.after.data();
    const oldData = change.before.data();

    // 1. Identify Triggers
    const isNewCompletion = newData.status === "completed" && oldData.status !== "completed";
    const isNewAnalysis = !!newData.analysis && !oldData.analysis;

    if (!isNewCompletion && !isNewAnalysis) {
        return null; // No relevant change
    }

    const teamId = newData.teamId;
    const createdAt = newData.createdAt.toDate();
    const period = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

    // Fetch Account ID (Need to look up team)
    const teamSnap = await db.collection("teams").doc(teamId).get();
    if (!teamSnap.exists) return null;
    const accountId = teamSnap.data()?.accountId;

    const batch = db.batch();

    // Helper to update analytics doc
    const updateAnalytics = (entityId: string, entityType: "team" | "account") => {
        const docId = `${entityType}_${entityId}_${period}`;
        const ref = db.collection("analytics").doc(docId);

        const updateData: any = {
            entityId,
            entityType,
            period,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Increment Counters
        if (isNewCompletion) {
            updateData.totalConnections = admin.firestore.FieldValue.increment(1);
            updateData.completedConnections = admin.firestore.FieldValue.increment(1);
        }
        // Analysis Aggregation (Simplified: just moving average)
        // For MVP, we'll just store the sum and count in the analytics doc and divide on read?
        // Or better: store sumSentiment and countSentiment
        if (isNewAnalysis && newData.analysis?.sentimentScore) {
            updateData.sumSentiment = admin.firestore.FieldValue.increment(newData.analysis.sentimentScore);
            updateData.countSentiment = admin.firestore.FieldValue.increment(1);
        }

        // For topics, we can increment counters in a map
        if (isNewAnalysis && newData.analysis?.topics) {
            newData.analysis.topics.forEach((topic: string) => {
                // sanitize topic key
                const key = topic.replace(/\s+/g, '_').toLowerCase();
                updateData[`topics.${key}`] = admin.firestore.FieldValue.increment(1);
            });
        }

        batch.set(ref, updateData, { merge: true });
    };

    // Update Team Analytics
    updateAnalytics(teamId, "team");

    // Update Account Analytics
    if (accountId) {
        updateAnalytics(accountId, "account");
    }

    await batch.commit();
    console.log(`[Analytics] Updated stats for Connection ${event.params.connectionId}`);
    return null;
});
