'use client';

import { useState, useEffect, Suspense, useActionState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { subscribeToTeamInvitations, revokeInvitation, Invitation } from '@/lib/firebase/firestore';
import { Loader2, Mail, CheckCircle, Clock, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InviteMemberDialog } from '@/components/invite-member-dialog';
import useSWR from 'swr';
import { TeamDataWithMembers, User } from '@/types/firestore';
import { removeTeamMember } from '@/app/(login)/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type ActionState = {
    error?: string;
    success?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function TeamMembersSkeleton() {
    return (
        <Card className="mb-8 h-[140px]">
            <CardHeader>
                <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="animate-pulse space-y-4 mt-1">
                    <div className="flex items-center space-x-4">
                        <div className="size-8 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="h-3 w-14 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TeamMembers() {
    const { data: teamData, isLoading } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
    const [removeState, removeAction, isRemovePending] = useActionState<ActionState, FormData>(removeTeamMember, {});

    const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
        return user.name || user.email || 'Unknown User';
    };

    if (isLoading) {
        return <TeamMembersSkeleton />;
    }

    if (!teamData?.teamMembers?.length) {
        return (
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No team members yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {teamData.teamMembers.map((member, index) => (
                        <li key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Avatar>
                                    <AvatarFallback>
                                        {getUserDisplayName(member.user)
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">
                                        {getUserDisplayName(member.user)}
                                    </p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {member.role}
                                    </p>
                                </div>
                            </div>
                            {/* Only allow removing members that are not owners */}
                            {member.role !== 'owner' ? (
                                <form action={removeAction}>
                                    <input type="hidden" name="memberId" value={member.id} />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        size="sm"
                                        disabled={isRemovePending}
                                    >
                                        {isRemovePending ? 'Removing...' : 'Remove'}
                                    </Button>
                                </form>
                            ) : null}
                        </li>
                    ))}
                </ul>
                {removeState?.error && (
                    <p className="text-red-500 mt-4">{removeState.error}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function TeamPage() {
    const { user, userData } = useAuth();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: () => void;

        if (userData?.teamId) {
            unsubscribe = subscribeToTeamInvitations(userData.teamId, (invites) => {
                setInvitations(invites);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [userData?.teamId]);

    const handleRevoke = async (inviteId: string) => {
        if (confirm('Are you sure you want to revoke this invitation?')) {
            try {
                await revokeInvitation(inviteId);
                // No need to refresh manually, subscription will handle it
            } catch (error) {
                console.error('Error revoking invitation:', error);
                alert('Failed to revoke invitation');
            }
        }
    };

    const handleResend = async (inviteId: string) => {
        try {
            const res = await fetch(`/api/invite/${inviteId}/resend`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Invitation resent successfully');
            } else {
                toast.error(data.message || 'Failed to resend invitation');
            }
        } catch (error) {
            console.error('Error resending invitation:', error);
            toast.error('An unexpected error occurred');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
            </div>
        );
    }

    return (
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your team members and invitations.
                        </p>
                    </div>
                    {userData?.teamId && userData?.accountId && user?.uid && (
                        <InviteMemberDialog
                            teamId={userData.teamId}
                            accountId={userData.accountId}
                            invitedBy={user.uid}
                        />
                    )}
                </div>

                <Suspense fallback={<TeamMembersSkeleton />}>
                    <TeamMembers />
                </Suspense>

                <Card>
                    <CardHeader>
                        <CardTitle>Invitations</CardTitle>
                        <CardDescription>
                            List of users invited to your team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invitations.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                No invitations found.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Sent At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invite) => (
                                        <TableRow key={invite.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center">
                                                    <Mail className="mr-2 h-4 w-4 text-gray-400" />
                                                    {invite.email}
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{invite.role}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        invite.status === 'accepted'
                                                            ? 'default'
                                                            : invite.status === 'pending'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                    className={
                                                        invite.status === 'accepted'
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            : invite.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                                : ''
                                                    }
                                                >
                                                    {invite.status === 'accepted' && <CheckCircle className="mr-1 h-3 w-3" />}
                                                    {invite.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                                                    {invite.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500">
                                                {invite.createdAt?.toDate().toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {invite.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleResend(invite.id)}
                                                            title="Resend Invite"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                            <span className="sr-only">Resend Invite</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleRevoke(invite.id)}
                                                            title="Revoke Invite"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Revoke</span>
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
