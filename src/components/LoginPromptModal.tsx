"use client"
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import { X, Lock, Sparkles, Music, Crown } from 'lucide-react';

const FREE_PLAY_LIMIT = 10;

export default function LoginPromptModal() {
    const { showLoginPrompt, dismissLoginPrompt, freePlayCount } = usePlayer();
    const router = useRouter();

    if (!showLoginPrompt) return null;

    const handleSignIn = () => {
        dismissLoginPrompt();
        router.push('/auth');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={dismissLoginPrompt}
            />

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={dismissLoginPrompt}
                    className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Lock size={36} className="text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-4 border-zinc-900">
                            <Crown size={14} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-white mb-2">
                    Free Limit Reached
                </h2>

                {/* Subtitle */}
                <p className="text-zinc-400 text-center mb-6">
                    You've played <span className="text-cyan-400 font-bold">{freePlayCount}</span> of <span className="text-cyan-400 font-bold">{FREE_PLAY_LIMIT}</span> free songs.
                    Sign in to enjoy unlimited music!
                </p>

                {/* Features */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Music size={18} className="text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">Unlimited Playback</p>
                            <p className="text-zinc-500 text-xs">Stream any song, anytime</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Sparkles size={18} className="text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">Premium Features</p>
                            <p className="text-zinc-500 text-xs">3D Audio, Lyrics, Audio FX & more</p>
                        </div>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleSignIn}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98]"
                    >
                        Sign In / Create Account
                    </button>
                    <button
                        onClick={dismissLoginPrompt}
                        className="w-full py-3 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>

                {/* Note */}
                <p className="text-center text-zinc-600 text-xs mt-4">
                    Free users can play up to {FREE_PLAY_LIMIT} songs
                </p>
            </div>
        </div>
    );
}
