import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  getUser, 
  getTeamForUser, 
  getUserConnections, 
  getTeamConnections, 
  getAnalyticsData, 
  getRelationships, 
  getAccountConnections, 
  checkConnectionVisibility 
} from '@/lib/firestore/admin/queries';
import { AnalyticsSnapshot, Relationship, TeamMember, ConnectionWithParticipants } from '@/types/firestore';
import { Connections } from '@/components/dashboard/connections';
import { AnalyticsSummary } from '@/components/analytics/analytics-summary';
import { ConnectionsGraph } from '@/components/dashboard/connections-graph';
import { RangeSelector } from '@/components/dashboard/range-selector';
import { serializeFirestoreData } from '@/lib/utils';

// Separate component for async data fetching to keep page clean
async function DashboardContent({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await getUser();
  if (!user) return null; // Should be handled by middleware/layout, but safety check

  const params = await searchParams;
  const range = params.range || '90';
  
  const dateLimit = range === 'all' ? undefined : new Date();
  if (dateLimit && range !== 'all') {
    dateLimit.setDate(dateLimit.getDate() - parseInt(range));
  }

  const team = await getTeamForUser();
  const isPrivileged = user.role === 'owner' || user.role === 'admin' || user.role === 'account_admin';

  let connections: ConnectionWithParticipants[] = [];
  if (isPrivileged && user.accountId) {
    connections = await getAccountConnections(user.accountId, dateLimit);
  } else {
    connections = await getUserConnections(user.id);
  }

  // Apply privacy gating to connection details
  const processedConnections = await Promise.all(connections.map(async (conn) => {
    const canSeeDetails = await checkConnectionVisibility(user, conn);
    if (!canSeeDetails) {
      return {
        ...conn,
        summary: 'Details restricted by participant privacy settings.',
        transcript: null,
        sentiment: null,
        analysis: null,
      };
    }
    return conn;
  }));

  let analyticsData: AnalyticsSnapshot[] = [];
  let relationships: Relationship[] = [];
  let teamMembers: TeamMember[] = [];

  if (isPrivileged && team) {
    analyticsData = await getAnalyticsData(team.id);
    relationships = await getRelationships(team.id);
    teamMembers = team.teamMembers;
  }

  return (
    <div className="space-y-8">
      {isPrivileged && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Team Analytics</h2>
            <RangeSelector />
          </div>
          <AnalyticsSummary
            analyticsData={serializeFirestoreData(analyticsData)}
          />
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Connection Network</h2>
        <ConnectionsGraph dateLimit={dateLimit} />
      </section>

      <section>
        <Connections connections={serializeFirestoreData(processedConnections)} currentUserId={user.id} />
      </section>
    </div>
  );

}

export default function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      <Suspense fallback={<div className="flex justify-center items-center p-12"><Loader2 className="animate-spin h-8 w-8 text-orange-500" /></div>}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
