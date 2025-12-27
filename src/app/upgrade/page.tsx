"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Crown, ArrowLeft, ExternalLink,
    Headphones, Download, Music, Eye, MessageCircle, Gift, Sparkles,
    Zap, Mic2, Radio, Repeat, Shuffle, Share2, Layers, Clock, Speaker
} from 'lucide-react';
import { TextShimmer } from '@/components/ui/text-shimmer';

// Instagram Icon Component
const InstagramIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

const featureCategories = [
    {
        name: "Pro Audio",
        items: [
            { icon: Headphones, label: '3D Spatial Audio' },
            { icon: Speaker, label: 'Scene Modes (Club, Stadium)' },
            { icon: Music, label: 'Lossless Quality' },
            { icon: Mic2, label: 'Synced Lyrics' },
        ]
    },
    {
        name: "Creative Tools",
        items: [
            { icon: Radio, label: 'DJ Mode Mixing' },
            { icon: Eye, label: 'Pro Visualizers' },
            { icon: Repeat, label: 'A-B Looping' },
            { icon: Share2, label: 'Shareable Cards' },
        ]
    },
    {
        name: "Power User",
        items: [
            { icon: Shuffle, label: 'AI Smart Shuffle' },
            { icon: Download, label: 'Offline Downloads' },
            { icon: Clock, label: 'Sleep Timer' },
            { icon: Zap, label: 'Haptic Feedback' },
        ]
    }
];

export default function UpgradePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative overflow-y-auto overflow-x-hidden pb-10">
            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-cyan-500/10 via-purple-500/10 to-transparent rounded-full blur-[100px]" />
            </div>

            {/* Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all text-sm font-medium shadow-lg"
                >
                    <ArrowLeft size={16} />
                    Back
                </Link>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">

                {/* Header Section */}
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    >
                        <Crown size={36} className="text-cyan-400" />
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
                        NITRO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">PREMIUM</span>
                    </h1>

                    <TextShimmer
                        className="text-base md:text-lg font-medium [--base-color:var(--foreground-muted)] [--base-gradient-color:theme(colors.cyan.400)]"
                        duration={3}
                    >
                        Unlock the full potential of your sound
                    </TextShimmer>
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                    className="grid gap-6 mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {featureCategories.map((category, idx) => (
                        <div key={category.name} className="bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-5 text-left">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-4 ml-1">{category.name}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {category.items.map((item) => (
                                    <div key={item.label} className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all">
                                            <item.icon size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-cyan-400 transition-colors">
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Feature Comparison Table */}
                <motion.div
                    className="mb-16 bg-[var(--card)]/30 border border-[var(--border)] rounded-3xl p-6 md:p-8 overflow-x-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h2 className="text-xl md:text-2xl font-bold mb-8">Compare Features</h2>

                    <div className="grid grid-cols-4 gap-4 md:gap-8 text-left min-w-[500px]">
                        {/* Headers */}
                        <div className="col-span-1 flex flex-col justify-end pb-4 font-bold text-lg">Feature</div>
                        <div className="flex flex-col items-center pb-4 text-[var(--foreground)]">
                            <span className="font-bold text-lg">Core</span>
                            <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">Free</span>
                        </div>
                        <div className="flex flex-col items-center pb-4 text-purple-400">
                            <span className="font-bold text-lg">Elite</span>
                            <span className="text-xs text-purple-400/70 uppercase tracking-wider">Plus</span>
                        </div>
                        <div className="flex flex-col items-center pb-4 text-amber-400">
                            <span className="font-bold text-lg">Supreme</span>
                            <span className="text-xs text-amber-400/70 uppercase tracking-wider">Pro</span>
                        </div>

                        {/* Rows */}
                        {[
                            { label: 'Ad-Free Music', core: 'No', elite: 'Yes', supreme: 'Yes' },
                            { label: 'Audio Quality', core: 'Standard', elite: 'High + 3D', supreme: 'Lossless' },
                            { label: 'Visualizer', core: '3/day', elite: 'Unlimited', supreme: 'Unlimited' },
                            { label: 'DJ Mode', core: '1/day', elite: 'Unlimited', supreme: 'Unlimited' },
                            { label: 'Downloads', core: '5/mo', elite: '100/mo', supreme: 'Unlimited' },
                            { label: 'Share Card Themes', core: 'Modern', elite: 'Modern + Holo', supreme: 'All Themes' },
                            { label: 'Unlimited Skips', core: '6/hr', elite: 'Unlimited', supreme: 'Unlimited' },
                        ].map((row, i) => (
                            <div key={i} className="contents group">
                                <div className="col-span-1 py-4 text-sm font-medium text-[var(--foreground-muted)] flex items-center border-t border-[var(--border)] group-hover:text-[var(--foreground)] transition-colors">
                                    {row.label}
                                </div>
                                <div className="py-4 text-sm font-medium text-center border-t border-[var(--border)] text-[var(--foreground-secondary)]">
                                    {row.core}
                                </div>
                                <div className="py-4 text-sm font-bold text-center border-t border-[var(--border)] text-purple-400">
                                    {row.elite}
                                </div>
                                <div className="py-4 text-sm font-bold text-center border-t border-[var(--border)] text-amber-400">
                                    {row.supreme}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    className="bg-gradient-to-b from-[var(--card)] to-[var(--background)] border border-[var(--border)] rounded-3xl p-6 md:p-8 relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />

                    <h2 className="text-2xl font-bold mb-2">Want to Upgrade?</h2>
                    <p className="text-[var(--foreground-muted)] text-sm mb-6 max-w-sm mx-auto">
                        Send a message with the word <strong>"NITRO"</strong> on Instagram to get your account upgraded instantly.
                    </p>

                    {/* Instagram Button */}
                    <motion.a
                        href="https://ig.me/m/veer.shaah"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex items-center justify-center gap-3 w-full px-8 py-4 rounded-xl font-bold text-white overflow-hidden group shadow-lg shadow-purple-500/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 group-hover:scale-105 transition-transform duration-500" />

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                        <InstagramIcon size={24} />
                        <span>DM "NITRO" to Upgrade</span>
                        <ExternalLink size={16} className="opacity-70" />
                    </motion.a>

                    <p className="text-[10px] text-[var(--foreground-muted)] mt-4 flex items-center justify-center gap-1.5 opacity-70">
                        <Gift size={12} />
                        I'll upgrade your account manually for you!
                    </p>
                </motion.div>

            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {!mounted && (
                    <motion.div
                        className="fixed inset-0 bg-[var(--background)] z-50 flex items-center justify-center"
                        exit={{ opacity: 0 }}
                    >
                        <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

