"use client"
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const EXCLUDED_PATHS = [
    '/auth',
    '/auth/callback',
    '/login',
    '/set-admin',
    '/setup-username',
];

export default function ApprovalGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userProfile, loading } = useAuth();

    // Skip check on excluded paths
    const isExcluded = EXCLUDED_PATHS.some(path => pathname?.startsWith(path));

    useEffect(() => {
        if (loading) return;
        if (isExcluded) return;

        // Force users to make an account
        if (!user) {
            router.push('/auth');
        }
    }, [user, loading, isExcluded, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
        );
    }

    if (isExcluded) {
        return <>{children}</>;
    }

    // Must be logged in
    if (!user) {
        return null; // Will redirect via useEffect
    }

    // Logged in — render the app. Feature gating happens inside UsageContext per feature.
    return <>{children}</>;
}
