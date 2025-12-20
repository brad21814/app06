import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/firestore/client/queries';
import { getUserWithTeam } from '@/lib/firestore/client/queries';
import { ActivityType } from '@/types/firestore';
import { getActivityLogsCollection } from '@/lib/firestore/admin/collections';
import { Timestamp } from 'firebase-admin/firestore';

async function logActivity(
    teamId: string | null | undefined,
    userId: string,
    type: ActivityType
) {
    if (!teamId) return;
    const newActivity = {
        teamId,
        userId,
        action: type,
        timestamp: Timestamp.now() as any,
        ipAddress: ''
    };
    await getActivityLogsCollection().add(newActivity as any);
}

export async function POST() {
    try {
        // Note: getUser uses client SDK queries which might not work in API route if not authenticated via client SDK
        // But here we are in API route, we should verify session cookie manually or use middleware.
        // The `getUser` helper checks cookies().get('session').
        const user = await getUser();

        if (user) {
            const userWithTeam = await getUserWithTeam(user.id);
            await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
        }

        (await cookies()).delete('session');

        return NextResponse.json({ success: true, redirectUrl: '/sign-in' });
    } catch (error) {
        console.error('Sign out error:', error);
        return NextResponse.json({ error: 'An error occurred during sign out' }, { status: 500 });
    }
}
