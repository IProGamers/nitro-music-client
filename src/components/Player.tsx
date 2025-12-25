"use client"
import { usePlayer } from '@/context/PlayerContext';
import { useSettings } from '@/context/SettingsContext';
import { useAudioFX } from '@/context/AudioFXContext';
import { useAuth } from '@/context/AuthContext';
import {
    Play, Pause, SkipBack, SkipForward, Download, Heart,
    ChevronDown, Mic2, Headphones, Volume2, VolumeX, ListMusic,
    Maximize2, Share2, Repeat, Shuffle, Sparkles, Wand2, Moon, ListPlus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AudioFXPanel from './AudioFXPanel';
import AudioVisualizer from './AudioVisualizer';
import LyricsPanel from './LyricsPanel';
import AddToPlaylistModal from './AddToPlaylistModal';

const decodeHtml = (html: string): string => {
    if (!html || typeof window === 'undefined') return html || '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

export default function Player() {
    const {
        currentSong, isPlaying, togglePlay, next, prev,
        progress, duration, seek, is3DActive, toggle3D,
        volume, setVolume,
        isShuffleOn, toggleShuffle, repeatMode, toggleRepeat
    } = usePlayer();

    const { enableDownload, enable3DAudio } = useSettings();
    const {
        sceneMode,
        sleepTimerRemaining,
        hapticEnabled,
        triggerHaptic
    } = useAudioFX();

    const { user, addLikedSong, removeLikedSong, isLikedSong } = useAuth();

    const [isFav, setIsFav] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFXPanel, setShowFXPanel] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [lastVolume, setLastVolume] = useState(1);

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

    if (!currentSong) return null;

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

    const download = async () => {
        const url = currentSong.downloadUrl?.[4]?.link || currentSong.downloadUrl?.[0]?.link || currentSong.audioUrl;
        if (!url) return;

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${currentSong.name}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Download failed", e);
            window.open(url, '_blank');
        }
    }

    const toggleFav = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return; // Only logged in users can like

        const changingToFav = !isFav;

        // Optimistic UI update
        setIsFav(changingToFav);

        try {
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

            // Sync with Node server as well
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            if (!changingToFav) {
                await fetch(`${apiUrl}/api/favorites/${currentSong.id}`, { method: 'DELETE' });
            } else {
                await fetch(`${apiUrl}/api/favorites`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        songId: String(currentSong.id),
                        name: currentSong.name,
                        artist: getArtist(currentSong),
                        image: getImg(currentSong),
                        audioUrl: currentSong.audioUrl || ''
                    })
                });
            }
        } catch (e) {
            console.warn("Favorite sync error:", e);
            // Revert on error
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
        if (sceneMode === 'none') return null;
        const badges: Record<string, { label: string; color: string }> = {
            stadium: { label: 'Stadium', color: 'bg-orange-500' },
            lofi: { label: 'Lo-Fi', color: 'bg-amber-500' },
            club: { label: 'Club', color: 'bg-purple-500' },
            concert: { label: 'Concert', color: 'bg-cyan-500' },
            underwater: { label: 'Underwater', color: 'bg-blue-500' },
            cave: { label: 'Cave', color: 'bg-emerald-500' },
        };
        return badges[sceneMode];
    };

    const sceneBadge = getSceneBadge();

    return (
        <>
            {/* Desktop & Mobile Mini Player Bar */}
            {/* On desktop: starts after sidebar (w-64 = 256px), on mobile: full width */}
            <div
                onClick={() => setIsExpanded(true)}
                className={`fixed bottom-16 md:bottom-0 left-0 md:left-64 w-full md:w-[calc(100%-256px)] h-16 md:h-24 bg-[var(--background)]/95 backdrop-blur-2xl border-t border-[var(--border)] flex items-center px-4 md:px-8 z-[60] cursor-pointer transition-all duration-500 hover:bg-[var(--card-hover)] group ${(isExpanded || showFXPanel || showLyrics) ? 'translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}
            >
                {/* Audio Visualizer Bar */}
                <div className="absolute bottom-full left-0 w-full h-8 overflow-hidden pointer-events-none opacity-50">
                    <AudioVisualizer height={32} className="opacity-70" />
                </div>

                {/* Global Seek Bar on top for total continuity */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--border)] group-hover:h-1 transition-all">
                    <div
                        className="h-full bg-cyan-400 relative"
                        style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--foreground)] rounded-full opacity-0 group-hover:opacity-100 shadow-[0_0_10px_white]" />
                    </div>
                </div>

                {/* Left Side: Track Info */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 md:flex-none md:w-1/3 min-w-0">
                    <div className="relative group/art shrink-0">
                        <img
                            src={getImg(currentSong)}
                            className="w-10 h-10 md:w-16 md:h-16 rounded-xl object-cover shadow-2xl border border-[var(--border)] group-hover/art:scale-105 transition-transform duration-500"
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
                        <h3 className="font-bold text-xs md:text-lg text-[var(--foreground)] truncate leading-tight group-hover:text-cyan-400 transition-colors uppercase tracking-tighter">
                            {decodeHtml(currentSong.name)}
                        </h3>
                        <div className="flex items-center gap-2">
                            <p className="text-[9px] md:text-xs text-[var(--foreground-secondary)] font-bold uppercase tracking-widest truncate mt-0.5">
                                {getArtist(currentSong)}
                            </p>
                            {/* Sleep Timer Indicator */}
                            {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
                                <div className="flex items-center gap-1 text-indigo-400">
                                    <Moon size={8} className="md:w-2.5 md:h-2.5" />
                                    <span className="text-[8px] md:text-[9px] font-mono">{Math.ceil(sleepTimerRemaining / 60)}m</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center: Mobile Playback Controls (prev, play/pause, next) */}
                <div className="flex items-center gap-3 md:hidden shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={prev} className="p-1.5 text-[var(--foreground-secondary)] active:scale-90 active:text-[var(--foreground)] transition-all">
                        <SkipBack size={20} fill="currentColor" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        className="w-10 h-10 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center active:scale-90 shadow-lg"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={next} className="p-1.5 text-[var(--foreground-secondary)] active:scale-90 active:text-[var(--foreground)] transition-all">
                        <SkipForward size={20} fill="currentColor" />
                    </button>
                </div>

                {/* Right: Mobile Utility Controls (heart, playlist, fx) */}
                <div className="flex items-center gap-1 md:hidden shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={toggleFav} className="p-1.5 transition-all active:scale-95">
                        <Heart size={18} className={isFav ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,1)]" : "text-[var(--foreground-muted)] active:text-rose-400"} />
                    </button>
                    {user && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }}
                            className="p-1.5 text-[var(--foreground-muted)] active:text-cyan-400 active:drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] transition-all"
                            title="Add to Playlist"
                        >
                            <ListPlus size={18} />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowFXPanel(true); }}
                        className={`p-1.5 transition-all duration-300 active:drop-shadow-[0_0_15px_rgba(34,211,238,1)] ${sceneMode !== 'none' ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] scale-110' : 'text-[var(--foreground-muted)] active:text-cyan-400'}`}
                    >
                        <Wand2 size={18} />
                    </button>
                </div>

                {/* Center: Desktop Playback Controls */}
                <div className="hidden md:flex flex-col items-center flex-1 max-w-lg px-8 gap-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-8">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                            className={`transition-all active:scale-90 ${isShuffleOn ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'text-[var(--foreground-muted)] hover:text-emerald-400'}`}
                        >
                            <Shuffle size={16} />
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
                            className={`transition-all active:scale-90 ${repeatMode !== 'off' ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'text-[var(--foreground-muted)] hover:text-amber-400'}`}
                        >
                            <Repeat size={16} />
                            {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
                        </button>
                    </div>
                    <div className="w-full flex items-center gap-3">
                        <span className="text-[9px] font-bold text-[var(--foreground-muted)] w-10 text-right font-mono">{formatTime(progress)}</span>
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden relative group/seek">
                            <div className="absolute h-full bg-cyan-400" style={{ width: `${(progress / (duration || 1)) * 100}%` }} />
                            <input
                                type="range"
                                min={0} max={duration || 100} value={progress}
                                onChange={e => seek(Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <span className="text-[9px] font-bold text-[var(--foreground-muted)] w-10 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right Side: Desktop Utility Controls with Custom Glowing Colors */}
                <div className="hidden md:flex items-center justify-end gap-5 w-1/3" onClick={e => e.stopPropagation()}>
                    {/* Heart/Favorite - Rose glow */}
                    <button
                        onClick={toggleFav}
                        className="transition-all hover:scale-110 active:scale-95"
                        title="Add to Favorites"
                    >
                        <Heart size={20} className={isFav ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" : "text-[var(--foreground-muted)] hover:text-rose-400 hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"} />
                    </button>

                    {/* Playlist - Purple/Indigo glow */}
                    {user && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }}
                            className="text-[var(--foreground-muted)] hover:text-purple-400 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all"
                            title="Add to Playlist"
                        >
                            <ListPlus size={20} />
                        </button>
                    )}

                    {/* Lyrics - Pink glow */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowLyrics(true); }}
                        className="text-[var(--foreground-muted)] hover:text-pink-400 hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] transition-all"
                        title="Lyrics"
                    >
                        <Mic2 size={18} />
                    </button>

                    {/* Audio FX - Cyan/Gradient glow */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowFXPanel(true); }}
                        className={`transition-all duration-300 ${sceneMode !== 'none'
                            ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.9)] scale-110 animate-pulse'
                            : 'text-[var(--foreground-muted)] hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                            }`}
                        title="Audio FX Studio"
                    >
                        <Wand2 size={18} />
                    </button>



                    {/* Queue - Orange glow */}
                    <button
                        className="text-[var(--foreground-muted)] hover:text-orange-400 hover:drop-shadow-[0_0_8px_rgba(251,146,60,0.8)] transition-all"
                        title="Queue"
                    >
                        <ListMusic size={18} />
                    </button>

                    {/* 3D Audio - Purple glow */}
                    {enable3DAudio && (
                        <button
                            onClick={toggle3D}
                            className={`transition-all duration-300 ${is3DActive
                                ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)] scale-110'
                                : 'text-[var(--foreground-muted)] hover:text-purple-400 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                                }`}
                            title="3D Audio"
                        >
                            <Headphones size={20} />
                        </button>
                    )}

                    <div className="flex items-center gap-3 w-32 group/vol">
                        <button onClick={handleToggleMute} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                            {volume === 0 || isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full relative overflow-hidden">
                            <div className="absolute h-full bg-[var(--foreground)] group-hover/vol:bg-cyan-400 transition-colors" style={{ width: `${volume * 100}%` }} />
                            <input
                                type="range"
                                min={0} max={1} step={0.01} value={volume}
                                onChange={e => setVolume(Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
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
                    <img src={getImg(currentSong)} className="w-full h-full object-cover blur-[120px] opacity-40 animate-slow-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/40 to-[var(--background)]" />
                    <div className="absolute inset-0 bg-[var(--background)]/60" />
                </div>

                {/* Player Header */}
                <header className="relative z-10 p-4 md:p-12 flex justify-between items-center bg-gradient-to-b from-[var(--background)]/50 to-transparent">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] transition-all hover:scale-110"
                    >
                        <ChevronDown size={24} className="md:w-7 md:h-7" />
                    </button>
                    <div className="text-center">
                        <div className="text-[8px] md:text-[10px] font-bold tracking-[0.4em] text-[var(--foreground-muted)] uppercase">Playing from Library</div>
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

                {/* Epic Background Visualizer - Positioned at Top */}
                <div className="absolute top-0 left-0 right-0 h-48 opacity-40 pointer-events-none z-0">
                    <AudioVisualizer height={192} />
                </div>

                {/* Main Content: Split in Desktop, Centered in Mobile */}
                <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:px-24 gap-8 md:gap-24 overflow-y-auto overflow-x-hidden">

                    {/* Left/Top: The Visualizer & Art */}
                    <div className="relative group w-full max-w-[280px] md:max-w-md aspect-square shrink-0">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] md:blur-[100px] rounded-full group-hover:bg-cyan-500/40 transition-all duration-1000 scale-90" />
                        <div className="relative w-full h-full rounded-3xl md:rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-[var(--border)] transition-all duration-500 group-hover:scale-105">
                            <img
                                src={getImg(currentSong)}
                                className={`w-full h-full object-cover transition-all duration-1000 ${isPlaying ? 'scale-100' : 'scale-110 blur-sm brightness-50'}`}
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
                    <div className="w-full max-w-lg space-y-6 md:space-y-12 px-2">
                        <div className="text-center md:text-left space-y-3 md:space-y-4">
                            <h2 className="text-2xl md:text-7xl font-bold text-[var(--foreground)] tracking-tighter uppercase leading-none animate-in fade-in slide-in-from-left-8 duration-700">
                                {decodeHtml(currentSong.name)}
                            </h2>
                            <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-4">
                                <p className="text-base md:text-2xl font-bold text-cyan-400 uppercase tracking-tighter opacity-80">
                                    {getArtist(currentSong)}
                                </p>
                                <div className="h-px w-8 bg-[var(--border)] hidden md:block" />
                                <div className="flex items-center gap-2 pt-1 md:pt-0">
                                    <button onClick={toggleFav} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-1 md:py-2 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-full border border-[var(--border)] transition-all">
                                        <Heart size={14} className={isFav ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "text-[var(--foreground-muted)] md:w-4 md:h-4"} />
                                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Like</span>
                                    </button>
                                    {user && (
                                        <button
                                            onClick={() => setShowPlaylistModal(true)}
                                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-1 md:py-2 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-full border border-[var(--border)] transition-all text-[var(--foreground-muted)] hover:text-cyan-400"
                                        >
                                            <ListPlus size={14} className="md:w-4 md:h-4" />
                                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Playlist</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Large Seek Bar */}
                        <div className="space-y-4">
                            <div className="relative h-2 w-full bg-[var(--border)] rounded-full group cursor-pointer">
                                <div
                                    className="absolute h-full bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.6)]"
                                    style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-[var(--foreground)] rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform" />
                                </div>
                                <input
                                    type="range"
                                    min={0} max={duration || 100} value={progress}
                                    onChange={e => seek(Number(e.target.value))}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold font-mono text-[var(--foreground-muted)]">
                                <span>{formatTime(progress)}</span>
                                <div className="flex items-center gap-1.5 text-cyan-400/50">
                                    <Sparkles size={12} className="animate-pulse" />
                                    LIVE MASTER
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
                        <div className="flex items-center justify-between gap-2 md:gap-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                                className={`p-3 md:p-4 transition-all group active:scale-90 ${isShuffleOn ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.9)] scale-110' : 'text-[var(--foreground-muted)] hover:text-emerald-400'}`}
                            >
                                <Shuffle size={20} className={`md:w-6 md:h-6 group-hover:rotate-12 transition-transform ${isShuffleOn ? 'animate-pulse' : ''}`} />
                            </button>

                            <div className="flex items-center gap-6 md:gap-14">
                                <button onClick={prev} className="text-[var(--foreground)] hover:text-cyan-400 transition-all hover:scale-125 hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] active:scale-95">
                                    <SkipBack size={32} fill="currentColor" className="md:w-12 md:h-12" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center hover:scale-105 active:scale-90 shadow-2xl transition-all group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <div className="relative z-10 flex items-center justify-center">
                                        {isPlaying ? <Pause size={28} fill="currentColor" className="md:w-12 md:h-12" /> : <Play size={28} fill="currentColor" className="ml-1 md:ml-2 md:w-12 md:h-12" />}
                                    </div>
                                </button>
                                <button onClick={next} className="text-[var(--foreground)] hover:text-cyan-400 transition-all hover:scale-125 hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] active:scale-95">
                                    <SkipForward size={32} fill="currentColor" className="md:w-12 md:h-12" />
                                </button>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
                                className={`p-3 md:p-4 transition-all group active:scale-90 relative ${repeatMode !== 'off' ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] scale-110' : 'text-[var(--foreground-muted)] hover:text-amber-400'}`}
                            >
                                <Repeat size={20} className={`md:w-6 md:h-6 group-hover:rotate-12 transition-transform ${repeatMode !== 'off' ? 'animate-pulse' : ''}`} />
                                {repeatMode === 'one' && <span className="absolute top-2 right-2 text-[10px] font-bold">1</span>}
                            </button>
                        </div>

                        {/* Bottom Utility Bar with Custom Glowing Colors */}
                        <div className="grid grid-cols-4 gap-2 md:gap-4 pt-6 md:pt-10 border-t border-[var(--border)]">
                            {/* Lyrics - Pink */}
                            <button className="flex flex-col items-center gap-1.5 md:gap-2 group" onClick={() => setShowLyrics(true)}>
                                <div className="p-3 md:p-4 rounded-2xl md:rounded-[2rem] bg-[var(--card)] group-hover:bg-pink-500/20 transition-all">
                                    <Mic2 size={18} className="text-[var(--foreground-muted)] group-hover:text-pink-400 transition-all md:w-[22px] md:h-[22px]" />
                                </div>
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] group-hover:text-pink-400">Lyrics</span>
                            </button>

                            {/* Audio FX - Cyan */}
                            <button className="flex flex-col items-center gap-1.5 md:gap-2 group" onClick={() => setShowFXPanel(true)}>
                                <div className={`p-3 md:p-4 rounded-2xl md:rounded-[2rem] transition-all ${sceneMode !== 'none' ? 'bg-cyan-500/20' : 'bg-[var(--card)] group-hover:bg-cyan-500/20'}`}>
                                    <Wand2 size={18} className={`transition-all md:w-[22px] md:h-[22px] ${sceneMode !== 'none' ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse' : 'text-[var(--foreground-muted)] group-hover:text-cyan-400'}`} />
                                </div>
                                <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest ${sceneMode !== 'none' ? 'text-cyan-400' : 'text-[var(--foreground-muted)] group-hover:text-cyan-400'}`}>FX</span>
                            </button>

                            {/* Download - Green */}
                            <button className="flex flex-col items-center gap-1.5 md:gap-2 group" onClick={download}>
                                <div className="p-3 md:p-4 rounded-2xl md:rounded-[2rem] bg-[var(--card)] group-hover:bg-emerald-500/20 transition-all">
                                    <Download size={18} className="text-[var(--foreground-muted)] group-hover:text-emerald-400 transition-all md:w-[22px] md:h-[22px]" />
                                </div>
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] group-hover:text-emerald-400">Save</span>
                            </button>

                            {/* Queue - Orange */}
                            <button className="flex flex-col items-center gap-1.5 md:gap-2 group">
                                <div className="p-3 md:p-4 rounded-2xl md:rounded-[2rem] bg-[var(--card)] group-hover:bg-orange-500/20 transition-all">
                                    <ListMusic size={18} className="text-[var(--foreground-muted)] group-hover:text-orange-400 transition-all md:w-[22px] md:h-[22px]" />
                                </div>
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] group-hover:text-orange-400">Queue</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audio FX Panel */}
            <AudioFXPanel isOpen={showFXPanel} onClose={() => setShowFXPanel(false)} />

            {/* Lyrics Panel */}
            <LyricsPanel
                isOpen={showLyrics}
                onClose={() => setShowLyrics(false)}
                songId={currentSong?.id || null}
                songName={currentSong?.name || ''}
                artistName={getArtist(currentSong)}
            />

            <AddToPlaylistModal
                isOpen={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
                song={currentSong}
            />
        </>
    );
}
