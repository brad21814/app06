import { Suspense } from 'react';
import { getUser, getTeamForUser, getUserConnections, getTeamConnections, getAnalyticsData, getRelationships } from '@/lib/firestore/admin/queries';
import { ConnectionHistory } from '@/components/dashboard/connection-history';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { OnboardingChecklist } from '@/components/dashboard/checklist';

// Separate component for async data fetching to keep page clean
async function DashboardContent() {
  const user = await getUser();
  if (!user) return null; // Should be handled by middleware/layout, but safety check

  const team = await getTeamForUser();
  const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';

  let connections: any[] = [];
  if (isOwnerOrAdmin && team) {
    connections = await getTeamConnections(team.id);
  } else {
    connections = await getUserConnections(user.id);
  }

  let analyticsData = [];
  let relationships = [];
  let teamMembers = [];

  if (isOwnerOrAdmin && team) {
    analyticsData = await getAnalyticsData(team.id);
    relationships = await getRelationships(team.id);
    teamMembers = team.teamMembers;
  }

  return (
    <div className="space-y-8">
      <OnboardingChecklist />

      {isOwnerOrAdmin && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Team Analytics</h2>
          <AnalyticsDashboard
            analyticsData={analyticsData}
            relationships={relationships}
            teamMembers={teamMembers}
          />
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Your Connections</h2>
        <ConnectionHistory connections={connections} currentUserId={user.id} />
      </section>
    </div>
  );

}

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </section>
  );
}
