"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { Music, Clock, Play, Heart, Loader2 } from 'lucide-react';
import Image from 'next/image';

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
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-cyan-400" size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Clock size={32} className="text-zinc-500" />
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter mb-2">History is Empty</h2>
                <p className="text-zinc-500 max-w-md">Please sign in to keep track of your recently played tracks across all devices.</p>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-12 py-8 pb-32 max-w-7xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-2xl flex items-center justify-center shrink-0">
                    <Clock size={80} className="text-white opacity-40" />
                </div>
                <div className="space-y-2 md:mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">Personal History</span>
                    <h1 className="text-4xl md:text-7xl font-bold text-white uppercase tracking-tighter leading-none">
                        Recently Played
                    </h1>
                    <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">
                        {recentSongs.length} Tracks played recently
                    </p>
                </div>
            </header>

            <div className="space-y-1">
                <div className="grid grid-cols-[auto,1fr,auto] md:grid-cols-[40px,1fr,1fr,auto] gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span className="hidden md:inline">#</span>
                    <span>Track</span>
                    <span className="hidden md:inline">Artist</span>
                    <span className="text-right">Played At</span>
                </div>

                {recentSongs.length > 0 ? (
                    recentSongs.map((item, idx) => (
                        <div
                            key={item.id}
                            className="group grid grid-cols-[auto,1fr,auto] md:grid-cols-[40px,1fr,1fr,auto] gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer items-center"
                            onClick={() => playTrack(item, recentSongs)}
                        >
                            <span className="hidden md:inline text-zinc-600 group-hover:text-cyan-400 font-bold text-xs">{idx + 1}</span>

                            <div className="flex items-center gap-4 min-w-0">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                                    <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Play size={20} fill="white" className="text-white" />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-white truncate text-sm md:text-base">{item.name}</p>
                                    <p className="text-xs text-zinc-500 md:hidden truncate">{item.artist}</p>
                                </div>
                            </div>

                            <span className="hidden md:inline text-zinc-400 text-sm font-medium truncate">{item.artist}</span>

                            <span className="text-right text-[10px] font-bold text-zinc-600 tabular-nums uppercase">
                                {item.playedAt?.toDate ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(item.playedAt.toDate()) : 'Recently'}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-zinc-600 font-bold uppercase tracking-widest">No play history found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
