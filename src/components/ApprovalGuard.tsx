"use client"
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

const EXCLUDED_PATHS = [
    '/auth',
    '/auth/callback',
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

    // Must be approved (tier > NITRO_CORE or admin)
    if (userProfile && !userProfile.isAdmin && userProfile.tier === 'NITRO_CORE') {
        // Let users set up their username first if they haven't so admins know who they are
        const hasUsername = userProfile.username && userProfile.username.trim() !== '';
        if (!hasUsername) {
             return <>{children}</>;
        }

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-center relative z-[100]">
                <div className="max-w-md w-full bg-[#121212] border border-cyan-500/20 p-8 rounded-3xl shadow-2xl">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={40} className="text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Approval Required</h1>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Nitro Music is currently a private platform. Your account has been created successfully, but requires administrator approval for full access.
                    </p>
                    <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-xl mb-6">
                        <p className="text-sm text-cyan-300">
                            Please request access from the site administrator to unlock the premium music experience.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Approved! Render the app.
    return <>{children}</>;
}
