// Nitro Music Service Worker v2 - Aggressive Pre-caching for Full Offline Support
const CACHE_NAME = 'nitro-music-v3';
const RUNTIME_CACHE = 'nitro-runtime-v3';
const OFFLINE_URL = '/offline.html'; // Static HTML fallback

// ========================================
// ALL PAGES TO PRE-CACHE AUTOMATICALLY
// User only needs to visit ONCE and entire app is cached!
// ========================================
const PAGES_TO_PRECACHE = [
    '/',
    '/offline',
    '/downloads',
    '/search',
    '/history',
    '/playlists',
    '/profile',
    '/settings',
    '/upgrade',
    '/features',
    '/recent',
    '/podcasts',
];

// Static assets that must be cached (these always work offline)
const STATIC_ASSETS = [
    '/offline.html', // Critical: static fallback page
    '/manifest.json',
    '/logo.png',
    '/favicon.ico',
];

// Combine all precache items
const PRECACHE_URLS = [...PAGES_TO_PRECACHE, ...STATIC_ASSETS];

// ========================================
// INSTALL - Pre-cache EVERYTHING
// ========================================
self.addEventListener('install', (event) => {
    console.log('[SW] 🚀 Installing Service Worker v2...');

    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            console.log('[SW] 📦 Pre-caching all pages and assets...');

            // Cache each URL individually to handle failures gracefully
            const cachePromises = PRECACHE_URLS.map(async (url) => {
                try {
                    const response = await fetch(url, {
                        credentials: 'same-origin',
                        redirect: 'follow'
                    });
                    if (response.ok) {
                        await cache.put(url, response);
                        console.log('[SW] ✅ Cached:', url);
                    }
                } catch (error) {
                    console.log('[SW] ⚠️ Failed to cache:', url, error.message);
                }
            });

            await Promise.all(cachePromises);
            console.log('[SW] 🎉 Pre-caching complete!');

            // Skip waiting to activate immediately
            await self.skipWaiting();
        })()
    );
});

// ========================================
// ACTIVATE - Clean old caches & take control
// ========================================
self.addEventListener('activate', (event) => {
    console.log('[SW] ⚡ Activating Service Worker v2...');

    event.waitUntil(
        (async () => {
            // Delete old caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => {
                        console.log('[SW] 🗑️ Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );

            // Take control of ALL pages immediately
            await self.clients.claim();

            // Tell all open pages that SW is ready
            const clients = await self.clients.matchAll({ type: 'window' });
            clients.forEach(client => {
                client.postMessage({ type: 'SW_READY', version: 'v2' });
            });

            console.log('[SW] ✅ Service Worker v2 is now active and controlling all pages!');

            // Start background pre-caching of dynamic content
            backgroundPrecache();
        })()
    );
});

// ========================================
// BACKGROUND PRE-CACHE - Cache more in background
// ========================================
async function backgroundPrecache() {
    console.log('[SW] 🔄 Starting background pre-cache...');

    try {
        const cache = await caches.open(RUNTIME_CACHE);

        // Additional pages to cache in background (lower priority)
        const backgroundUrls = [
            '/arihant',
            '/auth',
        ];

        for (const url of backgroundUrls) {
            try {
                const response = await fetch(url, { credentials: 'same-origin' });
                if (response.ok) {
                    await cache.put(url, response);
                    console.log('[SW] 🔄 Background cached:', url);
                }
            } catch (e) {
                // Silently fail for background caching
            }
        }
    } catch (error) {
        console.log('[SW] Background pre-cache error:', error);
    }
}

// ========================================
// FETCH - Smart caching strategy
// ========================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests (API calls to other domains)
    if (url.hostname !== self.location.hostname) return;

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) return;

    // Handle the request
    event.respondWith(handleRequest(request, url));
});

async function handleRequest(request, url) {
    const isNavigation = request.mode === 'navigate';
    const isApiRequest = url.pathname.startsWith('/api');

    // API requests: Network only (no caching)
    if (isApiRequest) {
        try {
            return await fetch(request);
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Offline' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Navigation requests (HTML pages): Network first, fallback to cache
    if (isNavigation) {
        return handleNavigationRequest(request);
    }

    // Static assets (JS, CSS, images): Cache first, update in background
    return handleStaticRequest(request, url);
}

async function handleNavigationRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache the fresh response
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed - try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[SW] 📱 Serving from cache:', request.url);
            return cachedResponse;
        }

        // Try the offline page
        const offlineResponse = await caches.match(OFFLINE_URL);
        if (offlineResponse) {
            return offlineResponse;
        }

        // Ultimate fallback
        return createOfflineFallback();
    }
}

async function handleStaticRequest(request, url) {
    // Check cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Serve from cache but update in background (stale-while-revalidate)
        updateCacheInBackground(request);
        return cachedResponse;
    }

    // Not in cache - fetch from network
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok && shouldCache(url.pathname)) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Return placeholder for images
        if (request.destination === 'image') {
            return createImagePlaceholder();
        }
        throw error;
    }
}

function updateCacheInBackground(request) {
    fetch(request)
        .then((response) => {
            if (response.ok) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, response);
                });
            }
        })
        .catch(() => { /* Ignore errors */ });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function shouldCache(pathname) {
    // Cache all Next.js static assets
    if (pathname.startsWith('/_next/')) return true;

    // Cache common file extensions
    const cacheExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.webp'];
    return cacheExtensions.some(ext => pathname.endsWith(ext));
}

function createOfflineFallback() {
    return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Nitro Music</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                    padding: 20px;
                }
                .container { max-width: 400px; }
                .icon { font-size: 80px; margin-bottom: 20px; }
                h1 { font-size: 28px; margin-bottom: 10px; }
                p { color: #888; margin-bottom: 30px; line-height: 1.6; }
                a {
                    display: inline-block;
                    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
                    color: white;
                    padding: 16px 32px;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                a:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3); }
                .reload {
                    margin-top: 20px;
                    background: transparent;
                    border: 2px solid #333;
                    color: #888;
                }
                .reload:hover { border-color: #8b5cf6; color: white; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">🎵</div>
                <h1>You're Offline</h1>
                <p>Don't worry! Your downloaded music is still available. Tap below to listen to your offline library.</p>
                <a href="/downloads">🎧 My Downloads</a>
                <br>
                <a href="javascript:location.reload()" class="reload">🔄 Try Again</a>
            </div>
        </body>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

function createImagePlaceholder() {
    return new Response(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
            <rect fill="#1a1a2e" width="200" height="200"/>
            <text x="100" y="100" text-anchor="middle" fill="#444" font-size="14" font-family="system-ui">Offline</text>
        </svg>
    `, {
        headers: { 'Content-Type': 'image/svg+xml' }
    });
}

// ========================================
// MESSAGE HANDLER - Communication with app
// ========================================
self.addEventListener('message', (event) => {
    const { data } = event;

    if (data === 'skipWaiting' || data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (data === 'clearCache' || data.type === 'CLEAR_CACHE') {
        Promise.all([
            caches.delete(CACHE_NAME),
            caches.delete(RUNTIME_CACHE)
        ]).then(() => {
            console.log('[SW] 🗑️ All caches cleared');
            event.source?.postMessage({ type: 'CACHE_CLEARED' });
        });
    }

    if (data.type === 'PRECACHE_PAGE') {
        // Allow app to request specific pages to be cached
        caches.open(CACHE_NAME).then(cache => {
            fetch(data.url).then(response => {
                if (response.ok) {
                    cache.put(data.url, response);
                    console.log('[SW] 📦 On-demand cached:', data.url);
                }
            });
        });
    }

    if (data.type === 'GET_CACHE_STATUS') {
        // Report cache status to app
        Promise.all([
            caches.open(CACHE_NAME).then(c => c.keys()),
            caches.open(RUNTIME_CACHE).then(c => c.keys())
        ]).then(([mainKeys, runtimeKeys]) => {
            event.source?.postMessage({
                type: 'CACHE_STATUS',
                mainCache: mainKeys.length,
                runtimeCache: runtimeKeys.length,
                total: mainKeys.length + runtimeKeys.length
            });
        });
    }
});

// ========================================
// INITIALIZATION LOG
// ========================================
console.log('[SW] 🎵 Nitro Music Service Worker v2 loaded!');
console.log('[SW] 📋 Will pre-cache:', PRECACHE_URLS.length, 'URLs');
