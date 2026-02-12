import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
                Access Denied
            </h1>
            <p className="mb-8 max-w-md text-gray-600">
                You do not have permission to access this page. If you believe this is a mistake, please contact your workspace owner.
            </p>
            <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </div>
    );
}
