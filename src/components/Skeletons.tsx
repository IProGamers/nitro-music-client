"use client"

/**
 * Skeleton Loaders for fast perceived loading
 * Shows content placeholders while data loads
 */

import { motion } from 'framer-motion';

// Base skeleton shimmer animation
const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

// Song Card Skeleton
export function SongCardSkeleton() {
    return (
        <div className="w-[115px] md:w-[140px] flex-shrink-0">
            <div className={`aspect-square rounded-lg bg-[var(--card)] ${shimmer}`} />
            <div className={`h-3 mt-2 rounded bg-[var(--card)] ${shimmer}`} />
            <div className={`h-2 mt-1 w-2/3 rounded bg-[var(--card)] ${shimmer}`} />
        </div>
    );
}

// Artist Card Skeleton (circular)
export function ArtistCardSkeleton() {
    return (
        <div className="w-[90px] md:w-[110px] flex flex-col items-center flex-shrink-0">
            <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full bg-[var(--card)] ${shimmer}`} />
            <div className={`h-2 mt-2 w-16 rounded bg-[var(--card)] ${shimmer}`} />
            <div className={`h-2 mt-1 w-10 rounded bg-[var(--card)] ${shimmer}`} />
        </div>
    );
}

// Quick Access Grid Skeleton
export function QuickAccessSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-xl h-14 md:h-16 border border-[var(--border)]">
                    <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[var(--background)] ${shimmer}`} />
                    <div className="flex-1">
                        <div className={`h-2.5 w-16 rounded bg-[var(--background)] ${shimmer}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Section with song cards skeleton
export function SongSectionSkeleton({ count = 8, title }: { count?: number; title?: string }) {
    return (
        <section className="mb-6">
            {title && (
                <div className="flex items-center gap-2 mb-4">
                    <div className={`w-4 h-4 rounded bg-[var(--card)] ${shimmer}`} />
                    <div className={`h-5 w-32 rounded bg-[var(--card)] ${shimmer}`} />
                </div>
            )}
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {[...Array(count)].map((_, i) => (
                    <SongCardSkeleton key={i} />
                ))}
            </div>
        </section>
    );
}

// Section with artist cards skeleton
export function ArtistSectionSkeleton({ count = 6 }: { count?: number }) {
    return (
        <section className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-4 h-4 rounded bg-[var(--card)] ${shimmer}`} />
                <div className={`h-5 w-36 rounded bg-[var(--card)] ${shimmer}`} />
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {[...Array(count)].map((_, i) => (
                    <ArtistCardSkeleton key={i} />
                ))}
            </div>
        </section>
    );
}

// Hero slider skeleton (desktop)
export function HeroSkeleton() {
    return (
        <div className={`hidden md:block w-full h-[280px] lg:h-[340px] rounded-3xl bg-[var(--card)] border border-[var(--border)] ${shimmer}`}>
            <div className="flex items-center h-full px-10 lg:px-16">
                <div className="max-w-[50%]">
                    <div className={`h-3 w-24 rounded bg-white/10 mb-4 ${shimmer}`} />
                    <div className={`h-8 w-64 rounded bg-white/10 mb-2 ${shimmer}`} />
                    <div className={`h-4 w-40 rounded bg-white/10 mb-6 ${shimmer}`} />
                    <div className={`h-10 w-32 rounded-full bg-white/10 ${shimmer}`} />
                </div>
            </div>
        </div>
    );
}

// Full home page skeleton
export function HomePageSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--background)] pb-32">
            <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 max-w-[1600px] mx-auto space-y-6 md:space-y-8">
                {/* Greeting */}
                <div className="flex items-center justify-between">
                    <div className={`h-8 w-48 rounded bg-[var(--card)] ${shimmer}`} />
                    <div className={`h-4 w-24 rounded bg-[var(--card)] ${shimmer}`} />
                </div>

                {/* Quick Access */}
                <QuickAccessSkeleton />

                {/* Hero */}
                <HeroSkeleton />

                {/* Sections */}
                <SongSectionSkeleton count={8} title="Trending now" />
                <ArtistSectionSkeleton count={6} />
                <SongSectionSkeleton count={8} title="New releases" />
                <SongSectionSkeleton count={8} title="Bollywood hits" />
            </div>
        </div>
    );
}

// Search page skeleton
export function SearchPageSkeleton() {
    return (
        <div className="p-4 space-y-6">
            {/* Search box */}
            <div className={`h-12 w-full rounded-2xl bg-[var(--card)] ${shimmer}`} />

            {/* Results */}
            <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                        <div className={`w-12 h-12 rounded-lg bg-[var(--card)] ${shimmer}`} />
                        <div className="flex-1">
                            <div className={`h-3 w-32 rounded bg-[var(--card)] ${shimmer}`} />
                            <div className={`h-2 w-20 mt-1 rounded bg-[var(--card)] ${shimmer}`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Profile page skeleton
export function ProfileSkeleton() {
    return (
        <div className="p-4 space-y-6">
            {/* Avatar and name */}
            <div className="flex flex-col items-center gap-4">
                <div className={`w-24 h-24 rounded-full bg-[var(--card)] ${shimmer}`} />
                <div className={`h-6 w-32 rounded bg-[var(--card)] ${shimmer}`} />
                <div className={`h-4 w-24 rounded bg-[var(--card)] ${shimmer}`} />
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="text-center">
                        <div className={`h-6 w-12 mx-auto rounded bg-[var(--card)] ${shimmer}`} />
                        <div className={`h-3 w-16 mt-1 rounded bg-[var(--card)] ${shimmer}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Add shimmer animation to globals.css
export const shimmerKeyframes = `
@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}
`;
