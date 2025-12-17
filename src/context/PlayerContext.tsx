"use client"
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';

interface PlayerContextType {
    currentSong: any | null;
    isPlaying: boolean;
    queue: any[];
    playTrack: (song: any, queue?: any[]) => void;
    togglePlay: () => void;
    next: () => void;
    prev: () => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    progress: number;
    duration: number;
    seek: (time: number) => void;
    is3DActive: boolean;
    toggle3D: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentSong, setCurrentSong] = useState<any | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { enable3DAudio } = useSettings();
    const [is3DActive, setIs3DActive] = useState(false);

    // Sync is3DActive with global setting
    useEffect(() => {
        setIs3DActive(enable3DAudio);
    }, [enable3DAudio]);

    const toggle3D = () => setIs3DActive(!is3DActive);

    // Web Audio API Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const pannerRef = useRef<PannerNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    // Initialize Audio Context and Nodes
    useEffect(() => {
        if (!audioRef.current) return;

        // Initialize AudioContext only once
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();

            // Create nodes
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            pannerRef.current = audioContextRef.current.createPanner();
            gainRef.current = audioContextRef.current.createGain();

            // Initial connection: Source -> Gain -> Destination (Bypass Panner)
            sourceRef.current.connect(gainRef.current);
            gainRef.current.connect(audioContextRef.current.destination);
        }

        // Handle 3D Audio Toggle
        if (is3DActive) {
            // Connect: Source -> Panner -> Gain -> Destination
            sourceRef.current?.disconnect();
            sourceRef.current?.connect(pannerRef.current!);
            pannerRef.current?.connect(gainRef.current!);

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
        } else {
            // Bypass Panner: Source -> Gain -> Destination
            sourceRef.current?.disconnect();
            sourceRef.current?.connect(gainRef.current!);
        }

        // Resume context if suspended (browser policy)
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

    }, [is3DActive]);

    const getImg = (t: any) => {
        if (typeof t.image === 'string') return t.image;
        if (t.image && t.image.length) {
            return t.image[t.image.length - 1].url;
        }
        return '';
    };

    const getAudio = (t: any) => {
        if (t.audioUrl) return t.audioUrl;
        if (t.downloadUrl && t.downloadUrl.length) {
            return t.downloadUrl[t.downloadUrl.length - 1].url;
        }
        return null;
    };

    const getArtist = (t: any) => {
        if (t.artists && t.artists.primary && t.artists.primary.length) {
            return t.artists.primary[0].name;
        }
        return 'Unknown';
    };

    const playTrack = async (song: any, newQueue?: any[]) => {
        // Normalize song ID (history items use songId, search items use id)
        const trackId = song.id || song.songId;

        if (!trackId) {
            console.error("No track ID found", song);
            return;
        }

        if (newQueue) {
            setQueue(newQueue);
            setCurrentIndex(newQueue.findIndex(s => (s.id || s.songId) === trackId));
        } else {
            if (queue.length === 0) setQueue([song]);
        }

        setCurrentSong(song);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${apiUrl}/api/songs/${trackId}`);
            const data = await res.json();
            if (data.success && data.data && data.data[0]) {
                const fullSong = data.data[0];
                setCurrentSong(fullSong);
                setIsPlaying(true);

                fetch(`${apiUrl}/api/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        songId: fullSong.id,
                        name: fullSong.name,
                        artist: getArtist(fullSong),
                        image: getImg(fullSong),
                        audioUrl: getAudio(fullSong) || ''
                    })
                }).then(res => {
                    if (!res.ok) console.error("Failed to save history:", res.statusText);
                    else console.log("Saved to history");
                }).catch(e => console.error("History save error:", e));
            }
        } catch (e) {
            console.error("Failed to play", e);
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

    const next = () => {
        if (queue.length === 0) return;
        const nextIdx = (currentIndex + 1) % queue.length;
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

    useEffect(() => {
        if (currentSong && audioRef.current) {
            const url = getAudio(currentSong);
            if (url) {
                // If the song is already loaded, just play it (prevents AbortError on double-render)
                if (audioRef.current.src === url) {
                    if (audioRef.current.paused) {
                        audioRef.current.play().catch(e => {
                            if (e.name !== 'AbortError') console.error("Play failed", e);
                        });
                        setIsPlaying(true);
                    }
                    return;
                }

                audioRef.current.src = url;
                audioRef.current.crossOrigin = "anonymous"; // Enable CORS for Web Audio API
                audioRef.current.play().then(() => {
                    if (audioContextRef.current?.state === 'suspended') {
                        audioContextRef.current.resume();
                    }
                }).catch(e => {
                    // Ignore AbortError which happens when skipping tracks quickly
                    if (e.name !== 'AbortError') {
                        console.error("Play failed", e);
                    }
                });
                setIsPlaying(true);
            }
        }
    }, [currentSong]);

    return (
        <PlayerContext.Provider value={{ currentSong, isPlaying, queue, playTrack, togglePlay, next, prev, audioRef, progress, duration, seek, is3DActive, toggle3D }}>
            {children}
            <audio
                ref={audioRef}
                onTimeUpdate={(e) => {
                    setProgress(e.currentTarget.currentTime);
                    setDuration(e.currentTarget.duration);
                }}
                onEnded={next}
            />
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error("usePlayer must be used within PlayerProvider");
    return context;
};
