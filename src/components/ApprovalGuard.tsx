"use client"
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldCheck, LogOut } from 'lucide-react';

const EXCLUDED_PATHS = [
    '/auth',
    '/auth/callback',
    '/login',
    '/setup-username',
];

export default function ApprovalGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userProfile, loading, signOut } = useAuth();

    const isExcluded = EXCLUDED_PATHS.some(path => pathname?.startsWith(path));

    useEffect(() => {
        if (loading) return;
        if (isExcluded) return;
        // Must be signed in
        if (!user) {
            router.push('/auth');
        }
    }, [user, loading, isExcluded, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    if (isExcluded) {
        return <>{children}</>;
    }

    if (!user) {
        return null; // redirecting via useEffect
    }

    // Binary access: admins and approved users get the full app.
    const hasAccess = userProfile?.isAdmin === true || userProfile?.isApproved === true;

    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
                <div className="max-w-sm w-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={28} className="text-[var(--accent)]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Awaiting approval</h1>
                    <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mb-8">
                        Nitro Music is invite-only right now. Your account
                        {userProfile?.email ? <> (<span className="text-[var(--foreground-secondary)]">{userProfile.email}</span>)</> : null} is
                        created and waiting for an administrator to grant access. You&apos;ll get
                        full access the moment you&apos;re approved.
                    </p>
                    <button
                        onClick={() => signOut()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--foreground)] text-sm font-medium transition-colors"
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
