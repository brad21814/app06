"use client";

import React from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Connection } from "@/types/firestore";

interface ConnectionHistoryProps {
    connections: Connection[];
    currentUserId: string;
}

export function ConnectionHistory({ connections, currentUserId }: ConnectionHistoryProps) {
    if (connections.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Connection History</CardTitle>
                    <CardDescription>Your past connections.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">No connections found yet.</p>
                </CardContent>
            </Card>
        );
    }

    const getDate = (val: any) => {
        if (!val) return new Date();
        if (typeof val === 'number') return new Date(val);
        if (typeof val.toDate === 'function') return val.toDate();
        return new Date(val);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Connection History</CardTitle>
                <CardDescription>Review your past connections and conversations.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sentiment</TableHead>
                            <TableHead>Summary</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {connections.map((connection: any) => (
                            <TableRow key={connection.id}>
                                <TableCell className="font-medium">
                                    {format(getDate(connection.createdAt), "MMM d, yyyy h:mm a")}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={connection.status === 'completed' ? 'default' : 'secondary'}>
                                        {connection.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {connection.sentiment !== undefined && connection.sentiment !== null ? (
                                        <Badge variant={connection.sentiment > 75 ? "default" : "outline"}>
                                            {connection.sentiment.toFixed(1)}
                                        </Badge>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate" title={connection.summary || ''}>
                                    {connection.summary || '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
