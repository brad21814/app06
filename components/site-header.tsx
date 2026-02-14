'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CircleIcon, Home, LogOut, Settings, Users, Shield, Activity, BarChart } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Suspense } from 'react';

function UserMenu() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    async function handleSignOut() {
        await signOut(auth);
        await fetch('/api/auth/sign-out', { method: 'POST' });
        router.push('/');
        router.refresh();
    }

    if (loading) {
        return null; // Or a spinner
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    <Link href="/sign-in">Login</Link>
                </Button>
                <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
                    <Link href="/sign-up">Sign Up</Link>
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer size-9 border border-gray-200">
                    <AvatarImage alt={userData?.name || user.email || ''} src={user.photoURL || ''} />
                    <AvatarFallback>
                        {(userData?.name || user.email || 'U')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="flex flex-col gap-1 w-56">
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">
                    {userData?.name || 'User'}
                    <div className="text-xs font-normal text-gray-500 truncate">{user.email}</div>
                </div>
                <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard" className="flex w-full items-center">
                        <Home className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                </DropdownMenuItem>

                {(userData?.role === 'owner' || userData?.role === 'admin') && (
                    <>
                        <DropdownMenuItem className="cursor-pointer" asChild>
                            <Link href="/teams" className="flex w-full items-center">
                                <Users className="mr-2 h-4 w-4" />
                                <span>Team</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer" asChild>
                            <Link href="/schedules" className="flex w-full items-center">
                                <Activity className="mr-2 h-4 w-4" />
                                <span>Schedules</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer" asChild>
                            <Link href="/themes" className="flex w-full items-center">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Themes</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer" asChild>
                            <Link href="/analytics" className="flex w-full items-center">
                                <BarChart className="mr-2 h-4 w-4" />
                                <span>Analytics</span>
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}

                <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/profile" className="flex w-full items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function SiteHeader() {
    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center">
                    <CircleIcon className="h-6 w-6 text-orange-500" />
                    <span className="ml-2 text-xl font-semibold text-gray-900">ACME</span>
                </Link>
                <div className="flex items-center space-x-4">
                    <Suspense fallback={<div className="h-9" />}>
                        <UserMenu />
                    </Suspense>
                </div>
            </div>
        </header>
    );
}
