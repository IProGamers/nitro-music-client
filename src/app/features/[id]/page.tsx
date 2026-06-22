"use client";
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Headphones, Download, Wand2, Radio, Check, Play, ChevronRight, Crown } from 'lucide-react';
import Link from 'next/link';

interface FeatureGuide {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    requiredTier: string;
    steps: { title: string; description: string }[];
    tips: string[];
}

const featureGuides: Record<string, FeatureGuide> = {
    '3d-audio': {
        id: '3d-audio',
        title: '3D Spatial Audio',
        description: 'Experience music in immersive 360° surround sound using advanced HRTF technology.',
        icon: <Headphones size={32} className="text-purple-400" />,
        gradient: 'from-purple-500/20 to-indigo-500/20',
        requiredTier: 'NITRO_ELITE',
        steps: [
            { title: 'Play any song', description: 'Start playing your favorite track from search or your library.' },
            { title: 'Expand the player', description: 'Tap on the mini player at the bottom to open the full player.' },
            { title: 'Find the 3D button', description: 'Look for the headphones icon labeled "3D" in the bottom controls.' },
            { title: 'Enable 3D Audio', description: 'Tap the 3D button - it will glow purple when active!' },
            { title: 'Use headphones', description: 'For the best experience, use wired or Bluetooth headphones.' },
        ],
        tips: [
            'Works best with headphones - speakers won\'t give the full effect',
            'Try closing your eyes to fully immerse in the sound',
            'Different songs have different spatial effects based on their mix'
        ]
    },
    'offline': {
        id: 'offline',
        title: 'Offline Playback',
        description: 'Download your favorite songs to play without an internet connection.',
        icon: <Download size={32} className="text-emerald-400" />,
        gradient: 'from-emerald-500/20 to-teal-500/20',
        requiredTier: 'NITRO_CORE',
        steps: [
            { title: 'Find a song to download', description: 'Browse or search for the song you want to save.' },
            { title: 'Open the context menu', description: 'Right-click (or long-press on mobile) on the song card.' },
            { title: 'Select "Download Offline"', description: 'Click the download option in the menu.' },
            { title: 'Wait for download', description: 'A progress indicator will show the download status.' },
            { title: 'Access your downloads', description: 'Go to Profile → Offline tab to see all downloaded songs.' },
        ],
        tips: [
            'Downloaded songs play instantly without buffering',
            'Check your storage usage in Profile → Offline',
            'You can also download from the expanded player using the Download button'
        ]
    },
    'audio-fx': {
        id: 'audio-fx',
        title: 'Audio Effects & Scenes',
        description: 'Transform your listening experience with immersive audio scenes.',
        icon: <Wand2 size={32} className="text-cyan-400" />,
        gradient: 'from-cyan-500/20 to-blue-500/20',
        requiredTier: 'NITRO_ELITE',
        steps: [
            { title: 'Start playing music', description: 'Play any song to enable the audio effects.' },
            { title: 'Expand the player', description: 'Tap the mini player to open the full player view.' },
            { title: 'Open Audio FX', description: 'Tap the wand icon labeled "FX" in the bottom controls.' },
            { title: 'Choose a scene', description: 'Select from Stadium, Club, Lo-Fi, Concert, and more!' },
            { title: 'Adjust settings', description: 'Fine-tune the equalizer and bass boost to your preference.' },
        ],
        tips: [
            'Stadium mode is great for energetic songs',
            'Lo-Fi mode adds warm, nostalgic vibes',
            'Club mode enhances bass and gives a party feel'
        ]
    },
    'dj-mode': {
        id: 'dj-mode',
        title: 'DJ Mode',
        description: 'Mix tracks like a pro with crossfade, speed control, and seamless transitions.',
        icon: <Radio size={32} className="text-pink-400" />,
        gradient: 'from-pink-500/20 to-rose-500/20',
        requiredTier: 'NITRO_SUPREME',
        steps: [
            { title: 'Play a song', description: 'Start with any track you want to mix.' },
            { title: 'Open DJ Mode', description: 'Tap the radio icon labeled "DJ" in the player controls.' },
            { title: 'Enable DJ Mode', description: 'Toggle the DJ Mode switch to activate mixing features.' },
            { title: 'Adjust crossfade', description: 'Set how songs blend into each other (1-12 seconds).' },
            { title: 'Control playback speed', description: 'Use the speed slider to match tempos between tracks.' },
        ],
        tips: [
            'Use A-B loop to practice specific sections',
            'Crossfade creates smooth transitions between songs',
            'Speed control helps match beats for seamless mixing'
        ]
    }
};

export default function FeatureGuidePage() {
    const params = useParams();
    const router = useRouter();
    const featureId = params?.id as string;
    const guide = featureGuides[featureId];

    if (!guide) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Feature not found</h1>
                    <Link href="/" className="text-cyan-400 hover:underline">Go back home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <header className="sticky top-16 md:top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] transition-colors"
                    >
                        <ArrowLeft size={20} className="text-[var(--foreground)]" />
                    </button>
                    <h1 className="font-bold text-lg text-[var(--foreground)]">How to Use</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-6 pb-32 space-y-8">
                {/* Feature Hero */}
                <div className={`p-6 rounded-3xl bg-gradient-to-br ${guide.gradient} border border-[var(--border)] relative overflow-hidden`}>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-lg">
                            {guide.icon}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">{guide.title}</h2>
                            <p className="text-sm text-[var(--foreground-muted)]">{guide.description}</p>
                        </div>
                    </div>
                </div>

                {/* Steps */}
                <section>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        <Play size={18} className="text-cyan-400" />
                        Step-by-Step Guide
                    </h3>
                    <div className="space-y-4">
                        {guide.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-[var(--foreground)] mb-1">{step.title}</h4>
                                    <p className="text-sm text-[var(--foreground-muted)]">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tips */}
                <section>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        <Crown size={18} className="text-amber-400" />
                        Pro Tips
                    </h3>
                    <div className="space-y-3">
                        {guide.tips.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-[var(--foreground)]">{tip}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <button
                    onClick={() => router.push('/')}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                    Try it Now
                    <ChevronRight size={20} />
                </button>
            </main>
        </div>
    );
}
