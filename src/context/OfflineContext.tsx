"use client"
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    saveSong,
    getSong,
    deleteSong,
    getAllDownloads,
    getDownloadedIds,
    getStorageUsage,
    clearAllDownloads,
    type OfflineSong
} from '@/lib/offlineDb';
import { ytStreamUrl } from '@/lib/source';


interface DownloadedSongMeta {
    id: string;
    name: string;
    artist: string;
    album?: string;
    image: string;
    downloadedAt: Date;
    size: number;
}

interface OfflineContextType {
    downloads: DownloadedSongMeta[];
    downloadedIds: Set<string>;
    isDownloaded: (id: string) => boolean;
    downloadSong: (song: any) => Promise<void>;
    downloadPlaylist: (songs: any[], playlistName: string) => Promise<void>;
    removeSong: (id: string) => Promise<void>;
    clearAllDownloads: () => Promise<void>;
    getOfflineAudioUrl: (id: string) => Promise<string | null>;
    downloadProgress: number; // 0-100
    isDownloading: boolean;
    currentDownloadId: string | null;
    playlistDownloadProgress: { current: number; total: number; name: string } | null;
    storageUsed: number; // bytes
    storageLimit: number; // bytes
    refreshDownloads: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
    const [downloads, setDownloads] = useState<DownloadedSongMeta[]>([]);
    const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [currentDownloadId, setCurrentDownloadId] = useState<string | null>(null);
    const [storageUsed, setStorageUsed] = useState(0);
    const [playlistDownloadProgress, setPlaylistDownloadProgress] = useState<{ current: number; total: number; name: string } | null>(null);

    // Unlimited offline downloads for every user. There is NO app-level cap on the
    // number of songs or total bytes (-1 = unlimited). The only ceiling is the
    // browser's own IndexedDB quota, which we expand below by requesting persistent
    // storage so users can keep downloading without hitting eviction limits.
    const storageLimit = -1;

    // Load downloads on mount + request persistent storage so the browser grants a
    // much larger quota and stops evicting downloaded audio. This is what previously
    // made downloads stop "after a limit" once the default best-effort quota filled.
    useEffect(() => {
        refreshDownloads();

        if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
            navigator.storage.persisted?.().then((already) => {
                if (!already) {
                    navigator.storage.persist().catch(() => { /* non-fatal */ });
                }
            }).catch(() => { /* non-fatal */ });
        }
    }, []);

    const refreshDownloads = useCallback(async () => {
        try {
            const [allDownloads, ids, storage] = await Promise.all([
                getAllDownloads(),
                getDownloadedIds(),
                getStorageUsage()
            ]);
            setDownloads(allDownloads as DownloadedSongMeta[]);
            setDownloadedIds(ids);
            setStorageUsed(storage.used);
        } catch (err) {
            console.error('Failed to load offline downloads:', err);
        }
    }, []);

    const isDownloaded = useCallback((id: string) => {
        return downloadedIds.has(id);
    }, [downloadedIds]);

    const downloadSong = useCallback(async (song: any) => {
        const songId = String(song.id);

        // Already downloaded
        if (downloadedIds.has(songId)) return;

        // No app-level download cap: users may download an unlimited number of songs.

        setIsDownloading(true);
        setCurrentDownloadId(songId);
        setDownloadProgress(0);

        try {
            // Resolve the audio URL. YouTube songs stream through our YouTube proxy
            // (absolute URL on the YT host) — never the relative /api/youtube/stream
            // path, which would resolve against the client origin and 404.
            let audioUrl = song.audioUrl;
            if (!audioUrl && song.downloadUrl?.length) {
                audioUrl = song.downloadUrl[song.downloadUrl.length - 1]?.url ||
                    song.downloadUrl[song.downloadUrl.length - 1]?.link;
            }
            if (!audioUrl) {
                // If song object has no direct download URL, query song detail by ID
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                try {
                    const detailRes = await fetch(`${apiUrl}/api/songs/${songId}`);
                    const detailData = await detailRes.json();
                    if (detailData?.success && detailData.data?.length) {
                        const dSong = detailData.data[0];
                        audioUrl = dSong.downloadUrl?.[dSong.downloadUrl.length - 1]?.url ||
                            dSong.downloadUrl?.[dSong.downloadUrl.length - 1]?.link;
                    }
                } catch { /* ignore fallback error */ }
            }

            if (!audioUrl) {
                throw new Error('No audio URL available for this song');
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
            let fetchUrl = audioUrl;
            if (isProduction || apiUrl.includes('vercel') || apiUrl.includes('netlify')) {
                fetchUrl = `${apiUrl}/api/audio/proxy?url=${encodeURIComponent(audioUrl)}`;
            }

            // Fetch audio with progress tracking
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error('Failed to fetch audio');

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Failed to read audio stream');

            const chunks: Uint8Array[] = [];
            let received = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                received += value.length;

                if (total > 0) {
                    setDownloadProgress(Math.round((received / total) * 100));
                }
            }

            // Create blob from chunks
            const audioBlob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });

            // Get image URL
            let image = '';
            if (typeof song.image === 'string') {
                image = song.image;
            } else if (song.image?.length) {
                image = song.image[song.image.length - 1]?.url || song.image[song.image.length - 1]?.link || '';
            }

            // Get artist name
            let artist = 'Unknown Artist';
            if (song.artists?.primary?.length) {
                artist = song.artists.primary[0].name;
            } else if (song.artist) {
                artist = song.artist;
            } else if (song.primaryArtists) {
                artist = song.primaryArtists;
            }

            // 1. Save to IndexedDB for in-app offline listening
            await saveSong({
                id: songId,
                name: song.name || song.title || 'Unknown',
                artist,
                album: song.album?.name || song.album || undefined,
                image,
                audioBlob
            }, audioBlob);

            // 2. Trigger browser download to device storage (.mp3)
            try {
                const blobUrl = URL.createObjectURL(audioBlob);
                const a = document.createElement('a');
                a.href = blobUrl;
                const safeName = (song.name || song.title || 'song').replace(/[\\/:*?"<>|]/g, '');
                const safeArtist = artist.replace(/[\\/:*?"<>|]/g, '');
                a.download = `${safeArtist} - ${safeName}.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            } catch (dlErr) {
                console.warn('Browser file download trigger error:', dlErr);
            }

            // Refresh downloads list
            await refreshDownloads();
            setDownloadProgress(100);

        } catch (err) {
            console.error('Download failed:', err);
            throw err;
        } finally {
            setIsDownloading(false);
            setCurrentDownloadId(null);
            setDownloadProgress(0);
        }
    }, [downloadedIds, refreshDownloads]);

    const removeSongHandler = useCallback(async (id: string) => {
        try {
            await deleteSong(id);
            await refreshDownloads();
        } catch (err) {
            console.error('Failed to remove download:', err);
            throw err;
        }
    }, [refreshDownloads]);

    const clearAllHandler = useCallback(async () => {
        try {
            await clearAllDownloads();
            await refreshDownloads();
        } catch (err) {
            console.error('Failed to clear downloads:', err);
            throw err;
        }
    }, [refreshDownloads]);

    const getOfflineAudioUrl = useCallback(async (id: string): Promise<string | null> => {
        try {
            const song = await getSong(id);
            if (song?.audioBlob) {
                return URL.createObjectURL(song.audioBlob);
            }
            return null;
        } catch (err) {
            console.error('Failed to get offline audio:', err);
            return null;
        }
    }, []);

    // Download entire playlist
    const downloadPlaylist = useCallback(async (songs: any[], playlistName: string) => {
        if (!songs || songs.length === 0) {
            throw new Error('No songs to download');
        }

        // Filter out already downloaded songs
        const songsToDownload = songs.filter(song => !downloadedIds.has(String(song.id)));

        if (songsToDownload.length === 0) {
            console.log('All songs already downloaded');
            return;
        }

        setPlaylistDownloadProgress({ current: 0, total: songsToDownload.length, name: playlistName });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < songsToDownload.length; i++) {
            const song = songsToDownload[i];
            setPlaylistDownloadProgress({ current: i + 1, total: songsToDownload.length, name: playlistName });

            try {
                await downloadSong(song);
                successCount++;
            } catch (err) {
                console.error(`Failed to download song ${song.name}:`, err);
                failCount++;
                // Continue with next song instead of stopping
            }
        }

        setPlaylistDownloadProgress(null);
        console.log(`Playlist download complete: ${successCount} succeeded, ${failCount} failed`);
    }, [downloadedIds, downloadSong]);

    return (
        <OfflineContext.Provider value={{
            downloads,
            downloadedIds,
            isDownloaded,
            downloadSong,
            downloadPlaylist,
            removeSong: removeSongHandler,
            clearAllDownloads: clearAllHandler,
            getOfflineAudioUrl,
            downloadProgress,
            isDownloading,
            currentDownloadId,
            playlistDownloadProgress,
            storageUsed,
            storageLimit: storageLimit,
            refreshDownloads
        }}>
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
}
