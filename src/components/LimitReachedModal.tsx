"use client"
import { useUsage } from "@/context/UsageContext";
import { FEATURE_NAMES } from "@/lib/features";
import { X, Crown } from "lucide-react";
import Link from "next/link";

export default function LimitReachedModal() {
    const { showLimitModal, setShowLimitModal, limitFeature } = useUsage();

    if (!showLimitModal || !limitFeature) return null;

    const featureName = FEATURE_NAMES[limitFeature] || 'This Feature';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 relative shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                <button
                    onClick={() => setShowLimitModal(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center gap-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                        <Crown size={32} className="text-amber-500" />
                    </div>

                    <h2 className="text-xl font-bold text-white">Limit Reached</h2>

                    <p className="text-zinc-400 text-sm">
                        You've reached your free limit for <span className="text-amber-400 font-bold">{featureName}</span>.
                    </p>

                    <div className="bg-zinc-900/50 rounded-xl p-4 w-full border border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-widest font-bold">Unlocks</p>
                        <ul className="text-sm text-left space-y-2">
                            <li className="flex items-center gap-2 text-zinc-300">
                                <Crown size={14} className="text-amber-500" /> Unlimited {featureName}
                            </li>
                            <li className="flex items-center gap-2 text-zinc-300">
                                <Crown size={14} className="text-amber-500" /> Ad-free Experience
                            </li>
                            <li className="flex items-center gap-2 text-zinc-300">
                                <Crown size={14} className="text-amber-500" /> High Quality Audio
                            </li>
                        </ul>
                    </div>

                    <Link
                        href="/upgrade"
                        onClick={() => setShowLimitModal(false)}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                    >
                        Unlock Nitro Premium
                    </Link>

                    <button
                        onClick={() => setShowLimitModal(false)}
                        className="text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
