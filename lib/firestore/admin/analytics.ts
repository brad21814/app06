import { Connection, AnalyticsSnapshot } from "@/types/firestore";
import { Timestamp } from "firebase-admin/firestore";

export function calculateUserAnalytics(
    userId: string,
    connections: Connection[]
): AnalyticsSnapshot[] {
    const monthlyData: Record<string, {
        total: number;
        sumSentiment: number;
        countSentiment: number;
    }> = {};

    connections.forEach(conn => {
        if (conn.status !== 'completed') return;

        const date = conn.createdAt instanceof Timestamp ? conn.createdAt.toDate() : new Date(conn.createdAt as any);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[month]) {
            monthlyData[month] = { total: 0, sumSentiment: 0, countSentiment: 0 };
        }

        monthlyData[month].total += 1;
        if (conn.sentiment) {
            monthlyData[month].sumSentiment += conn.sentiment;
            monthlyData[month].countSentiment += 1;
        }
    });

    const snapshots: AnalyticsSnapshot[] = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
            id: `user_${userId}_${month}`,
            entityType: 'account', // We reuse the type for the chart component
            entityId: userId,
            period: month,
            totalConnections: data.total,
            completedConnections: data.total,
            avgSentiment: data.countSentiment > 0 ? data.sumSentiment / data.countSentiment : 0,
            participationRate: 1, // Individual user participation is 100% by definition if they have connections
            relationshipDensity: 0,
            topTopics: [],
            updatedAt: Timestamp.now() as any
        }));

    return snapshots;
}
