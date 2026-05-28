'use client';

import * as React from 'react';
import { PrivacyTier } from '@/types/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PrivacySelectionFormProps {
    onSelect: (tier: PrivacyTier) => void;
    selectedTier?: PrivacyTier;
    showCard?: boolean;
}

export function PrivacySelectionForm({ onSelect, selectedTier, showCard = true }: PrivacySelectionFormProps) {
    const Content = (
        <RadioGroup 
            value={selectedTier} 
            onValueChange={(value) => onSelect(value as PrivacyTier)}
            className="grid gap-4"
        >
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => onSelect(PrivacyTier.TIER_1_STANDARD)}>
                <RadioGroupItem value={PrivacyTier.TIER_1_STANDARD} id="tier1" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="tier1" className="text-sm font-medium leading-none cursor-pointer">
                        Tier 1: Standard
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Full access to transcripts for AI processing and sharing.
                    </p>
                </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => onSelect(PrivacyTier.TIER_2_CONTROLLED)}>
                <RadioGroupItem value={PrivacyTier.TIER_2_CONTROLLED} id="tier2" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="tier2" className="text-sm font-medium leading-none cursor-pointer">
                        Tier 2: Controlled
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Restrict direct transcript access. Manual approval required for all summaries before sharing.
                    </p>
                </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => onSelect(PrivacyTier.TIER_3_PRIVATE)}>
                <RadioGroupItem value={PrivacyTier.TIER_3_PRIVATE} id="tier3" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="tier3" className="text-sm font-medium leading-none cursor-pointer">
                        Tier 3: Private
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        No transcript storage or sharing. Local/non-persistent processing only.
                    </p>
                </div>
            </div>
        </RadioGroup>
    );

    if (!showCard) {
        return Content;
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-base">Privacy Management</CardTitle>
                <CardDescription className="text-xs">
                    Choose how your meeting transcripts and summaries are handled.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {Content}
            </CardContent>
        </Card>
    );
}
