/**
 * API Router — routes requests to the JioSaavn backend.
 */

export const JIOSAAVN_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const API_VERSION = '1.0.0';

/**
 * Build a full URL for a JioSaavn/general API endpoint.
 * Use for: /api/search, /api/songs, /api/albums, /api/artists, etc.
 */
export function saavnUrl(path: string): string {
    const base = JIOSAAVN_API.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
}

/**
 * Detect if a song object came from YouTube (not JioSaavn).
 * Removed support for YouTube to favor JioSaavn's speed and cost-effectiveness.
 */
export function isYouTubeSong(song: any): boolean {
    return false;
}

/**
 * Fix download URL paths — Proxes JioSaavn CDN links to fix CORS issues.
 */
export function resolveAudioUrl(song: any, audioUrl: string): string {
    if (!audioUrl) return '';
    
    if (audioUrl.startsWith('http')) {
        const isSaavnCDN = audioUrl.includes('saavncdn.com') || audioUrl.includes('jiosaavn.com');
        if (isSaavnCDN) {
            const base = JIOSAAVN_API.replace(/\/$/, '');
            return `${base}/api/audio/proxy?url=${encodeURIComponent(audioUrl)}`;
        }
        return audioUrl;
    }

    const path = audioUrl.startsWith('/') ? audioUrl : `/${audioUrl}`;
    const base = JIOSAAVN_API.replace(/\/$/, '');
    return `${base}${path}`;
}

/**
 * YouTube backend support removed.
 */
export function warmupYTBackend(): void {
    // No-op
}
