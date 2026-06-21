"use client"
import { useEffect, useState } from 'react';
import { Sparkles, Play, Music } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { fetchLastfmSimilarSongs } from '@/lib/recommendations';
import { getTrackImageUrl, getTrackArtistName, decodeHtml } from '@/lib/utils';

/**
 * "Made for you" home row — Last.fm similar songs seeded from the user's most
 * recent play, resolved against our catalog. Renders nothing when there's no
 * recent play or Last.fm isn't configured (graceful, no errors).
 *
 * Drop anywhere in the home page: <RecommendedSection />
 */
export default function RecommendedSection() {
    const { user, getRecentPlays } = useAuth();
    const { playTrack } = usePlayer();
    const [seed, setSeed] = useState<any | null>(null);
    const [songs, setSongs] = useState<any[]>([]);

    useEffect(() => {
        if (!user) { setSongs([]); return; }
        let cancelled = false;
        (async () => {
            try {
                const recent = await getRecentPlays?.(1);
                const seedSong = recent?.[0];
                if (!seedSong) return;
                const similar = await fetchLastfmSimilarSongs(seedSong);
                if (!cancelled) {
                    setSeed(seedSong);
                    setSongs(similar.slice(0, 14));
                }
            } catch {
                if (!cancelled) setSongs([]);
            }
        })();
        return () => { cancelled = true; };
    }, [user]);

    if (songs.length === 0) return null;

    const seedName = decodeHtml(seed?.name || seed?.title || '');

    return (
        <section>
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-cyan-400" />
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Recommended for you</h2>
                    {seedName && (
                        <p className="text-[10px] md:text-xs text-[var(--foreground-muted)]">Because you played {seedName}</p>
                    )}
                </div>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {songs.map((s: any) => (
                    <div
                        key={`rec-${s.id || s.songId}`}
                        onClick={() => playTrack(s, undefined, { radio: true })}
                        className="group cursor-pointer w-36 md:w-44 flex-shrink-0"
                    >
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-2.5 bg-[var(--surface)] shadow-lg">
                            {getTrackImageUrl(s) ? (
                                <img src={getTrackImageUrl(s)} alt={decodeHtml(s.name || s.title)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]"><Music size={28} /></div>
                            )}
                            <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all" style={{ background: 'var(--accent)' }}>
                                <Play size={16} fill="#04161a" className="ml-0.5 text-[#04161a]" />
                            </div>
                        </div>
                        <h3 className="font-semibold text-sm text-[var(--foreground)] truncate">{decodeHtml(s.name || s.title)}</h3>
                        <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{decodeHtml(getTrackArtistName(s))}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
