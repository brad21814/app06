import { getUser } from '@/lib/firestore/admin/queries';

export async function GET() {
  const user = await getUser();
  return Response.json(user);
}
