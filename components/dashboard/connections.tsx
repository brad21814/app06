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
import { ConnectionWithParticipants } from "@/types/firestore";

interface ConnectionsProps {
    connections: ConnectionWithParticipants[];
    currentUserId: string;
}

export function Connections({ connections, currentUserId }: ConnectionsProps) {
    const getDate = (val: any) => {
        if (!val) return new Date();
        if (typeof val === 'number') return new Date(val);
        if (typeof val.toDate === 'function') return val.toDate();
        return new Date(val);
    };

    const getParticipantName = (connection: ConnectionWithParticipants) => {
        const isProposer = connection.proposerId === currentUserId;
        const isConfirmer = connection.confirmerId === currentUserId;

        if (isProposer) {
            return connection.confirmer?.name || connection.confirmer?.email || 'Unknown';
        }
        if (isConfirmer) {
            return connection.proposer?.name || connection.proposer?.email || 'Unknown';
        }
        // Admin or third party view
        const pName = connection.proposer?.name || connection.proposer?.email || 'Unknown';
        const cName = connection.confirmer?.name || connection.confirmer?.email || 'Unknown';
        return `${pName} & ${cName}`;
    };

    const upcomingStatuses = ['scheduling', 'proposed', 'scheduled'];
    const upcomingConnections = connections.filter(c => upcomingStatuses.includes(c.status));
    const pastConnections = connections.filter(c => !upcomingStatuses.includes(c.status));

    const ConnectionTable = ({ data, title, description }: { data: ConnectionWithParticipants[], title: string, description: string }) => (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No connections found.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Participants</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sentiment</TableHead>
                                <TableHead>Summary</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((connection: any) => (
                                <TableRow key={connection.id}>
                                    <TableCell className="font-medium">
                                        {format(getDate(connection.createdAt), "MMM d, yyyy h:mm a")}
                                    </TableCell>
                                    <TableCell>
                                        {getParticipantName(connection)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={connection.status === 'completed' ? 'default' : 'secondary'}>
                                            {connection.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {connection.sentiment !== undefined && connection.sentiment !== null ? (
                                            <Badge variant={connection.sentiment > 75 ? "default" : "outline"}>
                                                {typeof connection.sentiment === 'number' ? connection.sentiment.toFixed(1) : connection.sentiment}
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
                )}
            </CardContent>
        </Card>
    );

    return (
        <div>
            {upcomingConnections.length > 0 && (
                <ConnectionTable
                    data={upcomingConnections}
                    title="Upcoming & Pending"
                    description="Scheduled and pending connections."
                />
            )}
            <ConnectionTable
                data={pastConnections}
                title="History"
                description="Your past connections and conversations."
            />
        </div>
    );
}
