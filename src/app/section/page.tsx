"use client"
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { ArrowLeft, Music, Play, Loader2 } from 'lucide-react';
import SongContextMenu from '@/components/SongContextMenu';

// Decode HTML entities
const decodeHtml = (html: string): string => {
    if (!html || typeof window === 'undefined') return html || '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

import { Suspense } from 'react';

function SectionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { playTrack } = usePlayer();

    // `+` in the query string is used as a space separator on the home page, but
    // Next's router percent-encodes it to %2B so it reads back as a literal '+'.
    // Normalize both params back to spaces (no-op if already decoded) — otherwise
    // JioSaavn search gets "trending+viral+hits" and returns nothing.
    const title = (searchParams.get('title') || 'Songs').replace(/\+/g, ' ');
    const query = (searchParams.get('q') || '').replace(/\+/g, ' ');

    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSongs = async () => {
            if (!query) {
                setLoading(false);
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(query)}&limit=50`);
                const data = await res.json();

                if (data.success && data.data?.results) {
                    setSongs(data.data.results);
                }
            } catch (err) {
                console.error('Failed to fetch songs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSongs();
    }, [query]);

    const getImg = useCallback((t: any) => {
        if (typeof t.image === 'string') return t.image;
        if (t.image && t.image.length) {
            return t.image[t.image.length - 1].url || t.image[t.image.length - 1].link || '';
        }
        return '';
    }, []);

    const getName = useCallback((t: any) => {
        return decodeHtml(t.name || t.title || 'Unknown');
    }, []);

    const getArtist = useCallback((t: any) => {
        if (t.artists?.primary?.[0]?.name) return decodeHtml(t.artists.primary[0].name);
        if (typeof t.artist === 'string') return decodeHtml(t.artist);
        return 'Various Artists';
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] pb-32">
            {/* Header with Back Button */}
            <div className="sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-4 px-4 py-4 max-w-[1600px] mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)] capitalize">{title}</h1>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-6 lg:px-8 pt-6 max-w-[1600px] mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                ) : songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Music size={48} className="text-[var(--foreground-muted)]" />
                        <p className="text-[var(--foreground-muted)]">No songs found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {songs.map((song: any, idx: number) => (
                            <div
                                key={`${song.id || song.songId || idx}`}
                                onClick={() => playTrack(song, songs)}
                                className="group cursor-pointer"
                            >
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--card)] shadow-md mb-2 border border-[var(--border)]">
                                    {getImg(song) ? (
                                        <img
                                            src={getImg(song)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            alt={getName(song)}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[var(--background-tertiary)]">
                                            <Music size={32} className="text-[var(--foreground-muted)]" />
                                        </div>
                                    )}
                                    {/* Play Button */}
                                    <button className="absolute bottom-2 right-2 w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-cyan-300 active:scale-95">
                                        <Play size={18} fill="black" className="ml-0.5 text-black" />
                                    </button>
                                    {/* Context Menu */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                                        <SongContextMenu song={song} queue={songs} />
                                    </div>
                                </div>
                                <h3 className="font-semibold text-sm text-[var(--foreground)] truncate">{getName(song)}</h3>
                                <p className="text-xs text-[var(--foreground-muted)] truncate">{getArtist(song)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SectionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        }>
            <SectionContent />
        </Suspense>
    );
}
