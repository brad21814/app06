import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import {
    getUsersCollection,
    getTeamsCollection,
    getTeamMembersCollection,
    getActivityLogsCollection,
    getUserDoc,
    getTeamDoc
} from './collections';
import { query, where, getDocs, limit, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { User, Team, ActivityLog } from '@/types/firestore';

export async function getUser(): Promise<User | null> {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie || !sessionCookie.value) {
        return null;
    }

    const sessionData = await verifyToken(sessionCookie.value);
    if (
        !sessionData ||
        !sessionData.user ||
        typeof sessionData.user.id !== 'string'
    ) {
        return null;
    }

    if (new Date(sessionData.expires) < new Date()) {
        return null;
    }

    const userDoc = await getDoc(getUserDoc(sessionData.user.id));
    if (userDoc.exists()) {
        const user = userDoc.data();
        if (user.deletedAt) {
            return null;
        }
        return user;
    }

    return null;
}

export async function getTeamByStripeCustomerId(customerId: string): Promise<Team | null> {
    const q = query(
        getTeamsCollection(),
        where('stripeCustomerId', '==', customerId),
        limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : snapshot.docs[0].data();
}

export async function updateTeamSubscription(
    teamId: string,
    subscriptionData: {
        stripeSubscriptionId: string | null;
        stripeProductId: string | null;
        planName: string | null;
        subscriptionStatus: string;
    }
) {
    await updateDoc(getTeamDoc(teamId), {
        ...subscriptionData,
        updatedAt: new Date() as any
    });
}

export async function getUserWithTeam(userId: string) {
    const userDoc = await getDoc(getUserDoc(userId));
    if (!userDoc.exists()) return null;
    const user = userDoc.data();

    const q = query(
        getTeamMembersCollection(),
        where('userId', '==', userId),
        limit(1)
    );
    const snapshot = await getDocs(q);
    const teamId = snapshot.empty ? null : snapshot.docs[0].data().teamId;

    return { user, teamId };
}

export async function getActivityLogs(): Promise<(ActivityLog & { userName: string })[]> {
    const user = await getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const q = query(
        getActivityLogsCollection(),
        where('userId', '==', user.id),
        orderBy('timestamp', 'desc'),
        limit(10)
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((doc) => doc.data());

    const logsWithNames = await Promise.all(logs.map(async (log) => {
        let userName = 'Unknown';
        if (log.userId) {
            const u = await getDoc(getUserDoc(log.userId));
            if (u.exists()) userName = u.data().name || 'Unknown';
        }
        return { ...log, userName };
    }));

    return logsWithNames;
}

export async function getTeamForUser() {
    const user = await getUser();
    if (!user) {
        return null;
    }

    const q = query(
        getTeamMembersCollection(),
        where('userId', '==', user.id),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const teamMember = snapshot.docs[0].data();
    const teamDoc = await getDoc(getTeamDoc(teamMember.teamId));
    if (!teamDoc.exists()) return null;

    const team = teamDoc.data();

    // Fetch all team members
    const membersQ = query(
        getTeamMembersCollection(),
        where('teamId', '==', team.id)
    );
    const membersSnapshot = await getDocs(membersQ);
    const teamMembers = membersSnapshot.docs.map(d => d.data());

    // Fetch user details for each member
    const teamMembersWithUsers = await Promise.all(teamMembers.map(async (member) => {
        const uDoc = await getDoc(getUserDoc(member.userId));
        const u = uDoc.exists() ? uDoc.data() : null;
        return {
            ...member,
            user: u ? { id: u.id, name: u.name, email: u.email } : { id: '', name: '', email: '' }
        };
    }));

    return {
        ...team,
        teamMembers: teamMembersWithUsers
    };
}
