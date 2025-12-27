"use client"
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Pages that don't require username
const EXCLUDED_PATHS = [
    '/setup-username',
    '/auth',
    '/auth/callback',
];

export default function UsernameGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userProfile, loading } = useAuth();

    useEffect(() => {
        // Skip if loading, no user, or on excluded path
        if (loading) return;
        if (!user) return;
        if (EXCLUDED_PATHS.some(path => pathname?.startsWith(path))) return;

        // If user is logged in but has no username, redirect to setup
        if (userProfile && !userProfile.username) {
            router.push('/setup-username');
        }
    }, [user, userProfile, loading, pathname, router]);

    return <>{children}</>;
}
