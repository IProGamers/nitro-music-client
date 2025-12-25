"use client"
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { useAudioFX } from './AudioFXContext';
import { useRouter } from 'next/navigation';

const FREE_PLAY_LIMIT = 10;
const PLAY_COUNT_KEY = 'nitro_free_plays';

interface PlayerContextType {
    currentSong: any | null;
    isPlaying: boolean;
    queue: any[];
    playTrack: (song: any, queue?: any[]) => void;
    playNext: (song: any) => void;
    togglePlay: () => void;
    next: () => void;
    prev: () => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    progress: number;
    duration: number;
    seek: (time: number) => void;
    volume: number;
    setVolume: (v: number) => void;
    is3DActive: boolean;
    toggle3D: () => void;
    freePlayCount: number;
    showLoginPrompt: boolean;
    dismissLoginPrompt: () => void;
    isShuffleOn: boolean;
    toggleShuffle: () => void;
    repeatMode: 'off' | 'all' | 'one';
    toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentSong, setCurrentSong] = useState<any | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { enable3DAudio, audioQuality } = useSettings();
    const [is3DActive, setIs3DActive] = useState(false);
    const { user, saveToPlayHistory } = useAuth();
    const { connectAudioSource } = useAudioFX();
    const router = useRouter();

    // Free user play limit tracking
    const [freePlayCount, setFreePlayCount] = useState(0);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Shuffle and Repeat state
    const [isShuffleOn, setIsShuffleOn] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

    // Persistence keys
    const CURRENT_SONG_KEY = 'nitro_current_song';
    const QUEUE_KEY = 'nitro_queue';
    const INDEX_KEY = 'nitro_index';

    // Load persisted state
    useEffect(() => {
        try {
            const savedSong = localStorage.getItem(CURRENT_SONG_KEY);
            const savedQueue = localStorage.getItem(QUEUE_KEY);
            const savedIndex = localStorage.getItem(INDEX_KEY);
            const savedCount = localStorage.getItem(PLAY_COUNT_KEY);

            if (savedSong) setCurrentSong(JSON.parse(savedSong));
            if (savedQueue) setQueue(JSON.parse(savedQueue));
            if (savedIndex) setCurrentIndex(parseInt(savedIndex, 10));
            if (savedCount) setFreePlayCount(parseInt(savedCount, 10));
        } catch (e) {
            console.error('Failed to load persisted player state:', e);
        }
    }, []);

    // Save state on change
    useEffect(() => {
        if (currentSong) localStorage.setItem(CURRENT_SONG_KEY, JSON.stringify(currentSong));
        if (queue.length > 0) localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        localStorage.setItem(INDEX_KEY, currentIndex.toString());
    }, [currentSong, queue, currentIndex]);

    // Increment and save play count
    const incrementPlayCount = () => {
        const newCount = freePlayCount + 1;
        setFreePlayCount(newCount);
        try {
            localStorage.setItem(PLAY_COUNT_KEY, newCount.toString());
        } catch (e) {
            console.error('Failed to save play count:', e);
        }
        return newCount;
    };

    // Check if user can play (logged in OR under limit)
    const canPlay = (): boolean => {
        // Logged in users can always play
        if (user) return true;
        // Free users check limit
        return freePlayCount < FREE_PLAY_LIMIT;
    };

    const dismissLoginPrompt = () => {
        setShowLoginPrompt(false);
    };

    // Sync is3DActive with global setting
    useEffect(() => {
        setIs3DActive(enable3DAudio);
    }, [enable3DAudio]);

    const toggle3D = () => setIs3DActive(!is3DActive);

    // Web Audio API Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const pannerRef = useRef<PannerNode | null>(null);
    const fxGainRef = useRef<GainNode | null>(null);

    // Initialize Audio Context and Nodes
    useEffect(() => {
        if (!audioRef.current) return;

        // Initialize AudioContext only once
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();

            // Create media source
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);

            // Create 3D panner
            pannerRef.current = audioContextRef.current.createPanner();

            // Connect to AudioFX effects chain
            // source -> AudioFX chain -> fxGain
            fxGainRef.current = connectAudioSource(sourceRef.current, audioContextRef.current);

            // Configure Panner for 3D effect (HRTF)
            if (pannerRef.current) {
                pannerRef.current.panningModel = 'HRTF';
                pannerRef.current.distanceModel = 'linear';
                pannerRef.current.refDistance = 1;
                pannerRef.current.maxDistance = 10000;
                pannerRef.current.rolloffFactor = 1;
                pannerRef.current.coneInnerAngle = 360;
                pannerRef.current.coneOuterAngle = 0;
                pannerRef.current.coneOuterGain = 0;
                pannerRef.current.setPosition(0, 0, 1);
            }
        }

        // Handle Routing with optional 3D Panner
        if (is3DActive && pannerRef.current && fxGainRef.current) {
            // Path: AudioFX Chain -> Panner -> Destination
            fxGainRef.current.disconnect();
            fxGainRef.current.connect(pannerRef.current);
            pannerRef.current.connect(audioContextRef.current!.destination);
        } else if (fxGainRef.current) {
            // Path: AudioFX Chain -> Destination
            if (pannerRef.current) pannerRef.current.disconnect();
            fxGainRef.current.disconnect();
            fxGainRef.current.connect(audioContextRef.current!.destination);
        }

        // Resume context if suspended (browser policy)
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

    }, [is3DActive, connectAudioSource]);

    const getImg = (t: any) => {
        if (typeof t.image === 'string') return t.image;
        if (t.image && t.image.length) {
            return t.image[t.image.length - 1].url || t.image[t.image.length - 1].link || '';
        }
        return '';
    };

    const getAudio = (t: any) => {
        if (t.audioUrl) return t.audioUrl;
        if (t.downloadUrl && t.downloadUrl.length) {
            // Map quality setting to downloadUrl index
            // downloadUrl array typically: [0: 12kbps, 1: 48kbps, 2: 96kbps, 3: 160kbps, 4: 320kbps]
            const qualityMap = {
                'low': 2,      // 96 kbps
                'medium': 3,   // 160 kbps
                'high': 4,     // 320 kbps (highest available)
                'supreme': 4   // Lossless (use highest available as fallback)
            };

            const targetIndex = qualityMap[audioQuality] || 4; // Default to high quality

            // Use the target quality or the highest available if target doesn't exist
            const index = Math.min(targetIndex, t.downloadUrl.length - 1);
            return t.downloadUrl[index].url || t.downloadUrl[index].link || '';
        }
        return null;
    };

    const getArtist = (t: any) => {
        if (t.artists && t.artists.primary && t.artists.primary.length) {
            return t.artists.primary[0].name;
        }
        if (t.artist) return t.artist;
        return 'Unknown';
    };

    const playTrack = async (song: any, newQueue?: any[]) => {
        // Check free user play limit
        if (!user) {
            if (freePlayCount >= FREE_PLAY_LIMIT) {
                setShowLoginPrompt(true);
                return;
            }
            // Increment count for free users
            incrementPlayCount();
        }

        // Normalize song ID (history items use songId, search items use id)
        // Ensure it's a string to avoid Zod "Bad Request"
        const trackId = String(song.id || song.songId || '');

        if (!trackId) {
            console.error("No track ID found", song);
            return;
        }

        if (newQueue) {
            setQueue(newQueue);
            setCurrentIndex(newQueue.findIndex(s => String(s.id || s.songId) === trackId));
        } else {
            if (queue.length === 0) setQueue([song]);
        }

        // Check if the song already has audio data
        const existingAudioUrl = getAudio(song);

        if (existingAudioUrl) {
            // Song already has all the data it needs - play directly
            setCurrentSong(song);
            setIsPlaying(true);

            // Save to server history
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            fetch(`${apiUrl}/api/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    songId: trackId,
                    name: String(song.name || song.title || 'Unknown'),
                    artist: String(getArtist(song)),
                    image: String(getImg(song)),
                    audioUrl: String(existingAudioUrl)
                })
            }).then(res => {
                if (!res.ok) console.error("Failed to save history:", res.statusText);
                else console.log("Saved to history");
            }).catch(e => console.error("History save error:", e));

            // Also save to Firebase for signed-in users
            if (user) {
                saveToPlayHistory({
                    id: trackId,
                    name: song.name || song.title || 'Unknown',
                    artist: getArtist(song),
                    image: getImg(song)
                });
            }
        } else {
            // Need to fetch full song data
            setCurrentSong(song);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const res = await fetch(`${apiUrl}/api/songs/${trackId}`);
                const data = await res.json();
                if (data.success && data.data && data.data[0]) {
                    const fullSong = data.data[0];
                    const fullAudioUrl = getAudio(fullSong) || '';

                    setCurrentSong(fullSong);
                    setIsPlaying(true);

                    fetch(`${apiUrl}/api/history`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            songId: String(fullSong.id),
                            name: String(fullSong.name),
                            artist: String(getArtist(fullSong)),
                            image: String(getImg(fullSong)),
                            audioUrl: String(fullAudioUrl)
                        })
                    }).then(res => {
                        if (!res.ok) console.error("Failed to save history:", res.statusText);
                        else console.log("Saved to history");
                    }).catch(e => console.error("History save error:", e));

                    // Also save to Firebase for signed-in users
                    if (user) {
                        saveToPlayHistory({
                            id: String(fullSong.id),
                            name: fullSong.name,
                            artist: getArtist(fullSong),
                            image: getImg(fullSong)
                        });
                    }
                } else {
                    console.error("Could not fetch song details, trying to play with existing data");
                    setIsPlaying(true);
                }
            } catch (e) {
                console.error("Failed to fetch song, trying to play with existing data", e);
                setIsPlaying(true);
            }
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
            // Ensure context is running
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        }
        setIsPlaying(!isPlaying);
    };

    // Play Next: Insert song right after the current song in queue
    const playNext = (song: any) => {
        if (!song) return;
        const newQueue = [...queue];
        // Insert after current index
        newQueue.splice(currentIndex + 1, 0, song);
        setQueue(newQueue);
    };

    // Toggle Shuffle Mode
    const toggleShuffle = () => {
        setIsShuffleOn(!isShuffleOn);
    };

    // Toggle Repeat Mode (off -> all -> one -> off)
    const toggleRepeat = () => {
        if (repeatMode === 'off') setRepeatMode('all');
        else if (repeatMode === 'all') setRepeatMode('one');
        else setRepeatMode('off');
    };

    const next = () => {
        if (queue.length === 0) return;

        // If repeat one, replay current song
        if (repeatMode === 'one') {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        }

        let nextIdx: number;
        if (isShuffleOn) {
            // Random index excluding current
            const availableIndices = queue.map((_, i) => i).filter(i => i !== currentIndex);
            if (availableIndices.length === 0) {
                nextIdx = 0;
            } else {
                nextIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            }
        } else {
            nextIdx = currentIndex + 1;
            // If at end and repeat all, loop back
            if (nextIdx >= queue.length) {
                if (repeatMode === 'all') {
                    nextIdx = 0;
                } else {
                    // Stop at end
                    setIsPlaying(false);
                    return;
                }
            }
        }

        setCurrentIndex(nextIdx);
        playTrack(queue[nextIdx]);
    };

    const prev = () => {
        if (queue.length === 0) return;
        const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
        setCurrentIndex(prevIdx);
        playTrack(queue[prevIdx]);
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    }

    const isInitialMount = useRef(true);

    useEffect(() => {
        if (currentSong && audioRef.current) {
            const url = getAudio(currentSong);
            if (url) {
                // If this is the initial mount (restoring from localStorage), don't autoplay
                if (isInitialMount.current) {
                    audioRef.current.src = url;
                    audioRef.current.crossOrigin = "anonymous";
                    // Restore progress if saved? For now just load it
                    isInitialMount.current = false;
                    return;
                }

                // If the song is already loaded, just play it (prevents AbortError on double-render)
                if (audioRef.current.src === url) {
                    if (audioRef.current.paused && isPlaying) {
                        const playPromise = audioRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(e => {
                                if (e.name === 'NotAllowedError') {
                                    console.warn("Autoplay blocked by browser. User interaction required.");
                                    setIsPlaying(false);
                                } else if (e.name !== 'AbortError') {
                                    console.error("Play failed", e);
                                }
                            });
                        }
                    }
                    return;
                }

                audioRef.current.src = url;
                audioRef.current.crossOrigin = "anonymous";

                if (isPlaying) {
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            if (audioContextRef.current?.state === 'suspended') {
                                audioContextRef.current.resume();
                            }
                        }).catch(e => {
                            if (e.name === 'NotAllowedError') {
                                console.warn("Autoplay blocked by browser. User interaction required.");
                                setIsPlaying(false);
                            } else if (e.name !== 'AbortError') {
                                console.error("Play failed", e);
                            }
                        });
                    }
                }
            }
        }
    }, [currentSong, isPlaying]);

    const setVolume = (v: number) => {
        setVolumeState(v);
        if (audioRef.current) {
            audioRef.current.volume = v;
        }
        localStorage.setItem('nitro_volume', v.toString());
    };

    // Load volume
    useEffect(() => {
        const saved = localStorage.getItem('nitro_volume');
        if (saved) {
            const v = parseFloat(saved);
            setVolumeState(v);
            if (audioRef.current) audioRef.current.volume = v;
        }
    }, []);


    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            queue,
            playTrack,
            playNext,
            togglePlay,
            next,
            prev,
            audioRef,
            progress,
            duration,
            seek,
            volume,
            setVolume,
            is3DActive,
            toggle3D,
            freePlayCount,
            showLoginPrompt,
            dismissLoginPrompt,
            isShuffleOn,
            toggleShuffle,
            repeatMode,
            toggleRepeat
        }}>
            {children}
            <audio
                ref={audioRef}
                crossOrigin="anonymous"
                onTimeUpdate={(e) => {
                    setProgress(e.currentTarget.currentTime);
                    setDuration(e.currentTarget.duration);
                }}
                onEnded={next}
            />
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error("usePlayer must be used within PlayerProvider");
    return context;
};
