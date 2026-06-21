"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { exchangeSpotifyCode } from '@/lib/spotify';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SpotifyCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Read query params from the URL directly (avoids needing a Suspense boundary
        // for useSearchParams during static generation).
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const err = params.get('error');
        if (err) { setError('Spotify authorization was cancelled.'); return; }
        if (!code) { setError('No authorization code returned.'); return; }

        exchangeSpotifyCode(code)
            .then(() => router.replace('/playlists?spotify=connected'))
            .catch(() => setError('Could not connect to Spotify. Please try again.'));
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
            {error ? (
                <div className="max-w-sm text-center">
                    <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
                    <p className="text-[var(--foreground)] font-medium mb-4">{error}</p>
                    <button
                        onClick={() => router.replace('/playlists')}
                        className="px-5 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] text-sm font-medium"
                    >
                        Back to Library
                    </button>
                </div>
            ) : (
                <div className="text-center">
                    <Loader2 size={28} className="animate-spin text-[var(--accent)] mx-auto mb-3" />
                    <p className="text-[var(--foreground-muted)] text-sm">Connecting your Spotify…</p>
                </div>
            )}
        </div>
    );
}
