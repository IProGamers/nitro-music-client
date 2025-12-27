"use client"
import { useStats } from '@/context/StatsContext';
import {
    Trophy, Music, Clock, Flame, Star, Headphones, Heart,
    Zap, Award, Target, Crown, Disc, Radio, Volume2
} from 'lucide-react';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: any;
    requirement: number;
    currentProgress: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    unlocked: boolean;
}

interface AchievementsPanelProps {
    className?: string;
}

export default function AchievementsPanel({ className = '' }: AchievementsPanelProps) {
    const { totalSongsPlayed, totalTimeAllTime, currentStreak, longestStreak, sessionStats } = useStats();

    const achievements: Achievement[] = [
        {
            id: 'first_song',
            name: 'First Steps',
            description: 'Play your first song',
            icon: Music,
            requirement: 1,
            currentProgress: totalSongsPlayed,
            tier: 'bronze',
            unlocked: totalSongsPlayed >= 1
        },
        {
            id: 'songs_50',
            name: 'Music Explorer',
            description: 'Play 50 songs',
            icon: Disc,
            requirement: 50,
            currentProgress: totalSongsPlayed,
            tier: 'silver',
            unlocked: totalSongsPlayed >= 50
        },
        {
            id: 'songs_500',
            name: 'Audiophile',
            description: 'Play 500 songs',
            icon: Headphones,
            requirement: 500,
            currentProgress: totalSongsPlayed,
            tier: 'gold',
            unlocked: totalSongsPlayed >= 500
        },
        {
            id: 'songs_1000',
            name: 'Music Legend',
            description: 'Play 1000 songs',
            icon: Crown,
            requirement: 1000,
            currentProgress: totalSongsPlayed,
            tier: 'platinum',
            unlocked: totalSongsPlayed >= 1000
        },
        {
            id: 'time_1h',
            name: 'Hour Power',
            description: 'Listen for 1 hour total',
            icon: Clock,
            requirement: 3600,
            currentProgress: totalTimeAllTime,
            tier: 'bronze',
            unlocked: totalTimeAllTime >= 3600
        },
        {
            id: 'time_24h',
            name: 'Day Dreamer',
            description: 'Listen for 24 hours total',
            icon: Star,
            requirement: 86400,
            currentProgress: totalTimeAllTime,
            tier: 'gold',
            unlocked: totalTimeAllTime >= 86400
        },
        {
            id: 'streak_3',
            name: 'Streak Starter',
            description: 'Maintain a 3-day streak',
            icon: Flame,
            requirement: 3,
            currentProgress: longestStreak,
            tier: 'bronze',
            unlocked: longestStreak >= 3
        },
        {
            id: 'streak_7',
            name: 'Week Warrior',
            description: 'Maintain a 7-day streak',
            icon: Zap,
            requirement: 7,
            currentProgress: longestStreak,
            tier: 'silver',
            unlocked: longestStreak >= 7
        },
        {
            id: 'streak_30',
            name: 'Monthly Master',
            description: 'Maintain a 30-day streak',
            icon: Trophy,
            requirement: 30,
            currentProgress: longestStreak,
            tier: 'platinum',
            unlocked: longestStreak >= 30
        }
    ];

    const tierColors = {
        bronze: { bg: 'from-orange-700 to-orange-900', border: 'border-orange-500/30', text: 'text-orange-400' },
        silver: { bg: 'from-zinc-400 to-zinc-600', border: 'border-zinc-400/30', text: 'text-zinc-300' },
        gold: { bg: 'from-amber-500 to-yellow-600', border: 'border-amber-400/30', text: 'text-amber-400' },
        platinum: { bg: 'from-cyan-400 to-purple-500', border: 'border-cyan-400/30', text: 'text-cyan-400' }
    };

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className={`${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                        <Trophy size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--foreground)]">Achievements</h3>
                        <p className="text-xs text-[var(--foreground-muted)]">{unlockedCount}/{achievements.length} unlocked</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="h-2 bg-[var(--card)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
                        style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-3 gap-3">
                {achievements.map(achievement => {
                    const IconComponent = achievement.icon;
                    const colors = tierColors[achievement.tier];
                    const progress = Math.min((achievement.currentProgress / achievement.requirement) * 100, 100);

                    return (
                        <div
                            key={achievement.id}
                            className={`relative p-4 rounded-2xl border transition-all ${achievement.unlocked
                                    ? `bg-gradient-to-br ${colors.bg} border-transparent shadow-lg`
                                    : `bg-[var(--card)] ${colors.border} opacity-60`
                                }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className={`p-2 rounded-full ${achievement.unlocked ? 'bg-white/20' : 'bg-[var(--card-hover)]'} mb-2`}>
                                    <IconComponent size={18} className={achievement.unlocked ? 'text-white' : colors.text} />
                                </div>
                                <p className={`text-[10px] font-bold ${achievement.unlocked ? 'text-white' : 'text-[var(--foreground)]'} truncate w-full`}>
                                    {achievement.name}
                                </p>
                                {!achievement.unlocked && (
                                    <div className="w-full mt-2">
                                        <div className="h-1 bg-[var(--background)] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${colors.bg}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-[8px] text-[var(--foreground-muted)] mt-1">
                                            {Math.floor(progress)}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
