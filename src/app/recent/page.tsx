"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { Music, Clock, Play, Heart, Loader2, PlayCircle, MoreHorizontal, ChevronRight } from 'lucide-react';
import SongContextMenu from '@/components/SongContextMenu';

export default function RecentPlaysPage() {
    const { user, getRecentPlays } = useAuth();
    const { playTrack } = usePlayer();
    const [recentSongs, setRecentSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadRecent();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadRecent = async () => {
        setLoading(true);
        try {
            const data = await getRecentPlays(50);
            setRecentSongs(data);
        } catch (err) {
            console.error('Failed to load recent plays:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <div className="w-10 h-10 border-2 border-cyan-400/20 rounded-full animate-spin border-t-cyan-400"></div>
                <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest animate-pulse">Syncing Library</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-gradient-to-b from-purple-500/5 to-transparent">
                <div className="w-16 h-16 rounded-3xl bg-[var(--card)] flex items-center justify-center mb-6 shadow-xl border border-[var(--border)]">
                    <Clock size={28} className="text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] uppercase tracking-tighter mb-2">History empty</h2>
                <p className="text-[var(--foreground-muted)] max-w-sm text-xs opacity-70">Sign in to sync your listening history across devices.</p>
            </div>
        );
    }

    const decodeHtml = (html: string): string => {
        if (!html || typeof window === 'undefined') return html || '';
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Minimal Header - Much more balanced scale */}
            <div className="bg-gradient-to-b from-cyan-400/5 via-transparent to-transparent">
                <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                        {/* Compact Icon Card */}
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-3xl shadow-xl flex items-center justify-center ring-1 ring-white/10 shrink-0">
                            <Clock size={40} className="text-white drop-shadow-lg" />
                        </div>

                        {/* Title Section */}
                        <div className="text-center md:text-left space-y-1">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">Nitro Playback</span>
                                <span className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">{recentSongs.length} TRACKS</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-[var(--foreground)] uppercase tracking-tighter leading-none">
                                Recently <span className="text-cyan-400">Played</span>
                            </h1>
                            <p className="text-[10px] md:text-xs text-[var(--foreground-muted)] uppercase font-medium tracking-wide opacity-60">Revisit your favorite moments from your recent listening journey</p>

                            <div className="pt-2">
                                <button
                                    onClick={() => recentSongs[0] && playTrack(recentSongs[0], recentSongs)}
                                    className="h-10 px-6 bg-cyan-400 hover:bg-cyan-300 text-black rounded-full font-black text-[10px] uppercase tracking-widest transition-all transform active:scale-95 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                                >
                                    <Play size={14} fill="black" />
                                    Play History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Layout: 1 col on mobile, 2 cols on PC */}
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {recentSongs.length > 0 ? (
                        recentSongs.map((item, idx) => (
                            <div
                                key={`recent-${item.id || idx}`}
                                className="group flex items-center gap-3 p-2 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-2xl cursor-pointer transition-all border border-[var(--border)] active:scale-[0.98] h-16 md:h-18 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-400/5"
                                onClick={() => playTrack(item, recentSongs)}
                            >
                                {/* Compact Artwork */}
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shrink-0 shadow-md relative">
                                    <img
                                        src={item.image || '/logo.png'}
                                        alt=""
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e: any) => e.target.src = '/logo.png'}
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <PlayCircle size={20} className="text-cyan-400" />
                                    </div>
                                </div>

                                {/* Track Info - Small Sizes */}
                                <div className="flex-1 min-w-0 pr-1">
                                    <h3 className="font-bold text-[10px] md:text-[11px] text-[var(--foreground)] truncate group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{decodeHtml(item.name || item.title)}</h3>
                                    <p className="text-[8px] md:text-[10px] text-[var(--foreground-muted)] truncate mt-0.5 uppercase tracking-wide opacity-70">{decodeHtml(item.artist)}</p>
                                </div>

                                {/* Played Time / Context */}
                                <div className="flex flex-col items-end gap-1 px-1">
                                    <span className="text-[9px] font-black text-[var(--foreground-muted)] tabular-nums uppercase opacity-50 group-hover:opacity-100 group-hover:text-cyan-400 transition-all">
                                        {item.playedAt?.toDate ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(item.playedAt.toDate()) : 'Now'}
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <SongContextMenu song={item} queue={recentSongs} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 text-center space-y-3 opacity-30">
                            <Music size={32} className="mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Silence is deafening</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
