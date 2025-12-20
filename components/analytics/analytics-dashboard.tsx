"use client";

import React from "react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, BarChart, Bar, Legend
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsSnapshot } from "@/types/firestore";

interface AnalyticsDashboardProps {
    analyticsData: AnalyticsSnapshot[]; // Array of snapshots (e.g., monthly)
}

export function AnalyticsDashboard({ analyticsData }: AnalyticsDashboardProps) {
    // Sort data by period
    const sortedData = [...analyticsData].sort((a, b) => a.period.localeCompare(b.period));

    // Transform for charts
    const chartData = sortedData.map(d => ({
        name: d.period,
        sentiment: d.avgSentiment,
        participation: d.participationRate * 100, // Convert to %
        connections: d.completedConnections
    }));

    // Calculate current/latest stats
    const latest = sortedData[sortedData.length - 1] || {
        avgSentiment: 0,
        participationRate: 0,
        completedConnections: 0,
        relationshipDensity: 0
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latest.avgSentiment.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">
                            Based on last period
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(latest.participationRate * 100).toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Across all teams
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Connections</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latest.completedConnections}</div>
                        <p className="text-xs text-muted-foreground">
                            Total completed this period
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Density</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(latest.relationshipDensity * 100).toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Network interconnectedness
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>The Vibe Check</CardTitle>
                        <CardDescription>
                            Average sentiment score over time.
                        </CardDescription>
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
                        <CardDescription>
                            Activity levels by period.
                        </CardDescription>
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
        </div>
    );
}
