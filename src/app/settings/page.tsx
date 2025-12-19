"use client"
import { useSettings, SubscriptionTier } from '@/context/SettingsContext';
import { Download, Headphones, ToggleLeft, ToggleRight, Settings, Lock, Crown, Zap, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Define feature access per tier
const TIER_FEATURES = {
    NITRO_CORE: {
        audio3D: false,
        download: false,
        supremeQuality: false,
        visualizer: false,
        themes: false,
    },
    NITRO_ELITE: {
        audio3D: true,
        download: false,
        supremeQuality: false,
        visualizer: true,
        themes: true,
    },
    NITRO_SUPREME: {
        audio3D: true,
        download: true,
        supremeQuality: true,
        visualizer: true,
        themes: true,
    }
};

const TIER_INFO: Record<SubscriptionTier, { name: string; icon: React.ReactNode; color: string; gradient: string }> = {
    NITRO_CORE: { name: 'Nitro Core', icon: <Star size={20} />, color: 'text-zinc-400', gradient: 'from-zinc-600 to-zinc-800' },
    NITRO_ELITE: { name: 'Nitro Elite', icon: <Zap size={20} />, color: 'text-purple-400', gradient: 'from-purple-600 to-indigo-600' },
    NITRO_SUPREME: { name: 'Nitro Supreme', icon: <Crown size={20} />, color: 'text-amber-400', gradient: 'from-amber-500 to-orange-600' },
};

// Legacy fallback for NITRO_ULTRA in TIER_FEATURES
const TIER_FEATURES_EXTENDED: Record<string, typeof TIER_FEATURES.NITRO_CORE> = {
    ...TIER_FEATURES,
    NITRO_ULTRA: TIER_FEATURES.NITRO_SUPREME, // Map legacy tier
};

import { useTheme } from '@/context/ThemeContext';
import { Palette, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
    const {
        enableDownload, setEnableDownload,
        enable3DAudio, setEnable3DAudio,
        tier
    } = useSettings();

    const { theme, toggleTheme } = useTheme();

    // Handle legacy NITRO_ULTRA by mapping to NITRO_SUPREME
    const effectiveTier = (tier as string) === 'NITRO_ULTRA' ? 'NITRO_SUPREME' : tier;
    const features = TIER_FEATURES_EXTENDED[tier as string] || TIER_FEATURES.NITRO_CORE;
    const tierInfo = TIER_INFO[effectiveTier as keyof typeof TIER_INFO] || TIER_INFO.NITRO_CORE;

    const LockedOverlay = ({ requiredTier }: { requiredTier: string }) => (
        <Link href="/upgrade" className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 cursor-pointer hover:bg-black/50 transition-colors">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <Lock size={24} className="text-amber-400" />
                </div>
                <p className="text-sm text-zinc-300 font-medium">Requires {requiredTier}</p>
                <p className="text-xs text-cyan-400 mt-1 font-medium">Tap to Upgrade</p>
            </div>
        </Link>
    );

    return (
        <div className="p-6 md:p-8 pb-32 pt-20 md:pt-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Settings size={32} className="text-cyan-400" /> Settings
                </h1>
                <p className="text-[var(--foreground-secondary)]">Manage your playback and app preferences</p>
            </div>

            {/* Current Plan Badge */}
            <div className={`mb-8 p-6 rounded-2xl bg-gradient-to-r ${tierInfo.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        {tierInfo.icon}
                    </div>
                    <div>
                        <p className="text-white/70 text-sm">Current Plan</p>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {tierInfo.name}
                            <Sparkles size={20} className="text-white/80" />
                        </h2>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Appearance Settings */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
                    {!features.themes && <LockedOverlay requiredTier="Nitro Elite" />}
                    <h2 className="text-xl font-bold mb-6">Appearance</h2>

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
                                {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                            </div>
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    Exclusive Themes
                                    {!features.themes && <Lock size={14} className="text-amber-400" />}
                                </h3>
                                <p className="text-sm text-[var(--foreground-secondary)]">Switch between Light and Dark mode</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                                {theme === 'dark' ? 'Dark' : 'Light'}
                            </span>
                            <button
                                onClick={() => features.themes && toggleTheme()}
                                className={`transition-all duration-300 ${features.themes ? (theme === 'light' ? 'text-amber-500' : 'text-zinc-600') : 'text-zinc-700 cursor-not-allowed'}`}
                                disabled={!features.themes}
                            >
                                {theme === 'light' && features.themes ? <ToggleRight size={40} fill="currentColor" /> : <ToggleLeft size={40} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Playback Settings */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden transition-colors">
                    {!features.audio3D && <LockedOverlay requiredTier="Nitro" />}
                    <h2 className="text-xl font-bold mb-6">Playback</h2>

                    {/* 3D Audio Toggle */}
                    <div className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                <Headphones size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    3D Audio Effect
                                    {!features.audio3D && <Lock size={14} className="text-amber-400" />}
                                </h3>
                                <p className="text-sm text-[var(--foreground-secondary)]">Immersive spatial audio experience</p>
                            </div>
                        </div>
                        <button
                            onClick={() => features.audio3D && setEnable3DAudio(!enable3DAudio)}
                            className={`transition-colors ${features.audio3D ? (enable3DAudio ? 'text-cyan-400' : 'text-zinc-600') : 'text-zinc-700 cursor-not-allowed'}`}
                            disabled={!features.audio3D}
                        >
                            {enable3DAudio && features.audio3D ? <ToggleRight size={40} fill="currentColor" /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                </div>

                {/* Download Settings */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden transition-colors">
                    {!features.download && <LockedOverlay requiredTier="Nitro Elite" />}
                    <h2 className="text-xl font-bold mb-6">Downloads</h2>

                    {/* Download Toggle */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                <Download size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    Enable Downloads
                                    {!features.download && <Lock size={14} className="text-amber-400" />}
                                </h3>
                                <p className="text-sm text-[var(--foreground-secondary)]">Show download button in player</p>
                            </div>
                        </div>
                        <button
                            onClick={() => features.download && setEnableDownload(!enableDownload)}
                            className={`transition-colors ${features.download ? (enableDownload ? 'text-cyan-400' : 'text-zinc-600') : 'text-zinc-700 cursor-not-allowed'}`}
                            disabled={!features.download}
                        >
                            {enableDownload && features.download ? <ToggleRight size={40} fill="currentColor" /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                </div>

                {/* Tier Comparison */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 text-[var(--foreground)]">Compare Plans</h2>
                    <div className="grid gap-4">
                        {(['NITRO_CORE', 'NITRO_ELITE', 'NITRO_SUPREME'] as SubscriptionTier[]).map((t) => {
                            const info = TIER_INFO[t];
                            const isActive = tier === t;
                            return (
                                <div
                                    key={t}
                                    className={`p-4 rounded-xl border transition-all ${isActive
                                        ? `bg-gradient-to-r ${info.gradient} border-transparent`
                                        : 'bg-[var(--card-hover)] border-[var(--border)] hover:bg-[var(--border)]'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-[var(--card)]'}`}>
                                                {info.icon}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${isActive ? 'text-white' : info.color}`}>
                                                    {info.name}
                                                </h3>
                                                <p className={`text-xs ${isActive ? 'text-white/80' : 'text-[var(--foreground-muted)]'}`}>
                                                    {t === 'NITRO_CORE' && 'Basic features'}
                                                    {t === 'NITRO_ELITE' && '3D Audio, Visualizer'}
                                                    {t === 'NITRO_SUPREME' && 'All features unlocked'}
                                                </p>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center text-xs text-[var(--foreground-muted)] mt-12">
                    Nitro Music App v1.0.0
                </div>
            </div>
        </div>
    )
}
