
import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
    getUsersCollection,
    getTeamMembersCollection,
    getActivityLogsCollection,
    getInvitationsCollection,
    getUserDoc,
    getTeamDoc,
    getTeamsCollection
} from '@/lib/firestore/admin/collections';
import { setSession } from '@/lib/auth/session';
import { ActivityType, User, Team, TeamMember } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth } from '@/lib/firebase/server';

const signUpSchema = z.object({
    idToken: z.string(),
    inviteId: z.string().optional(),
    redirect: z.string().optional(),
    priceId: z.string().optional(),
});

async function logActivity(
    teamId: string | null | undefined,
    userId: string,
    type: ActivityType,
    ipAddress?: string
) {
    if (!teamId) return;

    const newActivity = {
        teamId,
        userId,
        action: type,
        timestamp: Timestamp.now() as any,
        ipAddress: ipAddress || ''
    };
    await getActivityLogsCollection().add(newActivity as any);
}

export async function POST(request: Request) {
    console.log('POST /api/auth/sign-up');
    try {
        const body = await request.json();
        const result = signUpSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { idToken, inviteId, redirect, priceId } = result.data;

        // Verify ID Token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { uid: newUserId, email } = decodedToken;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required.' },
                { status: 400 }
            );
        }

        const usersRef = getUsersCollection();
        const userDocRef = getUserDoc(newUserId);
        const userDocSnapshot = await userDocRef.get();

        if (userDocSnapshot.exists) {
            // User already initialized, set session and redirect
            const user = userDocSnapshot.data() as User;
            await setSession(user);
            return NextResponse.json({ success: true, redirectUrl: redirect || '/dashboard' });
        }

        let teamIds: string[] = [];
        let accountId: string | undefined;
        let userRole = 'owner';

        // Check for invitation
        if (inviteId) {
            const inviteDoc = await getInvitationsCollection().doc(inviteId).get();
            const invitation = inviteDoc.exists ? inviteDoc.data() : null;

            if (invitation && invitation.email === email && invitation.status === 'pending') {
                teamIds = invitation.teamIds;
                accountId = invitation.accountId;
                userRole = invitation.role;
            } else {
                // Invalid invite, but we can still create the user, just without the team connection?
                // Or fail? Existing logic failed. Let's fail for now to match behavior.
                return NextResponse.json(
                    { error: 'Invalid or expired invitation.' },
                    { status: 400 }
                );
            }
        }

        const newUser: User = {
            id: newUserId,
            name: email.split('@')[0], // Set default name from email
            email,
            role: userRole,
            accountId: accountId || null,
            createdAt: Timestamp.now() as any,
            updatedAt: Timestamp.now() as any,
        };

        await userDocRef.set(newUser);

        if (inviteId && teamIds.length > 0) {
            const inviteQuery = await getInvitationsCollection().doc(inviteId).get();
            if (inviteQuery.exists) {
                await inviteQuery.ref.update({ status: 'accepted' });
            }

            // Log activity for the first team (primary association for now)
            await logActivity(teamIds[0], newUser.id, ActivityType.ACCEPT_INVITATION);

            // Add user to all teams in the invite
            const teamMembersRef = getTeamMembersCollection();
            // const batch = adminAuth.app.firestore().batch(); // Unused

            // Note: The helper `getTeamMembersCollection` returns a collection ref.
            // Let's do parallel promises for simplicity since batch requires db instance ref which we can get from ref.firestore

            const joinPromises = teamIds.map(async (tid) => {
                const newTeamMemberId = teamMembersRef.doc().id;
                const newTeamMember: TeamMember = {
                    id: newTeamMemberId,
                    userId: newUser.id,
                    teamId: tid,
                    role: userRole,
                    joinedAt: Timestamp.now() as any
                };
                return teamMembersRef.doc(newTeamMemberId).set(newTeamMember);
            });

            await Promise.all(joinPromises);
        }

        await setSession(newUser);

        const redirectUrl = inviteId ? '/dashboard' : '/onboarding';

        return NextResponse.json({ success: true, redirectUrl });

    } catch (error: any) {
        console.error('Sign up error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
