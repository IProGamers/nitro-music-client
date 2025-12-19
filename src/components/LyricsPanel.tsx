"use client"
import { useState, useEffect } from 'react';
import { X, Mic2, AlertCircle, Music2 } from 'lucide-react';

interface LyricsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    songId: string | null;
    songName: string;
    artistName: string;
}

export default function LyricsPanel({ isOpen, onClose, songId, songName, artistName }: LyricsPanelProps) {
    const [lyrics, setLyrics] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !songId) return;

        const fetchLyrics = async () => {
            setLoading(true);
            setError(null);
            setLyrics(null);

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${apiUrl}/api/songs/${songId}/lyrics`);
                const data = await res.json();

                if (data.success && data.data?.lyrics) {
                    setLyrics(data.data.lyrics);
                } else {
                    setError('Lyrics not available for this song');
                }
            } catch (e) {
                console.error('Failed to fetch lyrics:', e);
                setError('Could not load lyrics. Try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchLyrics();
    }, [isOpen, songId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[var(--background)]/90 backdrop-blur-xl z-[150] flex flex-col">
            {/* Header */}
            <header className="p-6 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                        <Mic2 size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--foreground)]">Lyrics</h2>
                        <p className="text-xs text-[var(--foreground-muted)]">{songName} • {artistName}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-[var(--card-hover)] rounded-xl transition-colors"
                >
                    <X size={20} className="text-[var(--foreground-muted)]" />
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="animate-spin w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full" />
                        <p className="text-[var(--foreground-muted)] text-sm">Loading lyrics...</p>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="p-4 bg-[var(--card)] rounded-full">
                            <AlertCircle size={40} className="text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)]">Lyrics Not Available</h3>
                        <p className="text-[var(--foreground-muted)] text-sm max-w-xs">{error}</p>
                        <div className="flex items-center gap-2 mt-4 text-[var(--foreground-muted)]">
                            <Music2 size={16} />
                            <span className="text-xs">Enjoy the music without lyrics!</span>
                        </div>
                    </div>
                )}

                {lyrics && (
                    <div className="max-w-2xl mx-auto">
                        <div
                            className="text-center text-lg md:text-xl leading-relaxed text-[var(--foreground)] whitespace-pre-wrap font-medium"
                            dangerouslySetInnerHTML={{ __html: formatLyrics(lyrics) }}
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="p-4 border-t border-[var(--border)] text-center">
                <p className="text-[10px] text-[var(--foreground-muted)]">
                    Lyrics may not be 100% accurate. Sourced from JioSaavn.
                </p>
            </footer>
        </div>
    );
}

// Format lyrics for display
function formatLyrics(lyrics: string): string {
    // Clean up HTML entities
    let cleaned = lyrics
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags

    // Add styling for sections like [Verse 1], [Chorus], etc.
    cleaned = cleaned.replace(/\[(.*?)\]/g, '<span class="block mt-8 mb-4 text-cyan-400 text-sm font-bold uppercase tracking-widest">$1</span>');

    return cleaned;
}
