import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

async function migrateToEveryoneTeam() {
    console.log('Starting migration: Rename default teams to "Everyone"...');

    const teamsRef = db.collection('teams');

    // Find 'General' teams
    const generalSnapshot = await teamsRef.where('name', '==', 'General').get();

    // Find 'All Members' teams
    const allMembersSnapshot = await teamsRef.where('name', '==', 'All Members').get();

    if (generalSnapshot.empty && allMembersSnapshot.empty) {
        console.log('No teams found with name "General" or "All Members".');
        return;
    }

    console.log(`Found ${generalSnapshot.size} teams named "General" and ${allMembersSnapshot.size} teams named "All Members".`);

    const batch = db.batch();
    let count = 0;

    generalSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { name: 'Everyone' });
        count++;
    });

    allMembersSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { name: 'Everyone' });
        count++;
    });

    await batch.commit();
    console.log(`Successfully updated ${count} teams to "Everyone".`);
}

migrateToEveryoneTeam().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
