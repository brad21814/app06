import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { hashPassword } from '../auth/session';

// Initialize Firebase Admin
if (!getApps().length) {
    initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'komandra-app06',
    });
}

const db = getFirestore();

async function seed() {
    console.log('Seeding Firestore...');

    // Clear existing data (optional, be careful in production)
    // For now, we'll just add data.

    // Create a user
    const userId = 'seed-user-1';
    const email = 'user@example.com';
    const password = 'password123';
    const passwordHash = await hashPassword(password);

    const userRef = db.collection('users').doc(userId);
    await userRef.set({
        id: userId,
        name: 'Seed User',
        email,
        passwordHash,
        role: 'owner',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    console.log('Created user:', email);

    // Create a team
    const teamId = 'seed-team-1';
    const teamRef = db.collection('teams').doc(teamId);
    await teamRef.set({
        id: teamId,
        name: 'Seed Team',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: null,
    });

    console.log('Created team: Seed Team');

    // Create a team member
    const memberId = 'seed-member-1';
    const memberRef = db.collection('team_members').doc(memberId);
    await memberRef.set({
        id: memberId,
        userId,
        teamId,
        role: 'owner',
        joinedAt: Timestamp.now(),
    });

    console.log('Created team member');

    console.log('Seeding complete.');
}

seed().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
