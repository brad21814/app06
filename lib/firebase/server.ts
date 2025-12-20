import 'server-only';
import { initializeApp, getApps, getApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Note: For local development with the emulator or if using default credentials (like in GCP),
// we might not need a service account key if the environment is set up correctly.
// However, for explicit setup, we usually look for FIREBASE_SERVICE_ACCOUNT_KEY env var
// or specific credentials.
// For this starter, we'll assume standard environment variable configuration or default credentials.

// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string) as ServiceAccount;

console.log('Admin Init Debug:', {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    emulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
    firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
    authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST
});

let firebaseAdminConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
        process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    }
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    }
    if (!process.env.GCLOUD_PROJECT) {
        process.env.GCLOUD_PROJECT = 'komandra-app06';
    }
    firebaseAdminConfig.projectId = 'komandra-app06';
}

const app = !getApps().length ? initializeApp(firebaseAdminConfig) : getApp();
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
