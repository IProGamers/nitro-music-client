"use client";
import { useState } from 'react';
import { X, ChevronDown, Sparkles, Lightbulb } from 'lucide-react';
import { FEATURES } from '@/lib/featureGuide';

export default function HowToUseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [openId, setOpenId] = useState<string | null>(FEATURES[0]?.id ?? null);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex md:items-center md:justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

            {/* Panel: bottom sheet on mobile, centered card on desktop */}
            <div className="relative mt-auto md:mt-0 w-full md:max-w-lg max-h-[88vh] md:max-h-[82vh] bg-[var(--surface)] border border-[var(--border)] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-[var(--border)] shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/15 flex items-center justify-center shrink-0">
                        <Sparkles size={20} className="text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-[var(--foreground)] leading-tight">How to use Nitro</h2>
                        <p className="text-xs text-[var(--foreground-muted)]">Tap a feature to see how it works</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Feature accordion */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {FEATURES.map((f) => {
                        const open = openId === f.id;
                        const Icon = f.icon;
                        return (
                            <div key={f.id} className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
                                <button
                                    onClick={() => setOpenId(open ? null : f.id)}
                                    className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-[var(--card-hover)] transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                                        <Icon size={20} className={f.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[15px] font-bold text-[var(--foreground)] truncate">{f.title}</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] truncate">{f.short}</p>
                                    </div>
                                    <ChevronDown size={18} className={`text-[var(--foreground-muted)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                                </button>

                                {open && (
                                    <div className="px-4 pb-4 pt-1 animate-fade-in">
                                        <ol className="space-y-2.5">
                                            {f.steps.map((s, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="w-5 h-5 rounded-full bg-cyan-400/15 text-cyan-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                                    <span className="text-[13px] text-[var(--foreground-secondary)] leading-relaxed">{s}</span>
                                                </li>
                                            ))}
                                        </ol>
                                        {f.tip && (
                                            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                                                <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                                <span className="text-[12px] text-[var(--foreground-muted)] leading-relaxed">{f.tip}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div className="h-[env(safe-area-inset-bottom)]" />
                </div>
            </div>
        </div>
    );
}
