'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createAccountCheckoutSession, createAccountPortalSession } from '@/lib/payments/actions';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Account } from '@/types/firestore';
import { Loader2, ExternalLink } from 'lucide-react';

export default function BillingPage() {
    const { userData } = useAuth();
    const [account, setAccount] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!userData?.accountId) return;
        const fetchAccount = async () => {
            const docRef = doc(db, 'accounts', userData.accountId!);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setAccount(docSnap.data() as Account);
            }
            setIsLoading(false);
        };
        fetchAccount();
    }, [userData?.accountId]);

    const handleUpgrade = async () => {
        if (!userData?.accountId) return;
        setIsProcessing(true);
        try {
            const returnUrl = window.location.origin + '/settings/billing';
            const { url } = await createAccountCheckoutSession(userData.accountId, returnUrl);
            window.location.href = url;
        } catch (error) {
            console.error(error);
            alert('Failed to start checkout process.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManageBilling = async () => {
        if (!userData?.accountId) return;
        setIsProcessing(true);
        try {
            const returnUrl = window.location.origin + '/settings/billing';
            const { url } = await createAccountPortalSession(userData.accountId, returnUrl);
            window.location.href = url;
        } catch (error) {
            console.error(error);
            alert('Failed to open billing portal.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    if (!account) return <div>Account not found.</div>;

    const isActive = account.subscriptionStatus === 'active';
    const isTrialing = account.subscriptionStatus === 'trialing';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Billing & Subscription</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                        Manage your subscription and billing details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold capitalize">{account.subscriptionTier || 'Launchpad'} Plan</p>
                            <p className="text-sm text-muted-foreground">
                                Status: <span className="font-medium capitalize">{account.subscriptionStatus || 'Trialing'}</span>
                            </p>
                            {isTrialing && account.trialEndsAt && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Trial ends on: {account.trialEndsAt.toDate().toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">{account.userCount || 1}</p>
                            <p className="text-sm text-muted-foreground">Active Seats</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                    {!isActive && (
                        <Button onClick={handleUpgrade} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {isProcessing ? 'Processing...' : 'Upgrade to Paid Plan'}
                        </Button>
                    )}
                    {(isActive || account.stripeCustomerId) && (
                        <Button variant="outline" onClick={handleManageBilling} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                            Manage Billing
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
