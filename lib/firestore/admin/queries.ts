import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import {
    getUsersCollection,
    getTeamMembersCollection,
    getUserDoc,
    getTeamDoc
} from './collections';
import { User } from '@/types/firestore';

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

export async function getTeamForUser() {
    console.log('getTeamForUser: Starting...');
    const user = await getUser();
    if (!user) {
        console.log('getTeamForUser: No authenticated user found.');
        return null;
    }
    console.log(`getTeamForUser: User found: ${user.id} (${user.email})`);

    const snapshot = await getTeamMembersCollection()
        .where('userId', '==', user.id)
        .limit(1)
        .get();

    console.log(`getTeamForUser: Team member query result empty? ${snapshot.empty}`);

    if (snapshot.empty) return null;

    const teamMember = snapshot.docs[0].data();
    console.log(`getTeamForUser: Found team member record, teamId: ${teamMember.teamId}`);

    const teamDoc = await getTeamDoc(teamMember.teamId).get();

    if (!teamDoc.exists) {
        console.log('getTeamForUser: Team document does not exist.');
        return null;
    }

    const team = teamDoc.data();
    if (!team) {
        console.log('getTeamForUser: Team data is empty.');
        return null;
    }

    // Fetch all team members
    const membersSnapshot = await getTeamMembersCollection()
        .where('teamId', '==', team.id)
        .get();

    console.log(`getTeamForUser: Found ${membersSnapshot.size} members for team ${team.id}`);

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
        teamMembers: teamMembersWithUsers
    };
}
