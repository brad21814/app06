'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface HealthDataPoint {
    date: Date;
    sentiment: number;
}

interface UserHealthChartProps {
    data: HealthDataPoint[];
}

export function UserHealthChart({ data }: UserHealthChartProps) {
    const chartData = data
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((d) => ({
            name: format(d.date, 'MMM d'),
            sentiment: d.sentiment,
        }));

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>
                    Individual sentiment score over the last 90 days.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#888888' }}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}
                            itemStyle={{ color: '#f97316' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="sentiment"
                            stroke="#f97316"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#f97316' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
