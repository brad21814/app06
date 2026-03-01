'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { PrivacyTier } from '@/types/firestore';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function MissingTierNotification() {
    const { userData } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show if user is loaded and missing privacyTier
        if (userData && !userData.privacyTier) {
            setIsVisible(true);
        }
    }, [userData]);

    if (!isVisible) return null;

    return (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 relative flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-800">Default Privacy Setting Applied</h3>
                <p className="text-sm text-blue-700 mt-1">
                    You have been automatically assigned <strong>Tier 1 (Standard)</strong> privacy settings. 
                    You can review and change this in your{' '}
                    <Link href="/profile/privacy" className="font-semibold underline">
                        Privacy Management
                    </Link>{' '}
                    settings.
                </p>
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                onClick={() => setIsVisible(false)}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
