"use client"
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { ALL_SCENES } from '@/lib/sceneLibrary';

// Audio Effect Types
// A scene is identified by its id from the scene library ('none' = no effect).
// Keeping this as a string lets every one of the 100+ library scenes be applied.
export type SceneMode = string;
export type VocalMode = 'normal' | 'reduced' | 'karaoke' | 'bass_boost';

interface AudioFXContextType {
    // Scene Modes
    sceneMode: SceneMode;
    setSceneMode: (mode: SceneMode) => void;

    vocalMode: VocalMode;
    setVocalMode: (mode: VocalMode) => void;

    // Custom Vocal Controls
    vocalSettings: {
        clarity: number;
        isolation: number;
        presence: number;
    };
    setVocalSettings: (settings: { clarity: number; isolation: number; presence: number }) => void;

    // Haptic
    hapticEnabled: boolean;
    setHapticEnabled: (enabled: boolean) => void;
    triggerHaptic: (intensity?: number) => void;

    // Sleep Timer
    sleepTimerMinutes: number | null;
    sleepTimerRemaining: number | null;
    setSleepTimer: (minutes: number | null) => void;
    cancelSleepTimer: () => void;

    // Crossfade
    crossfadeEnabled: boolean;
    setCrossfadeEnabled: (enabled: boolean) => void;
    crossfadeDuration: number;
    setCrossfadeDuration: (seconds: number) => void;

    // Visualizer
    visualizerEnabled: boolean;
    setVisualizerEnabled: (enabled: boolean) => void;
    visualizerStyle: 'bars' | 'wave' | 'circle' | 'particles' | 'spectrum';
    setVisualizerStyle: (style: 'bars' | 'wave' | 'circle' | 'particles' | 'spectrum') => void;
    visualizerIntensity: number;
    setVisualizerIntensity: (intensity: number) => void;

    // Audio Normalizer
    normalizerEnabled: boolean;
    setNormalizerEnabled: (enabled: boolean) => void;

    // Manual Equalizer
    equalizerSettings: { bass: number; mid: number; treble: number };
    setEqualizerSettings: (settings: { bass: number; mid: number; treble: number }) => void;

    // Audio Analysis
    frequencyData: Uint8Array | null;
    analyserNode: AnalyserNode | null;

    // Connect audio effects
    connectAudioSource: (source: AudioNode, context: AudioContext) => GainNode;
    connectSecondarySource: (source: AudioNode) => void;
    applyCurrentEffects: () => void;
}

const AudioFXContext = createContext<AudioFXContextType | undefined>(undefined);

// Impulse response data for different scenes (simplified)
const createImpulseResponse = (context: AudioContext, duration: number, decay: number, reverse: boolean = false): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const buffer = context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-decay * t);
            data[i] = (Math.random() * 2 - 1) * envelope;
        }
        if (reverse) {
            data.reverse();
        }
    }
    return buffer;
};

export const AudioFXProvider = ({ children }: { children: React.ReactNode }) => {
    // State
    const [sceneMode, setSceneModeState] = useState<SceneMode>('none');
    const [vocalMode, setVocalModeState] = useState<VocalMode>('normal');
    const [hapticEnabled, setHapticEnabled] = useState(false);
    const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
    const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
    const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
    const [crossfadeDuration, setCrossfadeDuration] = useState(5);
    const [visualizerEnabled, setVisualizerEnabled] = useState(false);
    const [visualizerStyle, setVisualizerStyle] = useState<'bars' | 'wave' | 'circle' | 'particles' | 'spectrum'>('wave');
    const [visualizerIntensity, setVisualizerIntensity] = useState(1);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
    const frequencyDataRef = useRef<Uint8Array | null>(null);
    const [normalizerEnabled, setNormalizerEnabledState] = useState(false);

    // Custom Vocal Settings
    const [vocalSettings, setVocalSettings] = useState({
        clarity: 1,
        isolation: 0,
        presence: 1
    });

    // Manual Equalizer Settings (bass/mid/treble in dB)
    const [equalizerSettings, setEqualizerSettingsState] = useState({
        bass: 0,
        mid: 0,
        treble: 0
    });

    // Refs for audio nodes
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const convolverRef = useRef<ConvolverNode | null>(null);
    const biquadFiltersRef = useRef<BiquadFilterNode[]>([]);
    const gainNodeRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const sleepIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Equalizer setter - applies to biquad filters in real-time and persists
    const setEqualizerSettings = useCallback((settings: { bass: number; mid: number; treble: number }) => {
        setEqualizerSettingsState(settings);
        try {
            localStorage.setItem('nitro_equalizer', JSON.stringify(settings));
        } catch { }
    }, []);

    // Load settings from localStorage
    useEffect(() => {
        const savedScene = localStorage.getItem('nitro_scene_mode');
        const savedVocal = localStorage.getItem('nitro_vocal_mode');
        const savedHaptic = localStorage.getItem('nitro_haptic');
        const savedCrossfade = localStorage.getItem('nitro_crossfade');
        const savedVisualizer = localStorage.getItem('nitro_visualizer_style');

        if (savedScene) setSceneModeState(savedScene as SceneMode);
        if (savedVocal) setVocalModeState(savedVocal as VocalMode);
        if (savedHaptic) setHapticEnabled(savedHaptic === 'true');
        if (savedCrossfade) setCrossfadeEnabled(savedCrossfade === 'true');
        if (savedVisualizer) setVisualizerStyle(savedVisualizer as any);

        const savedEq = localStorage.getItem('nitro_equalizer');
        if (savedEq) {
            try { setEqualizerSettingsState(JSON.parse(savedEq)); } catch { }
        }

        const savedVisualizerEnabled = localStorage.getItem('nitro_visualizer_enabled');
        if (savedVisualizerEnabled !== null) setVisualizerEnabled(savedVisualizerEnabled !== 'false');

        const savedNormalizer = localStorage.getItem('nitro_normalizer');
        if (savedNormalizer !== null) setNormalizerEnabledState(savedNormalizer === 'true');
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('nitro_scene_mode', sceneMode);
        localStorage.setItem('nitro_vocal_mode', vocalMode);
        localStorage.setItem('nitro_haptic', String(hapticEnabled));
        localStorage.setItem('nitro_crossfade', String(crossfadeEnabled));
        localStorage.setItem('nitro_visualizer_style', visualizerStyle);
        localStorage.setItem('nitro_visualizer_enabled', String(visualizerEnabled));
        localStorage.setItem('nitro_normalizer', String(normalizerEnabled));
    }, [sceneMode, vocalMode, hapticEnabled, crossfadeEnabled, visualizerStyle, visualizerEnabled, normalizerEnabled]);

    // Haptic feedback
    const triggerHaptic = useCallback((intensity: number = 50) => {
        if (!hapticEnabled) return;
        if ('vibrate' in navigator) {
            navigator.vibrate(intensity);
        }
    }, [hapticEnabled]);

    // Haptic sync with bass
    useEffect(() => {
        if (!hapticEnabled || !analyserRef.current) {
            if (hapticIntervalRef.current) {
                clearInterval(hapticIntervalRef.current);
            }
            return;
        }

        const checkBass = () => {
            if (!analyserRef.current) return;
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(data);

            // Check bass frequencies (first 10 bins)
            const bassSum = data.slice(0, 10).reduce((a, b) => a + b, 0);
            const bassAvg = bassSum / 10;

            if (bassAvg > 180) {
                triggerHaptic(Math.min(100, bassAvg / 2));
            }
        };

        hapticIntervalRef.current = setInterval(checkBass, 100);
        return () => {
            if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
        };
    }, [hapticEnabled, triggerHaptic]);

    // Sleep timer
    const setSleepTimer = useCallback((minutes: number | null) => {
        if (sleepIntervalRef.current) {
            clearInterval(sleepIntervalRef.current);
        }

        if (minutes === null) {
            setSleepTimerMinutes(null);
            setSleepTimerRemaining(null);
            return;
        }

        setSleepTimerMinutes(minutes);
        setSleepTimerRemaining(minutes * 60);

        sleepIntervalRef.current = setInterval(() => {
            setSleepTimerRemaining(prev => {
                if (prev === null || prev <= 0) {
                    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
                    // Gradually fade audio
                    if (gainNodeRef.current && audioContextRef.current) {
                        const now = audioContextRef.current.currentTime;
                        gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now);
                        gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 30);
                    }
                    return 0;
                }

                // Natural fade in last 5 minutes
                if (prev <= 300 && gainNodeRef.current && audioContextRef.current) {
                    const fadeProgress = prev / 300;
                    gainNodeRef.current.gain.value = Math.max(0.1, fadeProgress);
                }

                return prev - 1;
            });
        }, 1000);
    }, []);

    const cancelSleepTimer = useCallback(() => {
        if (sleepIntervalRef.current) {
            clearInterval(sleepIntervalRef.current);
        }
        setSleepTimerMinutes(null);
        setSleepTimerRemaining(null);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = 1;
        }
    }, []);

    // Frequency data updater - optimized
    useEffect(() => {
        if (!analyserNode) return;

        let animationId: number;
        const data = new Uint8Array(analyserNode.frequencyBinCount);

        const updateFrequencyData = () => {
            if (analyserNode) {
                analyserNode.getByteFrequencyData(data);
                frequencyDataRef.current = data;
                // We'll update the state at 30fps instead of 60fps to save React overhead,
                // while visualizers should use the analyserNode directly for 60fps.
                if (Math.random() > 0.5) { // Throttle state update
                    setFrequencyData(new Uint8Array(data));
                }
            }
            animationId = requestAnimationFrame(updateFrequencyData);
        };

        updateFrequencyData();
        return () => cancelAnimationFrame(animationId);
    }, [analyserNode]);

    // Input filter ref to allow secondary crossfade audio element to route through the same FX chain
    const inputFilterRef = useRef<BiquadFilterNode | null>(null);

    // Refs for wet/dry gain control
    const dryGainRef = useRef<GainNode | null>(null);
    const wetGainRef = useRef<GainNode | null>(null);

    // Keep refs in sync with state for instantaneous access across renders/callbacks
    const sceneModeRef = useRef<SceneMode>(sceneMode);
    const equalizerSettingsRef = useRef(equalizerSettings);
    const vocalModeRef = useRef<VocalMode>(vocalMode);
    const vocalSettingsRef = useRef(vocalSettings);
    const normalizerEnabledRef = useRef<boolean>(normalizerEnabled);

    useEffect(() => { sceneModeRef.current = sceneMode; }, [sceneMode]);
    useEffect(() => { equalizerSettingsRef.current = equalizerSettings; }, [equalizerSettings]);
    useEffect(() => { vocalModeRef.current = vocalMode; }, [vocalMode]);
    useEffect(() => { vocalSettingsRef.current = vocalSettings; }, [vocalSettings]);
    useEffect(() => { normalizerEnabledRef.current = normalizerEnabled; }, [normalizerEnabled]);

    // Unified effects applicator: guarantees scene, EQ, vocal, and normalizer are active from the very first song and stay consistent across songs
    const applyEffects = useCallback((
        scene: SceneMode = sceneModeRef.current,
        eq = equalizerSettingsRef.current,
        vocal: VocalMode = vocalModeRef.current,
        vSettings = vocalSettingsRef.current,
        normalizer: boolean = normalizerEnabledRef.current
    ) => {
        if (!audioContextRef.current || biquadFiltersRef.current.length < 3) return;

        const ctx = audioContextRef.current;
        const [lowFilter, midFilter, highFilter] = biquadFiltersRef.current;
        const convolver = convolverRef.current;
        const dryGain = dryGainRef.current;
        const wetGain = wetGainRef.current;
        const compressor = compressorRef.current;

        if (!convolver || !dryGain || !wetGain) return;

        // 1. Calculate combined EQ (Scene EQ + Custom Equalizer + Vocal mode adjustments)
        const scenePreset = scene === 'none' ? null : ALL_SCENES.find(s => s.id === scene);

        let bassDb = (scenePreset?.eq.bass || 0) + (eq.bass || 0);
        let midDb = (scenePreset?.eq.mid || 0) + (eq.mid || 0);
        let trebleDb = (scenePreset?.eq.treble || 0) + (eq.treble || 0);

        // Vocal mode adjustments
        switch (vocal) {
            case 'reduced':
                midFilter.frequency.value = 1000;
                midFilter.Q.value = 1.5;
                midDb += -12 * (vSettings.isolation || 1);
                break;
            case 'karaoke':
                midFilter.frequency.value = 1200;
                midFilter.Q.value = 2.5;
                midDb += -25;
                trebleDb += -5;
                break;
            case 'bass_boost':
                bassDb += 12;
                midDb += 2;
                break;
            case 'normal':
            default:
                midFilter.frequency.value = 1500;
                midFilter.Q.value = Math.max(0.5, vSettings.clarity * 0.8);
                midDb += (vSettings.presence - 1) * 10;
                trebleDb += (vSettings.clarity - 1) * 5;
                break;
        }

        lowFilter.gain.value = bassDb;
        midFilter.gain.value = midDb;
        highFilter.gain.value = trebleDb;

        // 2. Apply Reverb & Wet/Dry mix from Scene preset
        if (!scenePreset) {
            dryGain.gain.value = 1;
            wetGain.gain.value = 0;
            try { dryGain.gain.setTargetAtTime(1, ctx.currentTime, 0.05); } catch {}
            try { wetGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch {}
        } else {
            convolver.buffer = createImpulseResponse(ctx, scenePreset.reverb.duration, scenePreset.reverb.decay, scenePreset.reverb.reverse);
            dryGain.gain.value = scenePreset.mix.dry;
            wetGain.gain.value = scenePreset.mix.wet;
            try { dryGain.gain.setTargetAtTime(scenePreset.mix.dry, ctx.currentTime, 0.05); } catch {}
            try { wetGain.gain.setTargetAtTime(scenePreset.mix.wet, ctx.currentTime, 0.05); } catch {}
        }

        // 3. Audio Normalizer
        if (compressor) {
            compressor.ratio.value = normalizer ? 12 : 1;
            compressor.threshold.value = normalizer ? -24 : 0;
        }
    }, []);

    // Keep active effects applied whenever any setting changes
    useEffect(() => {
        applyEffects(sceneMode, equalizerSettings, vocalMode, vocalSettings, normalizerEnabled);
    }, [sceneMode, equalizerSettings, vocalMode, vocalSettings, normalizerEnabled, applyEffects]);

    // Connect primary audio source with effects chain
    const connectAudioSource = useCallback((source: AudioNode, context: AudioContext) => {
        audioContextRef.current = context;

        // Create analyser
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyserRef.current = analyser;
        setAnalyserNode(analyser);

        // Create convolver for reverb/scene effects
        const convolver = context.createConvolver();
        convolverRef.current = convolver;

        // Create filters
        const lowFilter = context.createBiquadFilter();
        lowFilter.type = 'lowshelf';
        lowFilter.frequency.value = 200;

        const midFilter = context.createBiquadFilter();
        midFilter.type = 'peaking';
        midFilter.frequency.value = 1000;
        midFilter.Q.value = 0.5;

        const highFilter = context.createBiquadFilter();
        highFilter.type = 'highshelf';
        highFilter.frequency.value = 3000;

        biquadFiltersRef.current = [lowFilter, midFilter, highFilter];
        inputFilterRef.current = lowFilter;

        // Create wet/dry gain nodes
        const dryGain = context.createGain();
        const wetGain = context.createGain();
        dryGainRef.current = dryGain;
        wetGainRef.current = wetGain;

        // Create output gain
        const gainNode = context.createGain();
        gainNodeRef.current = gainNode;

        // Create dynamics compressor for normalizer
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        compressorRef.current = compressor;

        // Connect chain: source -> filters
        source.connect(lowFilter);
        lowFilter.connect(midFilter);
        midFilter.connect(highFilter);

        // Path A: Natural (Dry)
        highFilter.connect(dryGain);
        dryGain.connect(analyser);

        // Path B: Scene Effect (Wet)
        highFilter.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(analyser);

        // Output: analyser -> compressor -> gainNode
        analyser.connect(compressor);
        compressor.connect(gainNode);

        // Immediately apply all active user effects so the first song starts with chosen settings
        applyEffects(sceneModeRef.current, equalizerSettingsRef.current, vocalModeRef.current, vocalSettingsRef.current, normalizerEnabledRef.current);

        return gainNode;
    }, [applyEffects]);

    // Connect secondary audio source (used during DJ crossfade so both tracks share the exact same FX)
    const connectSecondarySource = useCallback((source: AudioNode) => {
        if (inputFilterRef.current) {
            try {
                source.connect(inputFilterRef.current);
            } catch (e) {
                console.warn('Could not connect secondary audio source:', e);
            }
        }
    }, []);

    // Apply scene mode effects
    const setSceneMode = useCallback((mode: SceneMode) => {
        setSceneModeState(mode);
    }, []);

    // Apply vocal mode
    const setVocalMode = useCallback((mode: VocalMode) => {
        setVocalModeState(mode);
    }, []);

    // Audio Normalizer toggle
    const setNormalizerEnabled = useCallback((enabled: boolean) => {
        setNormalizerEnabledState(enabled);
        if (compressorRef.current) {
            // When disabled, set ratio to 1 (no compression)
            // When enabled, set ratio to 12 (strong compression for normalization)
            compressorRef.current.ratio.value = enabled ? 12 : 1;
            compressorRef.current.threshold.value = enabled ? -24 : 0;
        }
    }, []);

    return (
        <AudioFXContext.Provider value={{
            sceneMode,
            setSceneMode,
            vocalMode,
            setVocalMode,
            hapticEnabled,
            setHapticEnabled,
            triggerHaptic,
            sleepTimerMinutes,
            sleepTimerRemaining,
            setSleepTimer,
            cancelSleepTimer,
            crossfadeEnabled,
            setCrossfadeEnabled,
            crossfadeDuration,
            setCrossfadeDuration,
            visualizerEnabled,
            setVisualizerEnabled,
            visualizerStyle,
            setVisualizerStyle,
            visualizerIntensity,
            setVisualizerIntensity,
            vocalSettings,
            setVocalSettings,
            frequencyData,
            analyserNode,
            connectAudioSource,
            connectSecondarySource,
            applyCurrentEffects: () => applyEffects(),
            normalizerEnabled,
            setNormalizerEnabled,
            equalizerSettings,
            setEqualizerSettings
        }}>
            {children}
        </AudioFXContext.Provider>
    );
};

export const useAudioFX = () => {
    const context = useContext(AudioFXContext);
    if (!context) throw new Error("useAudioFX must be used within AudioFXProvider");
    return context;
};
