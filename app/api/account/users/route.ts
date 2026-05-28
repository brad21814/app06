import { getAccountUsers, getUser } from '@/lib/firestore/admin/queries';
import { serializeFirestoreData } from '@/lib/utils';

export async function GET() {
  const user = await getUser();
  if (!user || (user.role !== 'owner' && user.role !== 'admin' && user.role !== 'account_admin')) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!user.accountId) {
    return new Response('Account not found', { status: 400 });
  }

  const users = await getAccountUsers(user.accountId);
  return Response.json(serializeFirestoreData(users));
}
