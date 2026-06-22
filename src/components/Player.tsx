"use client"
import { usePlayer } from '@/context/PlayerContext';
import { useSettings } from '@/context/SettingsContext';
import { useAudioFX } from '@/context/AudioFXContext';
import { useAuth } from '@/context/AuthContext';
import {
    Play, Pause, SkipBack, SkipForward, Download, Heart,
    ChevronDown, Headphones, Volume2, VolumeX, ListMusic,
    Maximize2, Share2, Repeat, Shuffle, Sparkles, Wand2, Moon, ListPlus, Repeat1, Radio, Eye, Check, Trash2, Loader, Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AudioFXPanel from './AudioFXPanel';
import AudioVisualizer from './AudioVisualizer';
import AddToPlaylistModal from './AddToPlaylistModal';
import QueuePanel from './QueuePanel';
import ShareableCard from './ShareableCard';
import SharePanel from './SharePanel';
import DJModePanel from './DJModePanel';
import FullScreenVisualizer from './FullScreenVisualizer';
import MarqueeText from './MarqueeText';
import { getSceneById } from '@/lib/sceneLibrary';
import ArtistLink from './ArtistLink';
import { useDJ } from '@/context/DJContext';
import { useUsage } from '@/context/UsageContext';
import { useOffline } from '@/context/OfflineContext';
import { useRoom } from '@/context/RoomContext';
import FirstTimeTooltip from './FirstTimeTooltip';

const decodeHtml = (html: string): string => {
    if (!html || typeof window === 'undefined') return html || '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

export default function Player() {
    const {
        currentSong, isPlaying, isLoadingSong, togglePlay, next, prev,
        progress, duration, seek, is3DActive, toggle3D,
        volume, setVolume,
        isShuffleOn, toggleShuffle, repeatMode, toggleRepeat,
        loopA, loopB, setLoopA, setLoopB, clearLoop, isLooping,
        isSmartShuffle, toggleSmartShuffle
    } = usePlayer();

    const { enableDownload, enable3DAudio } = useSettings();
    const {
        sceneMode,
        sleepTimerRemaining,
        hapticEnabled,
        triggerHaptic
    } = useAudioFX();

    const { user, userProfile, addLikedSong, removeLikedSong, isLikedSong } = useAuth();

    const [isFav, setIsFav] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFXPanel, setShowFXPanel] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [showShareCard, setShowShareCard] = useState(false);
    const [showSharePanel, setShowSharePanel] = useState(false);
    const [showDJPanel, setShowDJPanel] = useState(false);
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [lastVolume, setLastVolume] = useState(1);

    // Close the full-screen player (and its panels) whenever we navigate — e.g.
    // tapping the artist name opens the artist page instead of staying hidden
    // behind the expanded player overlay. The mini bar stays, so the user can
    // tap it to return to the now-playing screen.
    const pathname = usePathname();
    useEffect(() => {
        setIsExpanded(false);
        setShowQueue(false);
        setShowFXPanel(false);
        setShowVisualizer(false);
    }, [pathname]);

    const toggleMute = () => {
        if (isMuted) {
            setVolume(lastVolume);
            setIsMuted(false);
        } else {
            setLastVolume(volume);
            setVolume(0);
            setIsMuted(true);
        }
    };

    const { isDJMode } = useDJ();
    // Room state — a non-host member cannot control the host's playback.
    const { activeRoom, isHost } = useRoom();
    const isRoomMember = !!activeRoom && !isHost;
    const { checkAccess, trackUsage, setShowLimitModal, setLimitFeature } = useUsage();
    const { downloadSong, removeSong, isDownloaded, isDownloading, currentDownloadId } = useOffline();

    const handleFXClick = () => {
        const access = checkAccess('audio_fx_sessions');
        if (!access.allowed) {
            setLimitFeature('audio_fx_sessions');
            setShowLimitModal(true);
            return;
        }
        trackUsage('audio_fx_sessions');
        setShowFXPanel(true);
    };

    const handleDJClick = () => {
        const access = checkAccess('dj_mode_sessions');
        if (!access.allowed) {
            setLimitFeature('dj_mode_sessions');
            setShowLimitModal(true);
            return;
        }
        trackUsage('dj_mode_sessions');
        setShowDJPanel(true);
    };

    const handleVisualizerClick = () => {
        const access = checkAccess('visualizer_sessions');
        if (!access.allowed) {
            setLimitFeature('visualizer_sessions');
            setShowLimitModal(true);
            return;
        }
        trackUsage('visualizer_sessions');
        setShowVisualizer(true);
    };

    useEffect(() => {
        const checkFav = async () => {
            if (currentSong && user) {
                const liked = await isLikedSong(String(currentSong.id));
                setIsFav(liked);
            }
        };
        checkFav();
    }, [currentSong, user, isLikedSong]);

    // Haptic on play/pause
    useEffect(() => {
        if (hapticEnabled && isPlaying) {
            triggerHaptic(30);
        }
    }, [isPlaying, hapticEnabled, triggerHaptic]);

    if (!currentSong || userProfile?.arihantMode) return null;
    if (pathname?.startsWith('/play/')) return null; // standalone public share page (/play/[token]) — NOT /playlists

    const getImg = (t: any) => {
        if (!t) return '';
        if (t.image && Array.isArray(t.image) && t.image.length) {
            return t.image[t.image.length - 1].url || t.image[t.image.length - 1].link || '';
        }
        if (typeof t.image === 'string') return t.image;
        return '';
    };

    const getArtist = (t: any) => {
        if (!t) return 'Unknown';
        if (t.artists && t.artists.primary && t.artists.primary.length) {
            return decodeHtml(t.artists.primary[0].name);
        }
        if (typeof t.artist === 'string') return decodeHtml(t.artist);
        return 'Unknown';
    };

    const handleDownloadClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Check access first
        const access = checkAccess('downloads');
        if (!access.allowed) {
            setLimitFeature('downloads');
            setShowLimitModal(true);
            return;
        }

        const songId = String(currentSong.id || currentSong.songId);

        if (isDownloaded(songId)) {
            if (confirm("Remove this song from offline storage?")) {
                await removeSong(songId);
            }
        } else if (!isDownloading) {
            trackUsage('downloads');
            await downloadSong(currentSong);
        }
    };

    const toggleFav = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return; // Only logged in users can like

        const changingToFav = !isFav;

        // Optimistic UI update
        setIsFav(changingToFav);

        try {
            // Firebase is the primary storage - this is the important one
            if (!changingToFav) {
                await removeLikedSong(String(currentSong.id));
            } else {
                await addLikedSong({
                    id: String(currentSong.id),
                    name: currentSong.name,
                    artist: getArtist(currentSong),
                    image: getImg(currentSong)
                });
            }

            // Optional: Sync with Node server (fire-and-forget, don't await)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            if (!changingToFav) {
                fetch(`${apiUrl}/api/favorites/${currentSong.id}`, { method: 'DELETE' }).catch(() => { });
            } else {
                fetch(`${apiUrl}/api/favorites`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        songId: String(currentSong.id),
                        name: currentSong.name,
                        artist: getArtist(currentSong),
                        image: getImg(currentSong),
                        audioUrl: currentSong.audioUrl || ''
                    })
                }).catch(() => { });
            }
        } catch (e) {
            console.warn("Firebase favorite error:", e);
            // Only revert on Firebase error (the primary storage)
            setIsFav(!changingToFav);
        }
    }

    const formatTime = (s: number) => {
        if (isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }

    const handleToggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (volume > 0) {
            setLastVolume(volume);
            setVolume(0);
            setIsMuted(true);
        } else {
            setVolume(lastVolume || 0.5);
            setIsMuted(false);
        }
    }

    const getSceneBadge = () => {
        if (!sceneMode || sceneMode === 'none') return null;
        // Derive the badge from the full scene library so every one of the 150+
        // scenes shows a label (not just the original hardcoded handful).
        const scene = getSceneById(sceneMode);
        if (!scene) return null;
        return { label: scene.name, color: 'bg-[var(--card-hover)]' };
    };

    const sceneBadge = getSceneBadge();

    return (
        <>
            {/* Desktop & Mobile Mini Player Bar */}
            {/* On desktop: starts after sidebar (w-64 = 256px), on mobile: full width */}
            <div
                onClick={() => setIsExpanded(true)}
                className={`fixed bottom-[calc(3.625rem_+_env(safe-area-inset-bottom))] md:bottom-0 left-0 md:left-64 w-full md:w-[calc(100%-256px)] xl:w-[calc(100%-256px-320px)] h-16 md:h-24 bg-[var(--background)]/95 backdrop-blur-2xl border-t border-[var(--border)] flex items-center px-4 md:px-8 z-[60] cursor-pointer transition-all duration-500 hover:bg-[var(--card-hover)] group ${(isExpanded || showFXPanel) ? 'translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}
            >
                {/* Global Seek Bar on top - Touch Interactive */}
                <div
                    className="absolute top-0 left-0 w-full h-1 md:h-[3px] bg-[var(--border)] group-hover:h-2 transition-all cursor-pointer touch-none"
                    onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        seek(percent * (duration || 0));
                    }}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                        seek(percent * (duration || 0));
                    }}
                    onTouchMove={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                        seek(percent * (duration || 0));
                    }}
                >
                    {isLoadingSong ? (
                        /* Loading animation - Spotify-like animated gradient */
                        <div className="h-full w-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]"
                                style={{ animation: 'shimmer 1.5s infinite' }} />
                        </div>
                    ) : (
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 relative transition-all duration-100"
                            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 md:w-2 md:h-2 bg-[var(--foreground)] rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 shadow-[0_0_10px_white] transition-opacity" />
                        </div>
                    )}
                </div>

                {/* Left Side: Track Info - Hidden on mobile for centered layout */}
                <div className="hidden md:flex items-center gap-4 flex-initial w-[320px] min-w-0">
                    <div className="relative group/art shrink-0">
                        <img
                            src={getImg(currentSong)} onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}}
                            className="w-16 h-16 rounded-xl object-cover shadow-2xl border border-[var(--border)] group-hover/art:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                            <Maximize2 size={16} className="text-white" />
                        </div>
                        {/* Scene Badge */}
                        {sceneBadge && (
                            <div className={`absolute -top-1 -right-1 ${sceneBadge.color} text-[8px] font-bold px-1.5 py-0.5 rounded text-white shadow-lg`}>
                                {sceneBadge.label}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                        <MarqueeText
                            text={decodeHtml(currentSong.name)}
                            className="font-bold text-[17px] text-[var(--foreground)] leading-tight transition-colors tracking-tight"
                        />
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-[var(--foreground-secondary)] font-medium truncate mt-0.5">
                                {getArtist(currentSong)}
                            </p>
                            {/* Sleep Timer Indicator */}
                            {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
                                <div className="flex items-center gap-1 text-indigo-400">
                                    <Moon size={10} />
                                    <span className="text-[9px] font-mono">{Math.ceil(sleepTimerRemaining / 60)}m</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Layout: art+title (left) · transport (center) · features (right) */}
                <div className="flex md:hidden items-center w-full gap-1">
                    {/* Left: Album art + title/artist — tap to expand */}
                    <div
                        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer active:opacity-80 transition-opacity"
                        onClick={() => setIsExpanded(true)}
                    >
                        <div className="relative shrink-0">
                            <img
                                src={getImg(currentSong)} onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}}
                                className="w-10 h-10 rounded-md object-cover shadow-md"
                            />
                            {sceneBadge && (
                                <div className={`absolute -top-1 -right-1 ${sceneBadge.color} text-[7px] font-bold px-1 py-0.5 rounded text-white shadow`}>
                                    {sceneBadge.label}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                            <MarqueeText
                                text={decodeHtml(currentSong.name)}
                                className="font-semibold text-[13px] text-[var(--foreground)] leading-tight"
                            />
                            <ArtistLink song={currentSong} className="block text-[11px] text-[var(--foreground-secondary)] truncate leading-tight mt-0.5">
                                {getArtist(currentSong)}
                            </ArtistLink>
                        </div>
                    </div>

                    {/* Center: transport — previous · play/pause · next.
                        Room members can't control the host's playback, so we show
                        a LOCAL mute toggle (affects only this listener) instead. */}
                    <div className="flex items-center gap-1 shrink-0 text-[var(--foreground-secondary)]" onClick={e => e.stopPropagation()}>
                        {isRoomMember ? (
                            <button
                                onClick={handleToggleMute}
                                className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform"
                                aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                                title={isMuted || volume === 0 ? 'Unmute (local)' : 'Mute (local)'}
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX size={26} className="text-[var(--foreground)]" />
                                ) : (
                                    <Volume2 size={26} className="text-[var(--foreground)]" />
                                )}
                            </button>
                        ) : (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); prev(); }} className="p-1 active:scale-90 active:text-[var(--foreground)] transition-all" aria-label="Previous">
                                    <SkipBack size={21} fill="currentColor" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                    className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform"
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? (
                                        <Pause size={30} fill="var(--foreground)" className="text-[var(--foreground)]" />
                                    ) : (
                                        <Play size={30} fill="var(--foreground)" className="text-[var(--foreground)] ml-0.5" />
                                    )}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); next(); }} className="p-1 active:scale-90 active:text-[var(--foreground)] transition-all" aria-label="Next">
                                    <SkipForward size={21} fill="currentColor" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right: feature options */}
                    <div className="flex items-center justify-end gap-0 flex-1 min-w-0 text-[var(--foreground-secondary)]" onClick={e => e.stopPropagation()}>
                        <button onClick={toggleFav} className="p-1 active:scale-90 transition-transform shrink-0" aria-label="Like">
                            <Heart size={17} className={isFav ? "fill-current text-[var(--foreground)]" : ""} />
                        </button>
                        {user && (
                            <button onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }} className="p-1 active:scale-90 transition-transform shrink-0" aria-label="Add to playlist">
                                <Plus size={19} />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setShowQueue(true); }} className={`p-1 active:scale-90 transition-transform shrink-0 ${showQueue ? 'text-[var(--foreground)]' : ''}`} aria-label="Queue">
                            <ListMusic size={17} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleFXClick(); }} className={`p-1 active:scale-90 transition-transform shrink-0 ${(sceneMode !== 'none' || showFXPanel) ? 'text-[var(--foreground)]' : ''}`} aria-label="Audio effects">
                            <Wand2 size={17} />
                        </button>
                    </div>
                </div>


                {/* Center: Desktop Playback Controls */}
                <div className="hidden md:flex flex-col items-center flex-1 px-4 gap-2" onClick={e => e.stopPropagation()}>
                    {isRoomMember ? (
                        /* Room members can't control the host's playback. Offer a
                           LOCAL mute toggle (this listener only) instead. */
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={handleToggleMute}
                                className="w-12 h-12 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
                                title={isMuted || volume === 0 ? 'Unmute (local only)' : 'Mute (local only)'}
                                aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                            >
                                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                            </button>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                                {isMuted || volume === 0 ? 'Muted (You)' : 'Listening'}
                            </span>
                        </div>
                    ) : (
                    <div className="flex items-center gap-8">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (isShuffleOn) toggleSmartShuffle(); }}
                            className={`transition-all active:scale-90 relative group/shuffle ${isShuffleOn ? (isSmartShuffle ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]') : 'text-zinc-500 hover:text-emerald-400'}`}
                            title={isShuffleOn ? (isSmartShuffle ? 'Smart Shuffle ON - Right-click to toggle' : 'Shuffle ON - Right-click for Smart Shuffle') : 'Shuffle OFF'}
                        >
                            <Shuffle size={16} />
                            {isShuffleOn && isSmartShuffle && (
                                <span className="absolute -top-1 -right-2 text-[8px] font-bold text-purple-300">AI</span>
                            )}
                        </button>
                        <button onClick={prev} className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-all hover:scale-110 active:scale-90"><SkipBack size={24} fill="currentColor" /></button>
                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center hover:scale-110 active:scale-90 shadow-2xl transition-all"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                        <button onClick={next} className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-all hover:scale-110 active:scale-90"><SkipForward size={24} fill="currentColor" /></button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
                            className={`transition-all active:scale-90 ${repeatMode !== 'off' ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'text-zinc-500 hover:text-amber-400'}`}
                        >
                            <Repeat size={16} />
                            {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
                        </button>
                    </div>
                    )}
                    <div className="w-full flex items-center gap-3">
                        <span className="text-[9px] font-bold text-zinc-500 w-10 text-right font-mono">{formatTime(progress)}</span>
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden relative group/seek">
                            <div className="absolute h-full bg-cyan-400" style={{ width: `${(progress / (duration || 1)) * 100}%` }} />
                            <input
                                type="range"
                                min={0} max={duration || 100} value={progress}
                                onChange={e => seek(Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-500 w-10 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right Side: Desktop Utility Controls — plain grey, uniform */}
                <div className="hidden md:flex items-center justify-end gap-5 w-1/3 text-[var(--foreground-muted)]" onClick={e => e.stopPropagation()}>
                    {/* Favorite */}
                    <button
                        onClick={toggleFav}
                        className={`transition-all hover:scale-110 active:scale-95 p-2 rounded-full hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] ${isFav ? 'text-[var(--foreground)]' : ''}`}
                        title="Add to Favorites"
                    >
                        <Heart size={18} className={isFav ? "fill-current" : ""} />
                    </button>

                    {/* Audio FX */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleFXClick(); }}
                        className={`p-2 rounded-full transition-all hover:scale-110 hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] ${(sceneMode !== 'none' || showFXPanel) ? 'text-[var(--foreground)] bg-[var(--card-hover)]' : ''}`}
                        title="Audio Effects"
                    >
                        <Wand2 size={18} />
                    </button>

                    {/* 3D Audio */}
                    <button
                        onClick={(e) => { e.stopPropagation(); toggle3D(); }}
                        className={`p-2 rounded-full transition-all hover:scale-110 hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] ${is3DActive ? 'text-[var(--foreground)] bg-[var(--card-hover)]' : ''}`}
                        title="3D Spatial Audio"
                    >
                        <Headphones size={18} />
                    </button>

                    {/* Add to Playlist */}
                    {user && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }}
                            className="p-2 rounded-full transition-all hover:scale-110 hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                            title="Add to Playlist"
                        >
                            <ListPlus size={18} />
                        </button>
                    )}

                    {/* Queue */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowQueue(!showQueue); }}
                        className={`p-2 rounded-full transition-all hover:scale-110 hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] ${showQueue ? 'text-[var(--foreground)] bg-[var(--card-hover)]' : ''}`}
                        title="Queue"
                    >
                        <ListMusic size={18} />
                    </button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 group/vol w-32"
                        onMouseEnter={() => { /* logic if needed */ }}
                        onMouseLeave={() => { /* logic if needed */ }}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] p-1.5 rounded-full hover:bg-white/5 transition-colors"
                        >
                            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <div className="flex-1 h-1 bg-[var(--card)] rounded-full relative cursor-pointer group/slider"
                            onClick={(e) => { e.stopPropagation(); /* seek logic */ }}
                        >
                            <div
                                className="absolute top-0 left-0 h-full bg-[var(--foreground)] rounded-full group-hover/vol:bg-[var(--accent-cyan)] transition-colors"
                                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-3 bg-white rounded-full opacity-0 group-hover/vol:opacity-100 transition-opacity shadow-sm" style={{ left: `${isMuted ? 0 : volume * 100}%` }} />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* EXPANDED CINEMATIC PLAYER */}
            <div
                className={`fixed inset-0 z-[100] bg-[var(--background)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden flex flex-col ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Animated Background Layers */}
                <div className="absolute inset-0 z-0">
                    <img src={getImg(currentSong)} onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}} className="w-full h-full object-cover blur-[120px] opacity-40 animate-slow-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/40 to-[var(--background)]" />
                    <div className="absolute inset-0 bg-[var(--background)]/60" />
                </div>

                {/* Player Header */}
                <header className="relative z-20 p-4 md:p-12 flex justify-between items-center bg-gradient-to-b from-[var(--background)]/50 to-transparent">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] transition-all hover:scale-110"
                    >
                        <ChevronDown size={24} className="md:w-7 md:h-7" />
                    </button>
                    <div className="text-center">
                        <div className="text-[8px] md:text-[10px] font-bold tracking-[0.4em] text-zinc-500 uppercase">Playing from Library</div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <div className="text-xs md:text-sm font-bold text-[var(--foreground)] uppercase tracking-widest">Nitro Pulse</div>
                            {sceneBadge && (
                                <span className={`${sceneBadge.color} text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-full text-white`}>
                                    {sceneBadge.label} Mode
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFXPanel(true)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-all hover:scale-110"
                    >
                        <Wand2 size={18} className="md:w-5 md:h-5" />
                    </button>
                </header>

                {/* Main Content: Split in Desktop, Centered in Mobile */}
                <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:px-12 lg:px-20 gap-8 md:gap-12 lg:gap-20 overflow-y-auto overflow-x-hidden">

                    {/* Left/Top: The Visualizer & Art */}
                    <div className="relative group w-full max-w-[280px] md:max-w-sm lg:max-w-md xl:max-w-lg aspect-square shrink-0">
                        {/* Ambient glow pulled from the artwork — a soft colour aura that hugs the cover */}
                        <img
                            src={getImg(currentSong)} onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}}
                            aria-hidden="true"
                            className={`absolute inset-0 w-full h-full object-cover rounded-[3rem] blur-[55px] md:blur-[90px] saturate-150 pointer-events-none scale-[1.18] transition-all duration-1000 ${isPlaying ? 'opacity-70 group-hover:opacity-90 group-hover:scale-[1.28]' : 'opacity-40'}`}
                        />
                        <div className="absolute inset-0 bg-cyan-500/15 blur-[70px] md:blur-[110px] rounded-full scale-110 pointer-events-none transition-all duration-1000 group-hover:bg-cyan-500/30" />
                        <div className="relative w-full h-full rounded-2xl md:rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-[var(--border)] transition-all duration-500 group-hover:scale-105">
                            <img
                                src={getImg(currentSong)} onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}}
                                className={`w-full h-full object-cover transition-all duration-1000 ${isPlaying ? 'scale-100' : 'scale-100 blur-[2px] brightness-75'}`}
                            />
                            {enable3DAudio && is3DActive && (
                                <div className="absolute top-4 right-4 md:top-6 md:right-6 p-1.5 md:p-2 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-bounce">
                                    <Headphones size={16} className="text-white md:w-5 md:h-5" />
                                </div>
                            )}
                            {/* Scene Mode Indicator */}
                            {sceneBadge && (
                                <div className={`absolute top-4 left-4 md:top-6 md:left-6 ${sceneBadge.color} px-2.5 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 shadow-lg`}>
                                    <Sparkles size={12} className="text-white md:w-3.5 md:h-3.5" />
                                    <span className="text-[10px] md:text-xs font-bold text-white">{sceneBadge.label}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right/Bottom: Controls & Metadata */}
                    <div className="w-full md:max-w-xl lg:max-w-2xl xl:max-w-3xl space-y-6 md:space-y-8 px-2 self-center">
                        <div className="text-center md:text-left space-y-2 md:space-y-3">
                            <h2 className="text-2xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight leading-tight animate-in fade-in slide-in-from-left-8 duration-700 pb-1">
                                {decodeHtml(currentSong.name)}
                            </h2>
                            <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-4">
                                <ArtistLink song={currentSong} className="text-base md:text-xl font-semibold text-[var(--foreground-secondary)] tracking-tight hover:text-[var(--foreground)] transition-colors">
                                    {getArtist(currentSong)}
                                </ArtistLink>
                                <div className="h-px w-8 bg-[var(--border)] hidden md:block" />
                                <div className="flex items-center gap-2 pt-1 md:pt-0">
                                    <button onClick={toggleFav} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1 md:py-1.5 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-full border border-[var(--border)] transition-all">
                                        <Heart size={14} className={isFav ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "text-zinc-500 md:w-3.5 md:h-3.5"} />
                                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Like</span>
                                    </button>
                                    {user && (
                                        <button
                                            onClick={() => setShowPlaylistModal(true)}
                                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1 md:py-1.5 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-full border border-[var(--border)] transition-all text-zinc-500 hover:text-cyan-400"
                                        >
                                            <ListPlus size={14} className="md:w-3.5 md:h-3.5" />
                                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Playlist</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Large Seek Bar */}
                        <div className="space-y-4">
                            <div className="relative h-1.5 md:h-2 w-full bg-[var(--border)] rounded-full group cursor-pointer">
                                {/* A-B Loop Region Highlight */}
                                {loopA !== null && loopB !== null && (
                                    <div
                                        className="absolute h-full bg-amber-400/30 rounded-full"
                                        style={{
                                            left: `${(loopA / (duration || 1)) * 100}%`,
                                            width: `${((loopB - loopA) / (duration || 1)) * 100}%`
                                        }}
                                    />
                                )}
                                {/* Loop A Marker */}
                                {loopA !== null && (
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-amber-400 rounded-full shadow-lg"
                                        style={{ left: `${(loopA / (duration || 1)) * 100}%` }}
                                    />
                                )}
                                {/* Loop B Marker */}
                                {loopB !== null && (
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-amber-400 rounded-full shadow-lg"
                                        style={{ left: `${(loopB / (duration || 1)) * 100}%` }}
                                    />
                                )}
                                <div
                                    className="absolute h-full bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.6)]"
                                    style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 bg-[var(--foreground)] rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform" />
                                </div>
                                <input
                                    type="range"
                                    min={0} max={duration || 100} value={progress}
                                    onChange={e => seek(Number(e.target.value))}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold font-mono text-zinc-500">
                                <span>{formatTime(progress)}</span>
                                <div className="flex items-center gap-1.5 text-cyan-400/50">
                                    {isLooping ? (
                                        <span className="text-amber-400 flex items-center gap-1">
                                            <Repeat1 size={12} className="animate-pulse" />
                                            A-B LOOP
                                        </span>
                                    ) : (
                                        <>
                                            <Sparkles size={12} className="animate-pulse" />
                                            LIVE MASTER
                                        </>
                                    )}
                                    {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
                                        <span className="ml-3 text-indigo-400 flex items-center gap-1">
                                            <Moon size={12} />
                                            {Math.ceil(sleepTimerRemaining / 60)}m
                                        </span>
                                    )}
                                </div>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Epic Controls */}
                        {isRoomMember ? (
                            /* Members follow the host — show a LOCAL mute toggle only. */
                            <div className="flex flex-col items-center justify-center gap-2 py-2">
                                <button
                                    onClick={handleToggleMute}
                                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center hover:scale-105 active:scale-90 shadow-2xl transition-all"
                                    title={isMuted || volume === 0 ? 'Unmute (local only)' : 'Mute (local only)'}
                                    aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted || volume === 0 ? <VolumeX size={28} className="md:w-9 md:h-9" /> : <Volume2 size={28} className="md:w-9 md:h-9" />}
                                </button>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                                    {isMuted || volume === 0 ? 'Muted for you' : 'Synced with host'}
                                </span>
                            </div>
                        ) : (
                        <div className="flex items-center justify-between gap-2 md:gap-4 px-2 md:px-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                                className={`p-3 transition-all group active:scale-90 ${isShuffleOn ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.9)] scale-110' : 'text-zinc-500 hover:text-emerald-400 active:text-emerald-400 active:drop-shadow-[0_0_20px_rgba(52,211,153,0.9)]'}`}
                            >
                                <Shuffle size={18} className={`md:w-5 md:h-5 group-hover:rotate-12 transition-transform ${isShuffleOn ? 'animate-pulse' : ''}`} />
                            </button>

                            <div className="flex items-center gap-6 md:gap-14">
                                <button onClick={prev} className="text-[var(--foreground)] hover:text-cyan-400 transition-all hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] active:scale-95 active:text-cyan-400 active:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                                    <SkipBack size={28} fill="currentColor" className="md:w-10 md:h-10" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-14 h-14 md:w-24 md:h-24 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center hover:scale-105 active:scale-90 shadow-2xl transition-all group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <div className="relative z-10 flex items-center justify-center">
                                        {isPlaying ? <Pause size={24} fill="currentColor" className="md:w-10 md:h-10" /> : <Play size={24} fill="currentColor" className="ml-1 md:ml-1.5 md:w-10 md:h-10" />}
                                    </div>
                                </button>
                                <button onClick={next} className="text-[var(--foreground)] hover:text-cyan-400 transition-all hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] active:scale-95 active:text-cyan-400 active:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                                    <SkipForward size={28} fill="currentColor" className="md:w-10 md:h-10" />
                                </button>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
                                className={`p-3 transition-all group active:scale-90 relative ${repeatMode !== 'off' ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] scale-110' : 'text-zinc-500 hover:text-amber-400 active:text-amber-400 active:drop-shadow-[0_0_20px_rgba(251,191,36,0.9)]'}`}
                            >
                                <Repeat size={18} className={`md:w-5 md:h-5 group-hover:rotate-12 transition-transform ${repeatMode !== 'off' ? 'animate-pulse' : ''}`} />
                                {repeatMode === 'one' && <span className="absolute top-2 right-2 text-[8px] font-bold">1</span>}
                            </button>
                        </div>
                        )}

                        {/* Bottom Utility Bar - Grid for Mobile (Structured), Row for Desktop */}
                        <div className="grid grid-cols-4 md:flex items-center justify-items-center md:justify-center gap-y-4 gap-x-2 md:gap-x-10 pt-4 md:pt-10 border-t border-[var(--border)] w-full">
                            {/* A-B Loop */}
                            <button
                                className="flex flex-col items-center gap-1 group w-full"
                                onClick={() => {
                                    if (isLooping) {
                                        clearLoop();
                                    } else if (loopA === null) {
                                        setLoopA();
                                    } else {
                                        setLoopB();
                                    }
                                }}
                            >
                                <div className={`p-2.5 rounded-2xl transition-all ${(isLooping || loopA !== null) ? 'bg-amber-500/15' : 'bg-[var(--card)] group-hover:bg-[var(--card-hover)]'}`}>
                                    <Repeat1 size={16} className={`transition-all ${(isLooping || loopA !== null) ? 'text-amber-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`} />
                                </div>
                                <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${(isLooping || loopA !== null) ? 'text-amber-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`}>
                                    {isLooping ? 'Clear' : loopA !== null ? 'Set B' : 'Set A'}
                                </span>
                            </button>

                            {/* Audio FX */}
                            <button className="flex flex-col items-center gap-1 group w-full" onClick={handleFXClick}>
                                <div className={`p-2.5 rounded-2xl transition-all ${sceneMode !== 'none' ? 'bg-cyan-500/15' : 'bg-[var(--card)] group-hover:bg-[var(--card-hover)]'}`}>
                                    <Wand2 size={16} className={`transition-all ${sceneMode !== 'none' ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`} />
                                </div>
                                <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${sceneMode !== 'none' ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`}>FX</span>
                            </button>

                            {/* 3D Surround */}
                            <FirstTimeTooltip id="player-3d-audio" content="Experience immersive 360° spatial audio!" position="top">
                                <button className="flex flex-col items-center gap-1 group w-full" onClick={toggle3D}>
                                    <div className={`p-2.5 rounded-2xl transition-all ${is3DActive ? 'bg-purple-500/15' : 'bg-[var(--card)] group-hover:bg-[var(--card-hover)]'}`}>
                                        <Headphones size={16} className={`transition-all ${is3DActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`} />
                                    </div>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${is3DActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`}>3D</span>
                                </button>
                            </FirstTimeTooltip>

                            {/* Download */}
                            <FirstTimeTooltip id="player-download" content="Download songs for offline playback!" position="top">
                                <button className="flex flex-col items-center gap-1 group w-full" onClick={handleDownloadClick}>
                                    <div className={`p-2.5 rounded-2xl transition-all ${isDownloaded(String(currentSong.id || currentSong.songId)) ? 'bg-emerald-500/15' : 'bg-[var(--card)] group-hover:bg-[var(--card-hover)]'}`}>
                                        {isDownloading && currentDownloadId === String(currentSong.id || currentSong.songId) ? (
                                            <Loader size={16} className="text-emerald-400 animate-spin" />
                                        ) : isDownloaded(String(currentSong.id || currentSong.songId)) ? (
                                            <Check size={16} className="text-emerald-400" />
                                        ) : (
                                            <Download size={16} className="text-zinc-500 group-hover:text-[var(--foreground)] transition-all" />
                                        )}
                                    </div>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isDownloaded(String(currentSong.id || currentSong.songId)) ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`}>
                                        {isDownloaded(String(currentSong.id || currentSong.songId)) ? 'Saved' : 'Download'}
                                    </span>
                                </button>
                            </FirstTimeTooltip>

                            {/* Queue */}
                            <button className="flex flex-col items-center gap-1 group w-full" onClick={() => setShowQueue(true)}>
                                <div className="p-2.5 rounded-2xl bg-[var(--card)] group-hover:bg-[var(--card-hover)] transition-all">
                                    <ListMusic size={16} className="text-zinc-500 group-hover:text-[var(--foreground)] transition-all" />
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[var(--foreground)] mt-1">Queue</span>
                            </button>

                            {/* Share Card */}
                            <button className="flex flex-col items-center gap-1 group w-full" onClick={() => setShowSharePanel(true)}>
                                <div className="p-2.5 rounded-2xl bg-[var(--card)] group-hover:bg-[var(--card-hover)] transition-all">
                                    <Share2 size={16} className="text-zinc-500 group-hover:text-[var(--foreground)] transition-all" />
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[var(--foreground)] mt-1">Share</span>
                            </button>

                            {/* DJ Mode */}
                            <button className="flex flex-col items-center gap-1 group relative w-full" onClick={handleDJClick}>
                                <div className={`p-2.5 rounded-2xl transition-all ${isDJMode ? 'bg-pink-500/15' : 'bg-[var(--card)] group-hover:bg-[var(--card-hover)]'}`}>
                                    <Radio size={16} className={`transition-all ${isDJMode ? 'text-pink-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`} />
                                </div>
                                <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isDJMode ? 'text-pink-400' : 'text-zinc-500 group-hover:text-[var(--foreground)]'}`}>DJ</span>
                                {isDJMode && <span className="absolute -top-1 right-2 md:-right-1 w-2 h-2 bg-pink-400 rounded-full" />}
                            </button>

                            {/* Visualizer */}
                            <button className="flex flex-col items-center gap-1 group w-full" onClick={handleVisualizerClick}>
                                <div className="p-2.5 rounded-2xl bg-[var(--card)] group-hover:bg-[var(--card-hover)] transition-all">
                                    <Eye size={16} className="text-zinc-500 group-hover:text-[var(--foreground)] transition-all" />
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[var(--foreground)] mt-1">Visual</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audio FX Panel */}
            <AudioFXPanel isOpen={showFXPanel} onClose={() => setShowFXPanel(false)} />

            <AddToPlaylistModal
                isOpen={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
                song={currentSong}
            />

            {/* Queue Panel */}
            <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />

            {/* Share Panel — playable expiring link */}
            <SharePanel
                isOpen={showSharePanel}
                onClose={() => setShowSharePanel(false)}
                song={currentSong}
                onOpenCard={() => setShowShareCard(true)}
            />

            {/* Shareable Card Modal (story image) */}
            <ShareableCard
                isOpen={showShareCard}
                onClose={() => setShowShareCard(false)}
                song={currentSong}
            />

            {/* DJ Mode Panel */}
            <DJModePanel isOpen={showDJPanel} onClose={() => setShowDJPanel(false)} />

            {/* Full Screen Visualizer */}
            <FullScreenVisualizer isOpen={showVisualizer} onClose={() => setShowVisualizer(false)} />

        </>
    );
}
