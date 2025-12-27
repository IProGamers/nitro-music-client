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

const MAX_STORAGE_MB = 500; // Maximum storage limit in MB
const MAX_STORAGE_BYTES = MAX_STORAGE_MB * 1024 * 1024;

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
    removeSong: (id: string) => Promise<void>;
    clearAllDownloads: () => Promise<void>;
    getOfflineAudioUrl: (id: string) => Promise<string | null>;
    downloadProgress: number; // 0-100
    isDownloading: boolean;
    currentDownloadId: string | null;
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

    // Load downloads on mount
    useEffect(() => {
        refreshDownloads();
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

        // Check storage
        if (storageUsed >= MAX_STORAGE_BYTES) {
            throw new Error('Storage limit reached. Please remove some downloads.');
        }

        setIsDownloading(true);
        setCurrentDownloadId(songId);
        setDownloadProgress(0);

        try {
            // Get audio URL
            let audioUrl = song.audioUrl;
            if (!audioUrl && song.downloadUrl?.length) {
                // Use highest quality available
                audioUrl = song.downloadUrl[song.downloadUrl.length - 1]?.url ||
                    song.downloadUrl[song.downloadUrl.length - 1]?.link;
            }

            if (!audioUrl) {
                throw new Error('No audio URL available for this song');
            }

            // Fetch audio with progress tracking
            const response = await fetch(audioUrl);
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

            // Save to IndexedDB
            await saveSong({
                id: songId,
                name: song.name || song.title || 'Unknown',
                artist,
                album: song.album?.name || song.album || undefined,
                image,
                audioBlob
            }, audioBlob);

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
    }, [downloadedIds, storageUsed, refreshDownloads]);

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

    return (
        <OfflineContext.Provider value={{
            downloads,
            downloadedIds,
            isDownloaded,
            downloadSong,
            removeSong: removeSongHandler,
            clearAllDownloads: clearAllHandler,
            getOfflineAudioUrl,
            downloadProgress,
            isDownloading,
            currentDownloadId,
            storageUsed,
            storageLimit: MAX_STORAGE_BYTES,
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
