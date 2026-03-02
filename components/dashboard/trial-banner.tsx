'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Account } from '@/types/firestore';
import Link from 'next/link';

export function TrialBanner() {
    const { userData } = useAuth();
    const [account, setAccount] = useState<Account | null>(null);

    useEffect(() => {
        if (!userData?.accountId) return;

        const fetchAccount = async () => {
            const docRef = doc(db, 'accounts', userData.accountId!);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setAccount(docSnap.data() as Account);
            }
        };

        fetchAccount();
    }, [userData?.accountId]);

    if (!account || account.subscriptionStatus !== 'trialing' || !account.trialEndsAt) {
        return null;
    }

    const trialEndsDate = account.trialEndsAt.toDate();
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEndsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    if (daysRemaining === 0) {
        return (
            <div className="bg-red-500 text-white px-4 py-2 text-sm text-center">
                Your free trial has expired. <Link href="/settings/billing" className="underline font-bold">Upgrade now</Link> to continue using App06.
            </div>
        );
    }

    return (
        <div className="bg-blue-600 text-white px-4 py-2 text-sm text-center">
            You are on a free trial. {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining. <Link href="/settings/billing" className="underline font-bold">Upgrade</Link>
        </div>
    );
}
