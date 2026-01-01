// Service Worker Registration for Nitro Music PWA

type Config = {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onOffline?: () => void;
    onOnline?: () => void;
};

export function register(config?: Config): void {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
        // Wait for page to load
        window.addEventListener('load', () => {
            const swUrl = '/sw.js';

            registerValidSW(swUrl, config);

            // Listen for online/offline events
            window.addEventListener('online', () => {
                console.log('[PWA] Back online');
                config?.onOnline?.();
            });

            window.addEventListener('offline', () => {
                console.log('[PWA] Gone offline');
                config?.onOffline?.();
            });
        });
    }
}

async function registerValidSW(swUrl: string, config?: Config): Promise<void> {
    try {
        const registration = await navigator.serviceWorker.register(swUrl);

        console.log('[PWA] Service Worker registered successfully');

        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                        // New content is available, notify user
                        console.log('[PWA] New content available, please refresh');
                        config?.onUpdate?.(registration);
                    } else {
                        // Content is cached for offline use
                        console.log('[PWA] Content cached for offline use');
                        config?.onSuccess?.(registration);
                    }
                }
            };
        };
    } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
    }
}

export function unregister(): void {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.unregister();
        });
    }
}

// Check if the app can work offline
export function isOfflineReady(): Promise<boolean> {
    return new Promise((resolve) => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                resolve(registration.active !== null);
            }).catch(() => resolve(false));
        } else {
            resolve(false);
        }
    });
}

// Get the current network status
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Force update the service worker
export function update(): void {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.update();
        });
    }
}

// Skip waiting and activate new service worker
export function skipWaiting(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('skipWaiting');
    }
}
