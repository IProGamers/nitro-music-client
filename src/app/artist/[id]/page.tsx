"use client"
import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Music, Disc, User, Heart, Play, Share2, Verified, Users, ChevronRight, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { sourceUrl } from '@/lib/source';

export default function ArtistPage() {
    const { id } = useParams();
    const { playTrack } = usePlayer();
    const router = useRouter();
    const [artist, setArtist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        // Retry with backoff — handles transient 503s and server cold-starts
        // (e.g. a sleeping Render instance waking up).
        const fetchArtist = async (attempt = 0): Promise<void> => {
            const MAX_ATTEMPTS = 4;
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${sourceUrl(`/artists/${id}`)}?songCount=50&albumCount=50`, {
                    headers: { 'Accept': 'application/json' }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                if (data.success && data.data) {
                    setArtist(data.data);
                    setErrorMsg(null);
                } else {
                    setErrorMsg(data?.message || 'This artist could not be loaded.');
                }
                setLoading(false);
            } catch (e: any) {
                // Retry transient failures (503 / network / cold start) with backoff.
                if (attempt < MAX_ATTEMPTS - 1) {
                    const delay = 1200 * Math.pow(1.8, attempt); // ~1.2s, 2.2s, 3.9s
                    setTimeout(() => fetchArtist(attempt + 1), delay);
                    return;
                }
                console.error('Artist fetch error:', e);
                setErrorMsg(
                    e?.message?.includes('503')
                        ? "The music server is waking up — please try again in a moment."
                        : (e?.message ? `Couldn't reach the music server (${e.message}).` : "Couldn't reach the music server.")
                );
                setLoading(false);
            }
        };

        setLoading(true);
        fetchArtist();
    }, [id]);

    const getImg = (images: any[]) => {
        if (images && images.length) {
            return images[images.length - 1].url;
        }
        return '/placeholder-artist.png';
    };

    // Decode HTML entities
    const decodeHtml = (html: string) => {
        if (!html) return '';
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-cyan-400 gap-4">
                <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full"></div>
                <p className="text-zinc-500 font-medium animate-pulse">Loading...</p>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[var(--background)]">
                <User size={48} className="text-[var(--foreground-muted)] mb-4" />
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Artist not available</h1>
                <p className="text-[var(--foreground-muted)] text-sm mb-6">{errorMsg || "The artist you're looking for doesn't exist."}</p>
                <button onClick={() => router.back()} className="px-6 py-2.5 bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-full font-medium text-sm hover:bg-[var(--card-hover)] transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Header / Hero Section */}
            <div className="relative h-64 md:h-80 overflow-hidden">
                <div className="absolute inset-0">
                    <img src={getImg(artist.image)} className="w-full h-full object-cover blur-2xl opacity-30 scale-125" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />
                </div>

                {/* Back button — returns to wherever you came from (song/search/home) */}
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="absolute inset-0 flex items-end">
                    <div className="max-w-5xl mx-auto w-full px-4 md:px-8 pb-6 md:pb-10 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8">
                        {/* Artist Image */}
                        <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-[var(--border)] shadow-xl bg-[var(--card)]">
                                <img src={getImg(artist.image)} className="w-full h-full object-cover object-top" alt={artist.name} />
                            </div>
                            {artist.isVerified && (
                                <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full">
                                    <Verified size={14} fill="currentColor" />
                                </div>
                            )}
                        </div>

                        {/* Artist Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <span className="text-cyan-400 text-xs font-medium uppercase tracking-wide">
                                    {artist.type || 'Artist'}
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-bold text-[var(--foreground)] mb-2">
                                {decodeHtml(artist.name)}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-[var(--foreground-muted)] text-sm">
                                {artist.followerCount && (
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} className="text-cyan-400" />
                                        <span>{artist.followerCount.toLocaleString()} Followers</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => artist.topSongs?.[0] && playTrack(artist.topSongs[0], artist.topSongs)}
                                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-2.5 rounded-full font-semibold text-sm transition-colors"
                            >
                                <Play fill="currentColor" size={16} /> Play
                            </button>
                            <button className="p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-10">

                {/* Popular Songs */}
                {artist.topSongs && artist.topSongs.length > 0 && (
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <Music size={20} className="text-cyan-400" /> Popular Songs
                        </h2>
                        <div className="space-y-1">
                            {artist.topSongs.slice(0, 30).map((song: any, index: number) => (
                                <div
                                    key={song.id}
                                    onClick={() => playTrack(song, artist.topSongs)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--card-hover)] group transition-colors cursor-pointer"
                                >
                                    <div className="w-6 text-center text-[var(--foreground-muted)] text-sm font-medium group-hover:text-cyan-400">
                                        {index + 1}
                                    </div>
                                    <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--card)]">
                                        {song.image && song.image.length > 0 ? (
                                            <img src={song.image[song.image.length - 1].url} className="w-full h-full object-cover" alt={song.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Music size={16} className="text-zinc-600" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play fill="white" size={14} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm text-[var(--foreground)] group-hover:text-cyan-400 transition-colors truncate">
                                            {decodeHtml(song.name)}
                                        </h3>
                                        <p className="text-xs text-[var(--foreground-muted)] truncate">
                                            {song.album?.name ? decodeHtml(song.album.name) : ''}
                                        </p>
                                    </div>
                                    <div className="hidden md:block text-xs text-[var(--foreground-muted)]">
                                        {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : ''}
                                    </div>
                                    <button className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-all">
                                        <Heart size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Top Albums */}
                {artist.topAlbums && artist.topAlbums.length > 0 && (
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <Disc size={20} className="text-cyan-400" /> Albums
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {artist.topAlbums.slice(0, 20).map((album: any) => (
                                <div
                                    key={album.id}
                                    onClick={() => router.push(`/album/${album.id}`)}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                        {album.image && album.image.length > 0 ? (
                                            <img src={album.image[album.image.length - 1].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={album.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Disc size={32} className="text-[var(--foreground-muted)]" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center">
                                                <Play fill="black" size={18} className="ml-0.5 text-black" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-sm text-[var(--foreground)] group-hover:text-cyan-400 transition-colors truncate">
                                        {decodeHtml(album.name)}
                                    </h3>
                                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{album.year || 'Album'}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Similar Artists */}
                {artist.similarArtists && artist.similarArtists.length > 0 && (
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <User size={20} className="text-cyan-400" /> Similar Artists
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                            {artist.similarArtists.slice(0, 8).map((sim: any) => (
                                <div
                                    key={sim.id}
                                    onClick={() => router.push(`/artist/${sim.id}`)}
                                    className="flex flex-col items-center group cursor-pointer min-w-[80px] md:min-w-[100px]"
                                >
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden mb-2 bg-[var(--card)] ring-2 ring-transparent group-hover:ring-cyan-400 transition-all border border-[var(--border)]">
                                        <img src={getImg(sim.image)} className="w-full h-full object-cover" alt={sim.name} />
                                    </div>
                                    <h4 className="font-medium text-xs text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors text-center truncate w-full">
                                        {decodeHtml(sim.name)}
                                    </h4>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
