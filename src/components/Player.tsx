"use client"
import { usePlayer } from '@/context/PlayerContext';
import { useSettings } from '@/context/SettingsContext';
import { Play, Pause, SkipBack, SkipForward, Download, Heart, ChevronDown, Mic2, Headphones } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Player() {
    const { currentSong, isPlaying, togglePlay, next, prev, progress, duration, seek, is3DActive, toggle3D } = usePlayer();
    const { enableDownload, enable3DAudio } = useSettings();
    const [isFav, setIsFav] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);

    useEffect(() => {
        if (currentSong) {
            fetch(`http://localhost:3000/api/favorites/${currentSong.id}/check`)
                .then(r => r.json())
                .then(d => setIsFav(d.isFavorite))
                .catch(console.error);
        }
    }, [currentSong]);

    if (!currentSong) return null;

    const getImg = (t: any) => {
        if (typeof t.image === 'string') return t.image;
        if (t.image && t.image.length) {
            return t.image[t.image.length - 1].url;
        }
        return '';
    };

    const getArtist = (t: any) => {
        if (t.artists && t.artists.primary && t.artists.primary.length) {
            return t.artists.primary[0].name;
        }
        if (typeof t.artist === 'string') return t.artist;
        return 'Unknown';
    };

    const getAudio = (t: any) => {
        if (t.audioUrl) return t.audioUrl;
        if (t.downloadUrl && t.downloadUrl.length) {
            return t.downloadUrl[t.downloadUrl.length - 1].url;
        }
        return null;
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
        if (isFav) {
            await fetch(`http://localhost:3000/api/favorites/${currentSong.id}`, { method: 'DELETE' });
            setIsFav(false);
        } else {
            await fetch('http://localhost:3000/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    songId: currentSong.id,
                    name: currentSong.name,
                    artist: getArtist(currentSong),
                    image: getImg(currentSong),
                    audioUrl: getAudio(currentSong) || ''
                })
            });
            setIsFav(true);
        }
    }

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Mobile Full Player
    if (isExpanded) {
        return (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setIsExpanded(false)} className="text-white p-2"><ChevronDown size={28} /></button>
                    <div className="text-[10px] font-bold tracking-widest text-zinc-400">PLAYING NOW</div>
                    <button onClick={toggleFav} className={`${isFav ? 'text-cyan-400' : 'text-white'} p-2`}><Heart size={24} fill={isFav ? "currentColor" : "none"} /></button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                    <img
                        src={getImg(currentSong)}
                        className="rounded-2xl shadow-[0_0_30px_rgba(0,229,255,0.15)] object-cover border border-white/10 w-64 h-64 mb-8"
                    />
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex-1 overflow-hidden mr-4">
                            <h2 className="text-xl font-bold text-white mb-1 truncate">{currentSong.name}</h2>
                            <p className="text-base text-cyan-400 truncate">{getArtist(currentSong)}</p>
                        </div>
                        {/* Feature Toggles */}
                        <div className="flex gap-3">
                            {enable3DAudio && (
                                <button
                                    onClick={toggle3D}
                                    className={`p-2 rounded-full transition-all ${is3DActive ? 'bg-purple-500/20 text-purple-400 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                                    title={is3DActive ? "Disable 3D Audio" : "Enable 3D Audio"}
                                >
                                    <Headphones size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="w-full h-1 bg-zinc-800 rounded-full mb-2 relative group">
                        <div className="absolute h-full bg-cyan-400 rounded-full" style={{ width: `${(progress / (duration || 1)) * 100}%` }}></div>
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={progress}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="absolute w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-8 px-2">
                    <button onClick={prev} className="text-white hover:text-cyan-400 transition-colors p-2"><SkipBack size={28} /></button>
                    <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-cyan-400 text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                        {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
                    </button>
                    <button onClick={next} className="text-white hover:text-cyan-400 transition-colors p-2"><SkipForward size={28} /></button>
                </div>

                {enableDownload && (
                    <div className="flex justify-center">
                        <button onClick={download} className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs bg-white/5 px-4 py-2 rounded-full border border-white/5 transition-all active:scale-95">
                            <Download size={14} /> Download Audio
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // Mini Player (Bottom Bar)
    return (
        <div
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-16 md:bottom-0 left-0 w-full h-14 md:h-24 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center px-4 md:px-6 z-50 cursor-pointer md:cursor-default"
        >
            {/* Progress Bar for Mobile Mini Player */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-zinc-800 md:hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${(progress / (duration || 1)) * 100}%` }}></div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 w-full md:w-1/3 overflow-hidden">
                <img src={getImg(currentSong)} className="w-10 h-10 md:w-14 md:h-14 rounded-lg object-cover bg-zinc-800 border border-white/10" />
                <div className="flex-1 overflow-hidden min-w-0">
                    <div className="font-semibold truncate text-sm md:text-base text-white">{currentSong.name}</div>
                    <div className="text-xs text-zinc-400 truncate">{getArtist(currentSong)}</div>
                </div>
                <button onClick={toggleFav} className={`ml-2 p-2 ${isFav ? 'text-cyan-400' : 'text-zinc-500'}`}><Heart size={20} fill={isFav ? "currentColor" : "none"} /></button>

                {/* Mobile Play/Pause */}
                <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-white ml-1"
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                </button>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex flex-col items-center flex-1 gap-2">
                <div className="flex items-center gap-6">
                    <button onClick={(e) => { e.stopPropagation(); prev(); }} className="text-zinc-400 hover:text-white transition-colors"><SkipBack size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
                        {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-1" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); next(); }} className="text-zinc-400 hover:text-white transition-colors"><SkipForward size={20} /></button>
                </div>
                <div className="w-full max-w-md flex items-center gap-3 text-xs text-zinc-500 font-mono" onClick={(e) => e.stopPropagation()}>
                    <span>{formatTime(progress)}</span>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full relative group cursor-pointer">
                        <div className="absolute h-full bg-cyan-400 rounded-full group-hover:bg-cyan-300" style={{ width: `${(progress / (duration || 1)) * 100}%` }}></div>
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={progress}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="absolute w-full h-full opacity-0 cursor-pointer top-0 left-0"
                        />
                    </div>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div className="hidden md:flex w-1/3 justify-end items-center gap-4">
                {enable3DAudio && (
                    <button
                        onClick={(e) => { e.stopPropagation(); toggle3D(); }}
                        className={`transition-colors ${is3DActive ? 'text-purple-400 animate-pulse' : 'text-zinc-600 hover:text-white'}`}
                        title="Toggle 3D Audio"
                    >
                        <Headphones size={18} />
                    </button>
                )}
                {enableDownload && (
                    <button onClick={(e) => { e.stopPropagation(); download(); }} className="text-zinc-500 hover:text-cyan-400 transition-colors" title="Download"><Download size={18} /></button>
                )}
            </div>
        </div>
    )
}
