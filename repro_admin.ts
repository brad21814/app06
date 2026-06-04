import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function main() {
    console.log('Starting repro...');

    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
            process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
        }
        if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
            process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
        }
        if (!process.env.GCLOUD_PROJECT) {
            process.env.GCLOUD_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'komandra-app06';
        }
    }

    console.log('Admin Init Debug:', {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        emulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
        firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
        authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST
    });

    const firebaseAdminConfig = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    };

    const app = !getApps().length ? initializeApp(firebaseAdminConfig) : getApp();
    const adminDb = getFirestore(app);

    try {
        console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

        const analyticsSnap = await adminDb.collection('analytics').get();
        console.log('Analytics count:', analyticsSnap.size);
        analyticsSnap.docs.forEach(doc => {
            const data = doc.data();
            console.log(`- Analytics: ${doc.id}, type: ${data.entityType}, period: ${data.period}`);
        });

        const relSnap = await adminDb.collection('relationships').get();
        console.log('Relationships count:', relSnap.size);

        const usersSnap = await adminDb.collection('users').get();
        console.log('Users count:', usersSnap.size);
        usersSnap.docs.forEach(doc => {
            console.log(`- User: ${doc.id}, name: ${doc.data().name}, accountId: ${doc.data().accountId}`);
        });

        console.log('Success!');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
