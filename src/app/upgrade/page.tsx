"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Subscription tiers were removed in favor of a binary access model
// (a user is either approved by an admin = full access, or locked out).
// This route is kept only to avoid dead links; it redirects home.
export default function UpgradeRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
        </div>
    );
}
