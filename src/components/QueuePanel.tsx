"use client"
import { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { ListMusic, Play, Trash2, X, GripVertical, Music } from 'lucide-react';

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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center">
            <div className="bg-[var(--card)] w-full md:w-[480px] max-h-[80vh] rounded-t-3xl md:rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-cyan-400/10">
                            <ListMusic size={18} className="text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[var(--foreground)]">Queue</h2>
                            <p className="text-[10px] text-[var(--foreground-muted)]">
                                {queue.length} tracks
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {queue.length > 0 && (
                            <button
                                onClick={clearQueue}
                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--card-hover)] text-[var(--foreground-muted)] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Now Playing */}
                {currentSong && (
                    <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-[var(--border)]">
                        <p className="text-[9px] uppercase tracking-widest text-[var(--foreground-muted)] font-bold mb-2">
                            Now Playing
                        </p>
                        <div className="flex items-center gap-3">
                            <img
                                src={getImg(currentSong)}
                                className="w-12 h-12 rounded-lg object-cover"
                                alt=""
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-[var(--foreground)] truncate">
                                    {currentSong.name || currentSong.title}
                                </p>
                                <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                                    {currentSong.artists?.primary?.[0]?.name || currentSong.artist || 'Unknown'}
                                </p>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                    </div>
                )}

                {/* Queue List */}
                <div className="overflow-y-auto max-h-[50vh] p-2">
                    {queue.length === 0 ? (
                        <div className="text-center py-12">
                            <Music size={40} className="text-[var(--foreground-muted)]/30 mx-auto mb-3" />
                            <p className="text-sm text-[var(--foreground-muted)]">Your queue is empty</p>
                            <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-1">
                                Add songs to build your playlist
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {queue.map((song, index) => {
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
                                        className={`flex items-center gap-3 p-2 rounded-xl cursor-grab active:cursor-grabbing transition-all ${isCurrent
                                                ? 'bg-cyan-500/10 border border-cyan-400/30'
                                                : 'hover:bg-[var(--card-hover)] border border-transparent'
                                            } ${isDragging ? 'opacity-50 scale-[0.98]' : ''} ${isDragOver ? 'border-cyan-400 border-dashed' : ''
                                            }`}
                                    >
                                        {/* Drag Handle */}
                                        <div className="text-[var(--foreground-muted)] cursor-grab">
                                            <GripVertical size={16} />
                                        </div>

                                        {/* Song Info */}
                                        <div
                                            className="flex items-center gap-3 flex-1 min-w-0"
                                            onClick={() => playTrack(song, queue)}
                                        >
                                            <div className="relative shrink-0">
                                                <img
                                                    src={getImg(song)}
                                                    className="w-10 h-10 rounded object-cover"
                                                    alt=""
                                                />
                                                {isCurrent && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                                                        <Play size={12} fill="white" className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${isCurrent ? 'text-cyan-400' : 'text-[var(--foreground)]'}`}>
                                                    {song.name || song.title}
                                                </p>
                                                <p className="text-[9px] text-[var(--foreground-muted)] truncate">
                                                    {song.artists?.primary?.[0]?.name || song.artist || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Track Number */}
                                        <span className="text-[10px] text-[var(--foreground-muted)] font-medium w-6 text-center">
                                            {index + 1}
                                        </span>

                                        {/* Remove Button */}
                                        {!isCurrent && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFromQueue(index);
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Hint */}
                <div className="p-3 border-t border-[var(--border)] text-center">
                    <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-widest">
                        Drag to reorder • Swipe to remove
                    </p>
                </div>
            </div>
        </div>
    );
}
