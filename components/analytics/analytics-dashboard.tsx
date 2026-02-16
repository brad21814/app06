"use client";

import React from "react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, BarChart, Bar, Legend
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnalyticsSnapshot, TeamMember, Relationship } from "@/types/firestore";
import { AnalyticsSummary } from "./analytics-summary";

interface AnalyticsDashboardProps {
    analyticsData: AnalyticsSnapshot[];
    teamMembers?: TeamMember[];
    relationships?: Relationship[];
}

export function AnalyticsDashboard({ analyticsData, teamMembers = [], relationships = [] }: AnalyticsDashboardProps) {
    // Sort data by period
    const sortedData = [...analyticsData].sort((a, b) => a.period.localeCompare(b.period));

    // Transform for charts
    const chartData = sortedData.map(d => ({
        name: d.period,
        sentiment: d.avgSentiment,
        participation: d.participationRate * 100, // Convert to %
        connections: d.completedConnections
    }));

    const getDate = (val: any) => {
        if (!val) return null;
        if (typeof val === 'number') return new Date(val);
        if (typeof val.toDate === 'function') return val.toDate();
        return new Date(val);
    };

    // Sort Members by Last Connected (Ascending - show inactive first)
    const sortedMembers = [...teamMembers].sort((a, b) => {
        const dateA = getDate(a.stats?.lastConnectedAt)?.getTime() || 0;
        const dateB = getDate(b.stats?.lastConnectedAt)?.getTime() || 0;
        return dateA - dateB;
    });

    // Sort Relationships by Strength (Descending)
    const topRelationships = [...relationships]
        .sort((a, b) => (b.strengthScore || 0) - (a.strengthScore || 0))
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <AnalyticsSummary analyticsData={analyticsData} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>The Vibe Check</CardTitle>
                        <CardDescription>Average sentiment score over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip />
                                <Line type="monotone" dataKey="sentiment" stroke="#adfa1d" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Participation Trend</CardTitle>
                        <CardDescription>Activity levels by period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                <Tooltip />
                                <Bar dataKey="participation" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Participation</CardTitle>
                        <CardDescription>Member activity stats.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Connections</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead>Avg Sentiment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedMembers.slice(0, 10).map((member: any) => (
                                    <TableRow key={member.userId}>
                                        <TableCell className="font-medium">{member.role || 'Member'}</TableCell>
                                        <TableCell>{member.stats?.totalConnections || 0}</TableCell>
                                        <TableCell>
                                            {member.stats?.lastConnectedAt
                                                ? format(getDate(member.stats.lastConnectedAt)!, 'MMM d, yyyy')
                                                : 'Never'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.stats?.averageSentiment && member.stats.averageSentiment > 75 ? "default" : "secondary"}>
                                                {member.stats?.averageSentiment?.toFixed(1) || '-'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Connections</CardTitle>
                        <CardDescription>Strongest relationships in the team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pair</TableHead>
                                    <TableHead>Strength</TableHead>
                                    <TableHead>Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topRelationships.length > 0 ? topRelationships.map((rel) => (
                                    <TableRow key={rel.id}>
                                        <TableCell className="font-medium">
                                            {/* Ideally we map IDs to Names, but for now showing ID snippet or 'Pair' */}
                                            Pair {rel.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{rel.strengthScore}</Badge>
                                        </TableCell>
                                        <TableCell>{rel.connectionCount}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">No relationships found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
