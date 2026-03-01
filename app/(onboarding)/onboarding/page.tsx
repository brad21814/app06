'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import {
    updateUser,
    createAccount,
    createTeam,
    addTeamMember,
    getInvitation,
    acceptInvitation,
    Invitation
} from '@/lib/firebase/firestore';
import { PrivacyTier } from '@/types/firestore';
import { PrivacySelectionForm } from '@/components/auth/privacy-selection-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, User, Building, Users, Plus, ArrowRight } from 'lucide-react';

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteId = searchParams.get('inviteId');
    const { user, userData, loading: authLoading } = useAuth();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form States
    const [name, setName] = useState('');
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [accountName, setAccountName] = useState('');
    const [teamName, setTeamName] = useState('');
    const [privacyTier, setPrivacyTier] = useState<PrivacyTier>(PrivacyTier.TIER_1_STANDARD);

    // State to track created IDs
    const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
    const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);

    // Invitation Data
    const [invitation, setInvitation] = useState<Invitation | null>(null);

    useEffect(() => {
        if (user?.email) {
            // Pre-populate name from email if not already set
            if (!name) {
                setName(user.email.split('@')[0]);
            }

            // Pre-populate account name from email domain
            if (!accountName) {
                const parts = user.email.split('@');
                const namePart = parts[0];
                const domainPart = parts[1];

                if (domainPart) {
                    const domainName = domainPart.split('.')[0].toLowerCase();
                    const commonProviders = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'protonmail', 'aol'];

                    if (commonProviders.includes(domainName)) {
                        // Capitalize first letter of name
                        const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                        setAccountName(`${capitalizedName}'s Organization`);
                    } else {
                        setAccountName(domainName);
                    }
                }
            }
        }
        if (user?.displayName && !name) setName(user.displayName);
    }, [user]);

    useEffect(() => {
        const checkInvite = async () => {
            if (inviteId) {
                const invite = await getInvitation(inviteId);
                if (invite) {
                    if (invite.status === 'revoked') {
                        setError('This invitation has been revoked.');
                        return;
                    }
                    setInvitation(invite);
                } else {
                    setError('Invalid invitation link.');
                }
            }
        };
        checkInvite();
    }, [inviteId]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/sign-in');
        }
    }, [authLoading, user, router]);

    // Skip to dashboard if already onboarded (has team/account)
    useEffect(() => {
        if (!authLoading && userData?.accountId && userData?.teamId && !createdTeamId) {
            router.push('/dashboard');
        }
    }, [authLoading, userData, router, createdTeamId]);

    const handleProfileSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!user) return;
            if (invitation && invitation.status === 'revoked') {
                setError('This invitation has been revoked.');
                return;
            }
            await updateUser(user.uid, { name, timezone, privacyTier });

            if (invitation) {
                // If invited, accept invitation and join team
                await acceptInvitation(invitation.id, user.uid);
                await updateUser(user.uid, {
                    accountId: invitation.accountId,
                    teamId: invitation.teamIds[0], // Use first team as default context
                    role: invitation.role
                });
                router.push('/dashboard');
            } else {
                // If not invited, proceed to Account Setup (Admin flow)
                setStep(2);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccountSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!user) return;
            const account = await createAccount(accountName, user.uid);
            setCreatedAccountId(account.id);
            await updateUser(user.uid, { accountId: account.id, role: 'owner' });

            // Auto-create "Everyone" team (previously "All Members" / "General")
            const team = await createTeam('Everyone', account.id);
            setCreatedTeamId(team.id);
            await addTeamMember(team.id, user.uid, 'owner');
            await updateUser(user.uid, { teamId: team.id });

            // Redirect to dashboard (Invite step moved to dashboard checklist)
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                        <div className={`h-1 w-8 ${step >= 2 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                        <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    {step === 1 && 'Complete your profile'}
                    {step === 2 && 'Create your account'}
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Profile */}
                    {step === 1 && (
                        <form onSubmit={handleProfileSetup} className="space-y-6">
                            <div>
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="mt-1"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input
                                    id="timezone"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div className="mt-4">
                                <PrivacySelectionForm
                                    onSelect={setPrivacyTier}
                                    selectedTier={privacyTier}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Continue'}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: Account (Admin only) */}
                    {step === 2 && (
                        <form onSubmit={handleAccountSetup} className="space-y-6">
                            <div>
                                <Label htmlFor="accountName">Account Name</Label>
                                <Input
                                    id="accountName"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    required
                                    placeholder="Acme Corp"
                                    className="mt-1"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create Account & Finish'}
                            </Button>
                        </form>
                    )}


                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-orange-500" /></div>}>
            <OnboardingContent />
        </Suspense>
    );
}
