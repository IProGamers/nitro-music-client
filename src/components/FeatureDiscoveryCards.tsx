"use client";
import { useState, useEffect } from 'react';
import { X, Headphones, Download, Wand2, Radio, Sparkles, ChevronRight, Lock, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';

interface FeatureCard {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    borderColor: string;
    requiredTier: 'NITRO_CORE' | 'NITRO_ELITE' | 'NITRO_SUPREME';
    actionLabel: string;
}

// Tier hierarchy for comparison
const tierHierarchy: Record<string, number> = {
    'NITRO_CORE': 1,
    'NITRO_ELITE': 2,
    'NITRO_SUPREME': 3,
};

export default function FeatureDiscoveryCards() {
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();
    const { tier } = useSettings();

    useEffect(() => {
        // Load dismissed IDs from localStorage
        const saved = localStorage.getItem('nitro_dismissed_feature_ids');
        if (saved) {
            try {
                setDismissedIds(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse dismissed feature IDs', e);
            }
        }
        setIsLoaded(true);
    }, []);

    const dismissCard = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem('nitro_dismissed_feature_ids', JSON.stringify(newDismissed));
    };

    const dismissAll = () => {
        const allIds = ['offline', '3d-audio', 'audio-fx', 'dj-mode'];
        setDismissedIds(allIds);
        localStorage.setItem('nitro_dismissed_feature_ids', JSON.stringify(allIds));
    };

    // Check if user has access to a feature based on their tier
    const hasAccess = (requiredTier: string): boolean => {
        const userLevel = tierHierarchy[tier] || 1;
        const requiredLevel = tierHierarchy[requiredTier] || 1;
        return userLevel >= requiredLevel;
    };

    const allFeatures: FeatureCard[] = [
        {
            id: 'offline',
            icon: <Download size={24} className="text-emerald-400" />,
            title: 'Offline Playback',
            description: 'Download songs to play without internet. Free for everyone!',
            gradient: 'from-emerald-500/20 to-teal-500/20',
            borderColor: 'border-emerald-500/30',
            requiredTier: 'NITRO_CORE',
            actionLabel: 'Learn How'
        },
        {
            id: '3d-audio',
            icon: <Headphones size={24} className="text-purple-400" />,
            title: '3D Spatial Audio',
            description: 'Experience music in immersive 360° surround sound.',
            gradient: 'from-purple-500/20 to-indigo-500/20',
            borderColor: 'border-purple-500/30',
            requiredTier: 'NITRO_ELITE',
            actionLabel: hasAccess('NITRO_ELITE') ? 'Try Now' : 'Unlock with Elite'
        },
        {
            id: 'audio-fx',
            icon: <Wand2 size={24} className="text-cyan-400" />,
            title: 'Audio Effects',
            description: 'Transform your sound with Stadium, Club, Lo-Fi scenes.',
            gradient: 'from-cyan-500/20 to-blue-500/20',
            borderColor: 'border-cyan-500/30',
            requiredTier: 'NITRO_ELITE',
            actionLabel: hasAccess('NITRO_ELITE') ? 'Explore FX' : 'Unlock with Elite'
        },
        {
            id: 'dj-mode',
            icon: <Radio size={24} className="text-pink-400" />,
            title: 'DJ Mode',
            description: 'Mix tracks with crossfade, speed control & transitions.',
            gradient: 'from-pink-500/20 to-rose-500/20',
            borderColor: 'border-pink-500/30',
            requiredTier: 'NITRO_SUPREME',
            actionLabel: hasAccess('NITRO_SUPREME') ? 'Start DJing' : 'Unlock with Supreme'
        }
    ];

    const visibleFeatures = allFeatures.filter(f => !dismissedIds.includes(f.id));

    const handleCardClick = (feature: FeatureCard) => {
        // Mark as dismissed when clicked so it doesn't appear again
        dismissCard(feature.id);

        if (hasAccess(feature.requiredTier)) {
            // Has access - go to feature guide
            router.push(`/features/${feature.id}`);
        } else {
            // No access - go to upgrade page
            router.push('/upgrade');
        }
    };

    if (!isLoaded || visibleFeatures.length === 0) return null;

    return (
        <section className="mb-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Discover Nitro Features</h2>
                </div>
                <button
                    onClick={dismissAll}
                    className="flex items-center gap-1 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                    <X size={14} />
                    Dismiss All
                </button>
            </div>

            {/* Horizontal Scrolling Cards */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {visibleFeatures.map((feature) => {
                    const canAccess = hasAccess(feature.requiredTier);

                    return (
                        <div
                            key={feature.id}
                            onClick={() => handleCardClick(feature)}
                            className={`relative flex-shrink-0 w-[280px] md:w-[320px] p-5 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.borderColor} hover:border-opacity-80 transition-all duration-300 group cursor-pointer overflow-hidden`}
                        >
                            {/* Individual Dismiss Button */}
                            <button
                                onClick={(e) => dismissCard(feature.id, e)}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all z-20 opacity-0 group-hover:opacity-100"
                                title="Dismiss card"
                            >
                                <X size={14} />
                            </button>

                            {/* Background Glow Effect */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />

                            {/* Lock Badge for Locked Features */}
                            {!canAccess && (
                                <div className="absolute top-4 left-20 flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full border border-amber-500/30 z-10">
                                    <Lock size={10} className="text-amber-400" />
                                    <span className="text-[8px] font-bold text-amber-400 uppercase">
                                        {feature.requiredTier === 'NITRO_ELITE' ? 'Elite' : 'Supreme'}
                                    </span>
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`relative z-10 w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg ${!canAccess ? 'opacity-60' : ''}`}>
                                {feature.icon}
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <h3 className={`font-bold text-base text-[var(--foreground)] mb-1.5 ${!canAccess ? 'opacity-80' : ''}`}>
                                    {feature.title}
                                </h3>
                                <p className={`text-xs text-[var(--foreground-muted)] leading-relaxed mb-4 ${!canAccess ? 'opacity-70' : ''}`}>
                                    {feature.description}
                                </p>

                                <button className={`flex items-center gap-1.5 text-xs font-bold transition-colors group/btn ${canAccess
                                    ? 'text-cyan-400 hover:text-cyan-300'
                                    : 'text-amber-400 hover:text-amber-300'
                                    }`}>
                                    {!canAccess && <Crown size={12} />}
                                    {feature.actionLabel}
                                    <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
