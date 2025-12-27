"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStats } from '@/context/StatsContext';
import { Trophy, Medal, Crown, Music, Clock, Flame, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface LeaderboardUser {
    uid: string;
    displayName: string;
    photoURL: string | null;
    songsPlayed: number;
    listeningTime: number;
    streak: number;
}

interface LeaderboardsPanelProps {
    className?: string;
}

export default function LeaderboardsPanel({ className = '' }: LeaderboardsPanelProps) {
    const { user, userProfile } = useAuth();
    const { totalSongsPlayed, totalTimeAllTime, currentStreak } = useStats();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [activeTab, setActiveTab] = useState<'songs' | 'time' | 'streak'>('songs');
    const [loading, setLoading] = useState(true);

    // Mock leaderboard data (in production, fetch from Firestore)
    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                // In production, this would query Firestore for user stats
                // For demo, we'll create mock data with current user included
                const mockUsers: LeaderboardUser[] = [
                    { uid: '1', displayName: 'MusicMaster', photoURL: null, songsPlayed: 2500, listeningTime: 360000, streak: 45 },
                    { uid: '2', displayName: 'BeatHunter', photoURL: null, songsPlayed: 1800, listeningTime: 280000, streak: 30 },
                    { uid: '3', displayName: 'SoundWave', photoURL: null, songsPlayed: 1200, listeningTime: 180000, streak: 21 },
                    { uid: '4', displayName: 'Audiophile99', photoURL: null, songsPlayed: 900, listeningTime: 120000, streak: 14 },
                    { uid: '5', displayName: 'VibeSeeker', photoURL: null, songsPlayed: 600, listeningTime: 90000, streak: 7 },
                ];

                // Add current user if authenticated
                if (user && userProfile) {
                    mockUsers.push({
                        uid: user.uid,
                        displayName: userProfile.displayName || 'You',
                        photoURL: userProfile.photoURL,
                        songsPlayed: totalSongsPlayed,
                        listeningTime: totalTimeAllTime,
                        streak: currentStreak
                    });
                }

                // Sort based on active tab
                mockUsers.sort((a, b) => {
                    if (activeTab === 'songs') return b.songsPlayed - a.songsPlayed;
                    if (activeTab === 'time') return b.listeningTime - a.listeningTime;
                    return b.streak - a.streak;
                });

                setLeaderboard(mockUsers.slice(0, 10));
            } catch (e) {
                console.error('Failed to fetch leaderboard:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [activeTab, user, userProfile, totalSongsPlayed, totalTimeAllTime, currentStreak]);

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        if (hours >= 24) return `${Math.floor(hours / 24)}d`;
        return `${hours}h`;
    };

    const getStatValue = (user: LeaderboardUser) => {
        if (activeTab === 'songs') return user.songsPlayed.toLocaleString();
        if (activeTab === 'time') return formatTime(user.listeningTime);
        return `${user.streak}d`;
    };

    const getRankIcon = (rank: number) => {
        if (rank === 0) return <Crown size={16} className="text-amber-400" />;
        if (rank === 1) return <Medal size={16} className="text-zinc-300" />;
        if (rank === 2) return <Medal size={16} className="text-orange-600" />;
        return <span className="text-xs font-bold text-[var(--foreground-muted)]">{rank + 1}</span>;
    };

    return (
        <div className={`bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                        <Trophy size={18} className="text-white" />
                    </div>
                    <h3 className="font-bold text-[var(--foreground)]">Leaderboards</h3>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {[
                    { id: 'songs', label: 'Songs', icon: Music },
                    { id: 'time', label: 'Time', icon: Clock },
                    { id: 'streak', label: 'Streak', icon: Flame }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                ? 'bg-purple-500 text-white'
                                : 'bg-[var(--card-hover)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                            }`}
                    >
                        <tab.icon size={12} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Leaderboard List */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="space-y-2">
                    {leaderboard.map((entry, index) => {
                        const isCurrentUser = user && entry.uid === user.uid;
                        return (
                            <div
                                key={entry.uid}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrentUser
                                        ? 'bg-purple-500/20 border border-purple-500/30'
                                        : 'bg-[var(--card-hover)] hover:bg-[var(--background)]'
                                    }`}
                            >
                                {/* Rank */}
                                <div className="w-6 flex items-center justify-center">
                                    {getRankIcon(index)}
                                </div>

                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                                    {entry.photoURL ? (
                                        <img src={entry.photoURL} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <span className="text-xs font-bold text-white">
                                            {entry.displayName?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-purple-400' : 'text-[var(--foreground)]'}`}>
                                        {isCurrentUser ? 'You' : entry.displayName}
                                    </p>
                                </div>

                                {/* Stat */}
                                <div className={`text-sm font-bold ${index === 0 ? 'text-amber-400' :
                                        index === 1 ? 'text-zinc-300' :
                                            index === 2 ? 'text-orange-500' :
                                                'text-[var(--foreground-muted)]'
                                    }`}>
                                    {getStatValue(entry)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
