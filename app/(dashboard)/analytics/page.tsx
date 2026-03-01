import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { getAnalyticsCollection, getUserDoc, getTeamMembersCollection } from '@/lib/firestore/admin/collections';
import { adminDb } from '@/lib/firebase/server';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { serializeFirestoreData } from '@/lib/utils';

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

    // 1. Fetch Account-level Analytics (for the charts)
    const analyticsSnap = await getAnalyticsCollection()
        .where('entityId', '==', accountId)
        .where('entityType', '==', 'account')
        .get();

    const analyticsData = analyticsSnap.docs.map(doc => serializeFirestoreData(doc.data()));

    // 2. Fetch User's Team (for granular view - MVP limitation: showing user's team only)
    // We need to find which team the user is in.
    const memberSnap = await getTeamMembersCollection()
        .where('userId', '==', session.user.id)
        .limit(1)
        .get();

    let teamMembers: any[] = [];
    let relationships: any[] = [];

    if (!memberSnap.empty) {
        const teamId = memberSnap.docs[0].data().teamId;

        // Fetch all members of this team to show Participation Stats
        const teamMembersSnap = await getTeamMembersCollection()
            .where('teamId', '==', teamId)
            .get();

        teamMembers = teamMembersSnap.docs.map(doc => serializeFirestoreData(doc.data()));

        // Fetch Relationships for this team
        const relSnap = await adminDb.collection('relationships')
            .where('teamId', '==', teamId)
            .limit(20) // Limit for performance
            .get();

        relationships = relSnap.docs.map(doc => serializeFirestoreData(doc.data()));
    }

    // Fetch Relationships (We need to import adminDb)
    // We'll require a dynamic import or checking if we can import adminDb directly in page.tsx
    // It's a server component, so yes.

    // HOWEVER, we don't have a helper for relationships yet.
    // Let's skip fetching relationships for this exact tool call and do it in next one 
    // or just assume we can't display them yet until we add the helper?
    // actually I can just add the helper code right here if imports allow.

    return <AnalyticsDashboard analyticsData={analyticsData} teamMembers={teamMembers} relationships={relationships} />;
}


export default function AnalyticsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <Suspense fallback={<div className="flex justify-center items-center p-12 text-center"><Loader2 className="animate-spin h-8 w-8 text-orange-500 mx-auto" /><p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p></div>}>
                    <AnalyticsData />
                </Suspense>
            </div>
        </div>
    );
}
