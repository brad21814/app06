'use client';

import { useEffect } from 'react';
import { ThemeManager } from '@/components/settings/theme-manager';
import { useAuth } from '@/lib/firebase/auth-context';
import { updateAccount, getAccount } from '@/lib/firebase/firestore';

export default function ThemesPage() {
    const { userData } = useAuth();

    useEffect(() => {
        const markThemesReviewed = async () => {
            if (userData?.accountId && (userData.role === 'admin' || userData.role === 'owner')) {
                try {
                    const account = await getAccount(userData.accountId);
                    if (account && !account.hasReviewedThemes) {
                        await updateAccount(userData.accountId, { hasReviewedThemes: true });
                    }
                } catch (error) {
                    console.error("Error marking themes as reviewed:", error);
                }
            }
        };

        markThemesReviewed();
    }, [userData]);

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Themes</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Manage Themes</h2>
                    <p className="text-gray-500">Create and manage discussion themes and questions for your teams.</p>
                </div>
                <ThemeManager />
            </div>
        </div>
    );
}
