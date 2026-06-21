import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const NAMED_ENTITIES: Record<string, string> = {
    quot: '"', apos: "'", amp: '&', lt: '<', gt: '>', nbsp: ' ',
    '#39': "'", '#34': '"', '#038': '&', '#160': ' ',
};

/**
 * Decode HTML entities in API-provided text (e.g. JioSaavn returns titles like
 * `PERFECT (From &quot;Sunny&quot;)`). SSR-safe — pure string work, no DOM — so it
 * can be used anywhere a song/album/artist name is displayed.
 */
export function decodeHtml(text: unknown): string {
    if (text == null) return '';
    let s = String(text);
    if (s.indexOf('&') === -1) return s;
    s = s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code: string) => {
        if (code[0] === '#') {
            const num = code[1] === 'x' || code[1] === 'X'
                ? parseInt(code.slice(2), 16)
                : parseInt(code.slice(1), 10);
            return Number.isFinite(num) ? String.fromCodePoint(num) : match;
        }
        const named = NAMED_ENTITIES[code.toLowerCase()];
        return named !== undefined ? named : match;
    });
    return s;
}

type TrackLike = {
    id?: string;
    songId?: string;
    name?: string;
    title?: string;
    artist?: string;
    primaryArtists?: string;
    artists?: { primary?: Array<{ name?: string }> };
};

export function getTrackArtistName(track: TrackLike): string {
    if (!track) return 'Unknown';
    if (track.artists?.primary?.[0]?.name) return track.artists.primary[0].name;
    if (typeof track.artist === 'string' && track.artist) return track.artist;
    if (track.primaryArtists) return track.primaryArtists;
    return 'Unknown';
}

export function getTrackImageUrl(track: any): string {
    if (!track) return '';
    if (Array.isArray(track.image) && track.image.length) {
        return track.image[track.image.length - 1]?.url || track.image[track.image.length - 1]?.link || '';
    }
    if (typeof track.image === 'string') return track.image;
    return '';
}

export function normalizeTrackId(track: TrackLike): string {
    return String(track?.id || track?.songId || '');
}

export function normalizeTrack(raw: any) {
    const images = Array.isArray(raw.image) ? raw.image : [];
    const bestImg = images[images.length - 1]?.url || images[images.length - 1]?.link || (typeof raw.image === 'string' ? raw.image : '');
    const primaryArtists: Array<{ id: string; name: string }> = (raw.artists?.primary || []).map((a: any) => ({ id: String(a.id || ''), name: String(a.name || '') }));
    return {
        id: String(raw.id || raw.songId || ''),
        name: raw.name || raw.title || '',
        artist: primaryArtists[0]?.name || raw.primaryArtists || raw.artist || 'Unknown',
        album: raw.album?.name || raw.album || '',
        image: bestImg,
        audioUrl: raw.audioUrl || raw.downloadUrl?.[raw.downloadUrl.length - 1]?.url || '',
        duration: raw.duration ? Number(raw.duration) : undefined,
        playCount: raw.playCount ? Number(raw.playCount) : undefined,
        downloadUrl: raw.downloadUrl,
        artists: primaryArtists.length ? { primary: primaryArtists } : undefined,
        language: raw.language,
        year: raw.year,
        label: raw.label,
    };
}
