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

    // Toggle DJ Mode
    const toggleDJMode = useCallback(() => {
        const newState = !isDJMode;
        setIsDJMode(newState);

        if (newState) {
            // Enable crossfade when DJ mode is on
            setCrossfadeEnabled(true);
            setCrossfadeDuration(djSettings.crossfadeDuration);
            setCurrentMixState('building');
        } else {
            setCurrentMixState('idle');
            setNextTrackPreview(null);
        }
    }, [isDJMode, djSettings.crossfadeDuration, setCrossfadeEnabled, setCrossfadeDuration]);

    // Update DJ settings
    const updateDJSettings = useCallback((settings: Partial<typeof djSettings>) => {
        setDJSettings(prev => {
            const newSettings = { ...prev, ...settings };
            if (settings.crossfadeDuration !== undefined) {
                setCrossfadeDuration(settings.crossfadeDuration);
            }
            return newSettings;
        });
    }, [setCrossfadeDuration]);

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

    // Persist settings
    useEffect(() => {
        try {
            localStorage.setItem('nitro_dj_mode', isDJMode.toString());
            localStorage.setItem('nitro_dj_settings', JSON.stringify(djSettings));
        } catch (e) { }
    }, [isDJMode, djSettings]);

    // Load settings
    useEffect(() => {
        try {
            const savedMode = localStorage.getItem('nitro_dj_mode');
            const savedSettings = localStorage.getItem('nitro_dj_settings');
            if (savedMode) setIsDJMode(savedMode === 'true');
            if (savedSettings) setDJSettings(JSON.parse(savedSettings));
        } catch (e) { }
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
