"use client";

import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConnectionWithParticipants } from "@/types/firestore";
import { Video, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
                                <TableHead className="text-right">Actions</TableHead>
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
                                    <TableCell className={`max-w-[300px] truncate ${connection.summary === 'Details restricted by participant privacy settings.' ? 'italic text-muted-foreground' : ''}`} title={connection.summary || ''}>
                                        {connection.summary || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/connect/${connection.id}`} className="flex items-center">
                                                        <Video className="mr-2 h-4 w-4" />
                                                        <span>{upcomingStatuses.includes(connection.status) ? 'Connect Now' : 'Reconnect'}</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
