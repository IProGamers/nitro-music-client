"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect /login to /auth for backwards compatibility
export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/auth');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full"></div>
                <p className="text-[var(--foreground-muted)] text-sm">Redirecting to login...</p>
            </div>
        </div>
    );
}
