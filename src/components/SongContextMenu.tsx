"use client"
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSheet } from '@/hooks/useSheet';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import {
    ListEnd, Play, Heart, ListPlus, MoreVertical,
    User, Disc, Share2, Radio, Check, Download, MinusCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOffline } from '@/context/OfflineContext';

interface SongContextMenuProps {
    song: any;
    queue?: any[];
    children?: React.ReactNode;
    className?: string;
    onStartRadio?: (song: any) => void;
    // When provided, shows a "Remove from this playlist" action (the delete-music button).
    onRemoveFromPlaylist?: () => void;
}

const decodeHtml = (html: string): string => {
    if (!html || typeof window === 'undefined') return html || '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

export default function SongContextMenu({ song, queue, children, className = '', onStartRadio, onRemoveFromPlaylist }: SongContextMenuProps) {
    const { playTrack, playNext, addToQueue } = usePlayer();
    const { user, addLikedSong, removeLikedSong, isLikedSong } = useAuth();
    const { isDownloaded, downloadSong, removeSong, isDownloading, currentDownloadId } = useOffline();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [copied, setCopied] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [useFixedPosition, setUseFixedPosition] = useState(false); // desktop right-click → positioned dropdown
    const menuRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const check = async () => {
            if (song && user) {
                const liked = await isLikedSong(String(song.id || song.songId));
                setIsLiked(liked);
            }
        };
        check();
    }, [song, user, isLikedSong]);

    // Outside-click only applies to the desktop right-click dropdown (the sheet has its own backdrop).
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setUseFixedPosition(false);
            }
        };
        if (isOpen && useFixedPosition) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, useFixedPosition]);

    const close = () => { setIsOpen(false); setUseFixedPosition(false); };

    // Bottom-sheet slide for the tap menu (the right-click dropdown stays instant).
    const sheet = useSheet(isOpen && !useFixedPosition, () => { });

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setUseFixedPosition(true);
        setIsOpen(true);
    }, []);

    const handlePlayNext = (e: React.MouseEvent) => { e.stopPropagation(); playNext(song); close(); };
    const handleAddToQueue = (e: React.MouseEvent) => { e.stopPropagation(); addToQueue(song); close(); };
    const handlePlayNow = (e: React.MouseEvent) => { e.stopPropagation(); playTrack(song, queue || [song]); close(); };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        try {
            if (isLiked) {
                await removeLikedSong(String(song.id || song.songId));
                setIsLiked(false);
            } else {
                await addLikedSong({
                    id: String(song.id || song.songId),
                    name: song.name || song.title || 'Unknown',
                    artist: song.artists?.primary?.[0]?.name || song.artist || 'Unknown',
                    image: typeof song.image === 'string' ? song.image : song.image?.[song.image.length - 1]?.url || ''
                });
                setIsLiked(true);
            }
        } catch (e) { console.error("Failed to toggle like:", e); }
        close();
    };

    const handleGoToArtist = (e: React.MouseEvent) => {
        e.stopPropagation();
        const artistId = song.artists?.primary?.[0]?.id || song.primaryArtistsId?.split(',')[0];
        if (artistId) router.push(`/artist/${artistId}`);
        close();
    };

    const handleGoToAlbum = (e: React.MouseEvent) => {
        e.stopPropagation();
        const albumId = song.album?.id || song.albumId;
        if (albumId) router.push(`/album/${albumId}`);
        close();
    };

    const handleStartRadio = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onStartRadio) onStartRadio(song);
        close();
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const songName = song.name || song.title || 'song';
        const artistName = song.artists?.primary?.[0]?.name || song.artist || 'Unknown';
        const shareText = `🎵 Listening to "${songName}" by ${artistName} on Nitro Music!`;
        try {
            if (navigator.share) {
                await navigator.share({ title: songName, text: shareText, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(shareText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) { console.error('Share failed:', err); }
        close();
    };

    const toggleMenu = (e: React.MouseEvent) => { e.stopPropagation(); setUseFixedPosition(false); setIsOpen(o => !o); };

    const getArtistName = () => decodeHtml(song.artists?.primary?.[0]?.name || song.artist || 'Unknown');
    const getImage = (): string => {
        const img = song.image;
        if (typeof img === 'string') return img;
        if (Array.isArray(img) && img.length) return img[img.length - 1]?.url || img[img.length - 1]?.link || '';
        return '';
    };

    const itemCls = 'w-full flex items-center gap-3.5 px-4 md:py-2.5 py-3 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors';
    const iconCls = 'text-[var(--foreground-muted)] shrink-0';
    const songId = String(song.id || song.songId);
    const downloaded = isDownloaded(songId);
    const downloading = isDownloading && currentDownloadId === songId;

    // Shared menu body (header + items) used by both the sheet and the dropdown.
    const body = (
        <>
            {/* Song header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                {getImage() ? (
                    <img src={getImage()} alt="" className="w-11 h-11 rounded-md object-cover shrink-0 bg-[var(--surface-hover)]" />
                ) : (
                    <div className="w-11 h-11 rounded-md bg-[var(--surface-hover)] shrink-0" />
                )}
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{decodeHtml(song.name || song.title)}</p>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">{getArtistName()}</p>
                </div>
            </div>

            <div className="py-1">
                <button onClick={handlePlayNow} className={itemCls}><Play size={17} className={iconCls} /><span className="font-medium">Play now</span></button>
                <button onClick={handlePlayNext} className={itemCls}><ListEnd size={17} className={iconCls} /><span className="font-medium">Play next</span></button>
                <button onClick={handleAddToQueue} className={itemCls}><ListPlus size={17} className={iconCls} /><span className="font-medium">Add to queue</span></button>

                <div className="h-px bg-[var(--border)] my-1" />

                {onStartRadio && (
                    <button onClick={handleStartRadio} className={itemCls}><Radio size={17} className={iconCls} /><span className="font-medium">Start radio</span></button>
                )}
                {user && (
                    <button onClick={handleLike} className={itemCls}>
                        <Heart size={17} className={isLiked ? 'fill-rose-400 text-rose-400 shrink-0' : iconCls} />
                        <span className="font-medium">{isLiked ? 'Remove from Liked' : 'Add to Liked Songs'}</span>
                    </button>
                )}
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (downloaded) await removeSong(songId);
                        else if (!downloading) await downloadSong(song);
                        close();
                    }}
                    disabled={downloading}
                    className={`${itemCls} ${downloading ? 'opacity-50 cursor-wait' : ''}`}
                >
                    {downloading ? (
                        <div className="w-4 h-4 border-2 border-[var(--foreground-muted)] border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : downloaded ? (
                        <Check size={17} className="text-emerald-400 shrink-0" />
                    ) : (
                        <Download size={17} className={iconCls} />
                    )}
                    <span className="font-medium">{downloading ? 'Downloading…' : downloaded ? 'Downloaded' : 'Download'}</span>
                </button>

                <div className="h-px bg-[var(--border)] my-1" />

                <button onClick={handleGoToArtist} className={itemCls}><User size={17} className={iconCls} /><span className="font-medium">Go to artist</span></button>
                {(song.album?.id || song.albumId) && (
                    <button onClick={handleGoToAlbum} className={itemCls}><Disc size={17} className={iconCls} /><span className="font-medium">Go to album</span></button>
                )}
                <button onClick={handleShare} className={itemCls}>
                    {copied ? <><Check size={17} className="text-emerald-400 shrink-0" /><span className="font-medium">Copied link</span></>
                        : <><Share2 size={17} className={iconCls} /><span className="font-medium">Share</span></>}
                </button>

                {onRemoveFromPlaylist && (
                    <>
                        <div className="h-px bg-[var(--border)] my-1" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemoveFromPlaylist(); close(); }}
                            className="w-full flex items-center gap-3.5 px-4 md:py-2.5 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                            <MinusCircle size={17} className="shrink-0" />
                            <span className="font-medium">Remove from this playlist</span>
                        </button>
                    </>
                )}
            </div>
        </>
    );

    return (
        <div ref={containerRef} className={`relative ${className}`} onContextMenu={handleContextMenu}>
            {children}

            <button
                onClick={toggleMenu}
                className="p-1.5 rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all active:scale-90"
                title="More options"
            >
                <MoreVertical size={18} />
            </button>

            {/* Desktop right-click → positioned dropdown */}
            {isOpen && useFixedPosition && (
                <div
                    ref={menuRef}
                    className="fixed z-[1000] min-w-[240px] max-w-[calc(100vw-16px)] max-h-[80vh] overflow-y-auto bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl shadow-2xl ring-1 ring-black/40 animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        left: Math.min(menuPosition.x, (typeof window !== 'undefined' ? window.innerWidth : 0) - 256),
                        top: Math.min(menuPosition.y, (typeof window !== 'undefined' ? window.innerHeight : 0) - 360),
                    }}
                >
                    {body}
                </div>
            )}

            {/* Tap → bottom sheet (mobile) / centered card (desktop) */}
            {sheet.render && (
                <div
                    className={`fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center transition-opacity duration-300 ${sheet.show ? 'opacity-100' : 'opacity-0'}`}
                    onClick={(e) => { e.stopPropagation(); close(); }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full md:w-[360px] max-h-[85vh] overflow-y-auto bg-[var(--surface-hover)] border border-[var(--border)] rounded-t-3xl md:rounded-2xl shadow-2xl transition-transform duration-300 ease-out pb-[env(safe-area-inset-bottom)] ${sheet.show ? 'translate-y-0' : 'translate-y-full'}`}
                    >
                        <div className="md:hidden w-9 h-1 rounded-full bg-[var(--surface-hover)] mx-auto mt-2.5 mb-1" />
                        {body}
                    </div>
                </div>
            )}
        </div>
    );
}
