'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Users, ArrowUpDown, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/types/firestore';

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

export default function UserListPage() {
    const { data: users, isLoading, error } = useSWR<User[]>('/api/account/users', fetcher);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = users ? [...users].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue: any = a[key as keyof User];
        let bValue: any = b[key as keyof User];

        if (key === 'lastConnected') {
            aValue = getDate(a.stats?.lastConnectedAt)?.getTime() || 0;
            bValue = getDate(b.stats?.lastConnectedAt)?.getTime() || 0;
        } else if (key === 'totalConnections') {
            aValue = a.stats?.totalConnections || 0;
            bValue = b.stats?.totalConnections || 0;
        } else if (key === 'averageSentiment') {
            aValue = a.stats?.averageSentiment || 0;
            bValue = b.stats?.averageSentiment || 0;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    }) : [];

    const isAtRisk = (user: User) => {
        const total = user.stats?.totalConnections || 0;
        const sentiment = user.stats?.averageSentiment || 0;
        return total === 0 || (total > 0 && sentiment < 60);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-medium text-gray-900">Failed to load users</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Organization Users</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Monitor relationship health and engagement across your account.
                        </p>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                        <Users className="mr-2 h-4 w-4" />
                        {users?.length || 0} Total Users
                    </Badge>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>
                            All members registered under your organization account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('lastConnected')}>
                                            <div className="flex items-center">
                                                Last Connected
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('totalConnections')}>
                                            <div className="flex items-center">
                                                Connections
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('averageSentiment')}>
                                            <div className="flex items-center">
                                                Avg Sentiment
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedUsers.map((user) => (
                                        <TableRow key={user.id} className={isAtRisk(user) ? 'bg-red-50/30' : ''}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>
                                                            {user.name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">{user.name || 'N/A'}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                    {isAtRisk(user) && (
                                                        <Badge variant="destructive" className="h-5 text-[10px] px-1.5 py-0">
                                                            At Risk
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize text-sm">{user.role}</TableCell>
                                            <TableCell className="text-sm">
                                                {user.stats?.lastConnectedAt 
                                                    ? format(getDate(user.stats.lastConnectedAt)!, 'MMM d, yyyy')
                                                    : <span className="text-muted-foreground italic text-xs">Never</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {user.stats?.totalConnections || 0}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={
                                                        (user.stats?.averageSentiment || 0) > 80 ? 'default' : 
                                                        (user.stats?.averageSentiment || 0) > 60 ? 'secondary' : 
                                                        'destructive'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {user.stats?.averageSentiment?.toFixed(1) || '0.0'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/teams/users/${user.id}`}>
                                                        View Details
                                                        <ChevronRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
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
