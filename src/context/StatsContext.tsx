"use client"
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { usePlayer } from './PlayerContext';
import { useAuth } from './AuthContext';

interface SessionStats {
    songsPlayed: number;
    totalListeningTime: number; // in seconds
    topArtists: { name: string; count: number }[];
    genres: string[];
    sessionStart: Date;
}

interface StatsContextType {
    // Session Stats
    sessionStats: SessionStats;
    formattedListeningTime: string;

    // All-time stats (from history/Firestore)
    totalSongsPlayed: number;
    totalTimeAllTime: number;

    // Streaks
    currentStreak: number;
    longestStreak: number;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
};

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
    const { currentSong, isPlaying, progress } = usePlayer();
    const { user } = useAuth();

    // Session Stats
    const [sessionStats, setSessionStats] = useState<SessionStats>({
        songsPlayed: 0,
        totalListeningTime: 0,
        topArtists: [],
        genres: [],
        sessionStart: new Date()
    });

    // Track previous song to detect changes
    const prevSongRef = useRef<string | null>(null);
    const listeningIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // All-time stats
    const [totalSongsPlayed, setTotalSongsPlayed] = useState(0);
    const [totalTimeAllTime, setTotalTimeAllTime] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);

    // Get artist name from song
    const getArtistName = (song: any): string => {
        if (song?.artists?.primary?.[0]?.name) return song.artists.primary[0].name;
        if (typeof song?.artist === 'string') return song.artist;
        return 'Unknown';
    };

    // Track song plays
    useEffect(() => {
        if (currentSong) {
            const songId = currentSong.id || currentSong.songId;

            if (prevSongRef.current !== songId) {
                prevSongRef.current = songId;

                // Increment songs played
                setSessionStats(prev => {
                    const artistName = getArtistName(currentSong);
                    const existingArtist = prev.topArtists.find(a => a.name === artistName);

                    let newTopArtists;
                    if (existingArtist) {
                        newTopArtists = prev.topArtists.map(a =>
                            a.name === artistName ? { ...a, count: a.count + 1 } : a
                        ).sort((a, b) => b.count - a.count);
                    } else {
                        newTopArtists = [...prev.topArtists, { name: artistName, count: 1 }]
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 10);
                    }

                    return {
                        ...prev,
                        songsPlayed: prev.songsPlayed + 1,
                        topArtists: newTopArtists
                    };
                });
            }
        }
    }, [currentSong]);

    // Track listening time
    useEffect(() => {
        if (isPlaying) {
            listeningIntervalRef.current = setInterval(() => {
                setSessionStats(prev => ({
                    ...prev,
                    totalListeningTime: prev.totalListeningTime + 1
                }));
            }, 1000);
        } else {
            if (listeningIntervalRef.current) {
                clearInterval(listeningIntervalRef.current);
            }
        }

        return () => {
            if (listeningIntervalRef.current) {
                clearInterval(listeningIntervalRef.current);
            }
        };
    }, [isPlaying]);

    // Load all-time stats from localStorage
    useEffect(() => {
        try {
            const savedStats = localStorage.getItem('nitro_listening_stats');
            if (savedStats) {
                const stats = JSON.parse(savedStats);
                setTotalSongsPlayed(stats.totalSongsPlayed || 0);
                setTotalTimeAllTime(stats.totalTimeAllTime || 0);
                setCurrentStreak(stats.currentStreak || 0);
                setLongestStreak(stats.longestStreak || 0);
            }
        } catch (e) {
            console.error('Failed to load listening stats:', e);
        }
    }, []);

    // Save all-time stats periodically
    useEffect(() => {
        const saveInterval = setInterval(() => {
            const statsToSave = {
                totalSongsPlayed: totalSongsPlayed + sessionStats.songsPlayed,
                totalTimeAllTime: totalTimeAllTime + sessionStats.totalListeningTime,
                currentStreak,
                longestStreak,
                lastActive: new Date().toISOString()
            };
            localStorage.setItem('nitro_listening_stats', JSON.stringify(statsToSave));
        }, 30000); // Save every 30 seconds

        return () => clearInterval(saveInterval);
    }, [sessionStats, totalSongsPlayed, totalTimeAllTime, currentStreak, longestStreak]);

    // Check and update streak on mount
    useEffect(() => {
        try {
            const savedStats = localStorage.getItem('nitro_listening_stats');
            if (savedStats) {
                const stats = JSON.parse(savedStats);
                const lastActive = new Date(stats.lastActive);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Continued streak
                    const newStreak = (stats.currentStreak || 0) + 1;
                    setCurrentStreak(newStreak);
                    if (newStreak > (stats.longestStreak || 0)) {
                        setLongestStreak(newStreak);
                    }
                } else if (diffDays > 1) {
                    // Streak broken
                    setCurrentStreak(1);
                }
                // If diffDays === 0, keep current streak
            } else {
                setCurrentStreak(1);
                setLongestStreak(1);
            }
        } catch (e) {
            console.error('Failed to check streak:', e);
        }
    }, []);

    const formattedListeningTime = formatTime(sessionStats.totalListeningTime);

    return (
        <StatsContext.Provider value={{
            sessionStats,
            formattedListeningTime,
            totalSongsPlayed: totalSongsPlayed + sessionStats.songsPlayed,
            totalTimeAllTime: totalTimeAllTime + sessionStats.totalListeningTime,
            currentStreak,
            longestStreak
        }}>
            {children}
        </StatsContext.Provider>
    );
};

export const useStats = () => {
    const context = useContext(StatsContext);
    if (!context) throw new Error("useStats must be used within StatsProvider");
    return context;
};
