"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Crown, ArrowLeft, ExternalLink,
    Headphones, Download, Music, Eye, MessageCircle, Gift, Sparkles
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

const features = [
    { icon: Headphones, title: '3D Audio', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Download, title: 'Downloads', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Music, title: 'HD Quality', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { icon: Eye, title: 'Visualizer', color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

export default function UpgradePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden flex items-center justify-center">
            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-amber-500/20 via-purple-500/15 to-transparent rounded-full blur-[120px]" />
            </div>

            {/* Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--border)] rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Back
                </Link>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-md mx-auto px-6 py-16 text-center">

                {/* Crown Icon */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                        <Crown size={36} className="text-amber-400" />
                    </div>
                </motion.div>

                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                            Nitro Supreme
                        </span>
                    </h1>

                    {mounted && (
                        <TextShimmer
                            className="text-sm md:text-base [--base-color:var(--foreground-muted)] [--base-gradient-color:theme(colors.amber.400)]"
                            duration={3}
                        >
                            Unlock the ultimate experience
                        </TextShimmer>
                    )}
                </motion.div>

                {/* Quick Features */}
                <motion.div
                    className="flex justify-center gap-3 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className={`p-3 rounded-2xl ${feature.bg} border border-[var(--border)]`}
                            title={feature.title}
                        >
                            <feature.icon size={20} className={feature.color} />
                        </div>
                    ))}
                </motion.div>

                {/* Instagram CTA - Primary Focus */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <MessageCircle size={16} className="text-purple-400" />
                        <p className="text-[var(--foreground-muted)] text-sm font-medium">DM to upgrade</p>
                    </div>

                    {/* Instagram Button */}
                    <motion.a
                        href="https://www.instagram.com/veer.shaah/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl font-bold text-white overflow-hidden group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600" />

                        {/* Glow */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 blur-xl opacity-50"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Shimmer */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />

                        {/* Content */}
                        <div className="relative z-10 flex items-center gap-3">
                            <InstagramIcon size={24} />
                            <span className="text-lg">@veer.shaah</span>
                            <ExternalLink size={16} className="opacity-70" />
                        </div>
                    </motion.a>

                    <p className="text-[var(--foreground-muted)] text-xs mt-4 flex items-center justify-center gap-1.5">
                        <Gift size={12} className="text-amber-500" />
                        Mention "NITRO" for exclusive offers
                    </p>
                </motion.div>

                {/* Feature Pills */}
                <motion.div
                    className="flex flex-wrap justify-center gap-2 mt-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {['3D Audio', 'Offline Mode', 'HD Quality', 'Visualizer', 'Priority Support'].map((f) => (
                        <span key={f} className="px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-[10px] md:text-xs text-[var(--foreground-muted)] font-medium">
                            {f}
                        </span>
                    ))}
                </motion.div>

            </div>

            {/* Loading State */}
            <AnimatePresence>
                {!mounted && (
                    <motion.div
                        className="fixed inset-0 bg-[var(--background)] z-50 flex items-center justify-center"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <motion.div
                                className="w-12 h-12 border-3 border-amber-400/30 border-t-amber-400 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

