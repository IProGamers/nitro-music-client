"use client"

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console in development
        console.error('Page Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <AlertTriangle size={40} className="text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Something went wrong
            </h2>

            <p className="text-[var(--foreground-muted)] mb-6 max-w-md">
                We encountered an unexpected error. This might be a temporary issue.
            </p>

            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all hover:scale-105"
                >
                    <RefreshCw size={18} />
                    Try Again
                </button>

                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-bold rounded-full border border-[var(--border)] transition-all"
                >
                    <Home size={18} />
                    Go Home
                </Link>
            </div>

            {process.env.NODE_ENV === 'development' && error?.message && (
                <div className="mt-8 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl max-w-lg text-left">
                    <p className="text-xs font-mono text-red-400 break-all">
                        {error.message}
                    </p>
                </div>
            )}
        </div>
    );
}
