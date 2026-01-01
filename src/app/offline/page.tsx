'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Download, Music2, RefreshCw, Home, Headphones } from 'lucide-react';
import Link from 'next/link';
import { getAllDownloads } from '@/lib/offlineDb';

interface DownloadedSong {
    id: string;
    name: string;
    artist: string;
    image: string;
}

export default function OfflinePage() {
    const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSong[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load downloaded songs
        loadDownloads();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadDownloads = async () => {
        try {
            const songs = await getAllDownloads();
            setDownloadedSongs(songs.slice(0, 6)); // Show first 6
        } catch (error) {
            console.error('Error loading downloads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center space-y-8">
                {/* Animated Icon */}
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse" />
                    <div className="absolute inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="absolute inset-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <WifiOff className="w-10 h-10 text-gray-400" />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-white">
                        You're Offline
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Don't worry! Your downloaded music is still available.
                    </p>
                </div>

                {/* Downloaded Songs Preview */}
                {!isLoading && downloadedSongs.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold flex items-center gap-2">
                                <Headphones className="w-5 h-5 text-purple-400" />
                                Your Downloads
                            </h2>
                            <span className="text-sm text-gray-400">
                                {downloadedSongs.length} song{downloadedSongs.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {downloadedSongs.map((song) => (
                                <div key={song.id} className="group relative">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                                        {song.image ? (
                                            <img
                                                src={song.image}
                                                alt={song.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Music2 className="w-8 h-8 text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                        {song.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/downloads"
                        className="flex items-center justify-center gap-3 px-8 py-4 
                                 bg-gradient-to-r from-purple-600 to-pink-600 
                                 hover:from-purple-500 hover:to-pink-500 
                                 text-white rounded-xl font-semibold text-lg
                                 transition-all duration-300 transform hover:scale-105
                                 shadow-lg shadow-purple-500/25"
                    >
                        <Download className="w-5 h-5" />
                        Listen to Downloads
                    </Link>

                    {isOnline && (
                        <button
                            onClick={handleRetry}
                            className="flex items-center justify-center gap-3 px-8 py-4 
                                     bg-white/10 hover:bg-white/20 text-white 
                                     rounded-xl font-semibold text-lg
                                     transition-all duration-300 border border-white/20"
                        >
                            <Home className="w-5 h-5" />
                            Go Home
                        </button>
                    )}

                    {!isOnline && (
                        <button
                            onClick={handleRetry}
                            className="flex items-center justify-center gap-3 px-8 py-4 
                                     bg-white/10 hover:bg-white/20 text-white 
                                     rounded-xl font-semibold text-lg
                                     transition-all duration-300 border border-white/20"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Retry Connection
                        </button>
                    )}
                </div>

                {/* Tips */}
                <div className="text-sm text-gray-500 space-y-2">
                    <p>💡 Tip: Download your favorite songs while online to enjoy them offline!</p>
                </div>

                {/* Nitro Logo */}
                <div className="pt-8 opacity-50">
                    <p className="text-gray-600 text-sm">Nitro Music</p>
                </div>
            </div>

            {/* Background Animation */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
        </div>
    );
}
