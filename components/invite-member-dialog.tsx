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
import { Plus, Loader2 } from 'lucide-react';
import { getTeams, createTeam, Team } from '@/lib/firebase/firestore';

interface InviteMemberDialogProps {
    teamId: string;
    accountId: string;
    invitedBy: string;
    onSuccess?: () => void;
}

export function InviteMemberDialog({ teamId, accountId, invitedBy, onSuccess }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([teamId]);
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    useEffect(() => {
        if (open) {
            loadTeams();
            setSelectedTeamIds([teamId]); // Reset to current team when opening
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

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        let finalTeamIds = [...selectedTeamIds];

        try {
            if (isCreatingTeam && newTeamName.trim()) {
                const newTeam = await createTeam(newTeamName, accountId);
                finalTeamIds.push(newTeam.id);
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Send an invitation to a new member to join your team(s).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="colleague@example.com"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                Role
                            </Label>
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
                            <Label className="text-right mt-2">
                                Teams
                            </Label>
                            <div className="col-span-3 space-y-2">
                                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                                    {teams.map(team => (
                                        <div key={team.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`team-${team.id}`}
                                                checked={selectedTeamIds.includes(team.id)}
                                                onCheckedChange={() => toggleTeam(team.id)}
                                            />
                                            <label
                                                htmlFor={`team-${team.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {team.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCreatingTeam(!isCreatingTeam)}
                                    >
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

                        {error && (
                            <div className="text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
