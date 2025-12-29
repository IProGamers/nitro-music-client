"use client"
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface ArihantGuardProps {
    children: React.ReactNode;
}

/**
 * ArihantGuard - Redirects users with arihantMode enabled to /arihant
 * Place this inside the main layout to auto-redirect arihant users
 */
export default function ArihantGuard({ children }: ArihantGuardProps) {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Don't redirect while loading
        if (loading) return;

        // If user has arihantMode enabled AND is not already on an arihant route
        if (userProfile?.arihantMode && !pathname.startsWith('/arihant')) {
            // Allow auth routes (login, signup, etc.)
            if (pathname.startsWith('/auth')) return;
            // Allow admin routes (needed to disable arihant mode)
            if (pathname.startsWith('/admin')) return;

            // Redirect to arihant home
            router.replace('/arihant');
        }
    }, [userProfile, loading, pathname, router]);

    // Show children normally - the arihant layout handles its own protection
    return <>{children}</>;
}
