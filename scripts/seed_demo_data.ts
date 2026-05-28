import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
if (!getApps().length) {
    initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'komandra-app06',
    });
}

const db = getFirestore();
const auth = getAuth();

const USERS = [
    { uid: 'owner-1', email: 'brad+o@komandra.com', name: 'Brad Owner', role: 'owner' },
    { uid: 'admin-1', email: 'brad+u1@komandra.com', name: 'Sarah Admin', role: 'admin' },
    { uid: 'member-1', email: 'brad+u2@komandra.com', name: 'John Member', role: 'member' },
    { uid: 'member-2', email: 'brad+u3@komandra.com', name: 'Alice Member', role: 'member' },
    { uid: 'member-3', email: 'brad+u4@komandra.com', name: 'Bob Member', role: 'member' },
];

const STANDARD_THEMES = [
    {
        name: 'Team Building',
        description: 'Questions designed to strengthen team bonds and understanding.',
        questions: [
            "What is your clear definition of a successful team?",
            "What determines a successful team member?",
            "What is the most important quality of a team leader?",
            "How do you prefer to receive feedback?",
            "What is one skill you want to improve this year?"
        ]
    },
    {
        name: 'General Knowledge',
        description: 'Fun trivia and general knowledge questions to spark conversation.',
        questions: [
            "What is the capital of Australia?",
            "Who wrote '1984'?",
            "What is the chemical symbol for Gold?",
            "What is the largest planet in our solar system?",
            "Who painted the Mona Lisa?"
        ]
    }
];

const TOPICS = ['Project Architecture', 'Work-Life Balance', 'Team Growth', 'New Features', 'Customer Feedback', 'Internal Tools'];
const VIBES = ['Thriving', 'Neutral', 'Concern'];

const SUMMARIES = [
    "A highly productive session discussing the upcoming release. Both participants are aligned on goals.",
    "Discussed work-life balance and remote work challenges. Sarah shared some great tips on time management.",
    "A deep dive into the new architecture. Some healthy disagreement on the database choice, but reached a consensus.",
    "Quick catch-up on personal lives and hobbies. Strong bond identified through shared interest in hiking.",
    "Reviewed the recent customer feedback. John is feeling a bit overwhelmed with the current sprint pace.",
    "Discussed the new onboarding flow. Alice had some excellent ideas for simplifying the first step."
];

async function clearCollections() {
    const collections = ['users', 'accounts', 'teams', 'team_members', 'connections', 'relationships', 'analytics', 'invitations', 'themes', 'schedules'];
    for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Cleared ${collectionName}`);
    }
}

async function clearAuthUsers() {
    const listUsersResult = await auth.listUsers(1000);
    const uids = listUsersResult.users.map((user) => user.uid);
    if (uids.length > 0) {
        await auth.deleteUsers(uids);
        console.log(`Deleted ${uids.length} Auth users`);
    }
}

async function seedData() {
    const accountId = 'demo-account';
    const allMembersTeamId = 'team-all-members';
    const engineeringTeamId = 'team-engineering';
    const now = new Date();

    // 1. Create Themes (Standard)
    for (const theme of STANDARD_THEMES) {
        await db.collection('themes').add({
            accountId: null,
            name: theme.name,
            description: theme.description,
            questions: theme.questions,
            createdBy: 'system',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }

    // 2. Create Account
    await db.collection('accounts').doc(accountId).set({
        id: accountId,
        name: 'Teampulp Demo Corp',
        ownerId: 'owner-1',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        subscriptionStatus: 'active',
        subscriptionTier: 'culture',
        userCount: USERS.length,
        hasReviewedThemes: true
    });

    // 3. Create Teams
    const teams = [
        { id: allMembersTeamId, name: 'All Members' },
        { id: engineeringTeamId, name: 'Engineering' }
    ];

    for (const team of teams) {
        await db.collection('teams').doc(team.id).set({
            id: team.id,
            name: team.name,
            accountId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
    }

    // 4. Create Users & Team Members
    const userStatsMap = new Map<string, { total: number, sumSentiment: number, lastConnected: Date | null }>();

    for (const u of USERS) {
        await auth.createUser({
            uid: u.uid,
            email: u.email,
            password: 'Testing123!',
            displayName: u.name
        });

        await db.collection('users').doc(u.uid).set({
            id: u.uid,
            name: u.name,
            email: u.email,
            role: u.role,
            accountId,
            privacyTier: 'TIER_1',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            stats: {
                totalConnections: 0,
                averageSentiment: 0
            }
        });

        userStatsMap.set(u.uid, { total: 0, sumSentiment: 0, lastConnected: null });

        // Add to All Members
        await db.collection('team_members').doc(`tm-all-${u.uid}`).set({
            id: `tm-all-${u.uid}`,
            userId: u.uid,
            teamId: allMembersTeamId,
            role: u.role === 'owner' ? 'owner' : u.role === 'admin' ? 'admin' : 'member',
            joinedAt: Timestamp.now()
        });

        // Add to Engineering
        await db.collection('team_members').doc(`tm-eng-${u.uid}`).set({
            id: `tm-eng-${u.uid}`,
            userId: u.uid,
            teamId: engineeringTeamId,
            role: u.role === 'owner' ? 'owner' : u.role === 'admin' ? 'admin' : 'member',
            joinedAt: Timestamp.now()
        });
    }

    // 5. Create a Schedule
    const scheduleId = 'demo-schedule-1';
    await db.collection('schedules').doc(scheduleId).set({
        id: scheduleId,
        accountId,
        teamId: allMembersTeamId,
        frequency: 'bi-weekly',
        status: 'active',
        themeName: 'Team Building',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });

    // 6. Generate Historical Connections
    console.log('Generating historical connections...');
    const userIds = USERS.map(u => u.uid);
    const connectionsCount = 25;
    
    for (let i = 0; i < connectionsCount; i++) {
        const daysAgo = Math.floor(Math.random() * 60); 
        const connectionDate = new Date(now);
        connectionDate.setDate(connectionDate.getDate() - daysAgo);

        let p1Idx = Math.floor(Math.random() * userIds.length);
        let p2Idx = Math.floor(Math.random() * userIds.length);
        while (p1Idx === p2Idx) p2Idx = Math.floor(Math.random() * userIds.length);

        const proposerId = userIds[p1Idx];
        const confirmerId = userIds[p2Idx];
        const sentiment = 55 + Math.floor(Math.random() * 40); // 55-95
        const connectionId = `conn-hist-${i}`;

        const analysis = {
            summary: SUMMARIES[Math.floor(Math.random() * SUMMARIES.length)],
            sentimentScore: sentiment,
            interactionBalance: 0.4 + Math.random() * 0.2,
            topics: [TOPICS[Math.floor(Math.random() * TOPICS.length)], TOPICS[Math.floor(Math.random() * TOPICS.length)]],
            keyTakeaways: ["Action item identified", "Good alignment"],
            vibeScore: VIBES[sentiment > 85 ? 0 : sentiment > 70 ? 1 : 2]
        };

        const questions = STANDARD_THEMES[0].questions;

        await db.collection('connections').doc(connectionId).set({
            id: connectionId,
            accountId,
            teamId: allMembersTeamId,
            scheduleId,
            status: 'completed',
            proposerId,
            confirmerId,
            sentiment,
            summary: analysis.summary,
            analysis,
            questions,
            currentQuestionIndex: questions.length - 1,
            questionEvents: questions.map((q, idx) => ({
                question: q,
                askedAt: Timestamp.fromDate(new Date(connectionDate.getTime() + idx * 180000))
            })),
            createdAt: Timestamp.fromDate(connectionDate),
            updatedAt: Timestamp.fromDate(connectionDate),
            startedAt: Timestamp.fromDate(connectionDate),
            endedAt: Timestamp.fromDate(new Date(connectionDate.getTime() + 15 * 60000))
        });

        // Update Stats Map
        [proposerId, confirmerId].forEach(uid => {
            const s = userStatsMap.get(uid)!;
            s.total += 1;
            s.sumSentiment += sentiment;
            if (!s.lastConnected || connectionDate > s.lastConnected) {
                s.lastConnected = connectionDate;
            }
        });

        // Seed Relationship
        const pair = [proposerId, confirmerId].sort();
        const relId = `${pair[0]}_${pair[1]}`;
        const relRef = db.collection('relationships').doc(relId);
        const relSnap = await relRef.get();

        if (relSnap.exists) {
            await relRef.update({
                connectionCount: FieldValue.increment(1),
                lastConnectedAt: Timestamp.fromDate(connectionDate),
                strengthScore: Math.floor((relSnap.data()?.strengthScore + sentiment) / 2)
            });
        } else {
            await relRef.set({
                id: relId,
                teamId: allMembersTeamId,
                users: pair,
                connectionCount: 1,
                lastConnectedAt: Timestamp.fromDate(connectionDate),
                strengthScore: sentiment,
                tags: analysis.topics
            });
        }
    }

    // 7. Sync User Docs with Stats
    console.log('Syncing user stats...');
    for (const [uid, s] of userStatsMap.entries()) {
        await db.collection('users').doc(uid).update({
            stats: {
                totalConnections: s.total,
                averageSentiment: s.total > 0 ? s.sumSentiment / s.total : 0,
                lastConnectedAt: s.lastConnected ? Timestamp.fromDate(s.lastConnected) : null
            }
        });

        // Also update Team Member stats for All Members
        await db.collection('team_members').doc(`tm-all-${uid}`).update({
            stats: {
                totalConnections: s.total,
                averageSentiment: s.total > 0 ? s.sumSentiment / s.total : 0,
                lastConnectedAt: s.lastConnected ? Timestamp.fromDate(s.lastConnected) : null
            }
        });
    }

    // 8. Add some pending Invitations
    const pendingInvites = [
        { email: 'brad+invite1@komandra.com', name: 'Potential Hire', role: 'member' },
        { email: 'brad+invite2@komandra.com', name: 'Contractor Mike', role: 'member' }
    ];

    for (const invite of pendingInvites) {
        await db.collection('invitations').add({
            accountId,
            teamIds: [allMembersTeamId],
            email: invite.email,
            name: invite.name,
            role: invite.role,
            invitedBy: 'owner-1',
            status: 'pending',
            createdAt: Timestamp.now()
        });
    }

    // 9. Aggregate Analytics
    console.log('Aggregating analytics...');
    const months = ['2026-04', '2026-05'];
    for (const month of months) {
        await db.collection('analytics').doc(`team_${allMembersTeamId}_${month}`).set({
            id: `team_${allMembersTeamId}_${month}`,
            entityType: 'team',
            entityId: allMembersTeamId,
            period: month,
            totalConnections: 12,
            completedConnections: 12,
            avgSentiment: 78 + Math.random() * 5,
            participationRate: 0.9,
            relationshipDensity: 0.6,
            topTopics: [{ topic: 'Product', count: 8 }, { topic: 'Engineering', count: 6 }],
            updatedAt: Timestamp.now()
        });
    }

    console.log('Demo data seeding complete with all gaps filled!');
}

async function main() {
    try {
        await clearAuthUsers();
        await clearCollections();
        await seedData();
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

main();
