"use client"
import { useState, useEffect } from 'react';
import { useAudioFX, SceneMode, VocalMode } from '@/context/AudioFXContext';
import { useSettings } from '@/context/SettingsContext';
import {
    X, Waves, Mic, MicOff, Vibrate, Moon, Timer, Shuffle, Eye,
    BarChart3, Radio, Music2, CloudRain, Mountain, Sparkles,
    Volume2, Disc, CircleDot, PartyPopper, Droplets, Circle, Lock, Crown, Gauge,
    Car, Home, TreePine, Theater, Music, Search, Star, Check
} from 'lucide-react';
import { ALL_SCENES, SCENE_CATEGORIES, type SceneCategory, type ScenePreset } from '@/lib/sceneLibrary';

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
    { id: 'jazz_club', name: 'Jazz Club', icon: <Music size={20} />, description: 'Intimate jazz mood', color: 'text-yellow-400' },
    { id: 'bedroom', name: 'Bedroom', icon: <Home size={20} />, description: 'Cozy late night', color: 'text-pink-400' },
    { id: 'car', name: 'Car Audio', icon: <Car size={20} />, description: 'Punchy bass', color: 'text-red-400' },
    { id: 'forest', name: 'Forest', icon: <TreePine size={20} />, description: 'Natural ambience', color: 'text-green-400' },
    { id: 'theater', name: 'Theater', icon: <Theater size={20} />, description: 'Surround sound', color: 'text-teal-400' },
];

const VOCAL_MODES: { id: VocalMode; name: string; icon: React.ReactNode; description: string }[] = [
    { id: 'normal', name: 'Normal', icon: <Mic size={18} />, description: 'Original vocals' },
    { id: 'reduced', name: 'Vocal Down', icon: <Volume2 size={18} />, description: 'Reduce vocals' },
    { id: 'karaoke', name: 'Karaoke', icon: <MicOff size={18} />, description: 'Remove vocals' },
    { id: 'bass_boost', name: 'Bass Focus', icon: <Waves size={18} />, description: 'Boost bass' },
];

const SLEEP_OPTIONS = [
    { minutes: 5, label: '5 min' },
    { minutes: 15, label: '15 min' },
    { minutes: 30, label: '30 min' },
    { minutes: 45, label: '45 min' },
    { minutes: 60, label: '1 hour' },
    { minutes: 90, label: '1.5 hours' },
    { minutes: -1, label: 'Custom' }, // -1 indicates custom input
];

const VISUALIZER_STYLES = [
    { id: 'bars', name: 'Bars', icon: <BarChart3 size={18} /> },
    { id: 'wave', name: 'Wave', icon: <Waves size={18} /> },
    { id: 'circle', name: 'Circle', icon: <Circle size={18} /> },
    { id: 'particles', name: 'Particles', icon: <CircleDot size={18} /> },
    { id: 'spectrum', name: 'Spectrum', icon: <Gauge size={18} /> },
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
        vocalSettings, setVocalSettings,
        normalizerEnabled, setNormalizerEnabled,
        equalizerSettings, setEqualizerSettings
    } = useAudioFX();

    const { tier } = useSettings();
    const [activeTab, setActiveTab] = useState<'scene' | 'vocal' | 'effects' | 'visualizer' | 'timer'>('scene');
    const [customTimerMinutes, setCustomTimerMinutes] = useState<string>('10'); // For custom timer input

    // ---- Scene browser: search, category filter, favourites ("My Scenes") ----
    const [sceneSearch, setSceneSearch] = useState('');
    const [sceneCat, setSceneCat] = useState<'all' | SceneCategory>('all');
    const [browseScenes, setBrowseScenes] = useState(false); // false = compact "My Scenes" view
    const [favScenes, setFavScenes] = useState<string[]>([]);

    useEffect(() => {
        const defaults = ['stadium', 'club', 'lofi', 'cave', 'jazz_club', 'concert'];
        try {
            const saved = localStorage.getItem('nitro_fav_scenes');
            const parsed = saved ? JSON.parse(saved) : null;
            // Guard against corrupted / legacy non-array data so later .includes/.filter never throw.
            setFavScenes(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : defaults);
        } catch {
            setFavScenes(defaults);
        }
    }, []);

    const toggleFavScene = (id: string) => {
        setFavScenes(prev => {
            const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
            try { localStorage.setItem('nitro_fav_scenes', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    const filteredScenes = ALL_SCENES.filter(s => {
        if (sceneCat !== 'all' && s.category !== sceneCat) return false;
        if (sceneSearch.trim()) {
            const q = sceneSearch.toLowerCase();
            return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
        }
        return true;
    });
    const myScenes = ALL_SCENES.filter(s => favScenes.includes(s.id));

    const renderScene = (s: ScenePreset) => {
        const active = sceneMode === s.id;
        const fav = favScenes.includes(s.id);
        return (
            <div
                key={s.id}
                onClick={() => setSceneMode(s.id)}
                className={`relative p-3 rounded-xl border cursor-pointer transition-all ${active ? 'bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/10' : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-hover)] active:scale-[0.98]'}`}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); toggleFavScene(s.id); }}
                    className="absolute top-1.5 right-1.5 p-1"
                    aria-label={fav ? 'Unpin scene' : 'Pin to My Scenes'}
                >
                    <Star size={14} className={fav ? 'fill-amber-400 text-amber-400' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'} />
                </button>
                <div className="text-2xl mb-1.5 leading-none">{s.emoji}</div>
                <p className="text-[13px] font-bold text-[var(--foreground)] truncate pr-5">{s.name}</p>
                <p className="text-[10px] text-[var(--foreground-muted)] truncate">{s.description}</p>
                {active && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                        <Check size={10} /> Active
                    </div>
                )}
            </div>
        );
    };

    // Binary access model: approved users get every audio feature.
    const isEliteOrAbove = true;
    const isSupreme = true;

    const features = {
        scene: true,
        vocals: true,
        haptic: true,
        crossfade: true,
        visualizer: true,
        sleepTimer: true,
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
                className="bg-[var(--background)] w-full md:w-[480px] md:h-auto md:max-h-[85vh] h-screen md:rounded-3xl rounded-none border border-[var(--border)] flex flex-col animate-in fade-in zoom-in slide-in-from-top-4 duration-500 shadow-2xl"
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
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('scene')}
                        className={`flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl transition-all ${activeTab === 'scene' ? 'bg-[var(--card-hover)] text-[var(--accent-cyan)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                    >
                        <Music2 size={20} />
                        <span className="text-[10px] font-medium">Scene</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('vocal')}
                        className={`flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl transition-all ${activeTab === 'vocal' ? 'bg-[var(--card-hover)] text-[var(--accent-pink)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                    >
                        <Mic size={20} />
                        <span className="text-[10px] font-medium">Vocal</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('effects')}
                        className={`flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl transition-all ${activeTab === 'effects' ? 'bg-[var(--card-hover)] text-[var(--accent-amber)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                    >
                        <Vibrate size={20} />
                        <span className="text-[10px] font-medium">FX</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('visualizer')}
                        className={`flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl transition-all ${activeTab === 'visualizer' ? 'bg-[var(--card-hover)] text-[var(--accent-purple)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                    >
                        <Eye size={20} />
                        <span className="text-[10px] font-medium">Visuals</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('timer')}
                        className={`flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl transition-all ${activeTab === 'timer' ? 'bg-[var(--card-hover)] text-[var(--accent-emerald)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                    >
                        <Timer size={20} />
                        <span className="text-[10px] font-medium">Sleep</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto pb-32">
                    {/* Scene Modes */}
                    {activeTab === 'scene' && (
                        <div className="space-y-4">
                            {/* Search across the whole scene library */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                                <input
                                    value={sceneSearch}
                                    onChange={(e) => { setSceneSearch(e.target.value); if (e.target.value) setBrowseScenes(true); }}
                                    placeholder={`Search ${ALL_SCENES.length}+ scenes…`}
                                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-9 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50 transition-colors"
                                />
                                {sceneSearch && (
                                    <button onClick={() => setSceneSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Original (effects off) */}
                            <button
                                onClick={() => setSceneMode('none')}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${sceneMode === 'none' ? 'bg-cyan-500/10 border-cyan-400' : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}
                            >
                                <span className="text-xl leading-none">🎧</span>
                                <div className="text-left flex-1">
                                    <p className="text-sm font-bold text-[var(--foreground)]">Original</p>
                                    <p className="text-[11px] text-[var(--foreground-muted)]">No effects — pure audio</p>
                                </div>
                                {sceneMode === 'none' && <Check size={16} className="text-cyan-400" />}
                            </button>

                            {(!browseScenes && !sceneSearch) ? (
                                /* ===== Compact "My Scenes" view ===== */
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)] flex items-center gap-1.5">
                                            <Star size={12} className="fill-amber-400 text-amber-400" /> My Scenes
                                        </h3>
                                        <span className="text-[10px] text-[var(--foreground-muted)]">{myScenes.length} pinned</span>
                                    </div>
                                    {myScenes.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {myScenes.map(renderScene)}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[var(--foreground-muted)] text-center py-4">Pin scenes with the ★ to keep them here.</p>
                                    )}
                                    <button
                                        onClick={() => setBrowseScenes(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--border-hover)] text-sm font-semibold text-cyan-400 hover:bg-cyan-500/5 active:scale-[0.99] transition-all"
                                    >
                                        <Sparkles size={16} /> Add More Scenes · Browse {ALL_SCENES.length}+
                                    </button>
                                </>
                            ) : (
                                /* ===== Full searchable / categorised browser ===== */
                                <>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                                        {([{ id: 'all', name: 'All', emoji: '✨' }, ...SCENE_CATEGORIES] as { id: string; name: string; emoji: string }[]).map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setSceneCat(c.id as 'all' | SceneCategory)}
                                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${sceneCat === c.id ? 'bg-cyan-400 text-black' : 'bg-[var(--card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                                            >
                                                <span>{c.emoji}</span>{c.name}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-[var(--foreground-muted)]">{filteredScenes.length} scene{filteredScenes.length === 1 ? '' : 's'}</span>
                                        {!sceneSearch && (
                                            <button onClick={() => { setBrowseScenes(false); setSceneCat('all'); }} className="text-[11px] font-bold text-cyan-400">Done</button>
                                        )}
                                    </div>

                                    {filteredScenes.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {filteredScenes.map(renderScene)}
                                        </div>
                                    ) : (
                                        <p className="text-center text-xs text-[var(--foreground-muted)] py-10">No scenes match “{sceneSearch}”.</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Vocal Mode Tab */}
                    {activeTab === 'vocal' && (
                        <div className="space-y-4">
                            {!features.vocals ? (
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
                                                <div key={mode.id} className="w-full p-4 rounded-2xl border-2 flex items-center gap-4 bg-[var(--card)] border-transparent">
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
                            {/* Audio Normalizer */}
                            <div className="p-4 rounded-2xl bg-[var(--card)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                                            <Gauge size={18} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--foreground)] text-sm">Audio Normalizer</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">Auto-balance volume across tracks</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setNormalizerEnabled(!normalizerEnabled)}
                                        className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${normalizerEnabled ? 'bg-emerald-400' : 'bg-[var(--foreground-muted)]'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${normalizerEnabled ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                                {normalizerEnabled && (
                                    <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <p className="text-xs text-emerald-400">
                                            ✓ Volume levels are now balanced - quiet songs won't be jarring next to loud ones
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Haptic Sync */}
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

                            {/* Crossfade */}
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
                                            min="2" max="12"
                                            value={crossfadeDuration}
                                            onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                                            className="w-full h-2 bg-[var(--background)] rounded-full appearance-none cursor-pointer accent-purple-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Manual Equalizer - Supreme Only */}
                            <div className={`p-4 rounded-2xl relative ${isSupreme ? 'bg-[var(--card)]' : 'bg-[var(--card)] opacity-60'}`}>
                                {!isSupreme && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 rounded-full">
                                        <Lock size={10} className="text-purple-400" />
                                        <span className="text-[9px] font-bold text-purple-400">SUPREME</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                                        <Waves size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--foreground)] text-sm">Manual Equalizer</p>
                                        <p className="text-[10px] text-[var(--foreground-muted)]">Adjust bass, mid and treble in real-time</p>
                                    </div>
                                </div>

                                {isSupreme ? (
                                    <div className="space-y-4">
                                        {/* Bass */}
                                        <div>
                                            <div className="flex justify-between text-xs text-[var(--foreground-muted)] mb-2 font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">Bass</span>
                                                <span className={equalizerSettings.bass > 0 ? 'text-cyan-400' : equalizerSettings.bass < 0 ? 'text-red-400' : 'text-[var(--foreground-muted)]'}>
                                                    {equalizerSettings.bass > 0 ? '+' : ''}{equalizerSettings.bass} dB
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-12" max="12" step="1"
                                                value={equalizerSettings.bass}
                                                onChange={(e) => setEqualizerSettings({ ...equalizerSettings, bass: Number(e.target.value) })}
                                                className="w-full h-2 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                            />
                                        </div>

                                        {/* Mid */}
                                        <div>
                                            <div className="flex justify-between text-xs text-[var(--foreground-muted)] mb-2 font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">Mid</span>
                                                <span className={equalizerSettings.mid > 0 ? 'text-green-400' : equalizerSettings.mid < 0 ? 'text-red-400' : 'text-[var(--foreground-muted)]'}>
                                                    {equalizerSettings.mid > 0 ? '+' : ''}{equalizerSettings.mid} dB
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-12" max="12" step="1"
                                                value={equalizerSettings.mid}
                                                onChange={(e) => setEqualizerSettings({ ...equalizerSettings, mid: Number(e.target.value) })}
                                                className="w-full h-2 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-green-400"
                                            />
                                        </div>

                                        {/* Treble */}
                                        <div>
                                            <div className="flex justify-between text-xs text-[var(--foreground-muted)] mb-2 font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">Treble</span>
                                                <span className={equalizerSettings.treble > 0 ? 'text-purple-400' : equalizerSettings.treble < 0 ? 'text-red-400' : 'text-[var(--foreground-muted)]'}>
                                                    {equalizerSettings.treble > 0 ? '+' : ''}{equalizerSettings.treble} dB
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-12" max="12" step="1"
                                                value={equalizerSettings.treble}
                                                onChange={(e) => setEqualizerSettings({ ...equalizerSettings, treble: Number(e.target.value) })}
                                                className="w-full h-2 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-purple-400"
                                            />
                                        </div>

                                        {/* Reset button */}
                                        <button
                                            onClick={() => setEqualizerSettings({ bass: 0, mid: 0, treble: 0 })}
                                            className="w-full mt-2 py-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                        >
                                            Reset to flat
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <a href="/upgrade" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-bold rounded-full inline-flex items-center gap-2">
                                            <Crown size={14} /> Unlock Equalizer
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Visualizer Tab */}
                    {activeTab === 'visualizer' && (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-2xl relative ${features.visualizer ? 'bg-[var(--card)]' : 'bg-[var(--card)] opacity-60'}`}>
                                {!features.visualizer && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 rounded-full">
                                        <Lock size={10} className="text-purple-400" />
                                        <span className="text-[9px] font-bold text-purple-400">ELITE+</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                            <Eye size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--foreground)] text-sm">Visualizer Studio</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">Customize your visual experience</p>
                                        </div>
                                    </div>
                                    {features.visualizer ? (
                                        <button
                                            onClick={() => setVisualizerEnabled(!visualizerEnabled)}
                                            className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${visualizerEnabled ? 'bg-purple-500' : 'bg-[var(--foreground-muted)]'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${visualizerEnabled ? 'translate-x-6' : ''}`} />
                                        </button>
                                    ) : (
                                        <a href="/upgrade" className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full flex items-center gap-1">
                                            <Crown size={12} /> Upgrade
                                        </a>
                                    )}
                                </div>

                                {visualizerEnabled && features.visualizer ? (
                                    <>
                                        <div className="grid grid-cols-4 gap-2 mb-6">
                                            {VISUALIZER_STYLES.map(style => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => setVisualizerStyle(style.id as any)}
                                                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${visualizerStyle === style.id
                                                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                                                        : 'bg-[var(--card-hover)] text-[var(--foreground-muted)] hover:bg-[var(--foreground-muted)]/10'
                                                        }`}
                                                >
                                                    <div className={visualizerStyle === style.id ? 'text-white' : 'text-purple-400'}>
                                                        {style.icon}
                                                    </div>
                                                    <span className="text-[10px] font-medium">{style.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-[var(--background)]/50 rounded-xl p-4 border border-[var(--border)]">
                                            <div className="flex items-center justify-between text-xs text-[var(--foreground)] mb-3 font-bold">
                                                <span className="flex items-center gap-2">
                                                    <Sparkles size={12} className="text-purple-400" />
                                                    Reactivity Intensity
                                                </span>
                                                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{Math.round(visualizerIntensity * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.2" max="2" step="0.1"
                                                value={visualizerIntensity}
                                                onChange={(e) => setVisualizerIntensity(Number(e.target.value))}
                                                className="w-full h-2 bg-[var(--card)] rounded-full appearance-none cursor-pointer accent-purple-500"
                                            />
                                            <div className="flex justify-between mt-2 text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold">
                                                <span>Subtle</span>
                                                <span>Intense</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl opacity-50">
                                        <Eye size={32} className="mx-auto text-[var(--foreground-muted)] mb-2" />
                                        <p className="text-sm font-medium text-[var(--foreground-muted)]">Enable Visualizer to customize</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sleep Timer Tab */}
                    {activeTab === 'timer' && (
                        <div className="space-y-4">
                            {!features.sleepTimer ? (
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
                                                <div key={option.minutes} className="p-4 bg-[var(--card)] rounded-2xl">
                                                    <Timer size={20} className="text-indigo-400 mb-2" />
                                                    <p className="font-bold text-[var(--foreground)]">{option.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
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
                                        <div className="grid grid-cols-3 gap-3">
                                            {SLEEP_OPTIONS.map(option => (
                                                option.minutes === -1 ? (
                                                    // Custom timer input
                                                    <div key="custom" className="p-3 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
                                                        <Timer size={18} className="text-indigo-400 mb-2" />
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="480"
                                                                value={customTimerMinutes}
                                                                onChange={(e) => setCustomTimerMinutes(e.target.value)}
                                                                className="w-12 h-8 bg-[var(--background)] border border-[var(--border)] rounded-lg text-center text-sm font-bold text-[var(--foreground)] outline-none focus:border-indigo-400"
                                                            />
                                                            <span className="text-xs text-[var(--foreground-muted)]">min</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const mins = parseInt(customTimerMinutes);
                                                                if (mins >= 1) setSleepTimer(mins);
                                                            }}
                                                            className="mt-2 w-full py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            Set
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        key={option.minutes}
                                                        onClick={() => setSleepTimer(option.minutes)}
                                                        className="p-3 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-2xl border border-[var(--border)] transition-colors"
                                                    >
                                                        <Timer size={18} className="text-indigo-400 mb-1" />
                                                        <p className="font-bold text-[var(--foreground)] text-sm">{option.label}</p>
                                                    </button>
                                                )
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
