"use client"
import { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { ListMusic, Play, Trash2, X, GripVertical, Music } from 'lucide-react';
import { decodeHtml } from '@/lib/utils';

export default function QueuePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const {
        queue,
        currentIndex,
        currentSong,
        playTrack,
        removeFromQueue,
        clearQueue,
        reorderQueue
    } = usePlayer();

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const getImg = (t: any) => {
        if (!t) return '';
        if (t.image && Array.isArray(t.image) && t.image.length) {
            return t.image[t.image.length - 1].url || t.image[t.image.length - 1].link || '';
        }
        if (typeof t.image === 'string') return t.image;
        return '';
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            reorderQueue(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleTouchStart = (index: number) => {
        setDraggedIndex(index);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end md:items-center justify-center">
            <div className="bg-[#121212] text-white w-full md:w-[500px] max-h-[85vh] rounded-t-2xl md:rounded-2xl overflow-hidden border border-[#272727] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
                {/* YouTube Music UP NEXT Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#222222]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10 text-white">
                            <ListMusic size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-base tracking-tight text-white uppercase text-xs">Up Next</h2>
                            <p className="text-xs text-[#aaaaaa]">
                                {queue.length} {queue.length === 1 ? 'song' : 'songs'} in queue
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {queue.length > 0 && (
                            <button
                                onClick={clearQueue}
                                className="px-3 py-1 text-xs font-semibold text-[#aaaaaa] hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-white/10 text-[#aaaaaa] hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Now Playing */}
                {currentSong && (
                    <div className="px-5 py-3.5 bg-[#181818] border-b border-[#222222]">
                        <p className="text-[10px] uppercase tracking-wider text-[#888888] font-bold mb-2">
                            Now Playing
                        </p>
                        <div className="flex items-center gap-3">
                            <img
                                src={getImg(currentSong)}
                                className="w-12 h-12 rounded-md object-cover shadow-sm"
                                alt=""
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-white truncate">
                                    {decodeHtml(currentSong.name || currentSong.title)}
                                </p>
                                <p className="text-xs text-[#aaaaaa] truncate mt-0.5">
                                    {decodeHtml(currentSong.artists?.primary?.[0]?.name || currentSong.artist || 'Unknown')}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-medium">
                                <Play size={12} fill="currentColor" />
                                <span>Playing</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Queue List */}
                <div className="overflow-y-auto max-h-[50vh] p-3 space-y-1">
                    {queue.length === 0 ? (
                        <div className="text-center py-12">
                            <Music size={36} className="text-[#555555] mx-auto mb-2" />
                            <p className="text-sm font-medium text-[#888888]">Your queue is empty</p>
                            <p className="text-xs text-[#555555] mt-1">
                                Play any song or album to start listening
                            </p>
                        </div>
                    ) : (
                        queue.map((song, index) => {
                            const isCurrent = index === currentIndex;
                            const isDragging = draggedIndex === index;
                            const isDragOver = dragOverIndex === index;

                            return (
                                <div
                                    key={`${song.id || song.songId}-${index}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onTouchStart={() => handleTouchStart(index)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${isCurrent
                                        ? 'bg-[#222222] border border-white/20'
                                        : 'hover:bg-[#1c1c1c] border border-transparent'
                                        } ${isDragging ? 'opacity-40 scale-[0.98]' : ''} ${isDragOver ? 'border-white/50 border-dashed' : ''
                                        }`}
                                >
                                    {/* Drag Handle */}
                                    <div className="text-[#666666] hover:text-white cursor-grab p-1">
                                        <GripVertical size={16} />
                                    </div>

                                    {/* Song Info */}
                                    <div
                                        className="flex items-center gap-3 flex-1 min-w-0"
                                        onClick={() => playTrack(song, queue)}
                                    >
                                        <div className="relative shrink-0 w-10 h-10 rounded-md overflow-hidden bg-[#242424]">
                                            <img
                                                src={getImg(song)}
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                            {isCurrent && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <Play size={12} fill="white" className="text-white ml-0.5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs md:text-sm font-medium truncate ${isCurrent ? 'text-white font-bold' : 'text-[#e0e0e0]'}`}>
                                                {decodeHtml(song.name || song.title)}
                                            </p>
                                            <p className="text-xs text-[#888888] truncate mt-0.5">
                                                {decodeHtml(song.artists?.primary?.[0]?.name || song.artist || 'Unknown')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    {!isCurrent && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromQueue(index);
                                            }}
                                            className="p-1.5 rounded-md hover:bg-white/10 text-[#666666] hover:text-red-400 transition-colors"
                                            title="Remove from queue"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Hint */}
                <div className="px-5 py-3 border-t border-[#222222] bg-[#0d0d0d] flex items-center justify-between text-xs text-[#777777]">
                    <span>Drag items to reorder</span>
                    <span className="text-[#aaaaaa] font-medium">Autoplay active</span>
                </div>
            </div>
        </div>
    );
}
