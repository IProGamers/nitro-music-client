"use client"
import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ArihantPlayer() {
    const {
        currentSong,
        isPlaying,
        togglePlay,
        next,
        prev,
        progress,
        duration,
        seek,
        setRepeatMode, // Access repeat control
        repeatMode
    } = usePlayer();

    // Force Loop All in Arihant Mode
    useEffect(() => {
        if (setRepeatMode && repeatMode !== 'all') {
            setRepeatMode('all');
        }
    }, [setRepeatMode, repeatMode]);

    const [volume, setVolume] = useState(80);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const getImg = (song: any) => {
        if (!song) return '';
        if (song.image && Array.isArray(song.image) && song.image.length) {
            return song.image[song.image.length - 1]?.url || song.image[song.image.length - 1]?.link || '';
        }
        return song.image || '';
    };

    const getArtist = (song: any) => {
        if (song?.artists?.primary?.[0]?.name) return song.artists.primary[0].name;
        return song?.artist || 'Unknown Artist';
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle volume
    useEffect(() => {
        const audio = document.querySelector('audio');
        if (audio) {
            audio.volume = volume / 100;
        }
    }, [volume]);

    if (!currentSong) {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-orange-500/20 p-2 z-50">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest py-2">Select a Stavan to play 🙏</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-orange-500/30 p-2 z-50">
            <div className="max-w-3xl mx-auto">
                {/* Song Info Row */}
                <div className="flex items-center gap-3 mb-2">
                    {/* Album Art */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-orange-500/10 flex-shrink-0 border border-white/5">
                        {getImg(currentSong) ? (
                            <img
                                src={getImg(currentSong)}
                                alt={currentSong.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">
                                🙏
                            </div>
                        )}
                    </div>

                    {/* Song Details */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-[11px] truncate uppercase tracking-tighter">
                            {currentSong.name}
                        </h3>
                        <p className="text-white/40 text-[9px] truncate uppercase font-bold tracking-widest">
                            {getArtist(currentSong)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-white/40 text-[9px] min-w-[30px] font-mono">
                            {formatTime(progress)}
                        </span>
                        <div
                            className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const percent = (e.clientX - rect.left) / rect.width;
                                seek(percent * duration);
                            }}
                        >
                            <div
                                className="h-full bg-orange-500 rounded-full transition-all"
                                style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
                            />
                        </div>
                        <span className="text-white/40 text-[9px] min-w-[30px] text-right font-mono">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    {/* Previous */}
                    <button
                        onClick={prev}
                        className="w-10 h-10 bg-white/5 active:bg-white/10 rounded-full flex items-center justify-center transition-all active:scale-90"
                    >
                        <SkipBack size={18} className="text-white" fill="white" />
                    </button>

                    {/* Play/Pause */}
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-orange-500/20 border-2 border-white/10"
                    >
                        {isPlaying ? (
                            <Pause size={24} className="text-white" fill="white" />
                        ) : (
                            <Play size={24} className="text-white ml-0.5" fill="white" />
                        )}
                    </button>

                    {/* Next */}
                    <button
                        onClick={next}
                        className="w-10 h-10 bg-white/5 active:bg-white/10 rounded-full flex items-center justify-center transition-all active:scale-90"
                    >
                        <SkipForward size={18} className="text-white" fill="white" />
                    </button>
                </div>

                {/* Volume (optional, hidden on mobile) */}
                <div className="hidden md:flex items-center justify-center gap-3 mt-4">
                    <Volume2 size={20} className="text-white/40" />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-32 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                </div>
            </div>
        </div>
    );
}
