import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

async function migrateGeneralTeams() {
    console.log('Starting migration: Rename "General" teams to "All Members"...');

    const teamsRef = db.collection('teams');
    const snapshot = await teamsRef.where('name', '==', 'General').get();

    if (snapshot.empty) {
        console.log('No teams found with name "General".');
        return;
    }

    console.log(`Found ${snapshot.size} teams to update.`);

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { name: 'All Members' });
        count++;
    });

    await batch.commit();
    console.log(`Successfully updated ${count} teams.`);
}

migrateGeneralTeams().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
