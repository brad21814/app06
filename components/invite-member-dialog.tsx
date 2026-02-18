'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Upload, AlertCircle } from 'lucide-react';
import { getTeams, createTeam, Team } from '@/lib/firebase/firestore';
import { parseCSV, CSVMember } from '@/lib/csv';

interface InviteMemberDialogProps {
    teamId: string;
    accountId: string;
    invitedBy: string;
    onSuccess?: () => void;
}

export function InviteMemberDialog({ teamId, accountId, invitedBy, onSuccess }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('single');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);

    // Single Invite State
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([teamId]);
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    // Bulk Import State
    const [parsedMembers, setParsedMembers] = useState<CSVMember[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            loadTeams();
            setSelectedTeamIds([teamId]); // Reset to current team when opening
            setParsedMembers([]);
            setError(null);
            setSuccessMessage(null);
            setActiveTab('single');
        }
    }, [open, teamId]);

    async function loadTeams() {
        try {
            const fetchedTeams = await getTeams(accountId);
            setTeams(fetchedTeams);
        } catch (err) {
            console.error('Failed to load teams', err);
        }
    }

    const toggleTeam = (tId: string) => {
        setSelectedTeamIds(prev =>
            prev.includes(tId)
                ? prev.filter(aaa => aaa !== tId)
                : [...prev, tId]
        );
    };

    async function onSingleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const formData = new FormData(event.currentTarget);
        let finalTeamIds = [...selectedTeamIds];

        try {
            if (isCreatingTeam && newTeamName.trim()) {
                const newTeam = await createTeam(newTeamName, accountId);
                finalTeamIds.push(newTeam.id);
                // Refresh teams list
                loadTeams();
            }

            if (finalTeamIds.length === 0) {
                setError('Please select at least one team.');
                setIsLoading(false);
                return;
            }

            const response = await fetch('/api/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    role: formData.get('role'),
                    teamIds: finalTeamIds,
                    accountId,
                    invitedBy,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setOpen(false);
                setIsCreatingTeam(false);
                setNewTeamName('');
                if (onSuccess) onSuccess();
            } else {
                setError(result.message || 'Failed to send invitation');
            }
        } catch (e) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const members = parseCSV(text);
        setParsedMembers(members);
        setError(null);
    };

    const getTeamStatus = (teamName: string) => {
        const exists = teams.some(t => t.name.toLowerCase() === teamName.toLowerCase());
        return exists ? 'Existing' : 'New';
    };

    const processBatchInvite = async () => {
        if (parsedMembers.length === 0) return;
        setIsProcessing(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // 1. Identify and create new teams
            const allTeamNames = new Set<string>();
            parsedMembers.forEach(m => m.teams.forEach(t => allTeamNames.add(t)));

            const teamMap = new Map<string, string>(); // Name -> ID
            teams.forEach(t => teamMap.set(t.name.toLowerCase(), t.id));

            const newTeamsToCreate = Array.from(allTeamNames).filter(name => !teamMap.has(name.toLowerCase()));

            if (newTeamsToCreate.length > 0) {
                // Create teams in parallel
                await Promise.all(newTeamsToCreate.map(async (name) => {
                    try {
                        const newTeam = await createTeam(name, accountId);
                        teamMap.set(name.toLowerCase(), newTeam.id);
                    } catch (err) {
                        console.error(`Failed to create team: ${name}`, err);
                        // We continue, but this team won't be mapped
                    }
                }));
                // Refresh teams list for UI
                loadTeams();
            }

            // 2. Map members to team IDs
            // Find default team "Everyone", "All Members" or "General"
            const defaultTeamId = teams.find(t =>
                t.name.toLowerCase() === 'everyone' ||
                t.name.toLowerCase() === 'all members' ||
                t.name.toLowerCase() === 'general'
            )?.id;

            const payload = parsedMembers.map(m => {
                const memberTeamIds = m.teams
                    .map(t => teamMap.get(t.toLowerCase()) || '')
                    .filter(id => id !== '');

                // Ensure default team is added if found and not already present
                if (defaultTeamId && !memberTeamIds.includes(defaultTeamId)) {
                    memberTeamIds.push(defaultTeamId);
                }

                return {
                    email: m.email,
                    name: m.name,
                    role: m.role,
                    teamIds: memberTeamIds
                };
            });

            // 3. Send batch invite
            const response = await fetch('/api/invite/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invitations: payload,
                    accountId,
                    invitedBy
                })
            });

            const result = await response.json();

            if (result.success) {
                setSuccessMessage(`Successfully processed ${result.results.length} invitations.`);
                setTimeout(() => {
                    setOpen(false);
                    if (onSuccess) onSuccess();
                }, 2000);
            } else {
                setError(result.message || 'Batch invite failed');
            }

        } catch (err) {
            console.error(err);
            setError('An error occurred during batch processing');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Send an invitation to a new member or batch import via CSV.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="single">Single Invite</TabsTrigger>
                        <TabsTrigger value="bulk">Bulk Import (CSV)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="single">
                        <form onSubmit={onSingleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-right">Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="colleague@example.com" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="role" className="text-right">Role</Label>
                                    <Select name="role" defaultValue="member">
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right mt-2">Teams</Label>
                                    <div className="col-span-3 space-y-2">
                                        <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                                            {teams.map(team => (
                                                <div key={team.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`team-${team.id}`}
                                                        checked={selectedTeamIds.includes(team.id)}
                                                        onCheckedChange={() => toggleTeam(team.id)}
                                                    />
                                                    <label htmlFor={`team-${team.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {team.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingTeam(!isCreatingTeam)}>
                                                {isCreatingTeam ? 'Cancel' : 'Create New Team'}
                                            </Button>
                                        </div>
                                        {isCreatingTeam && (
                                            <Input
                                                placeholder="New Team Name"
                                                value={newTeamName}
                                                onChange={(e) => setNewTeamName(e.target.value)}
                                                className="mt-2"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? 'Sending...' : 'Send Invitation'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="bulk">
                        <div className="space-y-4 py-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="csv-upload">Upload CSV</Label>
                                <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} />
                                <p className="text-sm text-muted-foreground">Format: Name, Email, Role, Teams (pipe separated)</p>
                            </div>

                            {parsedMembers.length > 0 && (
                                <div className="border rounded-md max-h-[300px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Teams</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedMembers.map((member, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{member.name}</TableCell>
                                                    <TableCell>{member.email}</TableCell>
                                                    <TableCell className="capitalize">{member.role}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {member.teams.map((t, j) => (
                                                                <Badge key={j} variant={getTeamStatus(t) === 'New' ? "default" : "secondary"}>
                                                                    {t} {getTeamStatus(t) === 'New' && '(New)'}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            <DialogFooter>
                                <Button onClick={processBatchInvite} disabled={isProcessing || parsedMembers.length === 0}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isProcessing ? 'Processing...' : `Import ${parsedMembers.length} Members`}
                                </Button>
                            </DialogFooter>
                        </div>
                    </TabsContent>
                </Tabs>

                {error && (
                    <div className="text-sm text-red-500 text-center flex items-center justify-center gap-2">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}
                {successMessage && (
                    <div className="text-sm text-green-500 text-center">
                        {successMessage}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
