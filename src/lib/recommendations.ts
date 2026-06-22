// Lightweight, client-side personalized recommendation engine.
//
// It learns a "taste profile" from what the user actually plays, likes, repeats
// and skips, and uses it to bias autoplay / next-song selection toward the
// artists, languages and popularity the user gravitates to — instead of picking
// the next track purely by name similarity (which produced remix/same-song spam).
//
// Everything is stored in localStorage so it works offline and needs no backend.
// It complements lib/discovery.ts (which reads the same signal store).

import { getArtistNameFromSong, normalizeSongTitle, createSongKey } from './searchUtils';
import { sourceUrl } from './source';
import { matchInCatalog } from './playlistImport';

const SIGNALS_KEY = 'nitro_discovery_signals';   // { [trackId]: { plays, skips, repeats, lastPlayed } }
const TASTE_KEY = 'nitro_taste_profile';         // { artists: {name:weight}, languages: {key:weight} }

type Signal = { plays: number; skips: number; repeats: number; lastPlayed: number };
type Signals = Record<string, Signal>;
type Taste = { artists: Record<string, number>; languages: Record<string, number>; moods: Record<string, number> };

const MOOD_RULES: Array<{ key: string; match: RegExp }> = [
    { key: 'party', match: /\b(party|dance|club|dj|remix|nach|bhangra|anthem|edm|beat)\b/i },
    { key: 'romantic', match: /\b(love|dil|ishq|pyaar|pyar|romantic|heart|sajna|mohabbat|tum)\b/i },
    { key: 'sad', match: /\b(sad|alone|cry|miss|broken|pain|judai|bewafa|tanha|tujhe)\b/i },
    { key: 'chill', match: /\b(lofi|lo-?fi|chill|relax|calm|acoustic|slow|soft|sukoon)\b/i },
    { key: 'energetic', match: /\b(rock|hard|power|hype|workout|gym|fire|swag|attitude)\b/i },
];

const detectMood = (song: any): string | null => {
    const hay = `${(song?.name || song?.title || '')} ${(song?.album?.name || song?.album || '')}`.toLowerCase();
    for (const rule of MOOD_RULES) {
        if (rule.match.test(hay)) return rule.key;
    }
    return null;
};

const LANGUAGE_RULES: Array<{ key: string; match: RegExp }> = [
    { key: 'punjabi', match: /\b(kudi|kudiyan|bhangra|nach|gabru|sajna|sardar|diljit|aujla|jatt|peg)\b/i },
    { key: 'hindi', match: /\b(dil|ishq|pyaar|pyar|tera|meri|mohabbat|safar|yaar|raataan|tum|hai)\b/i },
    { key: 'tamil', match: /\b(anbe|thalapathy|kollywood|kaadhal|uyire|vaa)\b/i },
    { key: 'telugu', match: /\b(tollywood|prema|nuvvu|sye|mass)\b/i },
    { key: 'english', match: /\b(love|night|summer|heart|dream|dance|party|baby|you|the)\b/i },
];

const readJSON = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
};

const writeJSON = (key: string, value: unknown) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota / private mode — ignore */ }
};

const trackId = (song: any): string => String(song?.songId || song?.id || '');

const detectLanguage = (song: any): string | null => {
    // Prefer an explicit language field when the API provides one.
    const explicit = (song?.language || '').toString().toLowerCase().trim();
    if (explicit) return explicit;
    const hay = `${normalizeSongTitle(song?.name || song?.title || '')} ${getArtistNameFromSong(song)}`.toLowerCase();
    for (const rule of LANGUAGE_RULES) {
        if (rule.match.test(hay)) return rule.key;
    }
    return null;
};

const bump = (map: Record<string, number>, key: string, by: number) => {
    if (!key) return;
    map[key] = (map[key] || 0) + by;
};

// Gentle exponential decay so taste tracks *recent* listening, not all-time.
const decay = (map: Record<string, number>, factor = 0.997) => {
    for (const k of Object.keys(map)) {
        map[k] *= factor;
        if (map[k] < 0.05) delete map[k];
    }
};

/** Record that a track started playing — strengthens the taste profile. */
export const recordListen = (song: any, opts?: { liked?: boolean }) => {
    if (!song) return;
    const id = trackId(song);
    const weight = opts?.liked ? 3 : 1;

    const signals = readJSON<Signals>(SIGNALS_KEY, {});
    const prev = signals[id] || { plays: 0, skips: 0, repeats: 0, lastPlayed: 0 };
    signals[id] = { ...prev, plays: prev.plays + 1, lastPlayed: Date.now() };
    writeJSON(SIGNALS_KEY, signals);

    const taste = readJSON<Taste>(TASTE_KEY, { artists: {}, languages: {}, moods: {} });
    if (!taste.moods) taste.moods = {};
    decay(taste.artists);
    decay(taste.languages);
    decay(taste.moods);
    const artist = getArtistNameFromSong(song).toLowerCase();
    if (artist && artist !== 'unknown artist') bump(taste.artists, artist, weight);
    const lang = detectLanguage(song);
    if (lang) bump(taste.languages, lang, weight);
    const mood = detectMood(song);
    if (mood) bump(taste.moods, mood, weight);
    writeJSON(TASTE_KEY, taste);
};

/** Record that the user skipped a track early — weakens that artist slightly. */
export const recordSkip = (song: any) => {
    if (!song) return;
    const id = trackId(song);
    const signals = readJSON<Signals>(SIGNALS_KEY, {});
    const prev = signals[id] || { plays: 0, skips: 0, repeats: 0, lastPlayed: 0 };
    signals[id] = { ...prev, skips: prev.skips + 1 };
    writeJSON(SIGNALS_KEY, signals);

    const taste = readJSON<Taste>(TASTE_KEY, { artists: {}, languages: {}, moods: {} });
    const artist = getArtistNameFromSong(song).toLowerCase();
    if (artist && taste.artists[artist]) {
        taste.artists[artist] = Math.max(0, taste.artists[artist] - 0.5);
    }
    writeJSON(TASTE_KEY, taste);
};

const rankedKeys = (map: Record<string, number>, limit: number): string[] =>
    Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([k]) => k);

export const getTasteProfile = (): { topArtists: string[]; topLanguages: string[]; topMoods: string[] } => {
    const taste = readJSON<Taste>(TASTE_KEY, { artists: {}, languages: {}, moods: {} });
    return {
        topArtists: rankedKeys(taste.artists, 6),
        topLanguages: rankedKeys(taste.languages, 2),
        topMoods: rankedKeys(taste.moods || {}, 2),
    };
};

/**
 * Build a set of search queries for autoplay that blend the seed song with the
 * user's learned taste. Earlier queries are stronger signals.
 */
export const buildAutoplayQueries = (seedSong: any): string[] => {
    const { topArtists, topLanguages } = getTasteProfile();
    const seedArtist = getArtistNameFromSong(seedSong).toLowerCase();
    const lang = topLanguages[0] || '';

    const queries: string[] = [];
    // 1) Same vibe as what's playing now
    if (seedArtist && seedArtist !== 'unknown artist') queries.push(seedArtist);
    // 2) The user's favourite artists (the personalization signal)
    topArtists.forEach(a => {
        if (a && a !== seedArtist) queries.push(a);
    });
    // 3) Favourite-language hits seeded by a top artist
    if (lang) queries.push(`${lang} ${topArtists[0] || ''} hits`.trim());
    // 4) Fallback to the seed track name
    const seedName = seedSong?.name || seedSong?.title || '';
    if (seedName) queries.push(seedName);

    // De-dupe while preserving order
    return Array.from(new Set(queries.filter(Boolean)));
};

/** Affinity score of a candidate track against the learned taste profile. */
export const scoreByTaste = (song: any): number => {
    const { topArtists, topLanguages, topMoods } = getTasteProfile();
    let score = 0;

    const artist = getArtistNameFromSong(song).toLowerCase();
    const ai = topArtists.indexOf(artist);
    if (ai >= 0) score += (topArtists.length - ai) * 12; // strong: a favourite artist

    const lang = detectLanguage(song);
    if (lang && topLanguages.includes(lang)) score += 15;

    // Mood match — recommend songs that fit the user's current listening mood.
    const mood = detectMood(song);
    if (mood && topMoods.includes(mood)) score += 10;

    // Mild popularity nudge so well-known tracks win ties
    const plays = Number(song?.playCount || song?.play_count || 0);
    if (plays > 0) score += Math.min(Math.log10(plays + 1) * 5, 25);

    // Penalise versions/remixes so we recommend the real track
    const raw = (song?.name || song?.title || '').toLowerCase();
    if (/\b(remix|cover|lo-?fi|slowed|reverb|sped\s*up|instrumental|karaoke)\b/.test(raw)) score -= 20;

    return score;
};

/**
 * Category pools for a diversified queue (Spotify-like): instead of one search
 * that returns near-identical tracks, fetch several intent buckets and blend them.
 * Returns [{ query, category, max }] — caller fetches each and caps per category.
 */
export const buildQueuePools = (seedSong: any): Array<{ query: string; category: string; max: number }> => {
    const { topArtists, topLanguages, topMoods } = getTasteProfile();
    const seedArtist = getArtistNameFromSong(seedSong).toLowerCase();
    const lang = topLanguages[0] || '';
    const mood = topMoods[0] || '';

    const pools: Array<{ query: string; category: string; max: number }> = [];

    // More tracks from the artist you're playing now
    if (seedArtist && seedArtist !== 'unknown artist') {
        pools.push({ query: `${seedArtist}`, category: 'same_artist', max: 4 });
    }
    // Up to two of YOUR favourite artists (skip the seed artist) for personalization
    const favs = topArtists.filter(a => a && a !== seedArtist).slice(0, 2);
    favs.forEach((fav, i) => pools.push({ query: `${fav}`, category: `favourite_${i}`, max: 3 }));

    // Same mood + language vibe (two angles for variety)
    if (mood || lang) pools.push({ query: `${lang} ${mood} songs`.trim(), category: 'mood', max: 4 });
    if (lang && mood) pools.push({ query: `best ${lang} ${mood}`.trim(), category: 'mood2', max: 3 });

    // Discovery so the queue doesn't feel closed (current year, never stale)
    pools.push({ query: `${lang || ''} top hits ${new Date().getFullYear()}`.trim(), category: 'discovery', max: 3 });

    return pools;
};

/**
 * PRIMARY recommendation source: JioSaavn's own song-station / suggestions engine
 * (the same one that powers JioSaavn autoplay). Free, no API key, tuned for Indian
 * music, and returns full, ready-to-play song objects (no catalog resolution
 * needed). This is the best fit for an India-focused catalog.
 */
export const fetchJioSaavnSuggestions = async (seedSong: any): Promise<any[]> => {
    const id = String(seedSong?.id || seedSong?.songId || '');
    if (!id) return [];
    // Radio follows the SEED song's own source so a YouTube song continues with
    // YouTube suggestions (and a JioSaavn song with JioSaavn), regardless of the
    // global setting.
    const source = seedSong?.source === 'youtube' ? 'youtube' : 'jiosaavn';
    try {
        const res = await fetch(`${sourceUrl(`/songs/${id}/suggestions`, source)}?limit=20`);
        if (!res.ok) return [];
        const data = await res.json();
        return data?.success && Array.isArray(data.data) ? data.data : [];
    } catch {
        return [];
    }
};

/**
 * Unified "similar songs": JioSaavn suggestions first (free, Indian-tuned), then
 * supplement with Last.fm (better for Western/English) when configured. Merges
 * unique by id. Used by the home + search recommendation sections.
 */
export const fetchSimilarSongs = async (seedSong: any): Promise<any[]> => {
    const jio = await fetchJioSaavnSuggestions(seedSong);
    if (jio.length >= 6) return jio;

    const lf = await fetchLastfmSimilarSongs(seedSong);
    const seen = new Set(jio.map(s => String(s.id || s.songId)));
    const merged = [...jio];
    for (const s of lf) {
        const k = String(s.id || s.songId);
        if (k && !seen.has(k)) { seen.add(k); merged.push(s); }
    }
    return merged;
};

/**
 * "Similar songs" via the backend Last.fm proxy, resolved against our own JioSaavn
 * catalog for playback. Returns [] when Last.fm isn't configured or finds nothing.
 * Used as a SUPPLEMENT to JioSaavn suggestions (better for Western/English tracks).
 */
export const fetchLastfmSimilarSongs = async (seedSong: any): Promise<any[]> => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const name = seedSong?.name || seedSong?.title || '';
    const artist = getArtistNameFromSong(seedSong);
    if (!name) return [];

    let payload: { tracks: Array<{ name: string; artist: string }>; artists: string[] } | null = null;
    try {
        const res = await fetch(`${apiUrl}/api/recommendations/similar?track=${encodeURIComponent(name)}&artist=${encodeURIComponent(artist)}&limit=30`);
        if (!res.ok) return [];
        const data = await res.json();
        if (!data?.success) return []; // not_configured → heuristic fallback
        payload = data.data;
    } catch {
        return [];
    }
    if (!payload) return [];

    // Resolve similar TRACKS against our catalog (parallel, capped).
    const trackTargets = payload.tracks.slice(0, 18);
    const resolvedTracks = await Promise.allSettled(
        trackTargets.map(t => matchInCatalog({ name: t.name, artist: t.artist, durationSec: 0 }))
    );
    const songs: any[] = resolvedTracks
        .map(r => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean);

    // If track-level matches were thin, supplement with top hits of similar artists.
    if (songs.length < 6 && payload.artists.length) {
        const artistTargets = payload.artists.slice(0, 6);
        const resolvedArtists = await Promise.allSettled(
            artistTargets.map(a => matchInCatalog({ name: a, artist: a, durationSec: 0 }))
        );
        for (const r of resolvedArtists) {
            if (r.status === 'fulfilled' && r.value) songs.push(r.value);
        }
    }
    return songs;
};

/** Rank candidate songs by taste affinity (stable; ties keep original order). */
export const rankByTaste = <T,>(songs: T[]): T[] =>
    songs
        .map((song, idx) => ({ song, idx, score: scoreByTaste(song) }))
        .sort((a, b) => (b.score - a.score) || (a.idx - b.idx))
        .map(s => s.song);

export { createSongKey };
