import { getUserStats, getUser } from '@/lib/firestore/admin/queries';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const user = await getUser();
    if (!user || (user.role !== 'owner' && user.role !== 'admin' && user.role !== 'account_admin')) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { userId } = await params;
    
    try {
        const stats = await getUserStats(userId);
        
        // Ensure the requested user belongs to the same account
        if (stats.user.accountId !== user.accountId) {
            return new Response('Forbidden', { status: 403 });
        }

        return Response.json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return new Response('User not found', { status: 404 });
    }
}
