/**
 * API Cache Utility - Production Safe
 * High-performance caching layer for API responses
 * Uses IndexedDB with localStorage fallback
 * Includes comprehensive error handling for production stability
 */

const CACHE_DB_NAME = 'nitro_api_cache';
const CACHE_STORE_NAME = 'responses';
const CACHE_VERSION = 1;

// Get today's date string for cache invalidation (changes daily)
export const getTodayKey = (): string => {
    const today = new Date();
    return `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
};

// Cache TTL configurations (in milliseconds)
// Shorter TTLs ensure fresh content; daily key ensures variety
export const CACHE_TTL = {
    TRENDING: 5 * 60 * 1000,          // 5 minutes for trending
    SEARCH: 15 * 60 * 1000,           // 15 minutes for search results  
    ARTIST: 30 * 60 * 1000,           // 30 minutes for artist data
    ALBUM: 30 * 60 * 1000,            // 30 minutes for album data
    HOME_DATA: 10 * 60 * 1000,        // 10 minutes for home page
    PROFILE: 5 * 60 * 1000,           // 5 minutes for profile
    MODULES: 15 * 60 * 1000,          // 15 minutes for modules
    HISTORY: 2 * 60 * 1000,           // 2 minutes for history
};

interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
}

// In-memory fallback cache for when IndexedDB/localStorage fail
const memoryCache = new Map<string, CacheEntry>();

// Check if IndexedDB is available
const isIndexedDBAvailable = (): boolean => {
    try {
        return typeof window !== 'undefined' &&
            typeof indexedDB !== 'undefined' &&
            indexedDB !== null;
    } catch {
        return false;
    }
};

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
    try {
        if (typeof window === 'undefined') return false;
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
};

// Open IndexedDB connection with timeout
let dbPromise: Promise<IDBDatabase> | null = null;
let dbFailed = false;

const getDB = (): Promise<IDBDatabase> => {
    if (typeof window === 'undefined' || dbFailed) {
        return Promise.reject('IndexedDB not available');
    }

    if (!isIndexedDBAvailable()) {
        dbFailed = true;
        return Promise.reject('IndexedDB not available');
    }

    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(CACHE_DB_NAME, CACHE_VERSION);

                // Timeout after 3 seconds
                const timeout = setTimeout(() => {
                    dbFailed = true;
                    reject('IndexedDB timeout');
                }, 3000);

                request.onerror = () => {
                    clearTimeout(timeout);
                    dbFailed = true;
                    reject(request.error);
                };

                request.onsuccess = () => {
                    clearTimeout(timeout);
                    resolve(request.result);
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
                    }
                };
            } catch (err) {
                dbFailed = true;
                reject(err);
            }
        });
    }
    return dbPromise;
};

// Generate cache key from URL (safe version)
// If dailyKey is true, includes today's date so cache automatically refreshes daily
export const getCacheKey = (url: string, dailyKey = false): string => {
    try {
        const baseKey = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 140);
        return dailyKey ? `${getTodayKey()}_${baseKey}` : baseKey;
    } catch {
        return 'unknown_' + Date.now();
    }
};

// Set cache entry (with all fallbacks)
export const setCache = async (key: string, data: any, ttl: number): Promise<void> => {
    const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl
    };

    // Always set in memory cache first (fastest)
    memoryCache.set(key, entry);

    // Try IndexedDB
    try {
        const db = await getDB();
        const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CACHE_STORE_NAME);
        store.put({ key, ...entry });
        // Don't await - fire and forget for performance
    } catch {
        // IndexedDB failed, try localStorage
        if (isLocalStorageAvailable()) {
            try {
                // Only store smaller items in localStorage (< 100KB)
                const dataStr = JSON.stringify(entry);
                if (dataStr.length < 100000) {
                    localStorage.setItem(`cache_${key}`, dataStr);
                }
            } catch {
                // localStorage also failed, but we still have memory cache
            }
        }
    }
};

// Get cache entry (checks all levels)
export const getCache = async <T = any>(key: string): Promise<T | null> => {
    const now = Date.now();

    // Check memory cache first (fastest)
    const memEntry = memoryCache.get(key);
    if (memEntry && (now - memEntry.timestamp < memEntry.ttl)) {
        return memEntry.data as T;
    }

    // Try IndexedDB
    try {
        const db = await getDB();
        const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
        const store = tx.objectStore(CACHE_STORE_NAME);

        return new Promise((resolve) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const entry = request.result;
                if (entry && (now - entry.timestamp < entry.ttl)) {
                    // Also update memory cache
                    memoryCache.set(key, entry);
                    resolve(entry.data as T);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => resolve(null);
        });
    } catch {
        // IndexedDB failed, try localStorage
        if (isLocalStorageAvailable()) {
            try {
                const stored = localStorage.getItem(`cache_${key}`);
                if (stored) {
                    const entry: CacheEntry = JSON.parse(stored);
                    if (now - entry.timestamp < entry.ttl) {
                        memoryCache.set(key, entry);
                        return entry.data as T;
                    }
                }
            } catch {
                // Ignore errors
            }
        }
        return null;
    }
};

/**
 * Fetch with cache - The main function to use
 * Production-safe with all error handling
 */
export const fetchWithCache = async <T = any>(
    url: string,
    ttl: number = CACHE_TTL.SEARCH,
    options?: {
        forceRefresh?: boolean;
        staleWhileRevalidate?: boolean;
        dailyKey?: boolean; // If true, cache refreshes automatically each day
    }
): Promise<T> => {
    const { forceRefresh = false, staleWhileRevalidate = true, dailyKey = false } = options || {};
    const cacheKey = getCacheKey(url, dailyKey);

    // Try to get from cache first (unless forcing refresh)
    if (!forceRefresh) {
        try {
            const cached = await getCache<T>(cacheKey);
            if (cached !== null) {
                // If stale-while-revalidate is enabled, refresh in background
                if (staleWhileRevalidate) {
                    // Fire and forget background refresh
                    fetch(url)
                        .then(res => res.json())
                        .then(data => {
                            if (data && data.success !== false) {
                                setCache(cacheKey, data, ttl);
                            }
                        })
                        .catch(() => { /* Ignore background refresh errors */ });
                }
                return cached;
            }
        } catch {
            // Cache read failed, continue to fetch
        }
    }

    // Fetch fresh data
    const response = await fetch(url);
    const data = await response.json();

    // Cache the response (fire and forget)
    if (data && data.success !== false) {
        setCache(cacheKey, data, ttl).catch(() => { });
    }

    return data;
};

/**
 * Prefetch URLs in the background
 */
export const prefetch = (urls: string[], ttl: number = CACHE_TTL.SEARCH): void => {
    if (typeof window === 'undefined') return;

    const prefetchUrl = (url: string) => {
        fetchWithCache(url, ttl, { staleWhileRevalidate: false })
            .catch(() => { /* Ignore prefetch errors */ });
    };

    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
        urls.forEach(url => {
            (window as any).requestIdleCallback(() => prefetchUrl(url), { timeout: 5000 });
        });
    } else {
        // Fallback for Safari
        setTimeout(() => urls.forEach(prefetchUrl), 100);
    }
};

/**
 * Preload critical data after initial render
 */
export const preloadCriticalData = (): void => {
    if (typeof window === 'undefined') return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    prefetch([`${apiUrl}/api/modules`], CACHE_TTL.MODULES);
};

/**
 * Clear all caches (useful for logout)
 */
export const clearAllCache = async (): Promise<void> => {
    memoryCache.clear();

    try {
        const db = await getDB();
        const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
        tx.objectStore(CACHE_STORE_NAME).clear();
    } catch { }

    if (isLocalStorageAvailable()) {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
            keys.forEach(k => localStorage.removeItem(k));
        } catch { }
    }
};
