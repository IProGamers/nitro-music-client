/**
 * IndexedDB utility for offline music storage
 * Stores song metadata and audio blobs locally in the browser
 */

const DB_NAME = 'nitro_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_songs';

export interface OfflineSong {
    id: string;
    name: string;
    artist: string;
    album?: string;
    image: string;
    audioBlob: Blob;
    downloadedAt: Date;
    size: number; // bytes
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('IndexedDB not available on server'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
            }
        };
    });

    return dbPromise;
}

/**
 * Save a song with its audio blob to IndexedDB
 */
export async function saveSong(song: Omit<OfflineSong, 'downloadedAt' | 'size'>, audioBlob: Blob): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const offlineSong: OfflineSong = {
            ...song,
            audioBlob,
            downloadedAt: new Date(),
            size: audioBlob.size
        };

        const request = store.put(offlineSong);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get a song from IndexedDB by ID
 */
export async function getSong(id: string): Promise<OfflineSong | null> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Delete a song from IndexedDB
 */
export async function deleteSong(id: string): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get all downloaded songs (metadata only, without blobs for performance)
 */
export async function getAllDownloads(): Promise<Omit<OfflineSong, 'audioBlob'>[]> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            // Return without audioBlob to save memory
            const songs = request.result.map(({ audioBlob, ...rest }: OfflineSong) => rest);
            resolve(songs);
        };
    });
}

/**
 * Get all downloaded song IDs (for quick lookup)
 */
export async function getDownloadedIds(): Promise<Set<string>> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(new Set(request.result.map(String)));
    });
}

/**
 * Get total storage used by offline songs
 */
export async function getStorageUsage(): Promise<{ used: number; count: number }> {
    const downloads = await getAllDownloads();
    const used = downloads.reduce((acc, song) => acc + (song.size || 0), 0);
    return { used, count: downloads.length };
}

/**
 * Clear all offline songs
 */
export async function clearAllDownloads(): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Check if a song is downloaded
 */
export async function isSongDownloaded(id: string): Promise<boolean> {
    const song = await getSong(id);
    return song !== null;
}
