'use client';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { User } from '@/types/firestore';
import { useAuth } from '@/lib/firebase/auth-context';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    user?: Partial<User> | null;
    className?: string;
    fallbackClassName?: string;
}

export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
    const { user: authUser } = useAuth();
    
    // Tiered Fallback Logic:
    // 1. Custom Upload (Firestore photoURL)
    // 2. Social Identity (Auth photoURL)
    // 3. Default Asset (SVG)
    const photoURL = user?.photoURL || authUser?.photoURL || '/assets/avatars/default.svg';
    
    const initials = (user?.name || user?.email || 'U')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <Avatar className={className}>
            <AvatarImage src={photoURL} alt={user?.name || 'User Avatar'} />
            <AvatarFallback className={cn("bg-orange-100 text-orange-700", fallbackClassName)}>
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}
