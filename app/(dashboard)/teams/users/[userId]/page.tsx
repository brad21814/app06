'use client';

import { use, useEffect, useState } from 'react';
import useSWR from 'swr';
import { 
    Loader2, 
    ArrowLeft, 
    Calendar, 
    MessageSquare, 
    TrendingUp, 
    User as UserIcon,
    Shield,
    HeartPulse
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { User, ConnectionWithParticipants } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { UserHealthChart } from '@/components/dashboard/user-health-chart';
import { Connections } from '@/components/dashboard/connections';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getDate = (val: any) => {
    if (!val) return null;
    try {
        if (typeof val === 'number') return new Date(val);
        if (typeof val.toDate === 'function') return val.toDate();
        if (val._seconds !== undefined) return new Date(val._seconds * 1000);
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) {
        return null;
    }
};

const formatDateSafe = (dateVal: any, formatStr: string) => {
    const d = getDate(dateVal);
    if (!d) return 'N/A';
    try {
        return format(d, formatStr);
    } catch (e) {
        return 'N/A';
    }
};

export default function UserDrilldownPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params);
    const { data: stats, isLoading, error } = useSWR<{
        user: User;
        connections: ConnectionWithParticipants[];
    }>(`/api/account/users/${userId}`, fetcher);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-lg font-medium text-gray-900">User not found or access denied</p>
                <Button asChild>
                    <Link href="/teams/users">Back to List</Link>
                </Button>
            </div>
        );
    }

    const { user, connections } = stats;

    const sentimentData = (connections || [])
        .filter(c => c.status === 'completed' && c.sentiment !== undefined && c.sentiment !== null)
        .map(c => ({
            date: getDate(c.createdAt) || new Date(),
            sentiment: c.sentiment as number
        }));

    return (
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center space-x-4">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/teams/users">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <UserAvatar user={user} className="h-20 w-20 border-2 border-muted shadow-sm" fallbackClassName="text-2xl" />
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{user.name || 'N/A'}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                            <div className="flex items-center mt-2 space-x-2">
                                <Badge variant="secondary" className="capitalize">
                                    <Shield className="mr-1.5 h-3 w-3" />
                                    {user.role}
                                </Badge>
                                <Badge variant="outline">
                                    {user.privacyTier || 'TIER_1_STANDARD'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
                        <Card className="bg-orange-50/50 border-orange-100">
                            <CardContent className="p-4 flex flex-col items-center justify-center">
                                <HeartPulse className="h-5 w-5 text-orange-500 mb-1" />
                                <span className="text-2xl font-bold">{user.stats?.averageSentiment?.toFixed(1) || '0.0'}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Avg Sentiment</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50/50 border-blue-100">
                            <CardContent className="p-4 flex flex-col items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-blue-500 mb-1" />
                                <span className="text-2xl font-bold">{user.stats?.totalConnections || 0}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Total Connections</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50/50 border-green-100 hidden sm:flex">
                            <CardContent className="p-4 flex flex-col items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-500 mb-1" />
                                <span className="text-sm font-bold">
                                    {user.stats?.lastConnectedAt 
                                        ? formatDateSafe(user.stats.lastConnectedAt, 'MMM d')
                                        : 'N/A'
                                    }
                                </span>
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Last Active</span>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-1">
                    <UserHealthChart data={sentimentData} />
                </div>

                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        <h2 className="text-2xl font-bold tracking-tight">Recent Connections</h2>
                    </div>
                    <Connections 
                        connections={connections} 
                        currentUserId={userId} 
                    />
                </section>
            </div>
        </main>
    );
}
