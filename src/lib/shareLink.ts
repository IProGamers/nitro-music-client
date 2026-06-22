// Shareable song links — self-contained, expiring, no account required.
//
// A share link encodes the song (id + display fields) and an expiry timestamp
// directly into a URL-safe token, so anyone with the link can play the song —
// even people without a Nitro account. There's no server record to revoke; the
// link simply stops working once `exp` passes (default 3 hours).

export interface SharePayload {
    id: string;   // song id used to fetch the stream from the public API
    n: string;    // song name
    a: string;    // artist
    img: string;  // cover image url
    exp: number;  // expiry — epoch milliseconds
}

// Unicode-safe base64url (song names/artists contain non-ASCII characters).
const toB64Url = (s: string): string => {
    const b64 = typeof window === 'undefined'
        ? Buffer.from(s, 'utf-8').toString('base64')
        : btoa(unescape(encodeURIComponent(s)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64Url = (s: string): string => {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const raw = b64 + pad;
    return typeof window === 'undefined'
        ? Buffer.from(raw, 'base64').toString('utf-8')
        : decodeURIComponent(escape(atob(raw)));
};

/** Build an expiring token for a song. `hours` defaults to 3 (within the 2–4h window). */
export function createShareToken(
    song: { id: string; n: string; a: string; img: string },
    hours = 3
): string {
    const payload: SharePayload = {
        id: song.id,
        n: song.n,
        a: song.a,
        img: song.img,
        exp: Date.now() + hours * 60 * 60 * 1000,
    };
    return toB64Url(JSON.stringify(payload));
}

/** Decode a token back to its payload, or null if it's malformed. */
export function decodeShareToken(token: string): SharePayload | null {
    try {
        const obj = JSON.parse(fromB64Url(token));
        if (!obj || typeof obj.id !== 'string' || typeof obj.exp !== 'number') return null;
        return obj as SharePayload;
    } catch {
        return null;
    }
}

/** True once the link has passed its expiry time. */
export function isShareExpired(payload: SharePayload): boolean {
    return Date.now() > payload.exp;
}

/** Full playable URL for a token (client-side only — uses window.origin). */
export function buildShareUrl(token: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/play/${token}`;
}

/** Friendly "expires in …" label for a payload. */
export function expiresInLabel(payload: SharePayload): string {
    const ms = payload.exp - Date.now();
    if (ms <= 0) return 'Expired';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}
