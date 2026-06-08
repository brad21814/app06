import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { 
    getAnalyticsCollection, 
    getUserDoc, 
    getTeamMembersCollection,
    getAccountUsers,
    getUserConnections 
} from '@/lib/firestore/admin/queries';
import { adminDb } from '@/lib/firebase/server';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { serializeFirestoreData } from '@/lib/utils';
import { DashboardFilter } from '@/components/dashboard/dashboard-filter';
import { calculateUserAnalytics } from '@/lib/firestore/admin/analytics';

export const metadata = {
    title: 'Analytics | TeamPulp',
    description: 'Team and Organization Insights',
};

async function AnalyticsData({ searchParams }: { searchParams: Promise<{ view?: string, userId?: string }> }) {
    const session = await getSession();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const userDoc = await getUserDoc(session.user.id).get();
    if (!userDoc.exists) {
        return <div>User profile not found.</div>;
    }
    const userData = userDoc.data()!;
    const accountId = userData.accountId;

    if (!accountId) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <p>No account associated with this user.</p>
            </div>
        );
    }

    const params = await searchParams;
    const view = params.view || 'account';
    const targetUserId = params.userId;

    const isPrivileged = userData.role === 'owner' || userData.role === 'admin' || userData.role === 'account_admin';
    const resolvedView = isPrivileged ? view : 'personal';
    const resolvedTargetId = resolvedView === 'user' ? targetUserId : session.user.id;

    // 1. Fetch Account Users for mapping IDs to Names & for the Filter
    const accountUsersRaw = isPrivileged ? await getAccountUsers(accountId) : [];
    const accountUsers = serializeFirestoreData(accountUsersRaw);
    const usersMap: Record<string, any> = {};
    accountUsers.forEach((u: any) => {
        usersMap[u.id] = u;
    });

    // If usersMap is empty (non-privileged), at least add current user
    if (!usersMap[session.user.id]) {
        usersMap[session.user.id] = serializeFirestoreData(userData);
    }

    let analyticsData: any[] = [];
    let teamMembers: any[] = [];
    let relationships: any[] = [];

    if (resolvedView === 'account') {
        // Fetch Account-level Analytics (for the charts)
        const analyticsSnap = await getAnalyticsCollection()
            .where('entityId', '==', accountId)
            .where('entityType', '==', 'account')
            .get();

        analyticsData = analyticsSnap.docs.map((doc: any) => serializeFirestoreData(doc.data()));

        // Fetch User's Team (for granular view - MVP limitation: showing user's team only)
        const memberSnap = await getTeamMembersCollection()
            .where('userId', '==', session.user.id)
            .limit(1)
            .get();

        if (!memberSnap.empty) {
            const teamId = memberSnap.docs[0].data().teamId;

            const teamMembersSnap = await getTeamMembersCollection()
                .where('teamId', '==', teamId)
                .get();

            teamMembers = teamMembersSnap.docs.map((doc: any) => {
                const data = serializeFirestoreData(doc.data());
                return {
                    ...data,
                    user: usersMap[data.userId] || { name: 'Unknown User' }
                };
            });

            const relSnap = await adminDb.collection('relationships')
                .where('teamId', '==', teamId)
                .limit(20)
                .get();

            relationships = relSnap.docs.map(doc => {
                const data = serializeFirestoreData(doc.data());
                return {
                    ...data,
                    user1: usersMap[data.users[0]] || { name: 'Unknown' },
                    user2: usersMap[data.users[1]] || { name: 'Unknown' }
                };
            });
        }
    } else if (resolvedTargetId) {
        // PERSONAL or SPECIFIC USER VIEW
        // Fetch User's connections to calculate on-the-fly analytics
        const userConnections = await getUserConnections(resolvedTargetId);
        analyticsData = serializeFirestoreData(calculateUserAnalytics(resolvedTargetId, userConnections));

        // Fetch relationships involving this user
        const relSnap = await adminDb.collection('relationships')
            .where('users', 'array-contains', resolvedTargetId)
            .limit(20)
            .get();

        relationships = relSnap.docs.map(doc => {
            const data = serializeFirestoreData(doc.data());
            return {
                ...data,
                user1: usersMap[data.users[0]] || { name: 'Unknown' },
                user2: usersMap[data.users[1]] || { name: 'Unknown' }
            };
        });

        // For Team Participation, just show the target user
        const targetUser = usersMap[resolvedTargetId] || (resolvedTargetId === session.user.id ? serializeFirestoreData(userData) : null);
        if (targetUser) {
            teamMembers = [{
                userId: resolvedTargetId,
                role: targetUser.role,
                stats: targetUser.stats,
                user: targetUser
            }];
        }
    }

    return (
        <div className="space-y-4">
            {isPrivileged && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <DashboardFilter users={accountUsers} currentUserId={session.user.id} />
                </div>
            )}
            <AnalyticsDashboard analyticsData={analyticsData} teamMembers={teamMembers} relationships={relationships} />
        </div>
    );
}


export default function AnalyticsPage({ searchParams }: { searchParams: Promise<{ view?: string, userId?: string }> }) {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <Suspense fallback={<div className="flex justify-center items-center p-12 text-center"><Loader2 className="animate-spin h-8 w-8 text-orange-500 mx-auto" /><p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p></div>}>
                    <AnalyticsData searchParams={searchParams} />
                </Suspense>
            </div>
        </div>
    );
}
