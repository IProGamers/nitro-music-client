"use client"
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { usePlayer } from './PlayerContext';
import { useAudioFX } from './AudioFXContext';

interface DJContextType {
    isDJMode: boolean;
    toggleDJMode: () => void;
    djSettings: {
        autoMix: boolean;
        crossfadeDuration: number;
        energyMatching: boolean;
        announcements: boolean;
    };
    updateDJSettings: (settings: Partial<DJContextType['djSettings']>) => void;
    currentMixState: 'idle' | 'building' | 'peak' | 'cooling';
    nextTrackPreview: any | null;
}

const DJContext = createContext<DJContextType | undefined>(undefined);

export const DJProvider = ({ children }: { children: React.ReactNode }) => {
    const { currentSong, queue, currentIndex, next, isPlaying, progress, duration } = usePlayer();
    const { setCrossfadeEnabled, setCrossfadeDuration } = useAudioFX();

    const [isDJMode, setIsDJMode] = useState(false);
    const [currentMixState, setCurrentMixState] = useState<'idle' | 'building' | 'peak' | 'cooling'>('idle');
    const [nextTrackPreview, setNextTrackPreview] = useState<any | null>(null);

    const [djSettings, setDJSettings] = useState({
        autoMix: true,
        crossfadeDuration: 8,
        energyMatching: true,
        announcements: false
    });

    const mixTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Don't persist until we've loaded the saved value, otherwise the initial
    // render (isDJMode=false) overwrites a previously-saved "on" before load runs.
    const hasLoadedRef = useRef(false);

    // Toggle DJ Mode (AudioFX crossfade flags are synced in an effect below, never
    // during render — see the sync effect).
    const toggleDJMode = useCallback(() => {
        const newState = !isDJMode;
        setIsDJMode(newState);
        setCurrentMixState(newState ? 'building' : 'idle');
        if (!newState) setNextTrackPreview(null);
    }, [isDJMode]);

    // Update DJ settings
    const updateDJSettings = useCallback((settings: Partial<typeof djSettings>) => {
        setDJSettings(prev => ({ ...prev, ...settings }));
    }, []);

    // Keep AudioFX crossfade in sync with DJ state — in an effect (post-render) so we
    // never call another provider's setState during this provider's render.
    useEffect(() => {
        setCrossfadeEnabled(isDJMode);
        setCrossfadeDuration(djSettings.crossfadeDuration);
    }, [isDJMode, djSettings.crossfadeDuration, setCrossfadeEnabled, setCrossfadeDuration]);

    // Auto-mix logic: monitor progress and trigger transitions
    useEffect(() => {
        if (!isDJMode || !isPlaying || !duration || !djSettings.autoMix) return;

        const timeRemaining = duration - progress;
        const transitionPoint = djSettings.crossfadeDuration + 2; // Start slightly before crossfade

        // Update mix state based on song position
        const songProgress = progress / duration;
        if (songProgress < 0.2) {
            setCurrentMixState('building');
        } else if (songProgress < 0.7) {
            setCurrentMixState('peak');
        } else {
            setCurrentMixState('cooling');
        }

        // Prepare next track preview when approaching end
        if (timeRemaining <= transitionPoint + 5 && timeRemaining > transitionPoint) {
            const nextIdx = currentIndex + 1;
            if (nextIdx < queue.length) {
                setNextTrackPreview(queue[nextIdx]);
            }
        }

        // Clear preview after transition
        if (timeRemaining <= 2) {
            setNextTrackPreview(null);
        }

    }, [isDJMode, isPlaying, progress, duration, currentIndex, queue, djSettings]);

    // Clean up on song change
    useEffect(() => {
        if (isDJMode) {
            setCurrentMixState('building');
        }
    }, [currentSong, isDJMode]);

    // Persist settings — but only after the saved value has been loaded.
    useEffect(() => {
        if (!hasLoadedRef.current) return;
        try {
            localStorage.setItem('nitro_dj_mode', isDJMode.toString());
            localStorage.setItem('nitro_dj_settings', JSON.stringify(djSettings));
        } catch (e) { }
    }, [isDJMode, djSettings]);

    // Load settings once on mount; DJ Mode stays on across reloads until turned off.
    useEffect(() => {
        try {
            const savedMode = localStorage.getItem('nitro_dj_mode');
            const savedSettings = localStorage.getItem('nitro_dj_settings');
            if (savedMode === 'true') {
                setIsDJMode(true);
                setCurrentMixState('building');
            }
            if (savedSettings) setDJSettings(JSON.parse(savedSettings));
        } catch (e) { }
        hasLoadedRef.current = true;
    }, []);

    return (
        <DJContext.Provider value={{
            isDJMode,
            toggleDJMode,
            djSettings,
            updateDJSettings,
            currentMixState,
            nextTrackPreview
        }}>
            {children}
        </DJContext.Provider>
    );
};

export const useDJ = () => {
    const context = useContext(DJContext);
    if (!context) throw new Error("useDJ must be used within DJProvider");
    return context;
};
