'use client';

import * as React from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { PrivacyManager } from '@/components/settings/privacy-manager';
import { Skeleton } from '@/components/ui/skeleton';

export default function PrivacySettingsPage() {
    const { user, userData } = useAuth();

    if (!user) {
        return (
            <div className="flex-1 p-4 lg:p-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <section className="flex-1 p-4 lg:p-8">
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
                Privacy Management
            </h1>
            <PrivacyManager 
                uid={user.uid} 
                initialTier={userData?.privacyTier} 
            />
        </section>
    );
}
