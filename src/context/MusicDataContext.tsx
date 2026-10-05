"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MusicDataContextType {
    homeData: {
        trending: any[];
        newReleases: any[];
        featuredArtists: any[];
        bollywoodHits: any[];
        topCharts: any[];
        partyMix: any[];
        internationalHits: any[];
        globalPop: any[];
        lastPlayed: any[];
        iconicEnglish: any[];
        iconicHindi: any[];
        punjabiHits: any[];
        topArtists: any[];
        madeForYou: any[];
        lastFetchedAt: number;
    } | null;
    setHomeData: (data: any) => void;
    hasLoadedHome: boolean;
    setHasLoadedHome: (loaded: boolean) => void;

    profileData: {
        favorites: any[];
        history: any[];
        playlists: any[];
        lastFetchedAt: number;
    } | null;
    setProfileData: (data: any) => void;
    hasLoadedProfile: boolean;
    setHasLoadedProfile: (loaded: boolean) => void;

    // History page cache (from server API)
    historyPageData: {
        history: any[];
        lastFetchedAt: number;
    } | null;
    setHistoryPageData: (data: any) => void;
    hasLoadedHistoryPage: boolean;
    setHasLoadedHistoryPage: (loaded: boolean) => void;

    searchCache: Map<string, any>;
    clearSearchCache: () => void;

    // Clear all profile cache (for logout)
    clearProfileCache: () => void;

    // Invalidate profile cache (mark as stale to force refresh)
    invalidateProfileCache: () => void;
}

const MusicDataContext = createContext<MusicDataContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = 'nitro_profile_cache';
// Bump the suffix whenever the home page's section queries/shape change so stale
// cached homeData is discarded automatically (old key is simply never read again).
const HOME_CACHE_KEY = 'nitro_home_cache_v7';

export function MusicDataProvider({ children }: { children: ReactNode }) {
    const [homeData, setHomeData] = useState<MusicDataContextType['homeData']>(null);
    const [hasLoadedHome, setHasLoadedHome] = useState(false);

    const [profileData, setProfileDataState] = useState<MusicDataContextType['profileData']>(null);
    const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

    const [historyPageData, setHistoryPageData] = useState<MusicDataContextType['historyPageData']>(null);
    const [hasLoadedHistoryPage, setHasLoadedHistoryPage] = useState(false);

    const [searchCache] = useState(new Map<string, any>());

    const clearSearchCache = () => {
        searchCache.clear();
    };

    // Load cached profile data from localStorage on mount (for instant loading)
    useEffect(() => {
        try {
            const cachedProfile = localStorage.getItem(PROFILE_CACHE_KEY);
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                // Only use cache if it's less than 24 hours old
                const oneDayMs = 24 * 60 * 60 * 1000;
                if (data.lastFetchedAt && (Date.now() - data.lastFetchedAt < oneDayMs)) {
                    setProfileDataState(data);
                    setHasLoadedProfile(true);
                }
            }

            const cachedHome = localStorage.getItem(HOME_CACHE_KEY);
            if (cachedHome) {
                const data = JSON.parse(cachedHome);
                const oneDayMs = 24 * 60 * 60 * 1000;
                if (data.lastFetchedAt && (Date.now() - data.lastFetchedAt < oneDayMs) && Array.isArray(data.trending) && data.trending.length > 0) {
                    setHomeData(data);
                    setHasLoadedHome(true);
                }
            }
        } catch (e) {
            console.error('Failed to load cached data:', e);
        }
    }, []);

    // Persist profile data to localStorage when it updates
    const setProfileData = (data: any) => {
        setProfileDataState(data);
        if (data) {
            try {
                localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
            } catch (e) {
                console.error('Failed to cache profile data:', e);
            }
        }
    };

    // Also persist home data
    const setHomeDataWithCache = (data: any) => {
        setHomeData(data);
        if (data) {
            try {
                localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data));
            } catch (e) {
                console.error('Failed to cache home data:', e);
            }
        }
    };

    // Clear all profile cache (for logout)
    const clearProfileCache = () => {
        setProfileDataState(null);
        setHasLoadedProfile(false);
        try {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        } catch (e) {
            console.error('Failed to clear profile cache:', e);
        }
    };

    // Invalidate profile cache (mark as stale to force refresh on next view)
    const invalidateProfileCache = () => {
        if (profileData) {
            // Set lastFetchedAt to 0 to force a refresh
            const invalidatedData = { ...profileData, lastFetchedAt: 0 };
            setProfileDataState(invalidatedData);
            try {
                localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(invalidatedData));
            } catch (e) {
                console.error('Failed to invalidate profile cache:', e);
            }
        }
    };

    return (
        <MusicDataContext.Provider value={{
            homeData, setHomeData: setHomeDataWithCache, hasLoadedHome, setHasLoadedHome,
            profileData, setProfileData, hasLoadedProfile, setHasLoadedProfile,
            historyPageData, setHistoryPageData, hasLoadedHistoryPage, setHasLoadedHistoryPage,
            searchCache,
            clearSearchCache,
            clearProfileCache,
            invalidateProfileCache
        }}>
            {children}
        </MusicDataContext.Provider>
    );
}

export function useMusicData() {
    const context = useContext(MusicDataContext);
    if (context === undefined) {
        throw new Error('useMusicData must be used within a MusicDataProvider');
    }
    return context;
}
