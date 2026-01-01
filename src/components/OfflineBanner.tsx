'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Download, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [showRetry, setShowRetry] = useState(false);

    useEffect(() => {
        // Check initial status
        setIsOffline(!navigator.onLine);

        const handleOnline = () => {
            setIsOffline(false);
            setShowRetry(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setDismissed(false);
            // Show retry button after a few seconds
            setTimeout(() => setShowRetry(true), 3000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    if (!isOffline || dismissed) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] animate-slideDown">
            <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm text-white px-4 py-3 shadow-lg">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full">
                            <WifiOff className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">You're Offline</p>
                            <p className="text-xs text-white/80">
                                Listen to your downloaded music while offline
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/downloads"
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 
                                     hover:bg-white/30 rounded-full text-sm font-medium 
                                     transition-all duration-200"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">My Downloads</span>
                        </Link>

                        {showRetry && (
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 px-4 py-2 bg-white 
                                         text-amber-600 hover:bg-white/90 rounded-full 
                                         text-sm font-medium transition-all duration-200"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline">Retry</span>
                            </button>
                        )}

                        <button
                            onClick={() => setDismissed(true)}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

export default OfflineBanner;
