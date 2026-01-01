"use client"
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight, Sparkles, Crown, Zap, Lock } from 'lucide-react';
import { AVATAR_LIBRARY, QUICK_AVATARS, PREMIUM_PROFILE_FEATURES, isFeatureAvailable } from '@/lib/avatarLibrary';

interface AvatarPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (avatarUrl: string) => void;
    selectedAvatar: string;
    tier?: string;
}

export default function AvatarPicker({ isOpen, onClose, onSelect, selectedAvatar, tier = 'NITRO_CORE' }: AvatarPickerProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);

    const categories = Object.entries(AVATAR_LIBRARY);

    const handleSelect = (url: string) => {
        onSelect(url);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                                <Sparkles className="text-cyan-400" size={20} />
                                Choose Your Avatar
                            </h2>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                Pick from our collection of 90+ unique avatars
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-[var(--card-hover)] hover:bg-red-500/20 text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                        {/* Category View */}
                        {!activeCategory ? (
                            <div className="space-y-6">
                                {/* Quick Selection */}
                                <div>
                                    <h3 className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-3">
                                        Quick Selection
                                    </h3>
                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                        {QUICK_AVATARS.map((avatar, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelect(avatar.url)}
                                                onMouseEnter={() => setHoveredAvatar(avatar.url)}
                                                onMouseLeave={() => setHoveredAvatar(null)}
                                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${selectedAvatar === avatar.url
                                                        ? 'border-cyan-400 scale-105 shadow-lg shadow-cyan-400/30'
                                                        : 'border-transparent hover:border-[var(--foreground-muted)]/30 opacity-70 hover:opacity-100'
                                                    }`}
                                            >
                                                <img src={avatar.url} className="w-full h-full object-cover" alt="" />
                                                {selectedAvatar === avatar.url && (
                                                    <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                                                        <div className="bg-cyan-400 rounded-full p-1">
                                                            <Check size={12} className="text-black" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Category Grid */}
                                <div>
                                    <h3 className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-3">
                                        Browse Categories
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {categories.map(([key, category]) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveCategory(key)}
                                                className="group relative p-4 rounded-2xl bg-[var(--card-hover)] hover:bg-[var(--background)] border border-[var(--border)] hover:border-[var(--foreground-muted)]/30 transition-all overflow-hidden"
                                            >
                                                {/* Preview avatars */}
                                                <div className="flex -space-x-2 mb-3 justify-center">
                                                    {category.avatars.slice(0, 3).map((url, i) => (
                                                        <img
                                                            key={i}
                                                            src={url}
                                                            className="w-8 h-8 rounded-full border-2 border-[var(--card)] object-cover"
                                                            alt=""
                                                        />
                                                    ))}
                                                    <div className="w-8 h-8 rounded-full bg-[var(--card)] border-2 border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--foreground-muted)]">
                                                        +{category.avatars.length - 3}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-[var(--foreground)] flex items-center justify-center gap-1">
                                                    {category.label}
                                                    <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                <div className="text-[10px] text-[var(--foreground-muted)]">
                                                    {category.avatars.length} avatars
                                                </div>
                                                {/* Gradient overlay on hover */}
                                                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Premium Features Teaser */}
                                {tier === 'NITRO_CORE' && (
                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/20">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Crown className="text-amber-400" size={20} />
                                            <span className="font-bold text-[var(--foreground)]">Unlock Premium Features</span>
                                        </div>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-3">
                                            Elite & Supreme members get banner gradients, glowing borders, animated effects, and exclusive badges!
                                        </p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-purple-500/20 rounded-lg text-[10px] font-bold text-purple-400">Glowing Borders</span>
                                            <span className="px-2 py-1 bg-amber-500/20 rounded-lg text-[10px] font-bold text-amber-400">Animated Effects</span>
                                            <span className="px-2 py-1 bg-pink-500/20 rounded-lg text-[10px] font-bold text-pink-400">Badges</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Single Category View */
                            <div className="space-y-4">
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-cyan-400 transition-colors"
                                >
                                    <ChevronRight size={16} className="rotate-180" />
                                    Back to Categories
                                </button>

                                <div>
                                    <h3 className={`text-lg font-bold bg-gradient-to-r ${AVATAR_LIBRARY[activeCategory].color} bg-clip-text text-transparent mb-4`}>
                                        {AVATAR_LIBRARY[activeCategory].label}
                                    </h3>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                        {AVATAR_LIBRARY[activeCategory].avatars.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelect(url)}
                                                onMouseEnter={() => setHoveredAvatar(url)}
                                                onMouseLeave={() => setHoveredAvatar(null)}
                                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${selectedAvatar === url
                                                        ? 'border-cyan-400 scale-105 shadow-lg shadow-cyan-400/30'
                                                        : 'border-transparent hover:border-[var(--foreground-muted)]/30 opacity-70 hover:opacity-100'
                                                    }`}
                                            >
                                                <img src={url} className="w-full h-full object-cover" alt="" />
                                                {selectedAvatar === url && (
                                                    <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                                                        <div className="bg-cyan-400 rounded-full p-1">
                                                            <Check size={12} className="text-black" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--card-hover)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {selectedAvatar && (
                                <>
                                    <img src={selectedAvatar} className="w-10 h-10 rounded-xl border border-[var(--border)]" alt="" />
                                    <span className="text-sm text-[var(--foreground-muted)]">Selected</span>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold text-sm hover:bg-cyan-300 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
