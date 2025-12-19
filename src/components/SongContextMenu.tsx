"use client"
import { useState, useRef, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { ListEnd, Play, Heart, ListPlus, MoreVertical, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SongContextMenuProps {
    song: any;
    queue?: any[];
    children?: React.ReactNode;
    className?: string;
}

const decodeHtml = (html: string): string => {
    if (!html || typeof window === 'undefined') return html || '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

export default function SongContextMenu({ song, queue, children, className = '' }: SongContextMenuProps) {
    const { playTrack, playNext } = usePlayer();
    const { user, addLikedSong, isLikedSong } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Check if song is liked
    useEffect(() => {
        const check = async () => {
            if (song && user) {
                const liked = await isLikedSong(String(song.id || song.songId));
                setIsLiked(liked);
            }
        };
        check();
    }, [song, user, isLikedSong]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handlePlayNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        playNext(song);
        setIsOpen(false);
    };

    const handlePlayNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        playTrack(song, queue || [song]);
        setIsOpen(false);
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        try {
            await addLikedSong({
                id: String(song.id || song.songId),
                name: song.name || song.title || 'Unknown',
                artist: song.artists?.primary?.[0]?.name || song.artist || 'Unknown',
                image: typeof song.image === 'string' ? song.image : song.image?.[song.image.length - 1]?.url || ''
            });
            setIsLiked(true);
        } catch (e) {
            console.error("Failed to like song:", e);
        }
        setIsOpen(false);
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className={`relative ${className}`} ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={toggleMenu}
                className="p-1.5 rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all active:scale-90"
                title="More options"
            >
                <MoreVertical size={18} />
            </button>

            {/* Context Menu Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Close button for mobile */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] md:hidden">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Options</span>
                        <button onClick={() => setIsOpen(false)} className="text-[var(--foreground-muted)]">
                            <X size={14} />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        {/* Play Now */}
                        <button
                            onClick={handlePlayNow}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                        >
                            <Play size={16} className="text-cyan-400" />
                            <span className="font-medium">Play Now</span>
                        </button>

                        {/* Play Next - Main Feature */}
                        <button
                            onClick={handlePlayNext}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                        >
                            <ListEnd size={16} className="text-emerald-400" />
                            <div>
                                <span className="font-medium">Play Next</span>
                                <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">Add to queue after current</p>
                            </div>
                        </button>

                        {/* Add to Favorites */}
                        {user && (
                            <button
                                onClick={handleLike}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${isLiked
                                    ? 'text-rose-400 bg-rose-500/10'
                                    : 'text-[var(--foreground)] hover:bg-rose-500/10 hover:text-rose-400'
                                    }`}
                            >
                                <Heart size={16} className={isLiked ? 'fill-rose-400' : ''} />
                                <span className="font-medium">{isLiked ? 'Liked' : 'Add to Favorites'}</span>
                            </button>
                        )}

                        {/* Add to Playlist */}
                        {user && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
                            >
                                <ListPlus size={16} className="text-purple-400" />
                                <span className="font-medium">Add to Playlist</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
