import 'server-only';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import {
    getUsersCollection,
    getTeamsCollection,
    getTeamMembersCollection,
    getActivityLogsCollection,
    getUserDoc,
    getTeamDoc,
    getAccountDoc,
    getConnectionsCollection,
    getAnalyticsCollection,
    getRelationshipsCollection
} from './collections';
import { User, Team, Account, ActivityLog, Connection, AnalyticsSnapshot, Relationship, ConnectionWithParticipants, PrivacyTier } from '@/types/firestore';

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

    const userDoc = await getUserDoc(sessionData.user.id).get();
    if (userDoc.exists) {
        const user = userDoc.data();
        if (user?.deletedAt) {
            return null;
        }
        return user || null;
    }

    return null;
}

export async function getAccount(accountId: string): Promise<Account | null> {
    const accountDoc = await getAccountDoc(accountId).get();
    return accountDoc.exists ? accountDoc.data() || null : null;
}

export async function getTeamByStripeCustomerId(customerId: string): Promise<Team | null> {
    const snapshot = await getTeamsCollection()
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();

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
    await getTeamDoc(teamId).update({
        ...subscriptionData,
        updatedAt: new Date() as any
    });
}

export async function getUserWithTeam(userId: string) {
    const userDoc = await getUserDoc(userId).get();
    if (!userDoc.exists) return null;
    const user = userDoc.data();

    const snapshot = await getTeamMembersCollection()
        .where('userId', '==', userId)
        .limit(1)
        .get();

    const teamId = snapshot.empty ? null : snapshot.docs[0].data().teamId;

    return { user, teamId };
}

export async function getActivityLogs(): Promise<(ActivityLog & { userName: string })[]> {
    const user = await getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const snapshot = await getActivityLogsCollection()
        .where('userId', '==', user.id)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

    const logs = snapshot.docs.map((doc) => doc.data());

    const logsWithNames = await Promise.all(logs.map(async (log) => {
        let userName = 'Unknown';
        if (log.userId) {
            const u = await getUserDoc(log.userId).get();
            if (u.exists) userName = u.data()?.name || 'Unknown';
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

    const snapshot = await getTeamMembersCollection()
        .where('userId', '==', user.id)
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const teamMember = snapshot.docs[0].data();
    const teamDoc = await getTeamDoc(teamMember.teamId).get();
    if (!teamDoc.exists) return null;

    const team = teamDoc.data();
    if (!team) return null;

    // Fetch account to get ownerId
    const account = await getAccount(team.accountId);

    // Fetch all team members
    const membersSnapshot = await getTeamMembersCollection()
        .where('teamId', '==', team.id)
        .get();

    const teamMembers = membersSnapshot.docs.map(d => d.data());

    // Fetch user details for each member
    const teamMembersWithUsers = await Promise.all(teamMembers.map(async (member) => {
        const uDoc = await getUserDoc(member.userId).get();
        const u = uDoc.exists ? uDoc.data() : null;
        return {
            ...member,
            user: u ? { id: u.id, name: u.name, email: u.email } : { id: '', name: '', email: '' }
        };
    }));

    return {
        ...team,
        ownerId: account?.ownerId || null,
        teamMembers: teamMembersWithUsers
    };
}


async function enrichConnectionsWithParticipants(connections: Connection[]): Promise<ConnectionWithParticipants[]> {
    if (connections.length === 0) return [];

    const userIds = new Set<string>();
    connections.forEach(c => {
        if (c.proposerId) userIds.add(c.proposerId);
        if (c.confirmerId) userIds.add(c.confirmerId);
    });

    const userMap = new Map<string, Pick<User, 'id' | 'name' | 'email'>>();
    await Promise.all(Array.from(userIds).map(async (uid) => {
        const uDoc = await getUserDoc(uid).get();
        if (uDoc.exists) {
            const u = uDoc.data();
            if (u) {
                userMap.set(uid, { id: u.id, name: u.name, email: u.email });
            }
        }
    }));

    return connections.map(c => ({
        ...c,
        proposer: c.proposerId ? userMap.get(c.proposerId) || null : null,
        confirmer: c.confirmerId ? userMap.get(c.confirmerId) || null : null,
    }));
}

export async function getUserConnections(userId: string): Promise<ConnectionWithParticipants[]> {
    const snapshot = await getConnectionsCollection()
        .where('proposerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const snapshot2 = await getConnectionsCollection()
        .where('confirmerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    // Merge and sort
    const connections = [...snapshot.docs.map(d => d.data()), ...snapshot2.docs.map(d => d.data())];

    // Deduplicate based on ID (though unlikely to overlap given the queries unless user proposes to themselves?)
    const uniqueConnections = Array.from(new Map(connections.map(item => [item.id, item])).values());

    uniqueConnections.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return enrichConnectionsWithParticipants(uniqueConnections);
}

export async function getTeamConnections(teamId: string): Promise<ConnectionWithParticipants[]> {
    const snapshot = await getConnectionsCollection()
        .where('teamId', '==', teamId)
        .orderBy('createdAt', 'desc')
        .get();

    const connections = snapshot.docs.map(d => d.data());
    return enrichConnectionsWithParticipants(connections);
}

export async function getAnalyticsData(teamId: string): Promise<AnalyticsSnapshot[]> {
    const snapshot = await getAnalyticsCollection()
        .where('entityId', '==', teamId)
        .orderBy('period', 'asc')
        .get();

    return snapshot.docs.map(d => d.data());
}

export async function getRelationships(teamId: string): Promise<Relationship[]> {
    const snapshot = await getRelationshipsCollection()
        .where('teamId', '==', teamId)
        .get();

    return snapshot.docs.map(d => d.data());
}

export async function getAccountConnections(accountId: string, dateLimit?: Date): Promise<ConnectionWithParticipants[]> {
    let q = getConnectionsCollection()
        .where('accountId', '==', accountId)
        .where('status', '==', 'completed');

    if (dateLimit) {
        q = q.where('createdAt', '>=', dateLimit);
    }

    const snapshot = await q.get();
    const connections = snapshot.docs.map(d => d.data());

    // Sorting must be done in-memory or by index (if not already indexed)
    connections.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return enrichConnectionsWithParticipants(connections);
}

export async function checkConnectionVisibility(user: User, connection: Connection): Promise<boolean> {
    // Participants always have full access
    if (connection.proposerId === user.id || connection.confirmerId === user.id) {
        return true;
    }

    // Role check
    const isPrivileged = user.role === 'owner' || user.role === 'admin' || user.role === 'account_admin';
    if (!isPrivileged) {
        return false;
    }

    // Participants privacy check
    const pIds = [connection.proposerId, connection.confirmerId].filter(Boolean) as string[];

    for (const pid of pIds) {
        const pDoc = await getUserDoc(pid).get();
        const pData = pDoc.exists ? pDoc.data() : null;
        if (pData?.privacyTier === PrivacyTier.TIER_3_PRIVATE) {
            return false;
        }
    }

    return true;
}

export async function getAccountUsers(accountId: string): Promise<User[]> {
    const snapshot = await getUsersCollection()
        .where('accountId', '==', accountId)
        .get();

    const users = snapshot.docs.map(d => d.data());

    // Fetch 'All Members' team stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
        const teamMemberSnapshot = await getTeamMembersCollection()
            .where('userId', '==', user.id)
            .get();

        // Find the 'All Members' team member record or any if none
        const allMembersTeamMember = teamMemberSnapshot.docs.find(d => {
            // We'd ideally check team name, but for now let's just use the stats from the first one
            // as they are currently aggregated at the user document level in many cases 
            // but let's check for the team member stats.
            return d.exists;
        })?.data();

        return {
            ...user,
            stats: allMembersTeamMember?.stats || user.stats // Fallback to user.stats if present
        };
    }));

    return usersWithStats;
}

export async function getUserStats(userId: string): Promise<{
    user: User;
    connections: ConnectionWithParticipants[];
}> {
    const userDoc = await getUserDoc(userId).get();
    if (!userDoc.exists) {
        throw new Error('User not found');
    }
    const user = userDoc.data()!;

    // Fetch recent connections for this user
    const connections = await getUserConnections(userId);

    return {
        user,
        connections
    };
}
