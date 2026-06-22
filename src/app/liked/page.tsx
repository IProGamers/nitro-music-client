"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { Heart, Play, Shuffle, ArrowLeft, Loader2, Music } from 'lucide-react';
import SongContextMenu from '@/components/SongContextMenu';
import { decodeHtml } from '@/lib/utils';

export default function LikedSongsPage() {
    const router = useRouter();
    const { user, getLikedSongs } = useAuth();
    const { playTrack, currentSong, isPlaying } = usePlayer();
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        let cancelled = false;
        getLikedSongs()
            .then(s => { if (!cancelled) setSongs(s); })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user, getLikedSongs]);

    const shufflePlay = () => {
        if (songs.length === 0) return;
        const shuffled = [...songs].sort(() => Math.random() - 0.5);
        playTrack(shuffled[0], shuffled);
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <Heart size={40} className="text-[var(--foreground-muted)] mb-4" />
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Your Liked Songs</h1>
                <p className="text-[var(--foreground-muted)] text-sm mb-6">Sign in to see the songs you&apos;ve liked.</p>
                <button onClick={() => router.push('/auth')} className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-[#04161a] font-semibold text-sm">Sign In</button>
            </div>
        );
    }

    return (
        <div className="pb-32">
            {/* Gradient header */}
            <div className="relative px-4 md:px-8 pt-4 pb-6 bg-gradient-to-b from-indigo-600/50 via-purple-700/20 to-transparent">
                <button onClick={() => router.back()} className="mb-6 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-[var(--foreground)] hover:bg-black/50 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-end gap-4 md:gap-6">
                    <div className="w-32 h-32 md:w-52 md:h-52 rounded-lg shadow-2xl bg-gradient-to-br from-indigo-400 to-purple-700 flex items-center justify-center shrink-0">
                        <Heart size={56} className="text-white md:w-20 md:h-20" fill="white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)]">Playlist</p>
                        <h1 className="text-3xl md:text-6xl font-bold text-[var(--foreground)] tracking-tight leading-tight mb-2">Liked Songs</h1>
                        <p className="text-sm text-[var(--foreground-secondary)]">{songs.length} song{songs.length === 1 ? '' : 's'}</p>
                    </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-5 mt-6">
                    <button
                        onClick={() => songs.length > 0 && playTrack(songs[0], songs)}
                        disabled={songs.length === 0}
                        className="w-14 h-14 rounded-full bg-[var(--accent)] text-[#04161a] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
                    >
                        <Play size={26} fill="#04161a" className="ml-0.5" />
                    </button>
                    <button onClick={shufflePlay} disabled={songs.length === 0} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors">
                        <Shuffle size={22} />
                    </button>
                </div>
            </div>

            {/* Song list */}
            <div className="px-2 md:px-8 lg:px-12 max-w-6xl mt-2">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[var(--accent)]" /></div>
                ) : songs.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center text-[var(--foreground-muted)]">
                        <Heart size={40} className="mb-3 opacity-50" />
                        <p className="text-sm">Songs you like will collect here. Tap the heart on any track.</p>
                    </div>
                ) : (
                    songs.map((song, idx) => {
                        const isCurrent = String(currentSong?.id) === String(song.id);
                        return (
                            <div
                                key={`liked-${song.id || idx}`}
                                onClick={() => playTrack(song, songs)}
                                className="group flex items-center gap-3.5 p-2.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                            >
                                <span className="w-5 text-center text-sm text-[var(--foreground-muted)] hidden md:block">{idx + 1}</span>
                                <div className="relative w-11 h-11 flex-shrink-0">
                                    {song.image ? (
                                        <img src={song.image} alt="" className="w-full h-full rounded-md object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }} />
                                    ) : <div className="w-full h-full rounded-md bg-[var(--surface)] flex items-center justify-center text-[var(--foreground-muted)]"><Music size={16} /></div>}
                                    <div className="absolute inset-0 rounded-md bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Play size={14} fill="white" className="text-white ml-0.5" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-medium text-sm truncate ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>{decodeHtml(song.name)}</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{decodeHtml(song.artist)}</p>
                                </div>
                                <div onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity">
                                    <SongContextMenu song={song} queue={songs} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
