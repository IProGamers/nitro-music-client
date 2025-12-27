"use client"
import { useStats } from '@/context/StatsContext';
import { Clock, Music, Flame, Trophy, TrendingUp } from 'lucide-react';

interface LiveStatsProps {
    variant?: 'compact' | 'full';
    className?: string;
}

const formatAllTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
};

export default function LiveStats({ variant = 'compact', className = '' }: LiveStatsProps) {
    const {
        sessionStats,
        formattedListeningTime,
        totalSongsPlayed,
        totalTimeAllTime,
        currentStreak,
        longestStreak
    } = useStats();

    if (variant === 'compact') {
        return (
            <div className={`p-4 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/20 ${className}`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                        <TrendingUp size={14} className="text-purple-400" />
                    </div>
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Live Stats</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-cyan-400" />
                        <div>
                            <p className="text-lg font-bold text-[var(--foreground)]">{formattedListeningTime}</p>
                            <p className="text-[9px] text-[var(--foreground-muted)] uppercase">Session</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Music size={14} className="text-emerald-400" />
                        <div>
                            <p className="text-lg font-bold text-[var(--foreground)]">{sessionStats.songsPlayed}</p>
                            <p className="text-[9px] text-[var(--foreground-muted)] uppercase">Songs</p>
                        </div>
                    </div>
                </div>

                {currentStreak > 1 && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2">
                        <Flame size={14} className="text-orange-400" />
                        <span className="text-xs text-[var(--foreground)]">
                            <span className="font-bold text-orange-400">{currentStreak} day</span> streak!
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // Full variant with more details
    return (
        <div className={`p-6 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 rounded-3xl border border-purple-500/20 ${className}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl">
                    <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-[var(--foreground)]">Live Listening Stats</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">Your music journey in real-time</p>
                </div>
            </div>

            {/* This Session */}
            <div className="mb-6">
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">This Session</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--card)] rounded-2xl">
                        <Clock size={18} className="text-cyan-400 mb-2" />
                        <p className="text-2xl font-bold text-[var(--foreground)]">{formattedListeningTime}</p>
                        <p className="text-[10px] text-[var(--foreground-muted)] uppercase">Listening Time</p>
                    </div>
                    <div className="p-4 bg-[var(--card)] rounded-2xl">
                        <Music size={18} className="text-emerald-400 mb-2" />
                        <p className="text-2xl font-bold text-[var(--foreground)]">{sessionStats.songsPlayed}</p>
                        <p className="text-[10px] text-[var(--foreground-muted)] uppercase">Songs Played</p>
                    </div>
                </div>
            </div>

            {/* Top Artists This Session */}
            {sessionStats.topArtists.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3">Top Artists Today</h4>
                    <div className="space-y-2">
                        {sessionStats.topArtists.slice(0, 3).map((artist, idx) => (
                            <div key={artist.name} className="flex items-center gap-3 p-2 bg-[var(--card)] rounded-xl">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-black' :
                                        idx === 1 ? 'bg-zinc-400 text-black' :
                                            'bg-amber-700 text-white'
                                    }`}>{idx + 1}</span>
                                <span className="flex-1 text-sm text-[var(--foreground)] truncate">{artist.name}</span>
                                <span className="text-xs text-[var(--foreground-muted)]">{artist.count} plays</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All-Time Stats */}
            <div className="mb-6">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">All Time</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--card)] rounded-2xl text-center">
                        <p className="text-2xl font-bold text-[var(--foreground)]">{totalSongsPlayed}</p>
                        <p className="text-[10px] text-[var(--foreground-muted)] uppercase">Total Songs</p>
                    </div>
                    <div className="p-4 bg-[var(--card)] rounded-2xl text-center">
                        <p className="text-2xl font-bold text-[var(--foreground)]">{formatAllTime(totalTimeAllTime)}</p>
                        <p className="text-[10px] text-[var(--foreground-muted)] uppercase">Total Time</p>
                    </div>
                </div>
            </div>

            {/* Streaks */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                    <Flame size={24} className="text-orange-400" />
                    <div>
                        <p className="font-bold text-[var(--foreground)]">{currentStreak} Day Streak</p>
                        <p className="text-[10px] text-[var(--foreground-muted)]">Keep it going!</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-400">
                        <Trophy size={14} />
                        <span className="text-sm font-bold">{longestStreak}</span>
                    </div>
                    <p className="text-[9px] text-[var(--foreground-muted)]">Best Streak</p>
                </div>
            </div>
        </div>
    );
}
