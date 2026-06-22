"use client"
import { useDJ } from '@/context/DJContext';
import { X, Radio, Waves } from 'lucide-react';
import { useSheet } from '@/hooks/useSheet';

interface DJModePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DJModePanel({ isOpen, onClose }: DJModePanelProps) {
    const {
        isDJMode,
        toggleDJMode,
        djSettings,
        updateDJSettings,
        nextTrackPreview
    } = useDJ();

    const { render, show, requestClose } = useSheet(isOpen, onClose);
    if (!render) return null;

    return (
        <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-2xl z-[150] flex items-end md:items-center justify-center md:p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
            onClick={requestClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-[var(--card)] w-full md:max-w-sm rounded-t-3xl md:rounded-3xl border border-[var(--border)] overflow-hidden shadow-2xl transition-transform duration-300 ease-out ${show ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-all ${isDJMode ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-purple-500/15'}`}>
                            <Radio size={18} className={isDJMode ? 'text-white' : 'text-purple-400'} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[var(--foreground)]">DJ Mode</h2>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                {isDJMode ? 'Live — songs blend automatically' : 'Seamless, no-gap playback'}
                            </p>
                        </div>
                    </div>
                    <button onClick={requestClose} className="p-2 hover:bg-[var(--card-hover)] rounded-xl">
                        <X size={18} className="text-[var(--foreground-muted)]" />
                    </button>
                </div>

                {/* Big on/off */}
                <div className="p-5">
                    <button
                        onClick={toggleDJMode}
                        className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${isDJMode
                            ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 border border-purple-500/40'
                            : 'bg-[var(--card-hover)] border border-transparent'}`}
                    >
                        <div className="flex items-center gap-3 text-left">
                            <span className="relative flex h-3 w-3">
                                {isDJMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${isDJMode ? 'bg-pink-500' : 'bg-[var(--foreground-muted)]'}`} />
                            </span>
                            <div>
                                <p className="font-bold text-[var(--foreground)]">{isDJMode ? 'DJ is Live' : 'Turn on DJ'}</p>
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    {isDJMode ? 'Next song starts as this one ends' : 'Crossfade tracks with no pauses'}
                                </p>
                            </div>
                        </div>
                        <span className={`w-14 h-8 rounded-full flex items-center px-1 transition-all shrink-0 ${isDJMode ? 'bg-purple-500' : 'bg-[var(--foreground-muted)]'}`}>
                            <span className={`w-6 h-6 rounded-full bg-white transition-transform ${isDJMode ? 'translate-x-6' : ''}`} />
                        </span>
                    </button>

                    {/* Crossfade length */}
                    <div className="mt-4 p-4 bg-[var(--card-hover)] rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <Waves size={17} className="text-cyan-400" />
                                <span className="font-medium text-sm text-[var(--foreground)]">Crossfade length</span>
                            </div>
                            <span className="text-sm font-bold text-cyan-400">{djSettings.crossfadeDuration}s</span>
                        </div>
                        <input
                            type="range"
                            min="3"
                            max="16"
                            value={djSettings.crossfadeDuration}
                            onChange={(e) => updateDJSettings({ crossfadeDuration: Number(e.target.value) })}
                            className="w-full h-2 bg-[var(--background)] rounded-full appearance-none cursor-pointer accent-cyan-400"
                        />
                        <div className="flex justify-between mt-1.5 text-[10px] text-[var(--foreground-muted)]">
                            <span>Quick blend</span>
                            <span>Long blend</span>
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-[var(--foreground-muted)]">
                            <span className="text-[var(--foreground)] font-medium">What's crossfade?</span> As one song ends, the next
                            one starts at the same time and the two fade into each other — so the music never goes silent between tracks.
                            A longer length makes the blend slower and smoother.
                        </p>
                    </div>

                    {/* Up next */}
                    {isDJMode && nextTrackPreview && (
                        <div className="mt-4 p-4 bg-[var(--card-hover)] rounded-2xl">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3">Up Next</p>
                            <div className="flex items-center gap-3">
                                <img
                                    src={nextTrackPreview.image}
                                    className="w-12 h-12 rounded-xl object-cover"
                                    alt=""
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-[var(--foreground)] truncate">{nextTrackPreview.name}</p>
                                    <p className="text-xs text-[var(--foreground-muted)] truncate">
                                        {nextTrackPreview.artists?.primary?.[0]?.name || nextTrackPreview.artist}
                                    </p>
                                </div>
                                <span className="text-[10px] text-cyan-400 font-bold animate-pulse">INCOMING</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)]">
                    <button
                        onClick={requestClose}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-opacity ${isDJMode
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                            : 'bg-[var(--card-hover)] text-[var(--foreground)] hover:bg-[var(--border)]'}`}
                    >
                        {isDJMode ? 'Done — DJ keeps mixing' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
