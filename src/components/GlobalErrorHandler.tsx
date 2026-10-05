'use client';

import { useEffect } from 'react';

/**
 * GlobalErrorHandler intercepts benign browser runtime aborts
 * (e.g., Firestore snapshot unmount, fetch cancellations when navigating,
 * or user aborting a request) so Next.js's dev overlay doesn't crash the UI.
 */
export default function GlobalErrorHandler() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event?.reason;
            const message = reason?.message || String(reason || '');
            const name = reason?.name || '';

            if (
                name === 'AbortError' ||
                message.includes('aborted') ||
                message.includes('The user aborted a request') ||
                message.includes('signal is aborted') ||
                message.includes('Failed to fetch')
            ) {
                // Prevent Next.js error modal from popping up for cancelled requests
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };

        const handleError = (event: ErrorEvent) => {
            const message = event?.message || '';
            if (
                message.includes('aborted') ||
                message.includes('AbortError') ||
                message.includes('ResizeObserver loop')
            ) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
        window.addEventListener('error', handleError, true);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
            window.removeEventListener('error', handleError, true);
        };
    }, []);

    return null;
}
