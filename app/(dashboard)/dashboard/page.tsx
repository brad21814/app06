import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  getUser, 
  getTeamForUser, 
  getUserConnections, 
  getAnalyticsData, 
  getRelationships, 
  getAccountConnections, 
  checkConnectionVisibility,
  getAccountUsers
} from '@/lib/firestore/admin/queries';
import { AnalyticsSnapshot, Relationship, TeamMember, ConnectionWithParticipants, User } from '@/types/firestore';
import { Connections } from '@/components/dashboard/connections';
import { AnalyticsSummary } from '@/components/analytics/analytics-summary';
import { ConnectionsGraph } from '@/components/dashboard/connections-graph';
import { RangeSelector } from '@/components/dashboard/range-selector';
import { DashboardFilter } from '@/components/dashboard/dashboard-filter';
import { serializeFirestoreData } from '@/lib/utils';

// Separate component for async data fetching to keep page clean
async function DashboardContent({ searchParams }: { searchParams: Promise<{ range?: string, view?: string, userId?: string }> }) {
  const user = await getUser();
  if (!user) return null;

  const params = await searchParams;
  const range = params.range || '90';
  const view = params.view || 'account';
  const targetUserId = params.userId;
  
  const dateLimit = range === 'all' ? undefined : new Date();
  if (dateLimit && range !== 'all') {
    dateLimit.setDate(dateLimit.getDate() - parseInt(range));
  }

  const team = await getTeamForUser();
  const isPrivileged = user.role === 'owner' || user.role === 'admin' || user.role === 'account_admin';
  
  // Security check: only privileged users can change view
  const resolvedView = isPrivileged ? view : 'personal';
  const resolvedTargetId = resolvedView === 'user' ? targetUserId : user.id;

  let connections: ConnectionWithParticipants[] = [];
  let accountUsers: User[] = [];

  if (isPrivileged && user.accountId) {
    accountUsers = await getAccountUsers(user.accountId);
  }

  if (resolvedView === 'account' && user.accountId) {
    connections = await getAccountConnections(user.accountId, dateLimit);
  } else if (resolvedTargetId) {
    connections = await getUserConnections(resolvedTargetId);
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Filters</h2>
            <div className="flex flex-wrap items-center gap-2">
              <DashboardFilter users={serializeFirestoreData(accountUsers)} currentUserId={user.id} />
              <RangeSelector />
            </div>
          </div>
        </section>
      )}

      {resolvedView === 'account' && isPrivileged && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Team Analytics</h2>
          <AnalyticsSummary
            analyticsData={serializeFirestoreData(analyticsData)}
          />
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Connection Network</h2>
        <ConnectionsGraph dateLimit={dateLimit} view={resolvedView} targetUserId={resolvedTargetId} />
      </section>

      <section>
        <Connections connections={serializeFirestoreData(processedConnections)} currentUserId={user.id} />
      </section>
    </div>
  );

}

export default function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string, view?: string, userId?: string }> }) {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      <Suspense fallback={<div className="flex justify-center items-center p-12"><Loader2 className="animate-spin h-8 w-8 text-orange-500" /></div>}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
