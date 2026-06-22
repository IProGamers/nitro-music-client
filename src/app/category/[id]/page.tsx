"use client"
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { ArrowLeft, Music, Play, Loader2, Shuffle } from 'lucide-react';
import SongContextMenu from '@/components/SongContextMenu';
import { fetchWithCache, CACHE_TTL } from '@/lib/apiCache';
import { decodeHtml } from '@/lib/utils';

// Each category is backed by SEVERAL specific JioSaavn queries that are combined,
// de-duplicated and refreshed daily — so results stay relevant to the category
// (e.g. Party = real party anthems, not random matches) and never go stale.
const CATEGORY_CONFIG: Record<string, { title: string; subtitle: string; queries: string[] }> = {
    trending: { title: 'Trending', subtitle: 'What everyone is playing right now', queries: ['trending viral hits india 2026', 'top chartbusters bollywood 2026', 'viral songs 2026'] },
    new: { title: 'New Releases', subtitle: 'Fresh drops this week', queries: ['new bollywood songs 2026', 'latest punjabi releases 2026', 'new english pop 2026'] },
    charts: { title: 'Top Charts', subtitle: 'The biggest songs around', queries: ['top 50 songs india', 'billboard hot 100 2026', 'most played songs 2026'] },
    hindi: { title: 'Hindi', subtitle: 'Bollywood & Hindi hits', queries: ['latest hindi bollywood hits 2026', 'arijit singh shreya ghoshal hits', 'romantic hindi songs 2026'] },
    punjabi: { title: 'Punjabi', subtitle: 'Punjabi chartbusters', queries: ['diljit dosanjh ap dhillon karan aujla', 'latest punjabi hits 2026', 'shubh sidhu moose wala'] },
    pop: { title: 'Pop', subtitle: 'Global pop hits', queries: ['pop hits 2026', 'dua lipa the weeknd taylor swift', 'top english pop songs 2026'] },
    'hip-hop': { title: 'Hip Hop', subtitle: 'Rap & hip hop heat', queries: ['hip hop rap hits 2026', 'divine seedhe maut indian hip hop', 'drake kendrick lamar travis scott'] },
    rock: { title: 'Rock', subtitle: 'Rock anthems', queries: ['rock greatest hits', 'coldplay imagine dragons onerepublic', 'linkin park ac dc nirvana'] },
    edm: { title: 'Dance / EDM', subtitle: 'Beats to move to', queries: ['edm dance party hits 2026', 'electronic festival anthems', 'avicii marshmello alan walker'] },
    romance: { title: 'Romance', subtitle: 'Love songs for the mood', queries: ['romantic love songs hindi 2026', 'bollywood romantic hits', 'best english love songs'] },
    party: { title: 'Party', subtitle: 'Turn it up', queries: ['bollywood party dance anthems', 'punjabi party songs', 'club bangers hindi 2026'] },
    focus: { title: 'Focus', subtitle: 'Stay in the zone', queries: ['lofi study focus beats', 'instrumental concentration music', 'calm focus piano'] },
    chill: { title: 'Chill', subtitle: 'Easy, breezy vibes', queries: ['chill relaxing bollywood songs', 'soft acoustic chill', 'lofi chill hindi'] },
    sleep: { title: 'Sleep', subtitle: 'Wind down', queries: ['sleep soothing calm music', 'relaxing sleep instrumental', 'peaceful ambient sleep'] },
    devotional: { title: 'Devotional', subtitle: 'Bhajans & mantras', queries: ['hindu devotional bhajan aarti', 'krishna shiv bhajan', 'morning devotional mantras'] },
    jazz: { title: 'Jazz', subtitle: 'Smooth & soulful', queries: ['jazz greatest classics', 'smooth jazz instrumental', 'frank sinatra louis armstrong'] },
    classical: { title: 'Classical', subtitle: 'Timeless ragas & more', queries: ['indian classical raga', 'hindustani carnatic classical', 'instrumental sitar flute classical'] },
};

const getDailySeed = (): number => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
    const a = [...arr];
    let s = seed;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const { playTrack } = usePlayer();

    const id = String(params?.id || '');
    const config = CATEGORY_CONFIG[id];

    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!config) { setLoading(false); return; }
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const responses = await Promise.allSettled(
                    config.queries.map(q =>
                        fetchWithCache(
                            `${apiUrl}/api/search/songs?query=${encodeURIComponent(q)}&limit=30`,
                            CACHE_TTL.SEARCH,
                            { dailyKey: true }
                        )
                    )
                );
                const seen = new Set<string>();
                const combined: any[] = [];
                for (const res of responses) {
                    if (res.status === 'fulfilled' && (res.value as any)?.success) {
                        for (const s of ((res.value as any).data?.results || [])) {
                            const sid = String(s.id || s.songId || '');
                            if (!sid || seen.has(sid)) continue;
                            seen.add(sid);
                            combined.push(s);
                        }
                    }
                }
                const ordered = seededShuffle(combined, getDailySeed()).slice(0, 60);
                if (alive) setSongs(ordered);
            } catch {
                /* ignore — empty state handles it */
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const getImg = useCallback((t: any) => {
        if (typeof t?.image === 'string') return t.image;
        if (t?.image?.length) return t.image[t.image.length - 1].url || t.image[t.image.length - 1].link || '';
        return '';
    }, []);
    const getName = useCallback((t: any) => decodeHtml(t?.name || t?.title || 'Unknown'), []);
    const getArtist = useCallback((t: any) => {
        if (t?.artists?.primary?.[0]?.name) return decodeHtml(t.artists.primary[0].name);
        if (typeof t?.artist === 'string') return decodeHtml(t.artist);
        return 'Various Artists';
    }, []);

    if (!config) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] gap-4 px-6 text-center">
                <Music size={44} className="text-[var(--foreground-muted)]" />
                <p className="text-[var(--foreground-muted)]">This category doesn&apos;t exist.</p>
                <button onClick={() => router.push('/search')} className="px-5 py-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-sm font-semibold hover:bg-[var(--card-hover)] transition-colors">Back to Search</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] pb-32">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-4 px-4 py-3.5 max-w-[1100px] mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] transition-all shrink-0"
                        aria-label="Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-bold text-[var(--foreground)] truncate leading-tight">{config.title}</h1>
                        <p className="text-[11px] md:text-xs text-[var(--foreground-muted)] truncate">{config.subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-6 pt-5 max-w-[1100px] mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-7 h-7 text-[var(--foreground-muted)] animate-spin" />
                    </div>
                ) : songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Music size={44} className="text-[var(--foreground-muted)]" />
                        <p className="text-[var(--foreground-muted)] text-sm">No songs found right now. Try again later.</p>
                    </div>
                ) : (
                    <>
                        {/* Play / Shuffle actions */}
                        <div className="flex items-center gap-3 mb-5">
                            <button
                                onClick={() => songs[0] && playTrack(songs[0], songs)}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-400 text-black text-sm font-bold hover:bg-cyan-300 active:scale-95 transition-all"
                            >
                                <Play size={16} fill="currentColor" /> Play
                            </button>
                            <button
                                onClick={() => { const sh = seededShuffle(songs, Date.now()); sh[0] && playTrack(sh[0], sh); }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--card-hover)] active:scale-95 transition-all"
                            >
                                <Shuffle size={16} /> Shuffle
                            </button>
                        </div>

                        {/* Artwork card grid — same format as the Home page sections */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                            {songs.map((song, idx) => (
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
                                                <Music size={28} className="text-[var(--foreground-muted)]" />
                                            </div>
                                        )}
                                        <button className="absolute bottom-2 right-2 w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-cyan-300 active:scale-95">
                                            <Play size={18} fill="black" className="ml-0.5 text-black" />
                                        </button>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                                            <SongContextMenu song={song} queue={songs} />
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-[var(--foreground)] truncate">{getName(song)}</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] truncate">{getArtist(song)}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
