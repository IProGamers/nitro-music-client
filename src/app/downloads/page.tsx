'use client';

import React, { useState, useEffect } from 'react';
import { useOffline } from '@/context/OfflineContext';
import { usePlayer } from '@/context/PlayerContext';
import {
    Download, Music2, Play, Pause, Trash2,
    HardDrive, WifiOff, CheckCircle, Loader2,
    ArrowLeft, Search
} from 'lucide-react';
import Link from 'next/link';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
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
        isDownloading,
        currentDownloadId,
        downloadProgress,
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

    const storagePercentage = storageLimit === -1
        ? 0
        : Math.min(100, (storageUsed / storageLimit) * 100);

    return (
        <div className="px-4 md:px-12 pt-4 pb-32 md:py-8 max-w-7xl mx-auto space-y-8">
            {/* Offline Banner */}
            {!isOnline && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-amber-200 text-sm">
                        You're offline. Your downloaded music is available below.
                    </p>
                </div>
            )}

            {/* Playlist Download Progress */}
            {playlistDownloadProgress && (
                <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                        <p className="text-cyan-200 text-sm font-medium">
                            Downloading "{playlistDownloadProgress.name}" - Song {playlistDownloadProgress.current} of {playlistDownloadProgress.total}
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

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-[var(--card-hover)] rounded-xl transition-colors md:hidden">
                        <ArrowLeft size={20} className="text-[var(--foreground)]" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold text-[var(--foreground)] uppercase tracking-tighter">
                            Downloads
                        </h1>
                        <p className="text-[var(--foreground-muted)] text-sm mt-1">
                            {downloads.length} song{downloads.length !== 1 ? 's' : ''} saved for offline
                        </p>
                    </div>
                </div>

                {/* Storage Info */}
                <div className="flex items-center gap-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3">
                    <HardDrive className="w-5 h-5 text-[var(--foreground-muted)]" />
                    <div className="flex-1 min-w-[120px]">
                        <div className="flex justify-between text-xs text-[var(--foreground-muted)] mb-1">
                            <span>{formatBytes(storageUsed)}</span>
                            <span>{storageLimit === -1 ? 'Unlimited' : formatBytes(storageLimit)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${storagePercentage > 90 ? 'bg-rose-500' :
                                    storagePercentage > 70 ? 'bg-amber-500' :
                                        'bg-cyan-400'
                                    }`}
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search downloads..."
                        className="w-full pl-12 pr-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50"
                    />
                </div>
                {downloads.length > 0 && (
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="px-4 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-2xl font-medium text-sm hover:bg-rose-500/20 transition-colors flex items-center gap-2 justify-center"
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                )}
            </div>

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-xl font-bold text-[var(--foreground)]">Clear All Downloads?</h3>
                        <p className="text-[var(--foreground-muted)]">
                            This will remove all {downloads.length} downloaded songs. You'll need to download them again.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 px-4 py-3 bg-[var(--card-hover)] text-[var(--foreground)] rounded-xl font-medium hover:bg-[var(--border)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Songs List */}
            {filteredDownloads.length > 0 ? (
                <div className="space-y-2">
                    {filteredDownloads.map((song, idx) => {
                        const isCurrentSong = currentSong?.id === song.id;
                        const isThisDownloading = isDownloading && currentDownloadId === song.id;

                        return (
                            <div
                                key={song.id}
                                className={`group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer border ${isCurrentSong
                                    ? 'bg-cyan-400/10 border-cyan-400/30'
                                    : 'bg-[var(--card)] border-[var(--border)] hover:bg-[var(--card-hover)]'
                                    }`}
                                onClick={() => handlePlay(song)}
                            >
                                {/* Thumbnail with play overlay */}
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                                    {song.image ? (
                                        <img src={song.image} alt={song.name} className="w-full h-full object-cover" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}} />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--card-hover)] flex items-center justify-center">
                                            <Music2 className="w-6 h-6 text-[var(--foreground-muted)]" />
                                        </div>
                                    )}
                                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isCurrentSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        }`}>
                                        {isCurrentSong && isPlaying ? (
                                            <Pause size={20} className="text-white" fill="white" />
                                        ) : (
                                            <Play size={20} className="text-white" fill="white" />
                                        )}
                                    </div>
                                </div>

                                {/* Song Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold truncate ${isCurrentSong ? 'text-cyan-400' : 'text-[var(--foreground)]'}`}>
                                        {song.name}
                                    </p>
                                    <p className="text-sm text-[var(--foreground-muted)] truncate">
                                        {song.artist}
                                    </p>
                                </div>

                                {/* Downloaded indicator */}
                                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />

                                {/* Size */}
                                <span className="text-xs text-[var(--foreground-muted)] hidden sm:block">
                                    {formatBytes(song.size)}
                                </span>

                                {/* Remove button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeSong(song.id);
                                    }}
                                    className="p-2 text-[var(--foreground-muted)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-500/10"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-[var(--card)] rounded-full flex items-center justify-center mb-6">
                        <Download className="w-10 h-10 text-[var(--foreground-muted)]" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                        {searchQuery ? 'No matches found' : 'No downloads yet'}
                    </h2>
                    <p className="text-[var(--foreground-muted)] max-w-sm">
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Download songs to listen offline. Look for the download button on any song or playlist.'
                        }
                    </p>
                    {!searchQuery && (
                        <Link
                            href="/search"
                            className="mt-6 px-6 py-3 bg-cyan-400 text-black rounded-xl font-bold uppercase tracking-wide hover:bg-cyan-300 transition-colors"
                        >
                            Browse Songs
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
