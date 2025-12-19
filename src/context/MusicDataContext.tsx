"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    } | null;
    setHomeData: (data: any) => void;
    hasLoadedHome: boolean;
    setHasLoadedHome: (loaded: boolean) => void;
    searchCache: Map<string, any>;
}

const MusicDataContext = createContext<MusicDataContextType | undefined>(undefined);

export function MusicDataProvider({ children }: { children: ReactNode }) {
    const [homeData, setHomeData] = useState<MusicDataContextType['homeData']>(null);
    const [hasLoadedHome, setHasLoadedHome] = useState(false);
    const [searchCache] = useState(new Map<string, any>());

    return (
        <MusicDataContext.Provider value={{ homeData, setHomeData, hasLoadedHome, setHasLoadedHome, searchCache }}>
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
