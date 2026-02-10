import { onDocumentUpdated, FirestoreEvent } from "firebase-functions/v2/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

const aggregateConnectionData = async (connection: any): Promise<void> => {
    // 1. Identify Triggers (Passed connection is already new data)
    const newData = connection;
    // We don't have oldData here easily unless passed, but we can assume we only call this when valid.
    // However, the original logic relied on diff.

    // Let's refactor: The caller determines IF we should aggregate. This function just does the work.

    const teamId = newData.teamId;
    const createdAt = newData.createdAt.toDate(); // Assuming Timestamp
    const period = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

    // Fetch Account ID (Need to look up team)
    const teamSnap = await db.collection("teams").doc(teamId).get();
    if (!teamSnap.exists) return;
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
            updatedAt: FieldValue.serverTimestamp(),
        };

        // Increment Counters
        // Check Status
        if (newData.status === 'completed') {
            updateData.totalConnections = FieldValue.increment(1);
            updateData.completedConnections = FieldValue.increment(1);
        }

        // Analysis Aggregation
        if (newData.analysis?.sentimentScore) {
            updateData.sumSentiment = FieldValue.increment(newData.analysis.sentimentScore);
            updateData.countSentiment = FieldValue.increment(1);
        }

        // For topics, we can increment counters in a map
        // Note: FieldValue.increment in a map requires dot notation which we can do
        if (newData.analysis?.topics) {
            newData.analysis.topics.forEach((topic: string) => {
                // sanitize topic key
                const key = topic.replace(/\s+/g, '_').toLowerCase();
                // updateData[`topics.${key}`] = FieldValue.increment(1); // Nested map support varies
                // Better to use a separate field or flatter structure if needed.
                // For now, let's skip topic aggregation to avoid complexity or use dot notation if supported.
                updateData[`topic_${key}`] = FieldValue.increment(1);
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

    // ----------------------------------------------------
    // NEW: Update Pairwise Relationships & Member Stats
    // ----------------------------------------------------
    if (newData.status === 'completed' && newData.proposerId && newData.confirmerId) {
        const uid1 = newData.proposerId;
        const uid2 = newData.confirmerId;
        const users = [uid1, uid2].sort();
        const relationshipId = `${users[0]}_${users[1]}`;
        const relationshipRef = db.collection('relationships').doc(relationshipId);

        // Calculate new strength score (MVP: Average of current strength + new sentiment, or just increment)
        // For MVP, let's just use the latest sentiment as a proxy or keep it simple.
        // A better approach: Strength = (ConnectionCount * 5) + (AvgSentiment * 0.5)
        // Let's do a simple increment update for now.

        const sentiment = newData.analysis?.sentimentScore || 50;
        const topics = newData.analysis?.topics || [];

        // Update Relationship Doc
        batch.set(relationshipRef, {
            id: relationshipId,
            teamId: teamId,
            users: users,
            connectionCount: FieldValue.increment(1),
            lastConnectedAt: FieldValue.serverTimestamp(),
            // strengthScore: ... // We'd need to read the doc to average it, or use a cloud function trigger on write.
            // For now, let's just set it to the latest sentiment for simplicity, or we can't easily math in a batch without read.
            // Let's assume we want to just track that they connected.
            updatedAt: FieldValue.serverTimestamp(),
            tags: FieldValue.arrayUnion(...topics)
        }, { merge: true });

        // Update Team Member Stats (For "Isolated" & "Participation" tracking)
        [uid1, uid2].forEach(uid => {
            // We need to find the team_member doc for this user/team combo
            // Since we don't have the ID easily, we might need to query or assume a pattern.
            // IMPORTANT: TeamMember ID is not standard. We must query.
            // This breaks the batch atomicity if we await inside via loop, but standard for this scale.
            // actually we can't await inside the batch setup easily without breaking flow or verify efficiently.
            // Let's schedule a separate update or just do a fire-and-forget query loop.
            // ideally we query member IDs before or store memberId on Connection.
        });

        // Query Member IDs to update stats
        const membersSnapshot = await db.collection('team_members')
            .where('teamId', '==', teamId)
            .where('userId', 'in', [uid1, uid2])
            .get();

        membersSnapshot.forEach(doc => {
            const memberData = doc.data();
            const currentStats = memberData.stats || { totalConnections: 0, averageSentiment: 0 };
            const oldTotal = currentStats.totalConnections || 0;
            const oldAvg = currentStats.averageSentiment || 0;

            // Calculate new average
            // New Total = Old Total + 1
            // New Avg = ((Old Avg * Old Total) + New Sentiment) / New Total
            const newTotal = oldTotal + 1;
            const newAvg = ((oldAvg * oldTotal) + sentiment) / newTotal;

            batch.update(doc.ref, {
                'stats.totalConnections': newTotal,
                'stats.lastConnectedAt': FieldValue.serverTimestamp(),
                'stats.averageSentiment': newAvg
            });
        });
    }

    await batch.commit();
    console.log(`[Analytics] Aggregation complete for Team ${teamId}`);
};

export { aggregateConnectionData };

// Keep the trigger for backward compatibility or remove if index.ts handles it.
// For now, we are moving the logic to index.ts, so we can comment this out or make it a no-op
// to avoid double writes.
export const onConnectionUpdate = onDocumentUpdated("connections/{connectionId}", async (event: FirestoreEvent<any>) => {
    // Logic moved to index.ts to orchestrate AI -> Analytics
    // This function is effectively deprecated by the new flow in index.ts
    // or we can just call the shared function.
    return null;
});
