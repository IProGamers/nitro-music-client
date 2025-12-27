"use client"
import { useEffect, useState } from 'react';
import { useStats } from '@/context/StatsContext';
import { useAuth } from '@/context/AuthContext';
import { X, Music, Clock, Heart, Flame, TrendingUp, Award, Sparkles, Share2 } from 'lucide-react';

interface WrappedModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WrappedModal({ isOpen, onClose }: WrappedModalProps) {
    const { sessionStats, totalSongsPlayed, totalTimeAllTime, currentStreak, longestStreak } = useStats();
    const { userProfile } = useAuth();
    const [currentSlide, setCurrentSlide] = useState(0);

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return `${days} days ${hours % 24} hours`;
        }
        if (hours > 0) return `${hours} hours ${mins} mins`;
        return `${mins} minutes`;
    };

    const slides = [
        {
            title: "Your Year in Music",
            subtitle: userProfile?.displayName || "Music Lover",
            stat: totalSongsPlayed.toString(),
            label: "songs played",
            icon: Music,
            gradient: "from-purple-600 via-pink-600 to-orange-500"
        },
        {
            title: "Time Well Spent",
            subtitle: "That's more than most!",
            stat: formatTime(totalTimeAllTime),
            label: "of listening",
            icon: Clock,
            gradient: "from-cyan-600 via-blue-600 to-purple-600"
        },
        {
            title: "On Fire!",
            subtitle: "Your dedication shows",
            stat: longestStreak.toString(),
            label: "day best streak",
            icon: Flame,
            gradient: "from-orange-500 via-red-500 to-pink-600"
        },
        {
            title: "Top Artists",
            subtitle: "You've got great taste",
            stat: sessionStats.topArtists[0]?.name || "Keep listening!",
            label: "is your #1 artist",
            icon: Heart,
            gradient: "from-emerald-500 via-cyan-500 to-blue-600"
        }
    ];

    useEffect(() => {
        if (!isOpen) {
            setCurrentSlide(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen, slides.length]);

    if (!isOpen) return null;

    const slide = slides[currentSlide];
    const SlideIcon = slide.icon;

    return (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center">
            {/* Animated Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-1000`}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-black/30 hover:bg-black/50 rounded-full backdrop-blur-sm z-10"
            >
                <X size={24} className="text-white" />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center text-white max-w-md mx-auto p-8 animate-in fade-in zoom-in duration-500">
                <div className="mb-8">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <SlideIcon size={40} className="text-white" />
                    </div>
                    <p className="text-white/70 text-sm uppercase tracking-widest mb-2">{slide.title}</p>
                    <p className="text-white/50 text-xs">{slide.subtitle}</p>
                </div>

                <div className="mb-8">
                    <p className="text-7xl md:text-8xl font-black mb-2 animate-in slide-in-from-bottom duration-700">
                        {slide.stat}
                    </p>
                    <p className="text-xl text-white/80">{slide.label}</p>
                </div>

                {/* Slide Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`h-2 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-full text-sm font-bold backdrop-blur-sm"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}
                        className="px-6 py-3 bg-white hover:bg-white/90 text-black rounded-full text-sm font-bold"
                    >
                        {currentSlide === slides.length - 1 ? 'Restart' : 'Next'}
                    </button>
                </div>
            </div>

            {/* Branding */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 text-sm">
                <Sparkles size={16} />
                <span>Nitro Wrapped 2024</span>
            </div>
        </div>
    );
}
