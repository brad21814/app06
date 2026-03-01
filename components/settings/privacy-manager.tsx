'use client';

import * as React from 'react';
import { useState } from 'react';
import { PrivacyTier } from '@/types/firestore';
import { PrivacySelectionForm } from '@/components/auth/privacy-selection-form';
import { Button } from '@/components/ui/button';
import { updatePrivacyTier } from '@/lib/actions/privacy';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PrivacyManagerProps {
    uid: string;
    initialTier?: PrivacyTier;
}

export function PrivacyManager({ uid, initialTier }: PrivacyManagerProps) {
    const [tier, setTier] = useState<PrivacyTier | undefined>(initialTier);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!tier) return;
        
        setLoading(true);
        const result = await updatePrivacyTier(uid, tier);
        setLoading(false);

        if (result.success) {
            toast.success('Privacy settings updated successfully');
        } else {
            toast.error(result.error || 'Failed to update privacy settings');
        }
    };

    return (
        <div className="space-y-6">
            <PrivacySelectionForm onSelect={setTier} selectedTier={tier} />
            <div className="flex justify-end">
                <Button 
                    onClick={handleSave} 
                    disabled={loading || tier === initialTier}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
