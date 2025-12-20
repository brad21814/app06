import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
    getUsersCollection,
    getTeamsCollection,
    getTeamMembersCollection,
    getActivityLogsCollection,
    getInvitationsCollection,
    getUserDoc,
    getTeamDoc
} from '@/lib/firestore/admin/collections';
import { hashPassword, setSession } from '@/lib/auth/session';
import { ActivityType, User, Team, TeamMember, Invitation } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase/server';
import { emailService } from '@/lib/email';

const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
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
    try {
        const body = await request.json();
        const result = signUpSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        console.log('Sign Up Debug: Body parsed successfully');
        const { email, password, inviteId } = result.data;

        console.log('Sign Up Debug: Checking for existing user', { email });
        const usersRef = getUsersCollection();
        console.log('Users Collection Path:', usersRef.path);

        const userSnapshot = await usersRef
            .where('email', '==', email)
            .limit(1)
            .get();
        console.log('Sign Up Debug: User query complete', { empty: userSnapshot.empty });

        if (!userSnapshot.empty) {
            return NextResponse.json(
                { error: 'Account already exists with this email.' },
                { status: 400 }
            );
        }

        console.log('Sign Up Debug: Hashing password');
        const passwordHash = await hashPassword(password);
        console.log('Sign Up Debug: Password hashed');

        console.log('Sign Up Debug: Creating user in Firebase Auth');
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: email.split('@')[0],
            disabled: false,
        });
        const newUserId = userRecord.uid;
        console.log('Sign Up Debug: Generated new user ID', newUserId);

        let teamId: string | undefined;
        let accountId: string | undefined;
        let userRole = 'owner';

        // Check for invitation *before* creating the user document object
        if (inviteId) {
            console.log('Sign Up Debug: Handling invitation', inviteId);
            const inviteDoc = await getInvitationsCollection().doc(inviteId).get();
            const invitation = inviteDoc.exists ? inviteDoc.data() : null;

            if (invitation && invitation.email === email && invitation.status === 'pending') {
                teamId = invitation.teamId;
                accountId = invitation.accountId;
                userRole = invitation.role;

                // Mark as accepted immediately or after user creation? 
                // Let's keep existing flow: validate here, process after user doc creation options?
                // Actually, we can just use the values here to init newUser, and update invite status later.
            } else {
                return NextResponse.json(
                    { error: 'Invalid or expired invitation.' },
                    { status: 400 }
                );
            }
        }

        const newUser: User & { passwordHash: string } = {
            id: newUserId,
            name: null,
            email,
            role: userRole,
            accountId: accountId || null,
            createdAt: Timestamp.now() as any,
            updatedAt: Timestamp.now() as any,
            passwordHash
        };

        console.log('Sign Up Debug: Creating user doc');
        await getUserDoc(newUserId).set(newUser);
        console.log('Sign Up Debug: User doc created');

        let createdTeam: Team | null = null;

        if (inviteId && teamId) {
            // Re-fetch invite to update status effectively (or just use ref from earlier if scope allowed)
            // We know it exists and is pending from check above.
            const inviteQuery = await getInvitationsCollection().doc(inviteId).get();
            if (inviteQuery.exists) {
                await inviteQuery.ref.update({ status: 'accepted' });
            }

            await logActivity(teamId, newUser.id, ActivityType.ACCEPT_INVITATION);

            const tDoc = await getTeamDoc(teamId).get();
            if (tDoc.exists) createdTeam = tDoc.data() as Team;

            const newTeamMemberId = getTeamMembersCollection().doc().id;
            const newTeamMember: TeamMember = {
                id: newTeamMemberId,
                userId: newUser.id,
                teamId: teamId,
                role: userRole,
                joinedAt: Timestamp.now() as any
            };
            await getTeamMembersCollection().doc(newTeamMemberId).set(newTeamMember);
        }
        // For non-invited users, we do NOT create a team or team member here.
        // They will be redirected to onboarding to create their org and team.

        const customToken = await adminAuth.createCustomToken(newUser.id);

        await setSession(newUser);

        // Redirect to onboarding if no invite, otherwise dashboard
        const redirectUrl = inviteId ? '/dashboard' : '/onboarding';

        return NextResponse.json({ success: true, redirectUrl, customToken });

    } catch (error: any) {
        console.error('Sign up error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
