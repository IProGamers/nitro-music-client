"use client"
import { useState, useRef, useEffect, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import {
    ListEnd, Play, Heart, ListPlus, MoreVertical, X,
    User, Disc, Share2, Radio, Copy, Check, Download, Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOffline } from '@/context/OfflineContext';

interface SongContextMenuProps {
    song: any;
    queue?: any[];
    children?: React.ReactNode;
    className?: string;
    onStartRadio?: (song: any) => void;
}

const decodeHtml = (html: string): string => {
    if (!html || typeof window === 'undefined') return html || '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

export default function SongContextMenu({ song, queue, children, className = '', onStartRadio }: SongContextMenuProps) {
    const { playTrack, playNext, addToQueue } = usePlayer();
    const { user, addLikedSong, isLikedSong } = useAuth();
    const { isDownloaded, downloadSong, removeSong, isDownloading, currentDownloadId } = useOffline();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [copied, setCopied] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [useFixedPosition, setUseFixedPosition] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
                setUseFixedPosition(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Right-click handler (desktop)
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setUseFixedPosition(true);
        setIsOpen(true);
    }, []);

    const handlePlayNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        playNext(song);
        setIsOpen(false);
    };

    const handleAddToQueue = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToQueue(song);
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

    const handleGoToArtist = (e: React.MouseEvent) => {
        e.stopPropagation();
        const artistId = song.artists?.primary?.[0]?.id || song.primaryArtistsId?.split(',')[0];
        if (artistId) {
            router.push(`/artist/${artistId}`);
        }
        setIsOpen(false);
    };

    const handleGoToAlbum = (e: React.MouseEvent) => {
        e.stopPropagation();
        const albumId = song.album?.id || song.albumId;
        if (albumId) {
            router.push(`/album/${albumId}`);
        }
        setIsOpen(false);
    };

    const handleStartRadio = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onStartRadio) {
            onStartRadio(song);
        }
        setIsOpen(false);
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const songName = song.name || song.title || 'song';
        const artistName = song.artists?.primary?.[0]?.name || song.artist || 'Unknown';
        const shareText = `🎵 Listening to "${songName}" by ${artistName} on Nitro Music!`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: songName,
                    text: shareText,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
        setIsOpen(false);
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUseFixedPosition(false);
        setIsOpen(!isOpen);
    };

    const getArtistName = () => {
        return song.artists?.primary?.[0]?.name || song.artist || 'Unknown';
    };

    const menuContent = (
        <div className={`${useFixedPosition ? 'fixed' : 'absolute right-0 top-full mt-1'} z-[100] min-w-[220px] bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}
            style={useFixedPosition ? { left: menuPosition.x, top: menuPosition.y } : undefined}
        >
            {/* Header with song info */}
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--background)]/50">
                <p className="text-xs font-bold text-[var(--foreground)] truncate">
                    {song.name || song.title}
                </p>
                <p className="text-[10px] text-[var(--foreground-muted)] truncate mt-0.5">
                    {getArtistName()}
                </p>
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

                {/* Play Next */}
                <button
                    onClick={handlePlayNext}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                >
                    <ListEnd size={16} className="text-emerald-400" />
                    <span className="font-medium">Play Next</span>
                </button>

                {/* Add to Queue */}
                <button
                    onClick={handleAddToQueue}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                >
                    <ListPlus size={16} className="text-blue-400" />
                    <span className="font-medium">Add to Queue</span>
                </button>

                {/* Divider */}
                <div className="h-px bg-[var(--border)] my-1" />

                {/* Start Radio */}
                {onStartRadio && (
                    <button
                        onClick={handleStartRadio}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                    >
                        <Radio size={16} className="text-orange-400" />
                        <span className="font-medium">Start Radio</span>
                    </button>
                )}

                {/* Add to Favorites */}
                {user && (
                    <button
                        onClick={handleLike}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${isLiked
                            ? 'text-rose-400 bg-rose-500/10'
                            : 'text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                            }`}
                    >
                        <Heart size={16} className={isLiked ? 'fill-rose-400' : ''} />
                        <span className="font-medium">{isLiked ? 'Liked' : 'Add to Favorites'}</span>
                    </button>
                )}

                {/* Divider */}
                <div className="h-px bg-[var(--border)] my-1" />

                {/* Download for Offline */}
                {(() => {
                    const songId = String(song.id || song.songId);
                    const downloaded = isDownloaded(songId);
                    const downloading = isDownloading && currentDownloadId === songId;

                    return (
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (downloaded) {
                                    await removeSong(songId);
                                } else if (!downloading) {
                                    await downloadSong(song);
                                }
                                setIsOpen(false);
                            }}
                            disabled={downloading}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${downloaded
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                                } ${downloading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {downloading ? (
                                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            ) : downloaded ? (
                                <Trash2 size={16} className="text-red-400" />
                            ) : (
                                <Download size={16} className="text-cyan-400" />
                            )}
                            <span className="font-medium">
                                {downloading ? 'Downloading...' : downloaded ? 'Remove Download' : 'Download Offline'}
                            </span>
                        </button>
                    );
                })()}

                {/* Go to Artist */}
                <button
                    onClick={handleGoToArtist}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                >
                    <User size={16} className="text-purple-400" />
                    <span className="font-medium">Go to Artist</span>
                </button>

                {/* Go to Album */}
                {(song.album?.id || song.albumId) && (
                    <button
                        onClick={handleGoToAlbum}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                    >
                        <Disc size={16} className="text-amber-400" />
                        <span className="font-medium">Go to Album</span>
                    </button>
                )}

                {/* Share */}
                <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={16} className="text-green-400" />
                            <span className="font-medium text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Share2 size={16} className="text-cyan-400" />
                            <span className="font-medium">Share</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            onContextMenu={handleContextMenu}
        >
            {/* Children with right-click support */}
            {children}

            {/* Trigger Button (for mobile / click) */}
            <button
                onClick={toggleMenu}
                className="p-1.5 rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all active:scale-90"
                title="More options"
            >
                <MoreVertical size={18} />
            </button>

            {/* Context Menu */}
            {isOpen && (
                <div ref={menuRef}>
                    {menuContent}
                </div>
            )}
        </div>
    );
}
