"use client"
import { useDJ } from '@/context/DJContext';
import { X, Radio, Zap, Music2, Waves, Volume2, Mic } from 'lucide-react';

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
        currentMixState,
        nextTrackPreview
    } = useDJ();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
            <div className="bg-[var(--card)] w-full max-w-md rounded-3xl border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isDJMode ? 'bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse' : 'bg-purple-500/20'}`}>
                                <Radio size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[var(--foreground)]">AI DJ Mode</h2>
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    {isDJMode ? 'DJ is mixing your session' : 'Let AI DJ your playlist'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--card-hover)] rounded-xl">
                            <X size={20} className="text-[var(--foreground-muted)]" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Master Toggle */}
                    <div className={`p-5 rounded-2xl transition-all ${isDJMode ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-[var(--card-hover)]'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Zap size={24} className={isDJMode ? 'text-purple-400' : 'text-[var(--foreground-muted)]'} />
                                <div>
                                    <p className="font-bold text-[var(--foreground)]">Enable AI DJ</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Smart transitions & mixing</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleDJMode}
                                className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${isDJMode ? 'bg-purple-500' : 'bg-[var(--foreground-muted)]'}`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${isDJMode ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        {/* Mix State Indicator */}
                        {isDJMode && (
                            <div className="mt-4 pt-4 border-t border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Mix State</span>
                                </div>
                                <div className="flex gap-2">
                                    {['building', 'peak', 'cooling'].map(state => (
                                        <div
                                            key={state}
                                            className={`flex-1 py-2 rounded-lg text-center text-xs font-bold uppercase ${currentMixState === state
                                                    ? state === 'peak'
                                                        ? 'bg-pink-500 text-white'
                                                        : 'bg-purple-500 text-white'
                                                    : 'bg-[var(--card)] text-[var(--foreground-muted)]'
                                                }`}
                                        >
                                            {state}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Next Track Preview */}
                    {isDJMode && nextTrackPreview && (
                        <div className="p-4 bg-[var(--card-hover)] rounded-2xl">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3">Up Next</p>
                            <div className="flex items-center gap-3">
                                <img
                                    src={nextTrackPreview.image}
                                    className="w-12 h-12 rounded-xl object-cover"
                                    alt="Next track"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-[var(--foreground)] truncate">{nextTrackPreview.name}</p>
                                    <p className="text-xs text-[var(--foreground-muted)] truncate">
                                        {nextTrackPreview.artists?.primary?.[0]?.name || nextTrackPreview.artist}
                                    </p>
                                </div>
                                <div className="text-xs text-cyan-400 font-bold animate-pulse">INCOMING</div>
                            </div>
                        </div>
                    )}

                    {/* DJ Settings */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">DJ Settings</p>

                        {/* Auto Mix */}
                        <div className="flex items-center justify-between p-4 bg-[var(--card-hover)] rounded-xl">
                            <div className="flex items-center gap-3">
                                <Music2 size={18} className="text-emerald-400" />
                                <span className="font-medium text-sm text-[var(--foreground)]">Auto-Mix</span>
                            </div>
                            <button
                                onClick={() => updateDJSettings({ autoMix: !djSettings.autoMix })}
                                className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${djSettings.autoMix ? 'bg-emerald-400' : 'bg-[var(--foreground-muted)]'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${djSettings.autoMix ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        {/* Crossfade Duration */}
                        <div className="p-4 bg-[var(--card-hover)] rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Waves size={18} className="text-cyan-400" />
                                    <span className="font-medium text-sm text-[var(--foreground)]">Crossfade</span>
                                </div>
                                <span className="text-sm font-bold text-cyan-400">{djSettings.crossfadeDuration}s</span>
                            </div>
                            <input
                                type="range"
                                min="4"
                                max="16"
                                value={djSettings.crossfadeDuration}
                                onChange={(e) => updateDJSettings({ crossfadeDuration: Number(e.target.value) })}
                                className="w-full h-2 bg-[var(--background)] rounded-full appearance-none cursor-pointer accent-cyan-400"
                            />
                        </div>

                        {/* Energy Matching */}
                        <div className="flex items-center justify-between p-4 bg-[var(--card-hover)] rounded-xl">
                            <div className="flex items-center gap-3">
                                <Volume2 size={18} className="text-amber-400" />
                                <span className="font-medium text-sm text-[var(--foreground)]">Energy Matching</span>
                            </div>
                            <button
                                onClick={() => updateDJSettings({ energyMatching: !djSettings.energyMatching })}
                                className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${djSettings.energyMatching ? 'bg-amber-400' : 'bg-[var(--foreground-muted)]'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${djSettings.energyMatching ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)]">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        {isDJMode ? 'DJ is Live!' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
