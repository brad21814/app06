import { Suspense } from 'react';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { getAnalyticsCollection, getUserDoc } from '@/lib/firestore/admin/collections';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Analytics | TeamPulp',
    description: 'Team and Organization Insights',
};

async function AnalyticsData() {
    const session = await getSession();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const userDoc = await getUserDoc(session.user.id).get();
    if (!userDoc.exists) {
        return <div>User profile not found.</div>;
    }
    const userData = userDoc.data();
    const accountId = userData?.accountId;

    if (!accountId) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <p>No account associated with this user.</p>
            </div>
        );
    }

    // Fetch Analytics for this Account
    const analyticsSnap = await getAnalyticsCollection()
        .where('entityId', '==', accountId)
        .where('entityType', '==', 'account')
        .get();

    const analyticsData = analyticsSnap.docs.map(doc => doc.data());

    if (analyticsData.length === 0) {
        // Fallback for demo if no data exists yet
        const MOCK_DATA = [
            {
                id: 'mock_1',
                entityType: 'account',
                entityId: accountId, // Match user's account
                period: '2025-01',
                totalConnections: 12,
                completedConnections: 10,
                avgSentiment: 78,
                participationRate: 0.83,
                relationshipDensity: 0.35,
                topTopics: [{ topic: 'Launch', count: 5 }],
                updatedAt: null as any
            }
        ] as any[];

        return <AnalyticsDashboard analyticsData={MOCK_DATA} />;
    }

    return <AnalyticsDashboard analyticsData={analyticsData} />;
}


export default function AnalyticsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <Suspense fallback={<div>Loading analytics...</div>}>
                    <AnalyticsData />
                </Suspense>
            </div>
        </div>
    );
}
