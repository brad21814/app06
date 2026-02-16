"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsSnapshot } from "@/types/firestore";

interface AnalyticsSummaryProps {
    analyticsData: AnalyticsSnapshot[];
}

export function AnalyticsSummary({ analyticsData }: AnalyticsSummaryProps) {
    // Sort data by period
    const sortedData = [...analyticsData].sort((a, b) => a.period.localeCompare(b.period));

    // Calculate current/latest stats
    const latest = sortedData[sortedData.length - 1] || {
        avgSentiment: 0,
        participationRate: 0,
        completedConnections: 0,
        relationshipDensity: 0
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{latest.avgSentiment?.toFixed(1) || '0.0'}</div>
                    <p className="text-xs text-muted-foreground">Based on last period</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{((latest.participationRate || 0) * 100).toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground">Across all teams</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Connections</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{latest.completedConnections || 0}</div>
                    <p className="text-xs text-muted-foreground">Total completed this period</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Density</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{((latest.relationshipDensity || 0) * 100).toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground">Network interconnectedness</p>
                </CardContent>
            </Card>
        </div>
    );
}
