"use client"
import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Music, Disc, User, Heart, Play, Share2, Clock, Calendar, Globe, ChevronRight } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function AlbumPage() {
    const { id } = useParams();
    const { playTrack } = usePlayer();
    const router = useRouter();
    const [album, setAlbum] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchAlbum = async (retries = 2) => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${apiUrl}/api/albums?id=${id}`, {
                    headers: { 'Accept': 'application/json' }
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                if (data.success && data.data) {
                    setAlbum(data.data);
                } else {
                    console.warn('Album API returned:', data);
                }
            } catch (e) {
                console.error('Album fetch error:', e);
                // Retry on failure
                if (retries > 0) {
                    setTimeout(() => fetchAlbum(retries - 1), 1000);
                    return;
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAlbum();
    }, [id]);

    const getImg = (images: any[]) => {
        if (images && images.length) {
            return images[images.length - 1].url;
        }
        return '/placeholder-album.png';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] text-cyan-400 gap-4">
                <div className="animate-spin w-12 h-12 border-4 border-current border-t-transparent rounded-full shadow-lg shadow-cyan-500/20"></div>
                <p className="text-[var(--foreground-muted)] font-medium animate-pulse">Loading album details...</p>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] text-center p-6">
                <Disc size={64} className="text-[var(--foreground-muted)]/20 mb-6" />
                <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Album not found</h1>
                <p className="text-[var(--foreground-muted)] mb-8">The album you're looking for doesn't exist or was removed.</p>
                <button onClick={() => router.back()} className="px-8 py-3 bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-full font-bold hover:bg-[var(--card-hover)] transition-all">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Header Section */}
            <div className="relative pt-4 md:pt-20 pb-10 px-6 md:px-8 bg-[var(--background)]/50">
                <div className="absolute inset-x-0 top-0 h-96">
                    <img src={getImg(album.image)} className="w-full h-full object-cover blur-3xl opacity-20 saturate-150 scale-110" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />
                </div>

                <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-end">
                    <div className="relative group flex-shrink-0">
                        <div className="w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-[var(--border)] group-hover:border-[var(--foreground-muted)]/30 transition-all duration-500">
                            <img src={getImg(album.image)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={album.name} />
                        </div>
                        <div className="absolute inset-0 bg-[var(--background)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl pointer-events-none">
                            <Music className="text-[var(--foreground-muted)]/20 scale-[4]" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <span className="bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-cyan-500/20 mb-6 inline-block">
                            {album.type}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold text-[var(--foreground)] mb-6 leading-tight tracking-tight drop-shadow-xl">
                            {album.name}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-4 gap-x-8 text-[var(--foreground-muted)] font-semibold mb-8">
                            <div
                                className="flex items-center gap-3 cursor-pointer hover:text-cyan-400 transition-colors group"
                                onClick={() => album.artists?.primary?.[0] && router.push(`/artist/${album.artists.primary[0].id}`)}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border)] group-hover:border-cyan-400/50">
                                    <img src={album.artists?.primary?.[0]?.image?.[0]?.url || '/placeholder-artist.png'} className="w-full h-full object-cover" alt="" />
                                </div>
                                <span>{album.artists?.primary?.map((a: any) => a.name).join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={18} />
                                <span>{album.year}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Music size={18} />
                                <span>{album.songCount} Songs</span>
                            </div>
                            {album.language && (
                                <div className="flex items-center gap-2">
                                    <Globe size={18} />
                                    <span className="capitalize">{album.language}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => album.songs?.[0] && playTrack(album.songs[0], album.songs)}
                                className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <Play fill="currentColor" size={20} /> Play
                            </button>
                            <button className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-full text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all">
                                <Heart size={20} />
                            </button>
                            <button className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-full text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Songs List */}
            <div className="max-w-7xl mx-auto px-6 md:px-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[var(--foreground-muted)] text-xs font-bold uppercase tracking-widest border-b border-[var(--border)] mb-2">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-7 md:col-span-8">Title</div>
                    <div className="hidden md:flex col-span-2 items-center"><Clock size={14} className="mr-2" /> Duration</div>
                    <div className="col-span-4 md:col-span-1 text-right">Action</div>
                </div>

                <div className="space-y-1">
                    {album.songs?.map((song: any, index: number) => (
                        <div
                            key={song.id}
                            onClick={() => playTrack(song, album.songs)}
                            className="grid grid-cols-12 gap-4 items-center p-4 rounded-2xl hover:bg-[var(--card-hover)] border border-transparent hover:border-[var(--border)] group transition-all cursor-pointer"
                        >
                            <div className="col-span-1 text-center font-bold text-[var(--foreground-muted)]/50 group-hover:text-cyan-400 transition-colors">
                                {index + 1}
                            </div>
                            <div className="col-span-7 md:col-span-8">
                                <h3 className="font-bold text-[var(--foreground)] group-hover:text-cyan-400 transition-colors truncate">{song.name}</h3>
                                <p className="text-xs text-[var(--foreground-muted)] truncate mt-1">
                                    {song.artists?.primary?.map((a: any) => a.name).join(', ')}
                                </p>
                            </div>
                            <div className="hidden md:flex col-span-2 text-[var(--foreground-muted)] font-medium text-sm">
                                {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                            </div>
                            <div className="col-span-4 md:col-span-1 flex justify-end">
                                <button className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] group-hover:text-[var(--foreground-muted)] transition-all opacity-0 group-hover:opacity-100">
                                    <Heart size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {album.description && (
                    <div className="mt-16 p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)]">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">About this Album</h2>
                        <div className="text-[var(--foreground-muted)] leading-relaxed" dangerouslySetInnerHTML={{ __html: album.description }}></div>
                    </div>
                )}
            </div>
        </div>
    );
}
