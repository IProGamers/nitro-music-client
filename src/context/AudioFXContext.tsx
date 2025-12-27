"use client"
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

// Audio Effect Types
export type SceneMode = 'none' | 'stadium' | 'lofi' | 'club' | 'concert' | 'underwater' | 'cave';
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

    // Audio Analysis
    frequencyData: Uint8Array | null;
    analyserNode: AnalyserNode | null;

    // Connect audio effects
    connectAudioSource: (source: MediaElementAudioSourceNode, context: AudioContext) => GainNode;
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
    const [visualizerEnabled, setVisualizerEnabled] = useState(true);
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

    // Refs for audio nodes
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const convolverRef = useRef<ConvolverNode | null>(null);
    const biquadFiltersRef = useRef<BiquadFilterNode[]>([]);
    const gainNodeRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const sleepIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Refs for wet/dry gain control
    const dryGainRef = useRef<GainNode | null>(null);
    const wetGainRef = useRef<GainNode | null>(null);

    // Connect audio source with effects chain
    const connectAudioSource = useCallback((source: MediaElementAudioSourceNode, context: AudioContext) => {
        audioContextRef.current = context;

        // Create analyser
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024; // Increased from 256 for better resolution
        analyserRef.current = analyser;
        setAnalyserNode(analyser); // Expose to state

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
        compressor.threshold.value = -24;  // Start compressing at -24dB
        compressor.knee.value = 30;        // Soft knee for natural compression
        compressor.ratio.value = 12;       // High ratio for limiting
        compressor.attack.value = 0.003;   // Fast attack
        compressor.release.value = 0.25;   // Moderate release
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

        // Output: analyser -> compressor (if enabled) -> gainNode
        analyser.connect(compressor);
        compressor.connect(gainNode);

        // Initial Balance (Dry by default)
        dryGain.gain.value = 1;
        wetGain.gain.value = 0;

        return gainNode;
    }, []);

    // Apply scene mode effects
    const setSceneMode = useCallback((mode: SceneMode) => {
        setSceneModeState(mode);

        if (!audioContextRef.current || biquadFiltersRef.current.length < 3) return;

        const ctx = audioContextRef.current;
        const [lowFilter, midFilter, highFilter] = biquadFiltersRef.current;
        const convolver = convolverRef.current;
        const dryGain = dryGainRef.current;
        const wetGain = wetGainRef.current;

        if (!convolver || !dryGain || !wetGain) return;

        // Reset EQ
        lowFilter.gain.value = 0;
        midFilter.gain.value = 0;
        highFilter.gain.value = 0;

        // Default to wet/dry mix
        dryGain.gain.setTargetAtTime(mode === 'none' ? 1 : 0.4, ctx.currentTime, 0.1);
        wetGain.gain.setTargetAtTime(mode === 'none' ? 0 : 0.8, ctx.currentTime, 0.1);

        switch (mode) {
            case 'stadium':
                lowFilter.gain.value = 5;
                midFilter.gain.value = -4;
                highFilter.gain.value = 4;
                convolver.buffer = createImpulseResponse(ctx, 4.5, 1.2);
                break;
            case 'lofi':
                lowFilter.gain.value = 5;
                midFilter.gain.value = -6;
                highFilter.gain.value = -12;
                convolver.buffer = createImpulseResponse(ctx, 0.1, 10);
                break;
            case 'club':
                lowFilter.gain.value = 10;
                midFilter.gain.value = 2;
                highFilter.gain.value = 6;
                convolver.buffer = createImpulseResponse(ctx, 0.5, 3);
                break;
            case 'concert':
                lowFilter.gain.value = 3;
                midFilter.gain.value = 1;
                highFilter.gain.value = 5;
                convolver.buffer = createImpulseResponse(ctx, 2.0, 2.5);
                break;
            case 'underwater':
                lowFilter.gain.value = 8;
                midFilter.gain.value = -10;
                highFilter.gain.value = -24;
                convolver.buffer = createImpulseResponse(ctx, 1.5, 0.5, true);
                break;
            case 'cave':
                midFilter.gain.value = 6;
                convolver.buffer = createImpulseResponse(ctx, 4.0, 0.8);
                break;
            case 'none':
            default:
                // Just dry signal (already handled by gains above)
                break;
        }
    }, []);

    // Apply vocal mode
    const setVocalMode = useCallback((mode: VocalMode) => {
        setVocalModeState(mode);

        if (!biquadFiltersRef.current.length) return;

        const [lowFilter, midFilter, highFilter] = biquadFiltersRef.current;

        switch (mode) {
            case 'reduced':
                midFilter.frequency.value = 1000;
                midFilter.Q.value = 1.5;
                midFilter.gain.value = -12 * (vocalSettings.isolation || 1);
                break;
            case 'karaoke':
                midFilter.frequency.value = 1200;
                midFilter.Q.value = 2.5;
                midFilter.gain.value = -25;
                highFilter.gain.value = -5;
                break;
            case 'bass_boost':
                lowFilter.gain.value = 12;
                midFilter.gain.value = 2;
                break;
            case 'normal':
            default:
                // Use custom settings if available, otherwise reset
                if (mode === 'normal') {
                    midFilter.gain.value = 0;
                    midFilter.Q.value = 0.5;
                }
                break;
        }
    }, [vocalSettings]);

    // Apply custom vocal settings in real-time
    useEffect(() => {
        if (!biquadFiltersRef.current.length || vocalMode !== 'normal') return;
        const [lowFilter, midFilter, highFilter] = biquadFiltersRef.current;

        // Mid range (vocals)
        midFilter.frequency.value = 1500;
        midFilter.gain.value = (vocalSettings.presence - 1) * 10;
        midFilter.Q.value = vocalSettings.clarity * 0.8;

        // Influence high/low for overall balance
        highFilter.gain.value = (vocalSettings.clarity - 1) * 5;
    }, [vocalSettings, vocalMode]);

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
            normalizerEnabled,
            setNormalizerEnabled
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
