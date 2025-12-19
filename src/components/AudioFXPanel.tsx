"use client"
import { useState } from 'react';
import { useAudioFX, SceneMode, VocalMode } from '@/context/AudioFXContext';
import { useSettings } from '@/context/SettingsContext';
import {
    X, Waves, Mic, MicOff, Vibrate, Moon, Timer, Shuffle,
    BarChart3, Radio, Music2, CloudRain, Mountain, Sparkles,
    Volume2, Disc, CircleDot, PartyPopper, Droplets, Circle, Lock, Crown
} from 'lucide-react';

interface AudioFXPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const SCENE_MODES: { id: SceneMode; name: string; icon: React.ReactNode; description: string; color: string }[] = [
    { id: 'none', name: 'Original', icon: <Music2 size={20} />, description: 'No effects', color: 'text-zinc-400' },
    { id: 'stadium', name: 'Stadium', icon: <Radio size={20} />, description: 'Live concert feel', color: 'text-orange-400' },
    { id: 'lofi', name: 'Lo-Fi', icon: <Disc size={20} />, description: 'Warm vinyl vibes', color: 'text-amber-400' },
    { id: 'club', name: 'Club', icon: <PartyPopper size={20} />, description: 'Deep bass boost', color: 'text-purple-400' },
    { id: 'concert', name: 'Concert', icon: <Sparkles size={20} />, description: 'Live acoustics', color: 'text-cyan-400' },
    { id: 'underwater', name: 'Underwater', icon: <Droplets size={20} />, description: 'Submerged sound', color: 'text-blue-400' },
    { id: 'cave', name: 'Cave', icon: <Mountain size={20} />, description: 'Echo chamber', color: 'text-emerald-400' },
];

const VOCAL_MODES: { id: VocalMode; name: string; icon: React.ReactNode; description: string }[] = [
    { id: 'normal', name: 'Normal', icon: <Mic size={18} />, description: 'Original vocals' },
    { id: 'reduced', name: 'Vocal Down', icon: <Volume2 size={18} />, description: 'Reduce vocals' },
    { id: 'karaoke', name: 'Karaoke', icon: <MicOff size={18} />, description: 'Remove vocals' },
    { id: 'bass_boost', name: 'Bass Focus', icon: <Waves size={18} />, description: 'Boost bass' },
];

const SLEEP_OPTIONS = [
    { minutes: 15, label: '15 min' },
    { minutes: 30, label: '30 min' },
    { minutes: 45, label: '45 min' },
    { minutes: 60, label: '1 hour' },
    { minutes: 90, label: '1.5 hours' },
];

const VISUALIZER_STYLES = [
    { id: 'bars', name: 'Bars', icon: <BarChart3 size={18} /> },
    { id: 'wave', name: 'Wave', icon: <Waves size={18} /> },
    { id: 'circle', name: 'Circle', icon: <Circle size={18} /> },
    { id: 'particles', name: 'Particles', icon: <CircleDot size={18} /> },
];

export default function AudioFXPanel({ isOpen, onClose }: AudioFXPanelProps) {
    const {
        sceneMode, setSceneMode,
        vocalMode, setVocalMode,
        hapticEnabled, setHapticEnabled, triggerHaptic,
        sleepTimerMinutes, sleepTimerRemaining, setSleepTimer, cancelSleepTimer,
        crossfadeEnabled, setCrossfadeEnabled, crossfadeDuration, setCrossfadeDuration,
        visualizerEnabled, setVisualizerEnabled,
        visualizerStyle, setVisualizerStyle, visualizerIntensity, setVisualizerIntensity,
        vocalSettings, setVocalSettings
    } = useAudioFX();

    const { tier } = useSettings();
    const [activeTab, setActiveTab] = useState<'scene' | 'vocal' | 'effects' | 'timer'>('scene');

    // Feature access by tier
    const isEliteOrAbove = tier === 'NITRO_ELITE' || tier === 'NITRO_SUPREME';
    const isSupreme = tier === 'NITRO_SUPREME';

    // Elite: Scene Effects, Crossfade, Visualizer
    // Supreme: All Elite + Vocals, Haptic, Sleep Timer
    const features = {
        scene: isEliteOrAbove,        // Elite+
        vocals: isSupreme,            // Supreme only
        haptic: isSupreme,            // Supreme only
        crossfade: isEliteOrAbove,    // Elite+
        visualizer: isEliteOrAbove,   // Elite+
        sleepTimer: isSupreme,        // Supreme only
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[150] flex items-stretch md:items-center justify-center">
            <div
                className="bg-[var(--background)] w-full md:w-[480px] md:h-auto md:max-h-[85vh] h-screen md:rounded-3xl rounded-none border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in slide-in-from-top-4 duration-500 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[var(--foreground)]">Audio FX Studio</h2>
                                <p className="text-xs text-[var(--foreground-muted)]">Enhance your listening experience</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--card-hover)] rounded-xl transition-colors"
                        >
                            <X size={20} className="text-[var(--foreground-muted)]" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        {[
                            { id: 'scene', label: 'Scene', icon: Radio },
                            { id: 'vocal', label: 'Vocals', icon: Mic },
                            { id: 'effects', label: 'Effects', icon: Waves },
                            { id: 'timer', label: 'Sleep', icon: Moon },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                                    : 'bg-[var(--card)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--card-hover)]'
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">

                    {/* Scene Mode Tab */}
                    {activeTab === 'scene' && (
                        <div className="space-y-4">
                            {!features.scene ? (
                                /* Locked State for CORE users */
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[var(--background)]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
                                        <div className="p-3 bg-amber-500/20 rounded-full mb-3">
                                            <Lock size={24} className="text-amber-400" />
                                        </div>
                                        <p className="text-[var(--foreground)] font-bold mb-1">Unlock Scene Effects</p>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-4 text-center px-4">Upgrade to Elite or Supreme to access AI-powered acoustic remastering</p>
                                        <a href="/upgrade" className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm rounded-full flex items-center gap-2">
                                            <Crown size={14} /> Upgrade Now
                                        </a>
                                    </div>
                                    <div className="opacity-30 pointer-events-none">
                                        <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">🎭 Scene Remastering</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-4">
                                            Transform any song's environment with AI-powered acoustic remastering
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SCENE_MODES.slice(0, 4).map(mode => (
                                                <div
                                                    key={mode.id}
                                                    className="p-4 rounded-2xl border-2 bg-[var(--card)] border-transparent"
                                                >
                                                    <div className={`mb-2 ${mode.color}`}>{mode.icon}</div>
                                                    <p className="font-bold text-sm text-[var(--foreground)]">{mode.name}</p>
                                                    <p className="text-[10px] text-[var(--foreground-muted)]">{mode.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Unlocked State for Elite+ users */
                                <>
                                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">🎭 Scene Remastering</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] mb-4">
                                        Transform any song's environment with AI-powered acoustic remastering
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {SCENE_MODES.map(mode => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setSceneMode(mode.id)}
                                                className={`p-4 rounded-2xl border-2 transition-all text-left ${sceneMode === mode.id
                                                    ? 'bg-cyan-500/10 border-cyan-400'
                                                    : 'bg-[var(--card)] border-transparent hover:border-[var(--border)]'
                                                    }`}
                                            >
                                                <div className={`mb-2 ${mode.color}`}>{mode.icon}</div>
                                                <p className="font-bold text-sm text-[var(--foreground)]">{mode.name}</p>
                                                <p className="text-[10px] text-[var(--foreground-muted)]">{mode.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Vocal Mode Tab */}
                    {activeTab === 'vocal' && (
                        <div className="space-y-4">
                            {!features.vocals ? (
                                /* Locked State for CORE and ELITE users */
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[var(--background)]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
                                        <div className="p-3 bg-purple-500/20 rounded-full mb-3">
                                            <Lock size={24} className="text-purple-400" />
                                        </div>
                                        <p className="text-[var(--foreground)] font-bold mb-1">Supreme Only Feature</p>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-4 text-center px-4">Upgrade to Supreme to unlock vocal processing, karaoke mode, and bass boost</p>
                                        <a href="/upgrade" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full flex items-center gap-2">
                                            <Crown size={14} /> Go Supreme
                                        </a>
                                    </div>
                                    <div className="opacity-30 pointer-events-none">
                                        <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">🎤 Vocal Processing</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-4">
                                            Isolate or reduce vocals for karaoke, focus on instruments, or boost the bass
                                        </p>
                                        <div className="space-y-3">
                                            {VOCAL_MODES.slice(0, 3).map(mode => (
                                                <div
                                                    key={mode.id}
                                                    className="w-full p-4 rounded-2xl border-2 flex items-center gap-4 bg-[var(--card)] border-transparent"
                                                >
                                                    <div className="p-3 rounded-xl bg-[var(--card-hover)]">
                                                        {mode.icon}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-[var(--foreground)]">{mode.name}</p>
                                                        <p className="text-xs text-[var(--foreground-muted)]">{mode.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Unlocked State for Supreme users */
                                <>
                                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">🎤 Vocal Processing</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] mb-4">
                                        Isolate or reduce vocals for karaoke, focus on instruments, or boost the bass
                                    </p>
                                    <div className="space-y-3">
                                        {VOCAL_MODES.map(mode => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setVocalMode(mode.id)}
                                                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${vocalMode === mode.id
                                                    ? 'bg-purple-500/20 border-purple-500'
                                                    : 'bg-[var(--card)] border-transparent hover:border-[var(--border)]'
                                                    }`}
                                            >
                                                <div className={`p-3 rounded-xl ${vocalMode === mode.id ? 'bg-purple-500' : 'bg-[var(--card-hover)]'}`}>
                                                    {mode.icon}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-[var(--foreground)]">{mode.name}</p>
                                                    <p className="text-xs text-[var(--foreground-muted)]">{mode.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-4">
                                        <p className="text-xs text-amber-400">
                                            ⚠️ Note: Vocal removal works best on stereo tracks. Results may vary depending on the song's mix.
                                        </p>
                                    </div>

                                    {/* Custom Vocal Sliders */}
                                    <div className="mt-8 space-y-6 bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)]">
                                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles size={14} /> Custom Vocal Master
                                        </h4>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mb-2 font-bold uppercase tracking-wider">
                                                    <span>Clarity (Detail)</span>
                                                    <span>{Math.round(vocalSettings.clarity * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="2" step="0.1"
                                                    value={vocalSettings.clarity}
                                                    onChange={(e) => setVocalSettings({ ...vocalSettings, clarity: Number(e.target.value) })}
                                                    className="w-full h-1.5 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mb-2 font-bold uppercase tracking-wider">
                                                    <span>Presence (Forwardness)</span>
                                                    <span>{Math.round(vocalSettings.presence * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="2" step="0.1"
                                                    value={vocalSettings.presence}
                                                    onChange={(e) => setVocalSettings({ ...vocalSettings, presence: Number(e.target.value) })}
                                                    className="w-full h-1.5 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-purple-500"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mb-2 font-bold uppercase tracking-wider">
                                                    <span>Isolation (Cut-off)</span>
                                                    <span>{Math.round(vocalSettings.isolation * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="1" step="0.1"
                                                    value={vocalSettings.isolation}
                                                    onChange={(e) => setVocalSettings({ ...vocalSettings, isolation: Number(e.target.value) })}
                                                    className="w-full h-1.5 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Effects Tab */}
                    {activeTab === 'effects' && (
                        <div className="space-y-6">
                            {/* Haptic Sync - Supreme Only */}
                            <div className={`p-4 rounded-2xl relative ${features.haptic ? 'bg-[var(--card)]' : 'bg-[var(--card)] opacity-60'}`}>
                                {!features.haptic && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 rounded-full">
                                        <Lock size={10} className="text-purple-400" />
                                        <span className="text-[9px] font-bold text-purple-400">SUPREME</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cyan-500/20 rounded-xl">
                                            <Vibrate size={18} className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--foreground)] text-sm">Haptic Rhythm Sync</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">Phone vibrates to the bass</p>
                                        </div>
                                    </div>
                                    {features.haptic ? (
                                        <button
                                            onClick={() => {
                                                setHapticEnabled(!hapticEnabled);
                                                if (!hapticEnabled) triggerHaptic(100);
                                            }}
                                            className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${hapticEnabled ? 'bg-cyan-400' : 'bg-[var(--foreground-muted)]'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${hapticEnabled ? 'translate-x-6' : ''}`} />
                                        </button>
                                    ) : (
                                        <a href="/upgrade" className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full flex items-center gap-1">
                                            <Crown size={12} /> Upgrade
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Crossfade - Elite+ */}
                            <div className={`p-4 rounded-2xl relative ${features.crossfade ? 'bg-[var(--card)]' : 'bg-[var(--card)] opacity-60'}`}>
                                {!features.crossfade && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 rounded-full">
                                        <Lock size={10} className="text-amber-400" />
                                        <span className="text-[9px] font-bold text-amber-400">ELITE+</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded-xl">
                                            <Shuffle size={18} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--foreground)] text-sm">Smart Crossfade</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">Seamless track transitions</p>
                                        </div>
                                    </div>
                                    {features.crossfade ? (
                                        <button
                                            onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
                                            className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${crossfadeEnabled ? 'bg-purple-400' : 'bg-[var(--foreground-muted)]'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${crossfadeEnabled ? 'translate-x-6' : ''}`} />
                                        </button>
                                    ) : (
                                        <a href="/upgrade" className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1">
                                            <Crown size={12} /> Upgrade
                                        </a>
                                    )}
                                </div>
                                {crossfadeEnabled && features.crossfade && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-2">
                                            <span>Duration</span>
                                            <span>{crossfadeDuration}s</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="2"
                                            max="12"
                                            value={crossfadeDuration}
                                            onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                                            className="w-full h-2 bg-[var(--background)] rounded-full appearance-none cursor-pointer accent-purple-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Visualizer - Elite+ */}
                            <div className={`p-4 rounded-2xl relative ${features.visualizer ? 'bg-[var(--card)]' : 'bg-[var(--card)] opacity-60'}`}>
                                {!features.visualizer && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 rounded-full">
                                        <Lock size={10} className="text-amber-400" />
                                        <span className="text-[9px] font-bold text-amber-400">ELITE+</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/20 rounded-xl">
                                            <BarChart3 size={18} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--foreground)] text-sm">Audio Visualizer</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">Real-time audio visualization</p>
                                        </div>
                                    </div>
                                    {features.visualizer ? (
                                        <button
                                            onClick={() => setVisualizerEnabled(!visualizerEnabled)}
                                            className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${visualizerEnabled ? 'bg-amber-400' : 'bg-[var(--foreground-muted)]'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${visualizerEnabled ? 'translate-x-6' : ''}`} />
                                        </button>
                                    ) : (
                                        <a href="/upgrade" className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1">
                                            <Crown size={12} /> Upgrade
                                        </a>
                                    )}
                                </div>

                                {visualizerEnabled && features.visualizer && (
                                    <>
                                        <div className="grid grid-cols-4 gap-2">
                                            {VISUALIZER_STYLES.map(style => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => setVisualizerStyle(style.id as any)}
                                                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${visualizerStyle === style.id
                                                        ? 'bg-amber-500 text-black'
                                                        : 'bg-[var(--card-hover)] text-[var(--foreground-muted)] hover:bg-[var(--foreground-muted)]/10'
                                                        }`}
                                                >
                                                    {style.icon}
                                                    <span className="text-[10px] font-medium">{style.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-2">
                                                <span>Intensity</span>
                                                <span>{Math.round(visualizerIntensity * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.2"
                                                max="2"
                                                step="0.1"
                                                value={visualizerIntensity}
                                                onChange={(e) => setVisualizerIntensity(Number(e.target.value))}
                                                className="w-full h-2 bg-[var(--background)] rounded-full appearance-none cursor-pointer accent-amber-500"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sleep Timer Tab */}
                    {activeTab === 'timer' && (
                        <div className="space-y-4">
                            {!features.sleepTimer ? (
                                /* Locked State for CORE and ELITE users */
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[var(--background)]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
                                        <div className="p-3 bg-indigo-500/20 rounded-full mb-3">
                                            <Lock size={24} className="text-indigo-400" />
                                        </div>
                                        <p className="text-[var(--foreground)] font-bold mb-1">Supreme Only Feature</p>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-4 text-center px-4">Upgrade to Supreme to unlock Sleep Timer with gradual fade</p>
                                        <a href="/upgrade" className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm rounded-full flex items-center gap-2">
                                            <Crown size={14} /> Go Supreme
                                        </a>
                                    </div>
                                    <div className="opacity-30 pointer-events-none">
                                        <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">😴 Sleep Timer</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-4">
                                            Music gradually fades out with reduced treble to ease you into sleep
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SLEEP_OPTIONS.slice(0, 4).map(option => (
                                                <div
                                                    key={option.minutes}
                                                    className="p-4 bg-[var(--card)] rounded-2xl"
                                                >
                                                    <Timer size={20} className="text-indigo-400 mb-2" />
                                                    <p className="font-bold text-[var(--foreground)]">{option.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Unlocked State for Supreme users */
                                <>
                                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">😴 Sleep Timer</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] mb-4">
                                        Music gradually fades out with reduced treble to ease you into sleep
                                    </p>

                                    {sleepTimerRemaining !== null && sleepTimerRemaining > 0 ? (
                                        <div className="p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl text-center">
                                            <Moon size={32} className="text-indigo-400 mx-auto mb-3" />
                                            <p className="text-3xl font-bold text-[var(--foreground)] mb-1">
                                                {formatTime(sleepTimerRemaining)}
                                            </p>
                                            <p className="text-xs text-[var(--foreground-muted)] mb-4">remaining</p>
                                            <button
                                                onClick={cancelSleepTimer}
                                                className="px-6 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-colors"
                                            >
                                                Cancel Timer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {SLEEP_OPTIONS.map(option => (
                                                <button
                                                    key={option.minutes}
                                                    onClick={() => setSleepTimer(option.minutes)}
                                                    className="p-4 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-2xl border border-[var(--border)] transition-colors"
                                                >
                                                    <Timer size={20} className="text-indigo-400 mb-2" />
                                                    <p className="font-bold text-[var(--foreground)]">{option.label}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <p className="text-xs text-indigo-400">
                                            💡 The music will naturally fade over the last 5 minutes, reducing volume and high frequencies to help your brain transition to sleep.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)]">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        Apply Effects
                    </button>
                </div>
            </div>
        </div>
    );
}
