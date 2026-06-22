"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, SubscriptionTier } from './AuthContext';

// Re-export SubscriptionTier for backward compatibility
export type { SubscriptionTier } from './AuthContext';

interface SettingsContextType {
    enableDownload: boolean;
    setEnableDownload: (v: boolean) => void;
    enable3DAudio: boolean;
    setEnable3DAudio: (v: boolean) => void;
    audioQuality: 'low' | 'medium' | 'high' | 'supreme';
    setAudioQuality: (v: 'low' | 'medium' | 'high' | 'supreme') => void;
    autoPlay: boolean;
    setAutoPlay: (v: boolean) => void;
    visualizer: boolean;
    setVisualizer: (v: boolean) => void;
    language: string;
    setLanguage: (v: string) => void;
    region: string;
    setRegion: (v: string) => void;
    crossfadeDuration: number;
    setCrossfadeDuration: (v: number) => void;
    // Dual music source: where home/search/browse pull from. Playback of a song
    // always follows that song's own `source`, not this global setting.
    musicSource: 'jiosaavn' | 'youtube';
    setMusicSource: (v: 'jiosaavn' | 'youtube') => void;
    tier: SubscriptionTier;
    isAdmin: boolean;
    refreshProfile: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const { userProfile, refreshProfile: authRefreshProfile } = useAuth();

    const [enableDownload, setEnableDownload] = useState(false);
    const [enable3DAudio, setEnable3DAudio] = useState(false);
    const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high' | 'supreme'>('high');
    const [autoPlay, setAutoPlay] = useState(true);
    const [visualizer, setVisualizer] = useState(true);
    const [language, setLanguage] = useState('English');
    const [region, setRegion] = useState('Global');
    const [crossfadeDuration, setCrossfadeDuration] = useState(0); // 0 = off, 1-12 seconds
    const [musicSource, setMusicSource] = useState<'jiosaavn' | 'youtube'>('jiosaavn');

    // Get tier and isAdmin from userProfile (Firebase)
    // Map legacy NITRO_ULTRA to NITRO_SUPREME for backward compatibility
    const rawTier = userProfile?.tier || 'NITRO_CORE';
    const tier: SubscriptionTier = (rawTier as string) === 'NITRO_ULTRA' ? 'NITRO_SUPREME' : rawTier as SubscriptionTier;
    const isAdmin = userProfile?.isAdmin || false;

    const refreshProfile = async () => {
        await authRefreshProfile();
    };

    useEffect(() => {
        const saved = {
            download: localStorage.getItem('nitro_setting_download'),
            audio3d: localStorage.getItem('nitro_setting_3d'),
            quality: localStorage.getItem('nitro_setting_quality'),
            autoplay: localStorage.getItem('nitro_setting_autoplay'),
            viz: localStorage.getItem('nitro_setting_viz'),
            lang: localStorage.getItem('nitro_setting_lang'),
            region: localStorage.getItem('nitro_setting_region'),
            crossfade: localStorage.getItem('nitro_setting_crossfade'),
            source: localStorage.getItem('nitro_setting_source')
        };

        if (saved.download) setEnableDownload(JSON.parse(saved.download));
        if (saved.audio3d) setEnable3DAudio(JSON.parse(saved.audio3d));
        if (saved.quality) setAudioQuality(saved.quality as any);
        if (saved.autoplay) setAutoPlay(JSON.parse(saved.autoplay));
        if (saved.viz) setVisualizer(JSON.parse(saved.viz));
        if (saved.lang) setLanguage(saved.lang);
        if (saved.region) setRegion(saved.region);
        if (saved.crossfade) setCrossfadeDuration(parseInt(saved.crossfade, 10));
        if (saved.source === 'youtube' || saved.source === 'jiosaavn') setMusicSource(saved.source);
    }, []);

    useEffect(() => {
        localStorage.setItem('nitro_setting_download', JSON.stringify(enableDownload));
        localStorage.setItem('nitro_setting_3d', JSON.stringify(enable3DAudio));
        localStorage.setItem('nitro_setting_quality', audioQuality);
        localStorage.setItem('nitro_setting_autoplay', JSON.stringify(autoPlay));
        localStorage.setItem('nitro_setting_viz', JSON.stringify(visualizer));
        localStorage.setItem('nitro_setting_lang', language);
        localStorage.setItem('nitro_setting_region', region);
        localStorage.setItem('nitro_setting_crossfade', crossfadeDuration.toString());
        localStorage.setItem('nitro_setting_source', musicSource);
    }, [enableDownload, enable3DAudio, audioQuality, autoPlay, visualizer, language, region, crossfadeDuration, musicSource]);

    return (
        <SettingsContext.Provider value={{
            enableDownload, setEnableDownload,
            enable3DAudio, setEnable3DAudio,
            audioQuality, setAudioQuality,
            autoPlay, setAutoPlay,
            visualizer, setVisualizer,
            language, setLanguage,
            region, setRegion,
            crossfadeDuration, setCrossfadeDuration,
            musicSource, setMusicSource,
            tier, isAdmin, refreshProfile
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within SettingsProvider");
    return context;
};
