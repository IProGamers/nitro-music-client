"use client"
import { useState, useEffect } from 'react';
import { useAudioFX, type VocalMode } from '@/context/AudioFXContext';
import {
    X, Search, Star, Check, Wand2, Sliders, Mic, Moon,
    RotateCcw, Vibrate, Gauge, Timer, ChevronLeft,
    Radio, TreePine, Home, Sparkles, Car, Music2, Disc3, Gamepad2, FlaskConical
} from 'lucide-react';
import { ALL_SCENES, SCENE_CATEGORIES, type SceneCategory, type ScenePreset } from '@/lib/sceneLibrary';

interface AudioFXPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'scenes' | 'tune' | 'vocals' | 'sleep';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'scenes', label: 'Scenes', icon: <Wand2 size={17} /> },
    { id: 'tune', label: 'Tune', icon: <Sliders size={17} /> },
    { id: 'vocals', label: 'Vocals', icon: <Mic size={17} /> },
    { id: 'sleep', label: 'Sleep', icon: <Moon size={17} /> },
];

// A clean, professional icon per scene category — replaces the emoji look.
const CATEGORY_ICON: Record<SceneCategory, React.ReactNode> = {
    live_venues: <Radio size={18} />,
    nature: <TreePine size={18} />,
    rooms: <Home size={18} />,
    moods: <Sparkles size={18} />,
    vehicles: <Car size={18} />,
    genres: <Music2 size={18} />,
    iconic: <Disc3 size={18} />,
    gaming: <Gamepad2 size={18} />,
    experimental: <FlaskConical size={18} />,
};

const VOCAL_MODES: { id: VocalMode; name: string; desc: string }[] = [
    { id: 'normal', name: 'Natural', desc: 'Original mix' },
    { id: 'reduced', name: 'Vocal Down', desc: 'Lower the voice' },
    { id: 'karaoke', name: 'Karaoke', desc: 'Remove vocals' },
    { id: 'bass_boost', name: 'Bass Focus', desc: 'Boost low end' },
];

const EQ_PRESETS: { name: string; v: { bass: number; mid: number; treble: number } }[] = [
    { name: 'Flat', v: { bass: 0, mid: 0, treble: 0 } },
    { name: 'Bass', v: { bass: 7, mid: 0, treble: 2 } },
    { name: 'Vocal', v: { bass: -2, mid: 5, treble: 2 } },
    { name: 'Treble', v: { bass: 0, mid: 0, treble: 7 } },
    { name: 'Warm', v: { bass: 4, mid: 2, treble: -3 } },
    { name: 'Bright', v: { bass: -1, mid: 1, treble: 6 } },
];

const SLEEP_OPTIONS = [10, 15, 20, 30, 45, 60];

// ---- Shared primitives (single accent, no rainbow) ----
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={on}
            className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${on ? 'bg-[var(--accent)]' : 'bg-[var(--surface-hover)]'}`}
        >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </button>
    );
}

function Slider({ value, min, max, step = 1, onChange }: { value: number; min: number; max: number; step?: number; onChange: (n: number) => void }) {
    return (
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[var(--surface-hover)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
        />
    );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`rounded-2xl bg-[var(--surface)] border border-[var(--border)] ${className}`}>{children}</div>;
}

export default function AudioFXPanel({ isOpen, onClose }: AudioFXPanelProps) {
    const {
        sceneMode, setSceneMode,
        vocalMode, setVocalMode, vocalSettings, setVocalSettings,
        hapticEnabled, setHapticEnabled, triggerHaptic,
        sleepTimerRemaining, setSleepTimer, cancelSleepTimer,
        normalizerEnabled, setNormalizerEnabled,
        equalizerSettings, setEqualizerSettings,
    } = useAudioFX();

    const [tab, setTab] = useState<Tab>('scenes');

    // Slide up on open, slide down on close. `render` keeps the panel mounted during
    // the closing animation; `show` drives the transform/opacity.
    const [render, setRender] = useState(false);
    const [show, setShow] = useState(false);

    // Mount on open; keep mounted ~320ms after close so the slide-down can play.
    useEffect(() => {
        if (isOpen) {
            setRender(true);
        } else {
            setShow(false);
            const t = setTimeout(() => setRender(false), 320);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    // Once mounted, flip `show` on the SECOND frame so the browser first paints the
    // off-screen (translate-y-full) state — otherwise the enter transition is skipped.
    useEffect(() => {
        if (!render) return;
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setShow(true)); });
        return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    }, [render]);

    // Trigger the slide-down, then let the parent unmount via onClose.
    const handleClose = () => { setShow(false); setTimeout(onClose, 300); };

    // Scene browser state
    const [sceneSearch, setSceneSearch] = useState('');
    const [sceneCat, setSceneCat] = useState<'all' | SceneCategory>('all');
    const [browse, setBrowse] = useState(false);
    const [favScenes, setFavScenes] = useState<string[]>([]);
    const [customSleep, setCustomSleep] = useState('25');
    const [showAdvVocal, setShowAdvVocal] = useState(false);

    useEffect(() => {
        const defaults = ['stadium', 'club', 'lofi', 'cave', 'jazz_club', 'concert'];
        try {
            const saved = localStorage.getItem('nitro_fav_scenes');
            const parsed = saved ? JSON.parse(saved) : null;
            setFavScenes(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : defaults);
        } catch {
            setFavScenes(defaults);
        }
    }, []);

    const toggleFav = (id: string) => {
        setFavScenes(prev => {
            const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
            try { localStorage.setItem('nitro_fav_scenes', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    const activeScene = sceneMode === 'none' ? null : ALL_SCENES.find(s => s.id === sceneMode);

    const filtered = ALL_SCENES.filter(s => {
        if (sceneCat !== 'all' && s.category !== sceneCat) return false;
        if (sceneSearch.trim()) {
            const q = sceneSearch.toLowerCase();
            return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
        }
        return true;
    });
    const myScenes = ALL_SCENES.filter(s => favScenes.includes(s.id));

    const fmt = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

    const SceneTile = (s: ScenePreset) => {
        const active = sceneMode === s.id;
        const fav = favScenes.includes(s.id);
        return (
            <button
                key={s.id}
                onClick={() => setSceneMode(s.id)}
                className={`relative text-left p-3 rounded-2xl border transition-all active:scale-[0.98] ${active ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}
            >
                <span
                    onClick={(e) => { e.stopPropagation(); toggleFav(s.id); }}
                    className="absolute top-2 right-2 p-0.5"
                    aria-label={fav ? 'Unpin' : 'Pin'}
                >
                    <Star size={14} className={fav ? 'fill-amber-400 text-amber-400' : 'text-[var(--foreground-muted)]'} />
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${active ? 'bg-[var(--accent)] text-[#04161a]' : 'bg-[var(--surface-hover)] text-[var(--accent)]'}`}>
                    {CATEGORY_ICON[s.category]}
                </div>
                <p className="text-[13px] font-semibold text-[var(--foreground)] truncate pr-4">{s.name}</p>
                <p className="text-[10px] text-[var(--foreground-muted)] truncate">{s.description}</p>
                {active && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider">
                        <Check size={10} /> Active
                    </span>
                )}
            </button>
        );
    };

    if (!render) return null;

    return (
        <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-xl z-[150] flex items-end md:items-center justify-center transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-[var(--background)] w-full md:w-[440px] h-[90vh] md:h-auto md:max-h-[86vh] rounded-t-3xl md:rounded-3xl border border-[var(--border)] flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out ${show ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Header */}
                <div className="px-5 pt-4 pb-3 border-b border-[var(--border)]">
                    <div className="md:hidden w-9 h-1 rounded-full bg-[var(--surface-hover)] mx-auto mb-3" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shrink-0">
                                <Wand2 size={18} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-[var(--foreground)] leading-tight">Audio FX</h2>
                                <p className="text-xs text-[var(--foreground-muted)] truncate">
                                    {activeScene ? activeScene.name : 'No effect — pure audio'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {activeScene && (
                                <button onClick={() => setSceneMode('none')} title="Reset" className="w-8 h-8 rounded-full hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--foreground-muted)]">
                                    <RotateCcw size={16} />
                                </button>
                            )}
                            <button onClick={handleClose} className="w-8 h-8 rounded-full hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--foreground-muted)]">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-3 py-2 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${tab === t.id ? 'bg-[var(--accent)] text-[#04161a]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'}`}
                        >
                            {t.icon}{t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* ============ SCENES ============ */}
                    {tab === 'scenes' && (
                        <>
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                                <input
                                    value={sceneSearch}
                                    onChange={(e) => { setSceneSearch(e.target.value); if (e.target.value) setBrowse(true); }}
                                    placeholder={`Search ${ALL_SCENES.length} scenes…`}
                                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-9 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]/50"
                                />
                                {sceneSearch && (
                                    <button onClick={() => setSceneSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"><X size={15} /></button>
                                )}
                            </div>

                            {/* Original */}
                            <button
                                onClick={() => setSceneMode('none')}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${sceneMode === 'none' ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}
                            >
                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sceneMode === 'none' ? 'bg-[var(--accent)] text-[#04161a]' : 'bg-[var(--surface-hover)] text-[var(--accent)]'}`}>
                                    <Music2 size={18} />
                                </span>
                                <div className="text-left flex-1">
                                    <p className="text-sm font-semibold text-[var(--foreground)]">Original</p>
                                    <p className="text-[11px] text-[var(--foreground-muted)]">No effect — pure audio</p>
                                </div>
                                {sceneMode === 'none' && <Check size={16} className="text-[var(--accent)]" />}
                            </button>

                            {(!browse && !sceneSearch) ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)] flex items-center gap-1.5">
                                            <Star size={12} className="fill-amber-400 text-amber-400" /> My Scenes
                                        </h3>
                                        <span className="text-[10px] text-[var(--foreground-muted)]">{myScenes.length} pinned</span>
                                    </div>
                                    {myScenes.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2.5">{myScenes.map(SceneTile)}</div>
                                    ) : (
                                        <p className="text-xs text-[var(--foreground-muted)] text-center py-4">Pin scenes with ★ to keep them here.</p>
                                    )}
                                    <button
                                        onClick={() => setBrowse(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--border-hover)] text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/5 active:scale-[0.99] transition-all"
                                    >
                                        <Wand2 size={15} /> Browse all {ALL_SCENES.length} scenes
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        {!sceneSearch && (
                                            <button onClick={() => { setBrowse(false); setSceneCat('all'); }} className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] shrink-0">
                                                <ChevronLeft size={14} /> Done
                                            </button>
                                        )}
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                                            <button
                                                onClick={() => setSceneCat('all')}
                                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${sceneCat === 'all' ? 'bg-[var(--accent)] text-[#04161a]' : 'bg-[var(--surface)] text-[var(--foreground-muted)]'}`}
                                            >
                                                <Sparkles size={13} /> All
                                            </button>
                                            {SCENE_CATEGORIES.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setSceneCat(c.id)}
                                                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${sceneCat === c.id ? 'bg-[var(--accent)] text-[#04161a]' : 'bg-[var(--surface)] text-[var(--foreground-muted)]'}`}
                                                >
                                                    <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{CATEGORY_ICON[c.id]}</span>{c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-[var(--foreground-muted)]">{filtered.length} scene{filtered.length === 1 ? '' : 's'}</span>
                                    {filtered.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2.5">{filtered.map(SceneTile)}</div>
                                    ) : (
                                        <p className="text-center text-xs text-[var(--foreground-muted)] py-10">No scenes match “{sceneSearch}”.</p>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ============ TUNE (EQ + Normalizer + Haptic) ============ */}
                    {tab === 'tune' && (
                        <>
                            <Card className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-[var(--foreground)]">Equalizer</p>
                                    <button
                                        onClick={() => setEqualizerSettings({ bass: 0, mid: 0, treble: 0 })}
                                        className="flex items-center gap-1 text-[11px] font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    >
                                        <RotateCcw size={12} /> Flat
                                    </button>
                                </div>

                                <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
                                    {EQ_PRESETS.map(p => {
                                        const on = equalizerSettings.bass === p.v.bass && equalizerSettings.mid === p.v.mid && equalizerSettings.treble === p.v.treble;
                                        return (
                                            <button
                                                key={p.name}
                                                onClick={() => setEqualizerSettings(p.v)}
                                                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${on ? 'bg-[var(--accent)] text-[#04161a]' : 'bg-[var(--surface-hover)] text-[var(--foreground-secondary)]'}`}
                                            >
                                                {p.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {(['bass', 'mid', 'treble'] as const).map(band => (
                                    <div key={band} className="mb-3 last:mb-0">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="font-medium text-[var(--foreground)] capitalize">{band}</span>
                                            <span className={equalizerSettings[band] !== 0 ? 'text-[var(--accent)] font-semibold' : 'text-[var(--foreground-muted)]'}>
                                                {equalizerSettings[band] > 0 ? '+' : ''}{equalizerSettings[band]} dB
                                            </span>
                                        </div>
                                        <Slider
                                            value={equalizerSettings[band]} min={-12} max={12}
                                            onChange={(n) => setEqualizerSettings({ ...equalizerSettings, [band]: n })}
                                        />
                                    </div>
                                ))}
                            </Card>

                            <Card className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                                        <Gauge size={17} className="text-[var(--accent)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[var(--foreground)]">Volume Normalizer</p>
                                        <p className="text-[11px] text-[var(--foreground-muted)]">Even out loudness between tracks</p>
                                    </div>
                                </div>
                                <Toggle on={normalizerEnabled} onClick={() => setNormalizerEnabled(!normalizerEnabled)} />
                            </Card>

                            <Card className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                                        <Vibrate size={17} className="text-[var(--accent)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[var(--foreground)]">Haptic Sync</p>
                                        <p className="text-[11px] text-[var(--foreground-muted)]">Phone pulses with the bass</p>
                                    </div>
                                </div>
                                <Toggle
                                    on={hapticEnabled}
                                    onClick={() => { const next = !hapticEnabled; setHapticEnabled(next); if (next) triggerHaptic(100); }}
                                />
                            </Card>
                        </>
                    )}

                    {/* ============ VOCALS ============ */}
                    {tab === 'vocals' && (
                        <>
                            <div className="grid grid-cols-2 gap-2.5">
                                {VOCAL_MODES.map(m => {
                                    const on = vocalMode === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setVocalMode(m.id)}
                                            className={`text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${on ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}
                                        >
                                            <p className="text-sm font-semibold text-[var(--foreground)]">{m.name}</p>
                                            <p className="text-[11px] text-[var(--foreground-muted)]">{m.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-[var(--foreground-muted)] px-1">
                                Vocal removal works best on stereo tracks — results vary by how the song was mixed.
                            </p>

                            <button
                                onClick={() => setShowAdvVocal(v => !v)}
                                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold text-[var(--foreground)]"
                            >
                                Fine-tune voice
                                <span className="text-[var(--foreground-muted)]">{showAdvVocal ? '−' : '+'}</span>
                            </button>

                            {showAdvVocal && (
                                <Card className="p-4 space-y-4">
                                    {([
                                        { key: 'clarity', label: 'Clarity', max: 2 },
                                        { key: 'presence', label: 'Presence', max: 2 },
                                        { key: 'isolation', label: 'Isolation', max: 1 },
                                    ] as const).map(s => (
                                        <div key={s.key}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="font-medium text-[var(--foreground)]">{s.label}</span>
                                                <span className="text-[var(--foreground-muted)]">{Math.round(vocalSettings[s.key] * 100)}%</span>
                                            </div>
                                            <Slider
                                                value={vocalSettings[s.key]} min={0} max={s.max} step={0.1}
                                                onChange={(n) => setVocalSettings({ ...vocalSettings, [s.key]: n })}
                                            />
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-[var(--foreground-muted)]">Fine-tuning applies in Natural mode.</p>
                                </Card>
                            )}
                        </>
                    )}

                    {/* ============ SLEEP ============ */}
                    {tab === 'sleep' && (
                        <>
                            <p className="text-xs text-[var(--foreground-muted)] px-1">
                                Music gently fades out over the final minutes to ease you to sleep.
                            </p>
                            {sleepTimerRemaining !== null && sleepTimerRemaining > 0 ? (
                                <Card className="p-6 text-center">
                                    <Moon size={30} className="text-[var(--accent)] mx-auto mb-3" />
                                    <p className="text-3xl font-bold text-[var(--foreground)]">{fmt(sleepTimerRemaining)}</p>
                                    <p className="text-xs text-[var(--foreground-muted)] mb-4">until music stops</p>
                                    <button
                                        onClick={cancelSleepTimer}
                                        className="px-6 py-2 rounded-full bg-red-500/15 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-colors"
                                    >
                                        Cancel timer
                                    </button>
                                </Card>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {SLEEP_OPTIONS.map(min => (
                                            <button
                                                key={min}
                                                onClick={() => setSleepTimer(min)}
                                                className="py-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors flex flex-col items-center gap-1"
                                            >
                                                <Timer size={18} className="text-[var(--accent)]" />
                                                <span className="text-sm font-semibold text-[var(--foreground)]">{min} min</span>
                                            </button>
                                        ))}
                                    </div>
                                    <Card className="p-4 flex items-center gap-3">
                                        <Timer size={18} className="text-[var(--accent)] shrink-0" />
                                        <span className="text-sm text-[var(--foreground)]">Custom</span>
                                        <input
                                            type="number" min={1} max={480}
                                            value={customSleep}
                                            onChange={(e) => setCustomSleep(e.target.value)}
                                            className="w-16 h-9 ml-auto bg-[var(--background)] border border-[var(--border)] rounded-lg text-center text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                                        />
                                        <span className="text-xs text-[var(--foreground-muted)]">min</span>
                                        <button
                                            onClick={() => { const m = parseInt(customSleep); if (m >= 1) setSleepTimer(m); }}
                                            className="px-4 h-9 rounded-lg bg-[var(--accent)] text-[#04161a] text-sm font-bold"
                                        >
                                            Set
                                        </button>
                                    </Card>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
