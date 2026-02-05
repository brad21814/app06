import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/firestore/admin/collections';
import { setSession } from '@/lib/auth/session';

import { ActivityType } from '@/types/firestore';
import { getTeamMembersCollection, getActivityLogsCollection, getTeamDoc } from '@/lib/firestore/admin/collections';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth } from '@/lib/firebase/server';
import { createCheckoutSession } from '@/lib/payments/stripe';



const signInSchema = z.object({
    idToken: z.string(),
    redirect: z.string().optional(),
    priceId: z.string().optional(),
});

async function logActivity(
    teamId: string | null | undefined,
    userId: string,
    type: ActivityType,
    ipAddress?: string
) {
    if (!teamId) {
        return;
    }
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
    console.log('POST /api/auth/sign-in');
    try {
        const body = await request.json();
        const result = signInSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { idToken, redirect: redirectPath, priceId } = result.data;

        // Verify the ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Get user from Firestore
        const userDoc = await getUsersCollection().doc(uid).get();

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: 'User account not found.' },
                { status: 404 }
            );
        }

        const foundUser = userDoc.data()!;

        // Get Team Info
        const teamMemberSnapshot = await getTeamMembersCollection()
            .where('userId', '==', foundUser.id)
            .limit(1)
            .get();

        const teamId = teamMemberSnapshot.empty ? null : teamMemberSnapshot.docs[0].data().teamId;

        await Promise.all([
            setSession(foundUser),
            logActivity(teamId, foundUser.id, ActivityType.SIGN_IN)
        ]);

        return NextResponse.json({ success: true, redirectUrl: redirectPath || '/dashboard' });

    } catch (error: any) {
        console.error('Sign in error:', error);
        return NextResponse.json(
            { error: 'Authentication failed.' },
            { status: 401 }
        );
    }
}
