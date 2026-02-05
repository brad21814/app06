import { getTeamForUser, getUser } from '@/lib/firestore/admin/queries';

export async function GET() {
  console.log('GET /api/team');
  const user = await getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const team = await getTeamForUser();
  return Response.json(team);
}
