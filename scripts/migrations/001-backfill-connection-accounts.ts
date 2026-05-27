import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

async function backfillConnectionAccountsAndUserPrivacy() {
    console.log('Starting migration: Backfilling accountId for connections and privacyTier for users...');

    // 1. Backfill Connections
    const connectionsRef = db.collection('connections');
    const connectionsSnapshot = await connectionsRef.get();

    console.log(`Found ${connectionsSnapshot.size} connections.`);

    let connectionUpdateCount = 0;
    const teamCache = new Map<string, string>(); // teamId -> accountId

    for (const doc of connectionsSnapshot.docs) {
        const data = doc.data();
        if (data.accountId) continue;

        const teamId = data.teamId;
        if (!teamId) {
            console.warn(`Connection ${doc.id} missing teamId.`);
            continue;
        }

        let accountId = teamCache.get(teamId);
        if (!accountId) {
            const teamDoc = await db.collection('teams').doc(teamId).get();
            if (teamDoc.exists) {
                accountId = teamDoc.data()?.accountId;
                if (accountId) {
                    teamCache.set(teamId, accountId);
                }
            }
        }

        if (accountId) {
            await doc.ref.update({ accountId });
            connectionUpdateCount++;
        } else {
            console.warn(`Could not find accountId for team ${teamId} (Connection ${doc.id}).`);
        }
    }

    console.log(`Successfully backfilled accountId for ${connectionUpdateCount} connections.`);

    // 2. Backfill Users (Privacy Tier)
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    console.log(`Found ${usersSnapshot.size} users.`);

    let userUpdateCount = 0;
    for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        if (!data.privacyTier) {
            await doc.ref.update({ privacyTier: 'TIER_1' });
            userUpdateCount++;
        }
    }

    console.log(`Successfully backfilled privacyTier for ${userUpdateCount} users.`);
}

backfillConnectionAccountsAndUserPrivacy().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
