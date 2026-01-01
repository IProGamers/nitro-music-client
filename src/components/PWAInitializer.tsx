'use client';

import { useEffect, useState } from 'react';
import { Download, CheckCircle, RefreshCw } from 'lucide-react';

export function PWAInitializer() {
    const [status, setStatus] = useState<'idle' | 'installing' | 'ready' | 'update'>('idle');
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            console.log('[PWA] Service Workers not supported');
            return;
        }

        registerServiceWorker();

        // Listen for SW messages
        navigator.serviceWorker.addEventListener('message', handleSWMessage);

        return () => {
            navigator.serviceWorker.removeEventListener('message', handleSWMessage);
        };
    }, []);

    const handleSWMessage = (event: MessageEvent) => {
        const { data } = event;

        if (data.type === 'SW_READY') {
            console.log('[PWA] Service Worker ready!', data.version);
            setStatus('ready');
            // Show brief success notification
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        }

        if (data.type === 'CACHE_STATUS') {
            console.log('[PWA] Cache Status:', data.total, 'items cached');
        }
    };

    const registerServiceWorker = async () => {
        try {
            console.log('[PWA] Registering Service Worker...');

            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none' // Always check for updates
            });

            console.log('[PWA] Service Worker registered with scope:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                console.log('[PWA] New Service Worker installing...');
                setStatus('installing');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New version available
                            console.log('[PWA] New version available!');
                            setStatus('update');
                            setShowNotification(true);
                        } else {
                            // First install
                            console.log('[PWA] App cached for offline use!');
                            setStatus('ready');
                            setShowNotification(true);
                            setTimeout(() => setShowNotification(false), 4000);
                        }
                    }
                });
            });

            // If SW is already active
            if (registration.active) {
                console.log('[PWA] Service Worker already active');
                setStatus('ready');
            }

            // Trigger immediate update on every page load (will use cache if offline)
            registration.update().catch(() => { });

        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
        }
    };

    const handleUpdate = () => {
        // Skip waiting and reload to get new version
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    };

    const handleDismiss = () => {
        setShowNotification(false);
    };

    // Show update notification
    if (status === 'update' && showNotification) {
        return (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-fadeIn">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">New version available!</span>
                    <button
                        onClick={handleUpdate}
                        className="bg-white text-purple-600 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Update
                    </button>
                </div>
            </div>
        );
    }

    // Show first-time cached notification
    if (status === 'ready' && showNotification) {
        return (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-fadeIn">
                <div
                    onClick={handleDismiss}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                >
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">✨ App ready for offline use!</span>
                </div>
            </div>
        );
    }

    // Show installing progress
    if (status === 'installing') {
        return (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999]">
                <div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                    <Download className="w-5 h-5 animate-pulse" />
                    <span className="text-sm font-medium">Caching app for offline...</span>
                </div>
            </div>
        );
    }

    return null;
}

export default PWAInitializer;
