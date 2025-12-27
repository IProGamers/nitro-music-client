"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/profile?tab=settings');
    }, [router]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
