'use client';

import React, { useState, useEffect } from 'react';
import { useOffline } from '@/context/OfflineContext';
import { usePlayer } from '@/context/PlayerContext';
import {
    Download, Music2, Play, Pause, Trash2,
    HardDrive, WifiOff, Loader2, Infinity as InfinityIcon,
    ArrowLeft, Search, ListMusic
} from 'lucide-react';
import Link from 'next/link';

function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DownloadsPage() {
    const {
        downloads,
        removeSong,
        clearAllDownloads,
        storageUsed,
        storageLimit,
        playlistDownloadProgress
    } = useOffline();
    const { playTrack, currentSong, isPlaying } = usePlayer();
    const [searchQuery, setSearchQuery] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const filteredDownloads = downloads.filter(song =>
        song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePlay = (song: any) => {
        // Convert to track format for player
        const track = {
            id: song.id,
            name: song.name,
            artists: { primary: [{ name: song.artist }] },
            image: song.image,
            album: { name: song.album || '' },
            // The player will use getOfflineAudioUrl for downloaded songs
        };
        playTrack(track, downloads.map(d => ({
            id: d.id,
            name: d.name,
            artists: { primary: [{ name: d.artist }] },
            image: d.image,
            album: { name: d.album || '' },
        })));
    };

    const handleClearAll = async () => {
        await clearAllDownloads();
        setShowClearConfirm(false);
    };

    const isUnlimited = storageLimit === -1;
    const storagePercentage = isUnlimited
        ? 0
        : Math.min(100, (storageUsed / storageLimit) * 100);

    return (
        <div className="px-4 md:px-12 pt-4 pb-32 md:py-8 max-w-7xl mx-auto space-y-6">
            {/* Offline Banner */}
            {!isOnline && (
                <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-amber-200 text-sm">
                        You&apos;re offline. Your downloaded music is available below.
                    </p>
                </div>
            )}

            {/* Playlist Download Progress */}
            {playlistDownloadProgress && (
                <div className="bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                        <p className="text-cyan-200 text-sm font-medium truncate">
                            Downloading &quot;{playlistDownloadProgress.name}&quot; — {playlistDownloadProgress.current} of {playlistDownloadProgress.total}
                        </p>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${(playlistDownloadProgress.current / playlistDownloadProgress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Hero Header */}
            <header className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-cyan-500/10 via-[var(--card)] to-purple-500/10 p-6 md:p-8">
                {/* Decorative glow */}
                <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-purple-500/15 blur-3xl" />

                <div className="relative flex items-start gap-4">
                    <Link
                        href="/"
                        className="p-2 -ml-2 hover:bg-[var(--card-hover)] rounded-xl transition-colors md:hidden shrink-0"
                        aria-label="Back"
                    >
                        <ArrowLeft size={20} className="text-[var(--foreground)]" />
                    </Link>

                    <div className="hidden md:flex w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                        <Download className="w-9 h-9 text-black" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                            Offline Library
                        </p>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
                            Downloads
                        </h1>

                        {/* Stat chips */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <span className="inline-flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full px-3 py-1.5 text-sm">
                                <ListMusic className="w-4 h-4 text-cyan-400" />
                                <span className="font-semibold text-[var(--foreground)]">{downloads.length}</span>
                                <span className="text-[var(--foreground-muted)]">song{downloads.length !== 1 ? 's' : ''}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full px-3 py-1.5 text-sm">
                                <HardDrive className="w-4 h-4 text-purple-400" />
                                <span className="font-semibold text-[var(--foreground)]">{formatBytes(storageUsed)}</span>
                                <span className="text-[var(--foreground-muted)]">used</span>
                            </span>
                            {isUnlimited && (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5 text-sm text-emerald-300">
                                    <InfinityIcon className="w-4 h-4" />
                                    <span className="font-semibold">Unlimited</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Storage bar (only meaningful when a finite limit exists) */}
                {!isUnlimited && (
                    <div className="relative mt-6">
                        <div className="flex justify-between text-xs text-[var(--foreground-muted)] mb-1.5">
                            <span>{formatBytes(storageUsed)} used</span>
                            <span>{formatBytes(storageLimit)} total</span>
                        </div>
                        <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${storagePercentage > 90 ? 'bg-rose-500' :
                                    storagePercentage > 70 ? 'bg-amber-500' :
                                        'bg-gradient-to-r from-cyan-400 to-purple-500'
                                    }`}
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* Search & Actions */}
            {downloads.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search your downloads..."
                            className="w-full pl-12 pr-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50 focus:bg-[var(--card-hover)] transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="px-5 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-2xl font-semibold text-sm hover:bg-rose-500/20 transition-colors flex items-center gap-2 justify-center shrink-0"
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                </div>
            )}

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                            <Trash2 className="w-6 h-6 text-rose-400" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--foreground)]">Clear all downloads?</h3>
                        <p className="text-[var(--foreground-muted)] text-sm">
                            This removes all {downloads.length} downloaded song{downloads.length !== 1 ? 's' : ''} from this device. You can download them again anytime.
                        </p>
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 px-4 py-3 bg-[var(--card-hover)] text-[var(--foreground)] rounded-xl font-medium hover:bg-[var(--border-hover)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Songs List */}
            {filteredDownloads.length > 0 ? (
                <div className="space-y-1.5">
                    {filteredDownloads.map((song, idx) => {
                        const isCurrentSong = currentSong?.id === song.id;
                        const isThisPlaying = isCurrentSong && isPlaying;

                        return (
                            <div
                                key={song.id}
                                className={`group flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-2xl transition-all cursor-pointer border ${isCurrentSong
                                    ? 'bg-cyan-400/10 border-cyan-400/30'
                                    : 'bg-[var(--card)] border-transparent hover:bg-[var(--card-hover)] hover:border-[var(--border)]'
                                    }`}
                                onClick={() => handlePlay(song)}
                            >
                                {/* Index (desktop) */}
                                <span className="hidden md:flex w-6 justify-center text-sm text-[var(--foreground-muted)] tabular-nums group-hover:hidden">
                                    {idx + 1}
                                </span>
                                <span className="hidden md:group-hover:flex w-6 justify-center shrink-0">
                                    {isThisPlaying
                                        ? <Pause size={16} className="text-cyan-400" fill="currentColor" />
                                        : <Play size={16} className="text-[var(--foreground)]" fill="currentColor" />}
                                </span>

                                {/* Thumbnail with play overlay */}
                                <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shrink-0">
                                    {song.image ? (
                                        <img
                                            src={song.image}
                                            alt={song.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--surface-hover)] flex items-center justify-center">
                                            <Music2 className="w-6 h-6 text-[var(--foreground-muted)]" />
                                        </div>
                                    )}
                                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity md:hidden ${isCurrentSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {isThisPlaying
                                            ? <Pause size={20} className="text-white" fill="white" />
                                            : <Play size={20} className="text-white" fill="white" />}
                                    </div>
                                </div>

                                {/* Song Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold truncate ${isCurrentSong ? 'text-cyan-400' : 'text-[var(--foreground)]'}`}>
                                        {song.name}
                                    </p>
                                    <p className="text-sm text-[var(--foreground-muted)] truncate">
                                        {song.artist}
                                    </p>
                                </div>

                                {/* Size */}
                                <span className="text-xs text-[var(--foreground-muted)] tabular-nums hidden sm:block shrink-0">
                                    {formatBytes(song.size)}
                                </span>

                                {/* Remove button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeSong(song.id);
                                    }}
                                    aria-label={`Remove ${song.name} from downloads`}
                                    className="p-2 text-[var(--foreground-muted)] hover:text-rose-400 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-500/10 shrink-0"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--card)] to-[var(--surface)] border border-[var(--border)] rounded-3xl flex items-center justify-center">
                            <Download className="w-10 h-10 text-cyan-400" />
                        </div>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2">
                        {searchQuery ? 'No matches found' : 'No downloads yet'}
                    </h2>
                    <p className="text-[var(--foreground-muted)] max-w-sm">
                        {searchQuery
                            ? 'Try a different search term.'
                            : 'Save songs to listen offline anytime. Tap the download option on any song or playlist to get started.'}
                    </p>
                    {!searchQuery && (
                        <Link
                            href="/search"
                            className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-black rounded-xl font-bold uppercase tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <Search size={18} />
                            Browse Songs
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
