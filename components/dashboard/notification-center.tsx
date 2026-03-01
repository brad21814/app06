'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Summary, SummaryStatus, PrivacyTier } from '@/types/firestore';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { approveSummary, rejectSummary } from '@/lib/actions/summary';
import { toast } from 'sonner';
import { Bell, Check, Trash2, Loader2 } from 'lucide-react';

export function NotificationCenter() {
    const { user, userData } = useAuth();
    const [pendingSummaries, setPendingSummaries] = useState<Summary[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user || userData?.privacyTier !== PrivacyTier.TIER_2_CONTROLLED) {
            setPendingSummaries([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'summaries'),
            where('userId', '==', user.uid),
            where('status', '==', SummaryStatus.PENDING_APPROVAL),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const summaries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Summary));
            setPendingSummaries(summaries);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching pending summaries:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userData]);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        const result = await approveSummary(id);
        setProcessingId(null);
        if (result.success) {
            toast.success('Summary approved');
        } else {
            toast.error(result.error);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject and permanently delete this summary?')) return;
        
        setProcessingId(id);
        const result = await rejectSummary(id);
        setProcessingId(null);
        if (result.success) {
            toast.success('Summary deleted');
        } else {
            toast.error(result.error);
        }
    };

    if (!user || userData?.privacyTier !== PrivacyTier.TIER_2_CONTROLLED) return null;
    if (pendingSummaries.length === 0 && !loading) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingSummaries.length}
                </span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array.from({ length: 1 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-gray-100" />
                            <CardContent className="h-32" />
                        </Card>
                    ))
                ) : (
                    pendingSummaries.map((summary) => (
                        <Card key={summary.id} className="flex flex-col border-orange-200 bg-orange-50/30">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Meeting Summary</CardTitle>
                                <CardDescription>
                                    Created on {new Date(summary.createdAt instanceof Date ? summary.createdAt : (summary.createdAt as any).toDate()).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-gray-700 line-clamp-4 italic">
                                    "{summary.content}"
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => handleReject(summary.id)}
                                    disabled={processingId === summary.id}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Reject
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleApprove(summary.id)}
                                    disabled={processingId === summary.id}
                                >
                                    {processingId === summary.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-1" />
                                            Approve
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
