// No-API playlist import.
//
// Lets a user migrate playlists from Spotify (or anywhere) WITHOUT us needing a
// Spotify Developer app. Two input methods:
//   1. Paste a track list (one "Title - Artist" per line)
//   2. Upload a CSV (e.g. from exportify.net, which uses the user's OWN Spotify
//      login — no developer credentials required on our side)
//
// Each parsed track is matched against our JioSaavn catalog; unmatched tracks are
// skipped. Playback always stays on JioSaavn — nothing is streamed from Spotify.

export interface ImportTrack {
    name: string;
    artist: string;
    durationSec: number;
}

const cleanField = (s: string): string => (s || '').replace(/^"+|"+$/g, '').trim();

/**
 * Parse a pasted list. Accepts, per line:
 *   "Title - Artist"  |  "Title — Artist"  |  "Title by Artist"  |  "Artist - Title"
 *   or just "Title". Blank lines ignored.
 */
export const parsePastedTracks = (text: string): ImportTrack[] => {
    const out: ImportTrack[] = [];
    for (const line of (text || '').split(/\r?\n/)) {
        const raw = line.trim();
        if (!raw) continue;
        let name = raw;
        let artist = '';
        const sep = raw.match(/\s+[-–—]\s+|\s+by\s+/i);
        if (sep && sep.index !== undefined) {
            const left = raw.slice(0, sep.index).trim();
            const right = raw.slice(sep.index + sep[0].length).trim();
            // Heuristic: "Title - Artist" is most common.
            name = left;
            artist = right;
        }
        if (name) out.push({ name, artist, durationSec: 0 });
    }
    return out;
};

/** Split one CSV line into fields, respecting quoted commas. */
const splitCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            fields.push(cur); cur = '';
        } else {
            cur += ch;
        }
    }
    fields.push(cur);
    return fields;
};

/**
 * Parse a CSV. Recognises Exportify-style headers ("Track Name", "Artist Name(s)",
 * "Duration (ms)"); falls back to the first two columns as title, artist.
 */
export const parseCsvTracks = (text: string): ImportTrack[] => {
    const lines = (text || '').split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const header = splitCsvLine(lines[0]).map(h => cleanField(h).toLowerCase());
    const findCol = (...names: string[]) => header.findIndex(h => names.some(n => h.includes(n)));

    let nameIdx = findCol('track name', 'name', 'title', 'song');
    let artistIdx = findCol('artist name', 'artist', 'artists');
    const durIdx = findCol('duration (ms)', 'duration');

    let start = 1;
    // No recognisable header → treat every row as data, cols [0]=title [1]=artist
    if (nameIdx === -1) { nameIdx = 0; artistIdx = artistIdx === -1 ? 1 : artistIdx; start = 0; }

    const out: ImportTrack[] = [];
    for (let i = start; i < lines.length; i++) {
        const cols = splitCsvLine(lines[i]);
        const name = cleanField(cols[nameIdx] || '');
        if (!name) continue;
        const artist = artistIdx >= 0 ? cleanField(cols[artistIdx] || '') : '';
        let durationSec = 0;
        if (durIdx >= 0) {
            const d = Number(cleanField(cols[durIdx] || '0'));
            // Exportify uses milliseconds; a small number is probably already seconds.
            durationSec = d > 10000 ? Math.round(d / 1000) : Math.round(d);
        }
        out.push({ name, artist, durationSec });
    }
    return out;
};

// ---- Catalog matching (imported track -> our JioSaavn catalog) ----
const norm = (s: string): string =>
    (s || '').toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Find the best matching song in OUR catalog for an imported track.
 * Scores on title + primary artist + duration (±3s). Returns the JioSaavn song
 * object if confidence is high enough, else null (caller marks it unavailable).
 */
export const matchInCatalog = async (track: ImportTrack): Promise<any | null> => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const q = `${track.name} ${track.artist}`.trim();
        const res = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(q)}&limit=8`);
        if (!res.ok) return null;
        const data = await res.json();
        const results: any[] = data?.data?.results || [];
        if (results.length === 0) return null;

        const wantTitle = norm(track.name);
        const wantArtist = norm((track.artist || '').split(',')[0] || '');

        let best: { song: any; score: number } | null = null;
        for (const s of results) {
            const sTitle = norm(s.name || s.title || '');
            const sArtist = norm(s.artists?.primary?.[0]?.name || s.primaryArtists || s.artist || '');
            let score = 0;
            if (sTitle === wantTitle) score += 50;
            else if (sTitle.includes(wantTitle) || wantTitle.includes(sTitle)) score += 30;
            if (wantArtist && (sArtist.includes(wantArtist) || wantArtist.includes(sArtist))) score += 30;
            else if (!wantArtist) score += 15; // no artist provided (paste) — lean on title
            const dur = Number(s.duration || 0);
            if (dur && track.durationSec && Math.abs(dur - track.durationSec) <= 3) score += 15;
            else if (dur && track.durationSec && Math.abs(dur - track.durationSec) <= 8) score += 7;
            if (!best || score > best.score) best = { song: s, score };
        }
        return best && best.score >= 55 ? best.song : null;
    } catch {
        return null;
    }
};
