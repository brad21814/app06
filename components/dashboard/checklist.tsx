'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Circle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/firebase/auth-context';
import { updateUser, getAccountInvitations } from '@/lib/firebase/firestore';

export function OnboardingChecklist() {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [checklist, setChecklist] = useState<{ id: string; label: string; completed: boolean; action: string; role?: string }[]>([]);
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const fetchChecklistData = async () => {
            if (userData) {
                // Check for dismissed state
                if (userData.hasDismissedGettingStarted) {
                    setIsHidden(true);
                    return;
                }

                // Check for existing invitations
                let hasInvitations = false;
                if (userData.accountId) {
                    const invites = await getAccountInvitations(userData.accountId);
                    hasInvitations = invites.length > 0;
                }

                let items = [
                    { id: 'profile', label: 'Complete Profile', completed: !!userData.name && !!userData.timezone, action: '/profile' },
                    { id: 'invite', label: 'Invite Members', completed: hasInvitations, action: '/teams', role: 'admin,owner' },
                ];

                // Hide team/invite tasks for regular members
                if (userData.role === 'member') {
                    items = items.filter(item => item.id === 'profile' || item.role?.includes(userData.role));
                }

                setChecklist(items);
            }
        };

        fetchChecklistData();
    }, [userData]);

    const handleDismiss = async () => {
        setIsHidden(true);
        if (user) {
            try {
                await updateUser(user.uid, { hasDismissedGettingStarted: true });
            } catch (error) {
                console.error("Error dismissing getting started:", error);
            }
        }
    };

    const allCompleted = checklist.length > 0 && checklist.every(item => item.completed);

    if (isHidden || allCompleted || checklist.length === 0) return null;

    return (
        <Card className="mb-6 border-orange-200 bg-orange-50 relative">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-orange-400 hover:text-orange-600 hover:bg-orange-100 rounded-full"
                onClick={handleDismiss}
            >
                <X className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-orange-800">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {checklist.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {item.completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-orange-300" />
                                )}
                                <span className={`${item.completed ? 'text-gray-500 line-through' : 'text-gray-700 font-medium'}`}>
                                    {item.label}
                                </span>
                            </div>
                            {!item.completed && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                                    onClick={() => router.push(item.action)}
                                >
                                    Start <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
