'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import {
    getSchedulesCollection,
    getTeamsCollection,
    getThemesCollection
} from '@/lib/firestore/client/collections';
import { getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { Schedule, Team, Theme } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
    SelectSeparator
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Plus, Edit2, Trash, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { ActiveScheduleCard } from './active-schedule-card';

interface ScheduleFormProps {
    formData: {
        name: string;
        teamId: string;
        themeId: string;
        frequency: 'weekly' | 'bi-weekly' | 'monthly';
        start_day: string;
        duration: number;
        participantsPerMatch: number;
        minDiscussionTime: number;
        maxDiscussionTime: number;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        name: string;
        teamId: string;
        themeId: string;
        frequency: 'weekly' | 'bi-weekly' | 'monthly';
        start_day: string;
        duration: number;
        participantsPerMatch: number;
        minDiscussionTime: number;
        maxDiscussionTime: number;
    }>>;
    teams: Team[];
    themes: Theme[];
    systemThemes: Theme[];
}

function ScheduleForm({ formData, setFormData, teams, themes, systemThemes }: ScheduleFormProps) {
    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Schedule Name</Label>
                <Input
                    placeholder="e.g. Weekly Coffee Chat"
                    value={formData.name}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label>Team</Label>
                <Select
                    value={formData.teamId}
                    onValueChange={(v) => setFormData((prev: any) => ({ ...prev, teamId: v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                        {teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                    value={formData.themeId}
                    onValueChange={(v) => setFormData((prev: any) => ({ ...prev, themeId: v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>System Themes</SelectLabel>
                            {systemThemes.map(theme => (
                                <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>
                            ))}
                        </SelectGroup>
                        {themes.length > 0 && (
                            <>
                                <SelectSeparator />
                                <SelectGroup>
                                    <SelectLabel>Your Themes</SelectLabel>
                                    {themes.map(theme => (
                                        <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                        value={formData.frequency}
                        onValueChange={(v: any) => setFormData((prev: any) => ({ ...prev, frequency: v }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Start Day</Label>
                    <Select
                        value={formData.start_day}
                        onValueChange={(v) => setFormData((prev: any) => ({ ...prev, start_day: v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Day" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Monday">Monday</SelectItem>
                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                            <SelectItem value="Thursday">Thursday</SelectItem>
                            <SelectItem value="Friday">Friday</SelectItem>
                            <SelectItem value="Saturday">Saturday</SelectItem>
                            <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Duration (Minutes)</Label>
                    <Select
                        value={String(formData.duration)}
                        onValueChange={(v) => setFormData((prev: any) => ({ ...prev, duration: parseInt(v) }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15">15 mins</SelectItem>
                            <SelectItem value="30">30 mins</SelectItem>
                            <SelectItem value="45">45 mins</SelectItem>
                            <SelectItem value="60">60 mins</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Participants per Group</Label>
                    <Input
                        type="number"
                        min="2"
                        value={formData.participantsPerMatch}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, participantsPerMatch: parseInt(e.target.value) }))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Min Question Time (Mins)</Label>
                    <Input
                        type="number"
                        min="1"
                        value={formData.minDiscussionTime}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, minDiscussionTime: parseInt(e.target.value) || 1 }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Max Question Time (Mins)</Label>
                    <Input
                        type="number"
                        min="1"
                        value={formData.maxDiscussionTime}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, maxDiscussionTime: parseInt(e.target.value) || 1 }))}
                    />
                </div>
            </div>
        </div>
    );
}

export function ScheduleManager() {
    const { user, userData } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [systemThemes, setSystemThemes] = useState<Theme[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        teamId: '',
        themeId: '',
        frequency: 'bi-weekly' as 'weekly' | 'bi-weekly' | 'monthly',
        start_day: 'Monday',
        duration: 30,
        participantsPerMatch: 2,
        minDiscussionTime: 1, // minutes
        maxDiscussionTime: 3  // minutes
    });

    useEffect(() => {
        if (!userData?.accountId) {
            setLoading(false);
            return;
        }

        const themesQuery = query(getThemesCollection(), where('accountId', '==', userData.accountId));
        const systemThemesQuery = query(getThemesCollection(), where('accountId', '==', null));
        const teamsQuery = query(getTeamsCollection(), where('accountId', '==', userData.accountId));
        const schedulesQuery = query(getSchedulesCollection(), where('accountId', '==', userData.accountId));

        const unsubThemes = onSnapshot(themesQuery, (snapshot) => {
            setThemes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Theme)));
        });

        const unsubSystemThemes = onSnapshot(systemThemesQuery, (snapshot) => {
            setSystemThemes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Theme)));
        });

        const unsubTeams = onSnapshot(teamsQuery, (snapshot) => {
            setTeams(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Team)));
        });

        const unsubSchedules = onSnapshot(schedulesQuery, (snapshot) => {
            setSchedules(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Schedule)));
            setLoading(false); // Set loading false after schedules load (primary data)
        }, (error) => {
            console.error("Error fetching schedules:", error);
            setLoading(false);
        });

        return () => {
            unsubThemes();
            unsubSystemThemes();
            unsubTeams();
            unsubSchedules();
        };
    }, [userData?.accountId]);

    const resetForm = () => {
        setFormData({ name: '', teamId: '', themeId: '', frequency: 'bi-weekly', start_day: 'Monday', duration: 30, participantsPerMatch: 2, minDiscussionTime: 1, maxDiscussionTime: 3 });
        setSelectedSchedule(null);
    };

    const openEditDialog = (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setFormData({
            name: schedule.name,
            teamId: schedule.teamId,
            themeId: schedule.themeId,
            frequency: schedule.frequency,
            start_day: schedule.start_day || 'Monday',
            duration: schedule.duration,
            participantsPerMatch: schedule.participantsPerMatch,
            minDiscussionTime: schedule.minTimePerQuestion ? Math.round(schedule.minTimePerQuestion / 60) : 1,
            maxDiscussionTime: schedule.maxTimePerQuestion ? Math.round(schedule.maxTimePerQuestion / 60) : 3,
        });
        setIsEditOpen(true);
    };

    const openDeleteDialog = (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setIsDeleteOpen(true);
    };

    const handleCreateSchedule = async () => {
        if (!formData.name || !formData.teamId || !formData.themeId || !userData?.accountId) return;
        setActionLoading(true);

        try {
            const newSchedule: Omit<Schedule, 'id'> = {
                accountId: userData.accountId,
                name: formData.name,
                teamId: formData.teamId,
                themeId: formData.themeId,
                frequency: formData.frequency,
                start_day: formData.start_day,
                duration: formData.duration,
                participantsPerMatch: formData.participantsPerMatch,
                minTimePerQuestion: formData.minDiscussionTime * 60,
                maxTimePerQuestion: formData.maxDiscussionTime * 60,
                status: 'active',
                nextRunAt: Timestamp.now(),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            const docRef = await addDoc(getSchedulesCollection(), newSchedule as any);
            setSchedules([...schedules, { ...newSchedule, id: docRef.id } as Schedule]);
            setIsCreateOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error creating schedule:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSchedule = async () => {
        if (!selectedSchedule || !formData.name || !formData.teamId || !formData.themeId) return;
        setActionLoading(true);

        try {
            const scheduleRef = doc(getSchedulesCollection(), selectedSchedule.id);
            const updates = {
                name: formData.name,
                teamId: formData.teamId,
                themeId: formData.themeId,
                frequency: formData.frequency,
                start_day: formData.start_day,
                duration: formData.duration,
                participantsPerMatch: formData.participantsPerMatch,
                minTimePerQuestion: formData.minDiscussionTime * 60,
                maxTimePerQuestion: formData.maxDiscussionTime * 60,
                updatedAt: Timestamp.now()
            };

            await updateDoc(scheduleRef, updates);

            setSchedules(schedules.map(s =>
                s.id === selectedSchedule.id ? { ...s, ...updates } : s
            ));
            setIsEditOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error updating schedule:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSchedule = async () => {
        if (!selectedSchedule) return;
        setActionLoading(true);

        try {
            await deleteDoc(doc(getSchedulesCollection(), selectedSchedule.id));
            setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
            setIsDeleteOpen(false);
            setSelectedSchedule(null);
        } catch (error) {
            console.error("Error deleting schedule:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleStatus = async (schedule: Schedule) => {
        try {
            const newStatus = schedule.status === 'active' ? 'paused' : 'active';
            const scheduleRef = doc(getSchedulesCollection(), schedule.id);
            await updateDoc(scheduleRef, {
                status: newStatus,
                updatedAt: Timestamp.now()
            });

            setSchedules(schedules.map(s =>
                s.id === schedule.id ? { ...s, status: newStatus } : s
            ));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };



    if (loading) return (
        <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Active Schedules</h3>
                <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Schedule
                </Button>
            </div>

            <div className="grid gap-4">
                {schedules.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                        No schedules found. Create one to start connecting your team!
                    </div>
                )}
                {schedules.map(schedule => {
                    const theme = [...themes, ...systemThemes].find(t => t.id === schedule.themeId);
                    const team = teams.find(t => t.id === schedule.teamId);

                    return (
                        <ActiveScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            team={team}
                            theme={theme}
                            onToggleStatus={toggleStatus}
                            onEdit={openEditDialog}
                            onDelete={openDeleteDialog}
                        />
                    );
                })}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Schedule</DialogTitle>
                        <DialogDescription>Setup automated connection rules.</DialogDescription>
                    </DialogHeader>
                    <ScheduleForm formData={formData} setFormData={setFormData} teams={teams} themes={themes} systemThemes={systemThemes} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateSchedule} disabled={!formData.name || !formData.teamId || !formData.themeId || actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Schedule</DialogTitle>
                    </DialogHeader>
                    <ScheduleForm formData={formData} setFormData={setFormData} teams={teams} themes={themes} systemThemes={systemThemes} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateSchedule} disabled={!formData.name || !formData.teamId || !formData.themeId || actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Schedule?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this schedule?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteSchedule} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
