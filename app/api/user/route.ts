import { getUser } from '@/lib/firestore/admin/queries';

export async function GET() {
  console.log('GET /api/user');
  const user = await getUser();
  return Response.json(user);
}
