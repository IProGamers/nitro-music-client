'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

// Bump this whenever you ship a release that old home-screen PWA users
// should be nudged to update to.
const APP_VERSION = '2.0.0';
const STORAGE_KEY = 'nitro_app_version';

// Compares two dotted version strings. Returns true if `stored` is strictly
// older than `current` (or missing/unparseable).
function isOlder(stored: string | null, current: string): boolean {
    if (!stored) return true;
    const a = stored.split('.').map((n) => parseInt(n, 10) || 0);
    const b = current.split('.').map((n) => parseInt(n, 10) || 0);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const x = a[i] || 0;
        const y = b[i] || 0;
        if (x < y) return true;
        if (x > y) return false;
    }
    return false;
}

export default function VersionUpdatePrompt() {
    const [show, setShow] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (isOlder(stored, APP_VERSION)) {
                setShow(true);
            }
        } catch {
            // localStorage unavailable (private mode etc.) — just skip.
        }
    }, []);

    const persistVersion = () => {
        try {
            localStorage.setItem(STORAGE_KEY, APP_VERSION);
        } catch {
            // ignore
        }
    };

    const handleDismiss = () => {
        persistVersion();
        setShow(false);
    };

    const handleUpdate = async () => {
        persistVersion();
        setUpdating(true);
        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg?.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                // Ask the active SW to clear caches if it supports it.
                navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
            }
        } catch {
            // ignore — we reload regardless
        }
        // Reload to pick up the new version.
        window.location.reload();
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[400] w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--foreground)] leading-tight">
                        Nitro v2 is now available
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] leading-tight mt-0.5">
                        Tap update to get the latest version.
                    </p>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                    {updating ? 'Updating…' : 'Update'}
                </button>
                <button
                    onClick={handleDismiss}
                    aria-label="Dismiss"
                    className="shrink-0 p-1.5 rounded-full hover:bg-[var(--background)] transition-colors"
                >
                    <X size={16} className="text-[var(--foreground-muted)]" />
                </button>
            </div>
        </div>
    );
}
