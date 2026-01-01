"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Crown, ArrowLeft, ExternalLink,
    Headphones, Download, Music, Eye, Gift, Sparkles,
    Zap, Mic2, Radio, ChevronRight, Star
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

const plans = [
    {
        name: 'Core',
        tagline: 'Free Forever',
        color: 'zinc',
        features: [
            'Standard Audio Quality',
            'Basic Visualizers (3/day)',
            'DJ Mode (1/day)',
            'Audio FX (3/day)',
            'Limited Skips (6/hr)',
            'Ad-Supported',
            '5 Downloads/month',
            '50 Songs per Playlist',
            '25 Play History'
        ],
        isCurrent: true
    },
    {
        name: 'Elite',
        tagline: 'Most Popular',
        color: 'purple',
        features: [
            '3D Spatial Audio',
            'HD Streaming Quality',
            'No Advertisements',
            'Listen Together (Sync with Friends)',
            'Friends System (Add & Chat)',
            'Unlimited Visualizers',
            'Unlimited DJ Mode',
            'Unlimited Audio FX',
            'Unlimited Skips',
            '100 Downloads/month',
            '100 Songs per Playlist',
            '50 Play History',
            'Scene Modes (Club, Stadium)',
            'Sleep Timer',
            'A-B Loop'
        ],
        highlight: true
    },
    {
        name: 'Supreme',
        tagline: 'Ultimate Power',
        color: 'amber',
        features: [
            'Everything in Elite',
            'Lossless Audio Quality',
            'Unlimited Downloads',
            'Unlimited Songs per Playlist',
            'Unlimited Play History',
            'Priority Support',
            'Exclusive Themes',
            'Advanced Equalizer',
            'Early Access Features',
            'Share Card Themes',
            'Haptic Feedback',
            'Smart Shuffle AI'
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
            <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">

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

                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                        Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-400">Elite</span> or <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Supreme</span>
                    </h1>

                    <TextShimmer
                        className="text-base md:text-lg font-medium [--base-color:var(--foreground-muted)] [--base-gradient-color:theme(colors.cyan.400)]"
                        duration={3}
                    >
                        Unlock the full potential of your sound
                    </TextShimmer>
                </motion.div>

                {/* Plan Cards */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {plans.map((plan, idx) => (
                        <div
                            key={plan.name}
                            className={`relative bg-[var(--card)] border rounded-2xl p-6 text-left transition-all hover:scale-[1.02] ${plan.highlight
                                ? 'border-purple-500/50 ring-2 ring-purple-500/20'
                                : plan.color === 'amber'
                                    ? 'border-amber-500/30'
                                    : 'border-[var(--border)]'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                                    Popular
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-2">
                                {plan.color === 'purple' && <Zap size={18} className="text-purple-400" />}
                                {plan.color === 'amber' && <Crown size={18} className="text-amber-400" />}
                                {plan.color === 'zinc' && <Music size={18} className="text-zinc-400" />}
                                <h3 className={`text-xl font-bold ${plan.color === 'purple' ? 'text-purple-400' :
                                    plan.color === 'amber' ? 'text-amber-400' : 'text-zinc-400'
                                    }`}>
                                    Nitro {plan.name}
                                </h3>
                            </div>

                            <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider mb-4">{plan.tagline}</p>

                            <ul className="space-y-2 mb-4">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                                        <span className={
                                            plan.color === 'purple' ? 'text-purple-400' :
                                                plan.color === 'amber' ? 'text-amber-400' : 'text-zinc-500'
                                        }>✓</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {plan.isCurrent ? (
                                <div className="w-full py-2 bg-zinc-500/10 rounded-lg text-center text-xs font-bold text-zinc-400">
                                    Current Plan
                                </div>
                            ) : (
                                <button className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all ${plan.color === 'purple'
                                    ? 'bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/20'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 shadow-lg shadow-amber-500/20'
                                    }`}>
                                    Get {plan.name}
                                </button>
                            )}
                        </div>
                    ))}
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    className="bg-gradient-to-b from-[var(--card)] to-[var(--background)] border border-[var(--border)] rounded-3xl p-6 md:p-8 relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />

                    <h2 className="text-2xl font-bold mb-2">Ready to Upgrade?</h2>
                    <p className="text-[var(--foreground-muted)] text-sm mb-6 max-w-sm mx-auto">
                        DM <strong>"NITRO"</strong> on Instagram and I'll upgrade your account instantly!
                    </p>

                    {/* Instagram Handle Display */}
                    <div className="mb-4">
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                            @veer.shaah
                        </span>
                    </div>

                    {/* Instagram Button */}
                    <motion.a
                        href="https://ig.me/m/veer.shaah"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex items-center justify-center gap-3 w-full max-w-sm mx-auto px-8 py-4 rounded-xl font-bold text-white overflow-hidden group shadow-lg shadow-purple-500/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 group-hover:scale-105 transition-transform duration-500" />

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                        <span className="relative z-10 flex items-center gap-3">
                            <InstagramIcon size={24} />
                            <span>DM @veer.shaah</span>
                            <ExternalLink size={16} className="opacity-70" />
                        </span>
                    </motion.a>

                    <p className="text-[10px] text-[var(--foreground-muted)] mt-4 flex items-center justify-center gap-1.5 opacity-70">
                        <Gift size={12} />
                        Free upgrades available for early supporters!
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
