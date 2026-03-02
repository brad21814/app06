'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SubscriptionRequiredPage() {
    return (
        <div className="max-w-xl mx-auto mt-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Subscription Required</CardTitle>
                    <CardDescription>
                        Your free trial has expired or your subscription is no longer active.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">
                        To continue accessing team relationship intelligence, please upgrade your organization to a paid plan.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild>
                        <Link href="/settings/billing">
                            Upgrade to Paid Plan
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
