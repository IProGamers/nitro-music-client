"use client";
import { useState, useEffect } from 'react';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { FEATURES } from '@/lib/featureGuide';
import HowToUseModal from './HowToUseModal';

const SEEN_KEY = 'nitro_features_intro_seen';

// Shown on Home ONLY the first time. After that it's hidden — users can reopen the
// full guide anytime from Profile → "How to use Nitro".
export default function FeatureDiscoveryCards() {
    const [show, setShow] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        try {
            if (!localStorage.getItem(SEEN_KEY)) {
                setShow(true);
                localStorage.setItem(SEEN_KEY, '1'); // mark seen so it never auto-shows again
            }
        } catch { /* ignore */ }
    }, []);

    if (!show) return null;

    const intro = FEATURES.slice(0, 8);

    return (
        <>
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-cyan-400" />
                        <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Discover Nitro</h2>
                    </div>
                    <button
                        onClick={() => setShow(false)}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <X size={14} /> Got it
                    </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                    {intro.map((f) => {
                        const Icon = f.icon;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setShowGuide(true)}
                                className="relative flex-shrink-0 w-[210px] md:w-[240px] p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)] active:scale-[0.98] transition-all text-left"
                            >
                                <div className="w-11 h-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-3">
                                    <Icon size={22} className={f.color} />
                                </div>
                                <h3 className="font-bold text-[15px] text-[var(--foreground)] mb-1">{f.title}</h3>
                                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-2">{f.short}</p>
                            </button>
                        );
                    })}
                    {/* See full guide card */}
                    <button
                        onClick={() => setShowGuide(true)}
                        className="flex-shrink-0 w-[150px] rounded-2xl bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/15 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2 text-cyan-400"
                    >
                        <Sparkles size={22} />
                        <span className="text-sm font-bold">See how to<br />use Nitro</span>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </section>

            <HowToUseModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
        </>
    );
}
