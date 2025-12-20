'use client';

import { useState, useEffect } from 'react';
import { Schedule, Team, Theme, Connection } from '@/types/firestore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Edit2, Trash, Calendar, Loader2 } from 'lucide-react';
import { format, subWeeks, subMonths } from 'date-fns';
import { query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { getConnectionsCollection } from '@/lib/firestore/client/collections';

interface ActiveScheduleCardProps {
    schedule: Schedule;
    team?: Team;
    theme?: Theme;
    onToggleStatus: (schedule: Schedule) => void;
    onEdit: (schedule: Schedule) => void;
    onDelete: (schedule: Schedule) => void;
}

export function ActiveScheduleCard({
    schedule,
    team,
    theme,
    onToggleStatus,
    onEdit,
    onDelete
}: ActiveScheduleCardProps) {
    const [stats, setStats] = useState({
        invitesSent: 0,
        scheduled: 0,
        completed: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Calculate Window
    const nextRunDate = schedule.nextRunAt.toDate();
    let windowStartDate = new Date(nextRunDate);

    if (schedule.frequency === 'weekly') {
        windowStartDate = subWeeks(nextRunDate, 1);
    } else if (schedule.frequency === 'bi-weekly') {
        windowStartDate = subWeeks(nextRunDate, 2);
    } else if (schedule.frequency === 'monthly') {
        windowStartDate = subMonths(nextRunDate, 1);
    }

    // Format Dates
    const dateWindowStr = `${format(windowStartDate, 'MMM dd')} - ${format(nextRunDate, 'MMM dd')}`;

    useEffect(() => {
        // Query connections for this schedule within the calculated window
        // We look for connections created AFTER the window start date
        const connectionsQuery = query(
            getConnectionsCollection(),
            where('scheduleId', '==', schedule.id),
            where('createdAt', '>=', Timestamp.fromDate(windowStartDate))
        );

        const unsubscribe = onSnapshot(connectionsQuery, (snapshot) => {
            let invites = 0;
            let scheduledCount = 0;
            let completedCount = 0;

            snapshot.forEach((doc) => {
                const data = doc.data() as Connection;
                invites++; // Assuming every connection record counts as an invite sent pair

                if (['scheduled', 'completed'].includes(data.status)) {
                    scheduledCount++;
                }
                if (data.status === 'completed') {
                    completedCount++;
                }
            });

            setStats({
                invitesSent: invites,
                scheduled: scheduledCount,
                completed: completedCount
            });
            setLoadingStats(false);
        }, (error) => {
            console.error("Error fetching connection stats:", error);
            setLoadingStats(false);
        });

        return () => unsubscribe();
    }, [schedule.id, windowStartDate.toISOString()]);

    return (
        <Card className="p-4 space-y-4">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-lg">{schedule.name}</h4>
                        <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                            {schedule.status}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                        Team: <span className="font-medium text-gray-700">{team?.name || 'Unknown'}</span> •
                        Theme: <span className="font-medium text-gray-700">{theme?.name || 'Unknown'}</span>
                    </p>
                    <div className="flex items-center text-sm text-gray-500 gap-4 mt-1">
                        <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {dateWindowStr}
                        </span>
                        <span>
                            {schedule.frequency} • {schedule.duration} mins • {schedule.participantsPerMatch} people
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onToggleStatus(schedule)}
                        title={schedule.status === 'active' ? "Pause Schedule" : "Resume Schedule"}
                    >
                        {schedule.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(schedule)} title="Edit Schedule">
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(schedule)}
                        title="Delete Schedule"
                    >
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center p-3 rounded bg-gray-50/50 flex flex-col justify-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Current Window</div>
                    <div className="text-sm font-medium text-gray-900 leading-tight">{dateWindowStr}</div>
                </div>
                <div className="text-center p-3 rounded bg-gray-50/50">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Invites Sent</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {loadingStats ? <Loader2 className="w-4 h-4 animate-spin inline" /> : stats.invitesSent}
                    </div>
                </div>
                <div className="text-center p-3 rounded bg-gray-50/50">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Scheduled</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {loadingStats ? <Loader2 className="w-4 h-4 animate-spin inline" /> : stats.scheduled}
                    </div>
                </div>
                <div className="text-center p-3 rounded bg-gray-50/50">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Completed</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {loadingStats ? <Loader2 className="w-4 h-4 animate-spin inline" /> : stats.completed}
                    </div>
                </div>
            </div>
            {/* The user requested 3 stats: Invites Sent, Scheduled, Completed. Plus Date Interval.
                 I put the date interval in the grid too, or I can put the 4th item 'Completed' in the grid.
                 Let's do 4 columns or just add Completed line.
                 User Request: "For each card we want to list the current date connection window and how many invites sent, how many inviutes have been scheduled and how many connections have been completed."
                 
                 Revised Grid:
                 Col 1: Window (already in header? No, request says "list the current date connection window". I put it in header and grid. A bit redundant. Maybe remove from header and keep in grid as specific item?)
                 Col 2: Invites
                 Col 3: Scheduled
                 Col 4: Completed
              */}
        </Card>
    );
}
