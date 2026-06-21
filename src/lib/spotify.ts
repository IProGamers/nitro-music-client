// Spotify playlist IMPORT (onboarding) — metadata only, NO streaming.
//
// Uses Authorization Code + PKCE, which needs NO client secret, so the whole flow
// runs safely in the browser (public client). We only request read scopes and use
// the access token for a single import session (no refresh token persistence).
//
// Imported tracks are matched against our own JioSaavn catalog; playback always
// stays on JioSaavn. Tracks not found in our catalog are reported, never streamed
// from Spotify.

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const SCOPES = ['playlist-read-private', 'playlist-read-collaborative', 'user-library-read'];
const VERIFIER_KEY = 'nitro_spotify_verifier';
const TOKEN_KEY = 'nitro_spotify_token';

export const isSpotifyConfigured = (): boolean => !!CLIENT_ID;

const getRedirectUri = (): string =>
    typeof window !== 'undefined' ? `${window.location.origin}/spotify/callback` : '';

// ---- PKCE helpers ----
const randomString = (len: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(len));
    return Array.from(values, v => chars[v % chars.length]).join('');
};

const sha256 = async (plain: string): Promise<ArrayBuffer> => {
    const data = new TextEncoder().encode(plain);
    return crypto.subtle.digest('SHA-256', data);
};

const base64url = (buf: ArrayBuffer): string => {
    let str = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** Begin the OAuth flow: build the authorize URL and stash the PKCE verifier. */
export const beginSpotifyAuth = async (): Promise<string> => {
    const verifier = randomString(64);
    const challenge = base64url(await sha256(verifier));
    sessionStorage.setItem(VERIFIER_KEY, verifier);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: getRedirectUri(),
        scope: SCOPES.join(' '),
        code_challenge_method: 'S256',
        code_challenge: challenge,
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

/** Exchange the returned ?code= for an access token (called on the callback page). */
export const exchangeSpotifyCode = async (code: string): Promise<string> => {
    const verifier = sessionStorage.getItem(VERIFIER_KEY) || '';
    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: verifier,
    });
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!res.ok) throw new Error(`Spotify token exchange failed (${res.status})`);
    const data = await res.json();
    const token = data.access_token as string;
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
    sessionStorage.removeItem(VERIFIER_KEY);
    return token;
};

export const getStoredSpotifyToken = (): string | null => {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
};

export const clearSpotifyToken = () => {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

// ---- Spotify Web API reads ----
const spotifyGet = async (token: string, url: string): Promise<any> => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) throw new Error('SPOTIFY_UNAUTHORIZED');
    if (!res.ok) throw new Error(`Spotify API error (${res.status})`);
    return res.json();
};

export interface SpotifyPlaylist {
    id: string;
    name: string;
    trackCount: number;
    image: string | null;
    owner: string;
}

export interface SpotifyTrack {
    name: string;
    artist: string;
    album: string;
    durationSec: number;
}

/** All of the user's playlists (paginated). */
export const getSpotifyPlaylists = async (token: string): Promise<SpotifyPlaylist[]> => {
    const out: SpotifyPlaylist[] = [];
    let url: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50';
    while (url) {
        const data = await spotifyGet(token, url);
        for (const p of data.items || []) {
            if (!p) continue;
            out.push({
                id: p.id,
                name: p.name,
                trackCount: p.tracks?.total || 0,
                image: p.images?.[0]?.url || null,
                owner: p.owner?.display_name || '',
            });
        }
        url = data.next;
    }
    return out;
};

const mapTrack = (t: any): SpotifyTrack | null => {
    if (!t) return null;
    return {
        name: t.name || '',
        artist: (t.artists || []).map((a: any) => a.name).join(', '),
        album: t.album?.name || '',
        durationSec: Math.round((t.duration_ms || 0) / 1000),
    };
};

/** All tracks in a Spotify playlist (paginated, 100/page). */
export const getSpotifyPlaylistTracks = async (token: string, playlistId: string): Promise<SpotifyTrack[]> => {
    const out: SpotifyTrack[] = [];
    let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    while (url) {
        const data = await spotifyGet(token, url);
        for (const item of data.items || []) {
            const tr = mapTrack(item?.track);
            if (tr && tr.name) out.push(tr);
        }
        url = data.next;
    }
    return out;
};

/** The user's Liked Songs (paginated). */
export const getSpotifyLikedTracks = async (token: string): Promise<SpotifyTrack[]> => {
    const out: SpotifyTrack[] = [];
    let url: string | null = 'https://api.spotify.com/v1/me/tracks?limit=50';
    while (url) {
        const data = await spotifyGet(token, url);
        for (const item of data.items || []) {
            const tr = mapTrack(item?.track);
            if (tr && tr.name) out.push(tr);
        }
        url = data.next;
    }
    return out;
};

// ---- Catalog matching (Spotify track -> our JioSaavn catalog) ----
const norm = (s: string): string =>
    (s || '').toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Find the best matching song in OUR catalog for a Spotify track.
 * Scores on title + primary artist + duration (±3s). Returns the JioSaavn song
 * object if confidence is high enough, else null (caller marks it unavailable).
 */
export const matchInCatalog = async (track: SpotifyTrack): Promise<any | null> => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const q = `${track.name} ${track.artist}`.trim();
        const res = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(q)}&limit=8`);
        if (!res.ok) return null;
        const data = await res.json();
        const results: any[] = data?.data?.results || [];
        if (results.length === 0) return null;

        const wantTitle = norm(track.name);
        const wantArtist = norm(track.artist.split(',')[0] || '');

        let best: { song: any; score: number } | null = null;
        for (const s of results) {
            const sTitle = norm(s.name || s.title || '');
            const sArtist = norm(s.artists?.primary?.[0]?.name || s.primaryArtists || s.artist || '');
            let score = 0;
            if (sTitle === wantTitle) score += 50;
            else if (sTitle.includes(wantTitle) || wantTitle.includes(sTitle)) score += 30;
            if (wantArtist && (sArtist.includes(wantArtist) || wantArtist.includes(sArtist))) score += 30;
            const dur = Number(s.duration || 0);
            if (dur && track.durationSec && Math.abs(dur - track.durationSec) <= 3) score += 15;
            else if (dur && track.durationSec && Math.abs(dur - track.durationSec) <= 8) score += 7;
            if (!best || score > best.score) best = { song: s, score };
        }

        // Require a reasonable confidence (title + at least artist or duration support).
        return best && best.score >= 60 ? best.song : null;
    } catch {
        return null;
    }
};
