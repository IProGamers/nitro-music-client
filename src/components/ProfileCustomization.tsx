"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Crown, Lock, Check, Palette, CircleDot, Award, Wand2, Layers } from 'lucide-react';
import { PREMIUM_PROFILE_FEATURES, isFeatureAvailable } from '@/lib/avatarLibrary';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ProfileCustomizationProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: {
        bannerGradient?: string;
        borderEffect?: string;
        badge?: string;
        avatarEffect?: string;
    };
    onSave: (settings: {
        bannerGradient?: string;
        borderEffect?: string;
        badge?: string;
        avatarEffect?: string;
    }) => void;
}

export default function ProfileCustomization({
    isOpen,
    onClose,
    currentSettings,
    onSave
}: ProfileCustomizationProps) {
    const { tier } = useSettings();
    const { userProfile } = useAuth();

    const [activeTab, setActiveTab] = useState<'borders' | 'badges' | 'effects'>('borders');
    const [selectedBanner, setSelectedBanner] = useState(currentSettings.bannerGradient || '');
    const [selectedBorder, setSelectedBorder] = useState(currentSettings.borderEffect || 'none');
    const [selectedBadge, setSelectedBadge] = useState(currentSettings.badge || '');
    const [selectedEffect, setSelectedEffect] = useState(currentSettings.avatarEffect || 'none');

    // Update local state when currentSettings change
    useEffect(() => {
        setSelectedBanner(currentSettings.bannerGradient || '');
        setSelectedBorder(currentSettings.borderEffect || 'none');
        setSelectedBadge(currentSettings.badge || '');
        setSelectedEffect(currentSettings.avatarEffect || 'none');
    }, [currentSettings]);

    const tabs = [
        { id: 'borders' as const, label: 'Borders', icon: CircleDot, minTier: 'Elite' },
        { id: 'badges' as const, label: 'Badges', icon: Award, minTier: 'Supreme' },
        { id: 'effects' as const, label: 'Effects', icon: Wand2, minTier: 'Supreme' },
    ];

    const handleSave = () => {
        onSave({
            bannerGradient: selectedBanner,
            borderEffect: selectedBorder,
            badge: selectedBadge,
            avatarEffect: selectedEffect,
        });
        onClose();
    };

    // Binary access model: approved users get all customization options.
    const isEliteOrAbove = true;
    const isSupreme = true;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="relative w-full max-w-lg md:max-w-2xl bg-[var(--background)] border border-[var(--border)] rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)] px-4 md:px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                    <Sparkles size={20} className="text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--foreground)]">Customize Profile</h2>
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        {isEliteOrAbove ? 'Make your profile unique' : 'Upgrade to unlock'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-[var(--card-hover)] text-[var(--foreground-muted)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mt-4 overflow-x-auto no-scrollbar">
                            {tabs.map((tab) => {
                                const TabIcon = tab.icon;
                                const isLocked = !isFeatureAvailable(tab.id, tier);
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => !isLocked && setActiveTab(tab.id)}
                                        disabled={isLocked}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                                            ? 'bg-cyan-400 text-black'
                                            : isLocked
                                                ? 'bg-[var(--card)] text-[var(--foreground-muted)] opacity-60'
                                                : 'bg-[var(--card)] text-[var(--foreground-muted)] hover:bg-[var(--card-hover)]'
                                            }`}
                                    >
                                        {isLocked ? <Lock size={12} /> : <TabIcon size={12} />}
                                        {tab.label}
                                        {isLocked && (
                                            <span className="text-[8px] uppercase px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                                {tab.minTier}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-6 overflow-y-auto max-h-[50vh]">
                        {/* Not Elite - Show Upgrade Prompt */}
                        {!isEliteOrAbove && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-amber-500/20 flex items-center justify-center">
                                    <Crown size={32} className="text-amber-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Upgrade to Unlock</h3>
                                <p className="text-sm text-[var(--foreground-muted)] mb-4">
                                    Get Elite or Supreme to customize your profile with borders, badges, and effects!
                                </p>
                                <Link
                                    href="/upgrade"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-opacity"
                                >
                                    <Crown size={16} />
                                    View Plans
                                </Link>
                            </div>
                        )}


                        {/* Border Effects Tab */}
                        {isEliteOrAbove && activeTab === 'borders' && (
                            <div className="space-y-4">
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    Add a glowing border effect to your avatar
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {PREMIUM_PROFILE_FEATURES.borderEffects.map((border) => (
                                        <button
                                            key={border.id}
                                            onClick={() => setSelectedBorder(border.id)}
                                            className={`relative p-4 rounded-xl border-2 transition-all ${selectedBorder === border.id
                                                ? 'border-cyan-400 bg-cyan-400/10'
                                                : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--card)]'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 ${border.class}`} />
                                                <span className="text-xs font-bold">{border.label}</span>
                                            </div>
                                            {selectedBorder === border.id && (
                                                <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center">
                                                    <Check size={10} className="text-black" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Badges Tab (Supreme only) */}
                        {isEliteOrAbove && activeTab === 'badges' && (
                            <div className="space-y-4">
                                {!isSupreme ? (
                                    <div className="text-center py-6">
                                        <Lock size={32} className="mx-auto mb-2 text-amber-400" />
                                        <p className="text-sm text-[var(--foreground-muted)]">
                                            Badges are exclusive to Supreme members
                                        </p>
                                        <Link href="/upgrade" className="text-cyan-400 text-sm font-bold hover:underline">
                                            Upgrade to Supreme
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-[var(--foreground-muted)]">
                                            Choose a badge to display on your profile
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {/* None option */}
                                            <button
                                                onClick={() => setSelectedBadge('')}
                                                className={`relative p-3 rounded-xl border-2 transition-all ${selectedBadge === ''
                                                    ? 'border-cyan-400 bg-cyan-400/10'
                                                    : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--card)]'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--card-hover)] flex items-center justify-center text-lg">
                                                        ✕
                                                    </div>
                                                    <span className="text-[10px] font-bold">None</span>
                                                </div>
                                            </button>

                                            {PREMIUM_PROFILE_FEATURES.badges.map((badge) => (
                                                <button
                                                    key={badge.id}
                                                    onClick={() => setSelectedBadge(badge.id)}
                                                    className={`relative p-3 rounded-xl border-2 transition-all ${selectedBadge === badge.id
                                                        ? 'border-cyan-400 bg-cyan-400/10'
                                                        : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--card)]'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className={`w-8 h-8 rounded-full ${badge.color} flex items-center justify-center text-white text-lg`}>
                                                            {badge.emoji}
                                                        </div>
                                                        <span className="text-[10px] font-bold">{badge.label}</span>
                                                    </div>
                                                    {selectedBadge === badge.id && (
                                                        <div className="absolute top-1 right-1 w-3 h-3 bg-cyan-400 rounded-full flex items-center justify-center">
                                                            <Check size={8} className="text-black" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Avatar Effects Tab (Supreme only) */}
                        {isEliteOrAbove && activeTab === 'effects' && (
                            <div className="space-y-4">
                                {!isSupreme ? (
                                    <div className="text-center py-6">
                                        <Lock size={32} className="mx-auto mb-2 text-amber-400" />
                                        <p className="text-sm text-[var(--foreground-muted)]">
                                            Avatar effects are exclusive to Supreme members
                                        </p>
                                        <Link href="/upgrade" className="text-cyan-400 text-sm font-bold hover:underline">
                                            Upgrade to Supreme
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-[var(--foreground-muted)]">
                                            Add an animation effect to your avatar
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {PREMIUM_PROFILE_FEATURES.avatarEffects.map((effect) => (
                                                <button
                                                    key={effect.id}
                                                    onClick={() => setSelectedEffect(effect.id)}
                                                    className={`relative p-4 rounded-xl border-2 transition-all ${selectedEffect === effect.id
                                                        ? 'border-cyan-400 bg-cyan-400/10'
                                                        : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--card)]'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 ${effect.class || ''}`} />
                                                        <span className="text-xs font-bold">{effect.label}</span>
                                                    </div>
                                                    {selectedEffect === effect.id && (
                                                        <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center">
                                                            <Check size={10} className="text-black" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {isEliteOrAbove && (
                        <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)] px-4 md:px-6 py-4">
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground-muted)] font-bold text-sm hover:bg-[var(--card)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-3 rounded-xl bg-cyan-400 text-black font-bold text-sm hover:bg-cyan-300 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
