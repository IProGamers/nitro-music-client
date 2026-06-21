"use client"
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { useAudioFX } from './AudioFXContext';
import { useRouter } from 'next/navigation';
import { getSong as getOfflineSong } from '@/lib/offlineDb';
import { dedupeSongs, createSongKey } from '@/lib/searchUtils';
import { recordListen, recordSkip, buildAutoplayQueries, rankByTaste } from '@/lib/recommendations';

const FREE_PLAY_LIMIT = 10;
const PLAY_COUNT_KEY = 'nitro_free_plays';

interface PlayerContextType {
    currentSong: any | null;
    isPlaying: boolean;
    isLoadingSong: boolean;
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
    threeDMode: 'off' | 'simple' | 'extreme';
    setThreeDMode: (mode: 'off' | 'simple' | 'extreme') => void;
    toggle3D: () => void;
    freePlayCount: number;
    showLoginPrompt: boolean;
    dismissLoginPrompt: () => void;
    isShuffleOn: boolean;
    toggleShuffle: () => void;
    repeatMode: 'off' | 'all' | 'one';
    setRepeatMode?: (mode: 'off' | 'all' | 'one') => void;
    toggleRepeat: () => void;
    // Queue Management
    reorderQueue: (fromIndex: number, toIndex: number) => void;
    removeFromQueue: (index: number) => void;
    addToQueue: (song: any) => void;
    clearQueue: () => void;
    currentIndex: number;
    // Radio
    startRadio: (seedSong: any) => Promise<void>;
    isRadioMode: boolean;
    // A-B Loop
    loopA: number | null;
    loopB: number | null;
    setLoopA: () => void;
    setLoopB: () => void;
    clearLoop: () => void;
    isLooping: boolean;
    // Smart Shuffle
    isSmartShuffle: boolean;
    toggleSmartShuffle: () => void;
    // Listen Together - blocks listener controls
    isListenerMode: boolean;
    setListenerMode: (isListener: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentSong, setCurrentSong] = useState<any | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingSong, setIsLoadingSong] = useState(false);
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { enable3DAudio, audioQuality, autoPlay } = useSettings();
    const [is3DActive, setIs3DActive] = useState(false);
    const [threeDMode, setThreeDModeInternal] = useState<'off' | 'simple' | 'extreme'>('off');

    const setThreeDMode = (mode: 'off' | 'simple' | 'extreme') => {
        setThreeDModeInternal(mode);
        setIs3DActive(mode !== 'off');
    };
    const { user, saveToPlayHistory } = useAuth();
    const { connectAudioSource } = useAudioFX();
    const router = useRouter();

    // Free user play limit tracking
    const [freePlayCount, setFreePlayCount] = useState(0);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Shuffle and Repeat state
    const [isShuffleOn, setIsShuffleOn] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
    const [isSmartShuffle, setIsSmartShuffle] = useState(false);
    const [isListenerMode, setListenerMode] = useState(false);
    const recentlyPlayedRef = useRef<string[]>([]);

    // A-B Loop state
    const [loopA, setLoopAState] = useState<number | null>(null);
    const [loopB, setLoopBState] = useState<number | null>(null);
    const isLooping = loopA !== null && loopB !== null;

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
        if (enable3DAudio && threeDMode === 'off') {
            setThreeDMode('simple');
            setIs3DActive(true);
        } else if (!enable3DAudio) {
            setThreeDMode('off');
            setIs3DActive(false);
        }
    }, [enable3DAudio]);

    const toggle3D = () => {
        if (threeDMode === 'off') {
            setThreeDMode('simple');
            setIs3DActive(true);
        } else if (threeDMode === 'simple') {
            setThreeDMode('extreme');
            setIs3DActive(true);
        } else {
            setThreeDMode('off');
            setIs3DActive(false);
        }
    };

    // Web Audio API Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const pannerRef = useRef<PannerNode | null>(null);
    const fxGainRef = useRef<GainNode | null>(null);

    // DJ crossfade refs (secondary audio element used only while DJ mode is ON)
    const crossfadeAudioRef = useRef<HTMLAudioElement>(null);
    const isCrossfadingRef = useRef(false);
    const crossfadeRafRef = useRef<number | null>(null);
    const crossfadePrevGainRef = useRef<number>(1);

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
    }, [connectAudioSource]);

    // Handle Routing with optional 3D Panner
    useEffect(() => {
        if (is3DActive && pannerRef.current && fxGainRef.current && audioContextRef.current) {
            // Path: AudioFX Chain -> Panner -> Destination
            fxGainRef.current.disconnect();
            fxGainRef.current.connect(pannerRef.current);
            pannerRef.current.connect(audioContextRef.current.destination);
        } else if (fxGainRef.current && audioContextRef.current) {
            // Path: AudioFX Chain -> Destination
            if (pannerRef.current) pannerRef.current.disconnect();
            fxGainRef.current.disconnect();
            fxGainRef.current.connect(audioContextRef.current.destination);
        }
    }, [is3DActive]);

    // 8D/16D Rotating Audio Effect
    const animationFrameRef = useRef<number | undefined>(undefined);
    const angleRef = useRef<number>(0);

    useEffect(() => {
        if (!is3DActive || !pannerRef.current || !isPlaying) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            // Reset position to center if inactive
            if (pannerRef.current) pannerRef.current.setPosition(0, 0, 1);
            return;
        }

        const rotate = () => {
            if (!pannerRef.current) return;

            // Different speeds and depths for Simple vs Extreme
            const speed = threeDMode === 'extreme' ? 0.015 : 0.008;
            const radius = threeDMode === 'extreme' ? 10 : 5;

            angleRef.current += speed;

            const x = Math.sin(angleRef.current) * radius;
            const z = Math.cos(angleRef.current) * radius;

            // For extreme mode, add a slight vertical movement (Y axis) to feel "fully filled"
            const y = threeDMode === 'extreme' ? Math.sin(angleRef.current * 0.5) * 2 : 0;

            pannerRef.current.setPosition(x, y, z);

            animationFrameRef.current = requestAnimationFrame(rotate);
        };

        animationFrameRef.current = requestAnimationFrame(rotate);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [is3DActive, threeDMode, isPlaying]);

    // Resume context if suspended (browser policy)
    useEffect(() => {
        if (audioContextRef.current?.state === 'suspended' && isPlaying) {
            audioContextRef.current.resume();
        }
    }, [isPlaying]);

    // iOS / mobile background playback: when the tab returns to the foreground
    // Safari often suspends the AudioContext and pauses the <audio> element.
    // Resume both so playback continues seamlessly after backgrounding / lock screen.
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const resumePlayback = () => {
            const ctx = audioContextRef.current;
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => { /* ignore */ });
            }
            // If we believe we should be playing but the element got paused while
            // backgrounded, kick it back into playing state.
            if (isPlaying && audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(() => { /* user-gesture / autoplay policy */ });
            }
        };

        const onVisibility = () => {
            if (document.visibilityState === 'visible') resumePlayback();
        };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pageshow', resumePlayback);
        window.addEventListener('focus', resumePlayback);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pageshow', resumePlayback);
            window.removeEventListener('focus', resumePlayback);
        };
    }, [isPlaying]);

    // ---- Media Session API ----
    // Drives lock-screen / notification controls, Bluetooth car head units (AVRCP),
    // wearables, and Android Auto's media metadata. Split into focused effects so we
    // don't re-register handlers on every progress tick (which caused flicker and is
    // unnecessary churn). Handlers delegate through a ref so they're never stale.
    const mediaHandlersRef = useRef<{ next: () => void; prev: () => void }>({ next: () => {}, prev: () => {} });
    useEffect(() => {
        // No deps: runs after every render (post-render, so no TDZ on next/prev).
        mediaHandlersRef.current = { next, prev };
    });

    // Register action handlers once.
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
        const safe = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
            try { ms.setActionHandler(action, handler); } catch { /* unsupported action */ }
        };
        safe('play', () => { audioRef.current?.play().catch(() => {}); setIsPlaying(true); });
        safe('pause', () => { audioRef.current?.pause(); setIsPlaying(false); });
        safe('previoustrack', () => mediaHandlersRef.current.prev());
        safe('nexttrack', () => mediaHandlersRef.current.next());
        safe('stop', () => { audioRef.current?.pause(); setIsPlaying(false); });
        safe('seekto', (details) => {
            if (audioRef.current && details.seekTime != null) {
                audioRef.current.currentTime = details.seekTime;
                setProgress(details.seekTime);
            }
        });
        safe('seekbackward', (details) => {
            if (audioRef.current) {
                const offset = details.seekOffset || 10;
                audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - offset);
            }
        });
        safe('seekforward', (details) => {
            if (audioRef.current) {
                const offset = details.seekOffset || 10;
                const dur = audioRef.current.duration || 0;
                audioRef.current.currentTime = Math.min(dur, audioRef.current.currentTime + offset);
            }
        });
        return () => {
            // Clear handlers on unmount
            (['play', 'pause', 'previoustrack', 'nexttrack', 'stop', 'seekto', 'seekbackward', 'seekforward'] as MediaSessionAction[])
                .forEach(a => safe(a, null));
        };
    }, []);

    // Update metadata when the track changes.
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !currentSong) return;

        const title = currentSong.name || currentSong.title || 'Unknown Track';

        let artist = 'Unknown Artist';
        if (currentSong.artists?.primary?.length) {
            artist = currentSong.artists.primary.map((a: any) => a.name).join(', ');
        } else if (currentSong.artist) {
            artist = currentSong.artist;
        } else if (currentSong.primaryArtists) {
            artist = currentSong.primaryArtists;
        }

        const album = currentSong.album?.name || currentSong.album || '';

        let artwork = '';
        if (typeof currentSong.image === 'string') {
            artwork = currentSong.image;
        } else if (currentSong.image?.length) {
            const img = currentSong.image[currentSong.image.length - 1];
            artwork = img?.url || img?.link || '';
        }
        // Car systems require absolute https artwork; upgrade protocol-relative/http.
        if (artwork.startsWith('//')) artwork = 'https:' + artwork;
        else if (artwork.startsWith('http://')) artwork = artwork.replace('http://', 'https://');

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title,
                artist,
                album,
                artwork: artwork ? [
                    { src: artwork, sizes: '96x96', type: 'image/jpeg' },
                    { src: artwork, sizes: '128x128', type: 'image/jpeg' },
                    { src: artwork, sizes: '192x192', type: 'image/jpeg' },
                    { src: artwork, sizes: '256x256', type: 'image/jpeg' },
                    { src: artwork, sizes: '384x384', type: 'image/jpeg' },
                    { src: artwork, sizes: '512x512', type: 'image/jpeg' },
                ] : []
            });
        } catch (e) {
            console.warn('Media Session metadata error:', e);
        }
    }, [currentSong]);

    // Reflect play/pause state.
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }, [isPlaying, currentSong]);

    // Keep the external scrubber position in sync.
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        if (!audioRef.current || !duration || !isFinite(duration) || duration <= 0) return;
        try {
            navigator.mediaSession.setPositionState({
                duration,
                playbackRate: audioRef.current.playbackRate || 1,
                position: Math.min(Math.max(progress, 0), duration)
            });
        } catch { /* invalid state — ignore */ }
    }, [progress, duration]);

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
                'low': 1,      // 48kbps (Data Saver)
                'medium': 2,   // 96kbps (Standard)
                'high': 4,     // 320kbps (High Definition)
                'supreme': 4   // Lossless (Highest available)
            };

            const targetIndex = qualityMap[audioQuality as keyof typeof qualityMap] || 4; // Default to high quality

            // Use the target quality or the highest available if target doesn't exist
            const index = Math.min(targetIndex, t.downloadUrl.length - 1);
            return t.downloadUrl[index].url || t.downloadUrl[index].link || '';
        }
        return null;
    };

    // Get audio URL, checking offline cache first
    const getAudioWithOffline = async (t: any): Promise<string | null> => {
        const songId = String(t.songId || t.id || '');

        // Check offline cache first
        try {
            const offlineSong = await getOfflineSong(songId);
            if (offlineSong?.audioBlob) {
                return URL.createObjectURL(offlineSong.audioBlob);
            }
        } catch (e) {
            // IndexedDB not available or error - fall through to streaming
        }

        // Fall back to streaming URL
        return getAudio(t);
    };

    const getArtist = (t: any) => {
        if (t.artists && t.artists.primary && t.artists.primary.length) {
            return t.artists.primary[0].name;
        }
        if (t.artist) return t.artist;
        return 'Unknown';
    };

    const playTrack = async (song: any, newQueue?: any[]) => {
        // Any explicit play cancels an in-flight DJ crossfade and restores volume.
        cancelCrossfade();
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
        // IMPORTANT: Prioritize songId over id to avoid using database auto-increment IDs
        const trackId = String(song.songId || song.id || '');

        if (!trackId) {
            console.error("No track ID found", song);
            return;
        }

        // Learn from this play to personalize future recommendations.
        try { recordListen(song); } catch { /* non-critical */ }

        // Show loading indicator immediately
        setIsLoadingSong(true);

        if (newQueue) {
            // Check if this is the same queue (navigating within existing queue via next/prev)
            // If same queue, don't reset the index - it's already set by next() or prev()
            const isSameQueue = newQueue === queue || (
                newQueue.length === queue.length &&
                newQueue.length > 0 &&
                String(newQueue[0]?.songId || newQueue[0]?.id) === String(queue[0]?.songId || queue[0]?.id)
            );

            if (!isSameQueue) {
                // This is a genuinely new queue - update both queue and index
                setQueue(newQueue);
                const foundIndex = newQueue.findIndex(s => String(s.songId || s.id) === trackId);
                setCurrentIndex(foundIndex >= 0 ? foundIndex : 0);
            }
            // If same queue, the queue and index are already correct - do nothing
        } else {
            // When playing a single song without a queue, auto-fetch similar songs
            // This only happens when directly clicking on a song (not from next/prev which pass queue)
            if (queue.length === 0 || (queue.length === 1 && String(queue[0]?.songId || queue[0]?.id) !== trackId)) {
                setQueue([song]);
                setCurrentIndex(0);

                // Fetch similar songs in the background and add to queue ONCE
                const fetchSimilarSongs = async () => {
                    try {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                        const songName = song.name || song.title || '';
                        const artistName = song.artists?.primary?.[0]?.name || song.artist || '';
                        const query = encodeURIComponent(`${artistName} ${songName}`.trim());

                        const res = await fetch(`${apiUrl}/api/search/songs?query=${query}&limit=20`);
                        if (!res.ok) return;
                        const data = await res.json();

                        if (data.success && data.data?.results) {
                            // Filter out the current song (by exact ID)
                            const byId = data.data.results.filter((s: any) =>
                                String(s.id) !== trackId && String(s.songId) !== trackId
                            );
                            // Dedupe by normalized title+artist so the queue isn't filled
                            // with the same song's remixes/live/acoustic variants.
                            const similarSongs = dedupeSongs(byId, new Set<string>([createSongKey(song)]));

                            if (similarSongs.length > 0) {
                                // Only add similar songs if queue is still just the current song
                                // This prevents duplicate additions
                                setQueue(prev => {
                                    if (prev.length === 1) {
                                        return [...prev, ...similarSongs];
                                    }
                                    return prev; // Don't modify if queue already populated
                                });
                            }
                        }
                    } catch (e) {
                        console.log('Could not fetch similar songs:', e);
                    }
                };

                // Don't await - let it run in background
                fetchSimilarSongs();
            }
        }


        // Check if the song already has audio data OR is available offline
        const offlineAudioUrl = await getAudioWithOffline(song);
        const existingAudioUrl = offlineAudioUrl || getAudio(song);

        if (existingAudioUrl) {
            // Song has audio (either offline or streaming) - play directly
            // If from offline, attach the blob URL to the song object for the player
            const songToPlay = offlineAudioUrl
                ? { ...song, audioUrl: existingAudioUrl, isOffline: true }
                : song;
            setCurrentSong(songToPlay);
            setIsPlaying(true);
            setIsLoadingSong(false);

            // Immediately set audio source and play (don't wait for useEffect)
            if (audioRef.current) {
                audioRef.current.src = existingAudioUrl;
                audioRef.current.crossOrigin = "anonymous";
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (e.name === 'NotAllowedError') {
                            console.warn("Autoplay blocked - user interaction required");
                        } else if (e.name !== 'AbortError') {
                            console.error("Play failed", e);
                        }
                    });
                }
                // Resume audio context if needed
                if (audioContextRef.current?.state === 'suspended') {
                    audioContextRef.current.resume();
                }
            }

            // Save to server history
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
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
                // Server history is optional - Firebase is primary storage
                if (res.ok) console.log("Saved to history");
            }).catch(() => { /* Ignore - Firebase is primary storage */ });

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
            // Need to fetch full song data - keep loading indicator on
            setCurrentSong(song);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${apiUrl}/api/songs/${trackId}`);
                const data = await res.json();
                if (data.success && data.data && data.data[0]) {
                    const fullSong = data.data[0];
                    const fullAudioUrl = getAudio(fullSong) || '';

                    setCurrentSong(fullSong);
                    setIsPlaying(true);
                    setIsLoadingSong(false);

                    // Immediately set audio source and play
                    if (audioRef.current && fullAudioUrl) {
                        audioRef.current.src = fullAudioUrl;
                        audioRef.current.crossOrigin = "anonymous";
                        const playPromise = audioRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(e => {
                                if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') {
                                    console.error("Play failed", e);
                                }
                            });
                        }
                        if (audioContextRef.current?.state === 'suspended') {
                            audioContextRef.current.resume();
                        }
                    }

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
                        // Server history is optional - Firebase is primary storage
                        if (res.ok) console.log("Saved to history");
                    }).catch(() => { /* Ignore - Firebase is primary storage */ });

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
                    setIsLoadingSong(false);
                }
            } catch (e) {
                console.error("Failed to fetch song, trying to play with existing data", e);
                setIsPlaying(true);
                setIsLoadingSong(false);
            }
        }
    };

    const togglePlay = () => {
        // Block listener controls in Listen Together rooms
        if (isListenerMode) {
            console.log('Playback controlled by room host');
            return;
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

    // Queue Management
    const reorderQueue = (fromIndex: number, toIndex: number) => {
        const newQueue = [...queue];
        const [movedItem] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, movedItem);
        setQueue(newQueue);
        // If the current index was one of the moved items, update it
        if (currentIndex === fromIndex) {
            setCurrentIndex(toIndex);
        } else if (currentIndex > fromIndex && currentIndex <= toIndex) {
            setCurrentIndex(currentIndex - 1);
        } else if (currentIndex < fromIndex && currentIndex >= toIndex) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const removeFromQueue = (index: number) => {
        const newQueue = [...queue];
        newQueue.splice(index, 1);
        setQueue(newQueue);
        if (index < currentIndex) {
            setCurrentIndex(currentIndex - 1);
        } else if (index === currentIndex) {
            if (newQueue.length > 0) {
                const nextIdx = index % newQueue.length;
                setCurrentIndex(nextIdx);
                playTrack(newQueue[nextIdx]);
            } else {
                setCurrentSong(null);
                setIsPlaying(false);
            }
        }
    };

    const addToQueue = (song: any) => {
        setQueue(prev => [...prev, song]);
    };

    const clearQueue = () => {
        setQueue([]);
        setCurrentIndex(0);
        setCurrentSong(null);
        setIsPlaying(false);
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

    // Toggle Smart Shuffle
    const toggleSmartShuffle = () => {
        setIsSmartShuffle(!isSmartShuffle);
    };

    // Helper to get artist name from song
    const getArtistName = (song: any): string => {
        if (song?.artists?.primary?.[0]?.name) return song.artists.primary[0].name;
        if (typeof song?.artist === 'string') return song.artist;
        return 'Unknown';
    };

    // Smart shuffle scoring function
    const getSmartShuffleIndex = (availableIndices: number[], currentSong: any): number => {
        if (availableIndices.length === 0) return 0;
        if (availableIndices.length === 1) return availableIndices[0];

        const currentArtist = getArtistName(currentSong);
        const recentArtists = recentlyPlayedRef.current.slice(0, 5);

        // Score each available song
        const scoredIndices = availableIndices.map(idx => {
            const song = queue[idx];
            const artist = getArtistName(song);
            let score = Math.random() * 30; // Base randomness (0-30)

            // Prefer different artists (avoid repetition)
            if (artist !== currentArtist) score += 40;

            // Avoid recently played artists
            const recencyPenalty = recentArtists.indexOf(artist);
            if (recencyPenalty === -1) {
                score += 30; // Not played recently, bonus
            } else {
                score -= (5 - recencyPenalty) * 5; // More penalty for more recent
            }

            return { idx, score };
        });

        // Sort by score descending and pick the best
        scoredIndices.sort((a, b) => b.score - a.score);
        return scoredIndices[0].idx;
    };

    // Fetch more related songs for autoplay — PERSONALIZED.
    // Blends the seed song with the user's learned taste profile (favourite
    // artists + language), gathers candidates from a few queries, de-dupes by
    // title+artist, and ranks the pool by taste affinity so the next track
    // reflects what the user actually likes — not just a same-name remix.
    const fetchMoreSongsForAutoplay = async (seedSong: any): Promise<any[]> => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            // Taste-aware queries (seed artist, favourite artists, favourite-language hits, seed name)
            const queries = buildAutoplayQueries(seedSong).slice(0, 3);
            if (queries.length === 0) {
                queries.push(seedSong.artists?.primary?.[0]?.name || seedSong.artist || seedSong.name || '');
            }

            // Fetch a couple of queries in parallel for a richer, more varied pool.
            const responses = await Promise.allSettled(
                queries.slice(0, 2).map(q =>
                    fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(q)}&limit=12`).then(r => r.ok ? r.json() : null)
                )
            );

            const pool: any[] = [];
            for (const r of responses) {
                if (r.status === 'fulfilled' && r.value?.success && r.value.data?.results) {
                    pool.push(...r.value.data.results);
                }
            }
            if (pool.length === 0) return [];

            // Drop the seed + anything already queued (by exact id and by title+artist).
            const seedId = String(seedSong.id || seedSong.songId);
            const queueIds = new Set(queue.map(s => String(s.id || s.songId)));
            const byId = pool.filter((s: any) => String(s.id) !== seedId && !queueIds.has(String(s.id)));

            const excludeKeys = new Set<string>([
                createSongKey(seedSong),
                ...queue.map(s => createSongKey(s)),
            ]);
            const deduped = dedupeSongs(byId, excludeKeys);

            // Rank by how well each candidate matches the user's taste.
            return rankByTaste(deduped);
        } catch (e) {
            console.log('Could not fetch more songs for autoplay:', e);
        }
        return [];
    };

    // ---- DJ Mode Crossfade Engine ----
    // DJ mode + crossfade duration live in localStorage (written by DJContext, which
    // is a child of this provider so we can't read it via context). Read lazily.
    const getDJConfig = (): { enabled: boolean; duration: number } => {
        try {
            const enabled = localStorage.getItem('nitro_dj_mode') === 'true';
            let duration = 8;
            const raw = localStorage.getItem('nitro_dj_settings');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed?.crossfadeDuration === 'number') duration = parsed.crossfadeDuration;
            }
            duration = Math.max(3, Math.min(16, duration));
            return { enabled, duration };
        } catch {
            return { enabled: false, duration: 8 };
        }
    };

    // Abort an in-flight crossfade and restore the primary element to full volume.
    // Called on manual next/prev/playTrack so a skip mid-mix never leaves audio muted.
    const cancelCrossfade = () => {
        if (crossfadeRafRef.current !== null) {
            cancelAnimationFrame(crossfadeRafRef.current);
            crossfadeRafRef.current = null;
        }
        if (!isCrossfadingRef.current) return;
        // Restore primary gain / volume
        if (fxGainRef.current) {
            try { fxGainRef.current.gain.value = crossfadePrevGainRef.current; } catch { /* noop */ }
        } else if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        const sec = crossfadeAudioRef.current;
        if (sec) {
            try { sec.pause(); sec.removeAttribute('src'); sec.volume = 0; } catch { /* noop */ }
        }
        isCrossfadingRef.current = false;
    };

    const finishCrossfade = (nextSong: any, nextIdx: number, nextUrl: string, origGain: number) => {
        const primary = audioRef.current;
        const sec = crossfadeAudioRef.current;
        crossfadeRafRef.current = null;
        if (!primary || !sec) { isCrossfadingRef.current = false; return; }

        const pos = sec.currentTime;
        // Hand the new track back to the PRIMARY element so the Web Audio graph
        // (FX, 3D panner, visualizer analyser) keeps working on the new song.
        try {
            primary.src = nextUrl;
            primary.crossOrigin = 'anonymous';
            primary.currentTime = pos > 0 ? pos : 0;
            if (fxGainRef.current) {
                try { fxGainRef.current.gain.value = origGain; } catch { /* noop */ }
            } else {
                primary.volume = volume;
            }
            const p = primary.play();
            if (p !== undefined) p.catch(() => { /* autoplay policy */ });
        } catch { /* noop */ }

        // Stop & reset the secondary element
        try { sec.pause(); sec.removeAttribute('src'); sec.volume = 0; } catch { /* noop */ }

        // Update player state to the new track (no restart: src already matches)
        setCurrentIndex(nextIdx);
        setCurrentSong(nextSong);
        setIsPlaying(true);
        isCrossfadingRef.current = false;

        // Persist history for signed-in users
        if (user) {
            try {
                saveToPlayHistory({
                    id: String(nextSong.songId || nextSong.id),
                    name: nextSong.name || nextSong.title || 'Unknown',
                    artist: getArtist(nextSong),
                    image: getImg(nextSong)
                });
            } catch { /* noop */ }
        }
    };

    // Begin crossfading into nextSong over durationSec seconds.
    // Returns false if it can't start (no playable URL) so the caller falls back to next().
    const startCrossfade = (nextSong: any, nextIdx: number, durationSec: number): boolean => {
        const primary = audioRef.current;
        const sec = crossfadeAudioRef.current;
        if (!primary || !sec) return false;

        const nextUrl = getAudio(nextSong);
        if (!nextUrl) return false; // next track has no ready stream — let onEnded handle it

        isCrossfadingRef.current = true;

        // Primary fades out via the FX gain node (reliable inside the Web Audio graph);
        // fall back to element.volume if the graph isn't ready.
        const useGain = !!fxGainRef.current;
        const origGain = useGain ? fxGainRef.current!.gain.value : primary.volume;
        crossfadePrevGainRef.current = origGain;

        // Secondary plays the next track from 0, faded in via element.volume.
        try {
            sec.src = nextUrl;
            sec.crossOrigin = 'anonymous';
            sec.currentTime = 0;
            sec.volume = 0;
            const sp = sec.play();
            if (sp !== undefined) sp.catch(() => { /* noop */ });
        } catch {
            isCrossfadingRef.current = false;
            return false;
        }

        const startTs = performance.now();
        const totalMs = Math.max(1000, durationSec * 1000);
        const targetVol = volume;

        const step = (nowTs: number) => {
            const t = Math.min(1, (nowTs - startTs) / totalMs);
            // Fade out primary
            if (useGain && fxGainRef.current) {
                try { fxGainRef.current.gain.value = origGain * (1 - t); } catch { /* noop */ }
            } else {
                try { primary.volume = targetVol * (1 - t); } catch { /* noop */ }
            }
            // Fade in secondary
            try { sec.volume = targetVol * t; } catch { /* noop */ }

            if (t < 1) {
                crossfadeRafRef.current = requestAnimationFrame(step);
            } else {
                finishCrossfade(nextSong, nextIdx, nextUrl, origGain);
            }
        };
        crossfadeRafRef.current = requestAnimationFrame(step);
        return true;
    };

    // Decide whether to kick off a crossfade as the current track nears its end.
    // Called from the primary element's onTimeUpdate. No-op unless DJ mode is enabled.
    const maybeCrossfade = (currentTime: number, dur: number) => {
        if (isCrossfadingRef.current || isListenerMode) return;
        if (!dur || !isFinite(dur) || currentTime <= 0) return;
        if (repeatMode === 'one') return;

        const dj = getDJConfig();
        if (!dj.enabled) return;
        if (dur - currentTime > dj.duration) return;

        // Determine the upcoming track (sequential; wraps when repeat-all)
        let nextIdx = currentIndex + 1;
        if (nextIdx >= queue.length) {
            if (repeatMode === 'all') nextIdx = 0;
            else return; // no next track to mix into — onEnded will handle autoplay
        }
        if (nextIdx === currentIndex) return;
        const nextSong = queue[nextIdx];
        if (!nextSong) return;

        startCrossfade(nextSong, nextIdx, dj.duration);
    };

    const next = () => {
        // If we're leaving a track well before it ends, treat it as a skip signal
        // (onEnded fires at ~full duration, so natural completion isn't counted).
        try {
            const el = audioRef.current;
            if (currentSong && el && el.duration && isFinite(el.duration) && el.currentTime < el.duration * 0.8) {
                recordSkip(currentSong);
            }
        } catch { /* non-critical */ }
        cancelCrossfade();
        if (queue.length === 0) return;

        // Track current song artist for smart shuffle
        if (currentSong && isSmartShuffle) {
            const artist = getArtistName(currentSong);
            recentlyPlayedRef.current = [artist, ...recentlyPlayedRef.current.slice(0, 9)];
        }

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
            const availableIndices = queue.map((_, i) => i).filter(i => i !== currentIndex);
            if (availableIndices.length === 0) {
                nextIdx = 0;
            } else if (isSmartShuffle) {
                // Use smart shuffle algorithm
                nextIdx = getSmartShuffleIndex(availableIndices, currentSong);
            } else {
                // Random shuffle
                nextIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            }
        } else {
            nextIdx = currentIndex + 1;
            // If at end
            if (nextIdx >= queue.length) {
                if (repeatMode === 'all') {
                    nextIdx = 0;
                } else if (autoPlay && currentSong) {
                    // Autoplay is ON - fetch more related songs and continue playing
                    fetchMoreSongsForAutoplay(currentSong).then(moreSongs => {
                        if (moreSongs.length > 0) {
                            // Add new songs to queue and play the first new one
                            const newQueue = [...queue, ...moreSongs];
                            setQueue(newQueue);
                            const newIdx = queue.length; // First new song index
                            setCurrentIndex(newIdx);
                            playTrack(moreSongs[0], newQueue);
                        } else {
                            // No more songs found, stop playback
                            setIsPlaying(false);
                        }
                    });
                    return; // Exit early, playTrack will be called in the Promise
                } else {
                    // Stop at end
                    setIsPlaying(false);
                    return;
                }
            }
        }

        setCurrentIndex(nextIdx);
        // Pass the existing queue to prevent fetchSimilarSongs from modifying the queue
        playTrack(queue[nextIdx], queue);
    };

    const prev = () => {
        cancelCrossfade();
        if (queue.length === 0) return;

        // If more than 3 seconds into the song, restart it instead of going to previous
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        // Otherwise, go to previous track
        const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
        setCurrentIndex(prevIdx);
        // Pass the existing queue to prevent fetchSimilarSongs from modifying the queue
        playTrack(queue[prevIdx], queue);
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    // A-B Loop functions
    const setLoopA = () => {
        if (audioRef.current) {
            setLoopAState(audioRef.current.currentTime);
        }
    };

    const setLoopB = () => {
        if (audioRef.current && loopA !== null) {
            const currentTime = audioRef.current.currentTime;
            if (currentTime > loopA) {
                setLoopBState(currentTime);
            }
        }
    };

    const clearLoop = () => {
        setLoopAState(null);
        setLoopBState(null);
    };

    // Clear loop when song changes
    useEffect(() => {
        clearLoop();
    }, [currentSong]);

    const isInitialMount = useRef(true);

    useEffect(() => {
        if (currentSong && audioRef.current) {
            const url = getAudio(currentSong);
            if (url) {
                // If this is the initial mount (restoring from localStorage), don't autoplay
                if (isInitialMount.current) {
                    audioRef.current.src = url;
                    audioRef.current.crossOrigin = "anonymous";
                    isInitialMount.current = false;
                    return;
                }

                // Check if source changed
                const isSourceChanged = audioRef.current.src !== url;

                if (isSourceChanged) {
                    audioRef.current.src = url;
                    audioRef.current.crossOrigin = "anonymous";
                }

                if (isPlaying) {
                    // Only call play if it's paused or source changed
                    if (audioRef.current.paused || isSourceChanged) {
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
                } else {
                    // Handle pause
                    if (!audioRef.current.paused) {
                        audioRef.current.pause();
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

    // Radio Mode
    const [isRadioMode, setIsRadioMode] = useState(false);

    const startRadio = async (seedSong: any) => {
        try {
            setIsRadioMode(true);
            const songName = seedSong.name || seedSong.title || '';
            const artistName = seedSong.artists?.primary?.[0]?.name || seedSong.artist || '';

            // Search for similar songs
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const query = encodeURIComponent(`${artistName} ${songName}`.trim());
            const res = await fetch(`${apiUrl}/api/search/songs?query=${query}&limit=30`);
            if (!res.ok) { setIsRadioMode(false); return; }
            const data = await res.json();

            if (data.success && data.data?.results) {
                // Filter out the seed song and create new queue
                const seedId = String(seedSong.id || seedSong.songId);
                const byId = data.data.results.filter((s: any) =>
                    String(s.id) !== seedId
                );
                // Dedupe by normalized title+artist (exclude the seed) so radio
                // doesn't replay the same track in different versions.
                const radioSongs = dedupeSongs(byId, new Set<string>([createSongKey(seedSong)]));

                // Start with seed song, add similar songs
                const newQueue = [seedSong, ...radioSongs];
                setQueue(newQueue);
                setCurrentIndex(0);
                playTrack(seedSong, newQueue);
            }
        } catch (err) {
            console.error('Failed to start radio:', err);
            setIsRadioMode(false);
        }
    };


    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            isLoadingSong,
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
            threeDMode,
            setThreeDMode,
            toggle3D,
            freePlayCount,
            showLoginPrompt,
            dismissLoginPrompt,
            isShuffleOn,
            toggleShuffle,
            repeatMode,
            setRepeatMode,
            toggleRepeat,
            reorderQueue,
            removeFromQueue,
            addToQueue,
            clearQueue,
            currentIndex,
            startRadio,
            isRadioMode,
            loopA,
            loopB,
            setLoopA,
            setLoopB,
            clearLoop,
            isLooping,
            isSmartShuffle,
            toggleSmartShuffle,
            isListenerMode,
            setListenerMode
        }}>
            {children}
            <audio
                ref={audioRef}
                crossOrigin="anonymous"
                onTimeUpdate={(e) => {
                    const currentTime = e.currentTarget.currentTime;
                    const dur = e.currentTarget.duration;
                    setProgress(currentTime);
                    setDuration(dur);
                    // A-B Loop: if we've passed point B, jump back to A
                    if (loopA !== null && loopB !== null && currentTime >= loopB) {
                        e.currentTarget.currentTime = loopA;
                        return;
                    }
                    // DJ Mode: blend into the next track as this one nears its end
                    maybeCrossfade(currentTime, dur);
                }}
                onEnded={next}
            />
            {/* Secondary element used only for DJ-mode crossfade (not wired to Web Audio) */}
            <audio ref={crossfadeAudioRef} crossOrigin="anonymous" preload="auto" />
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error("usePlayer must be used within PlayerProvider");
    return context;
};
