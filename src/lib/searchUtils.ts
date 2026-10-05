// Search result processing utilities
// Handles deduplication and intelligent grouping of search results

/**
 * Normalize a song title for comparison
 * Removes common suffixes like "(From Movie)", "- Remix", etc.
 */
export const normalizeSongTitle = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/\s*\(from\s+["']?[^)]+["']?\)/gi, '')  // Remove "(From Movie)"
        .replace(/\s*\(original\s+motion\s+picture\s+soundtrack\)/gi, '')
        .replace(/\s*\(from\s+the\s+motion\s+picture\)/gi, '')
        .replace(/\s*-\s*(remix|acoustic|live|radio\s+edit|extended)/gi, '')
        .replace(/\s*\[(remix|acoustic|live|radio\s+edit|extended)\]/gi, '')
        .replace(/\s*\((remix|acoustic|live|radio\s+edit|extended)\)/gi, '')
        .replace(/[^\w\s]/g, '')  // Remove special characters
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
};

/**
 * Get artist name from song object (handles various API response formats)
 */
export const getArtistNameFromSong = (song: any): string => {
    if (song.artists?.primary?.length) {
        return song.artists.primary[0].name;
    }
    if (song.primaryArtists) {
        // Handle comma-separated artists, get first one
        const firstArtist = song.primaryArtists.split(',')[0].trim();
        return firstArtist;
    }
    if (song.artist) {
        return song.artist.split(',')[0].trim();
    }
    if (song.singers) {
        return song.singers.split(',')[0].trim();
    }
    return 'Unknown Artist';
};

/**
 * Get artist ID from song object
 */
export const getArtistIdFromSong = (song: any): string | null => {
    if (song.artists?.primary?.length && song.artists.primary[0].id) {
        return song.artists.primary[0].id;
    }
    if (song.artistId) {
        return song.artistId;
    }
    return null;
};

/**
 * Create a unique key for a song based on normalized title + artist
 */
export const createSongKey = (song: any): string => {
    const title = normalizeSongTitle(song.title || song.name || '');
    const artist = getArtistNameFromSong(song).toLowerCase();
    return `${title}__${artist}`;
};

/**
 * Check if candidate song is the same song, cover, remix, or derivative title of the seed song.
 * Prevents autoplay from recommending multiple versions of the exact same song name.
 */
export const isSameOrDerivativeSong = (seedSong: any, candidateSong: any): boolean => {
    if (!seedSong || !candidateSong) return false;
    const idA = String(seedSong.id || seedSong.songId || '');
    const idB = String(candidateSong.id || candidateSong.songId || '');
    if (idA && idB && idA === idB) return true;

    const titleA = normalizeSongTitle(seedSong.name || seedSong.title || '');
    const titleB = normalizeSongTitle(candidateSong.name || candidateSong.title || '');
    if (!titleA || !titleB) return false;

    // Exact normalized title match
    if (titleA === titleB) return true;

    // One contains the other when title has significant length (>= 4 chars)
    if (titleA.length >= 4 && titleB.length >= 4) {
        if (titleA.includes(titleB) || titleB.includes(titleA)) return true;
    }

    // Word token overlap: if more than 50% of meaningful words (>2 chars) overlap
    const wordsA = titleA.split(' ').filter(w => w.length > 2);
    const wordsB = new Set(titleB.split(' ').filter(w => w.length > 2));
    if (wordsA.length > 0 && wordsB.size > 0) {
        const overlap = wordsA.filter(w => wordsB.has(w)).length;
        const ratio = overlap / Math.min(wordsA.length, wordsB.size);
        if (ratio >= 0.5) return true;
    }

    return false;
};

/**
 * Deduplicate a list of songs by normalized title+artist.
 * Optionally exclude a set of song keys (e.g. the seed song + already-queued songs)
 * so autoplay never queues the same song in a different version/remix.
 */
export const dedupeSongs = (songs: any[], excludeKeys?: Set<string>): any[] => {
    const seen = new Set<string>(excludeKeys ? Array.from(excludeKeys) : []);
    const out: any[] = [];
    for (const song of songs || []) {
        const key = createSongKey(song);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(song);
    }
    return out;
};

/**
 * Relevance score of a search result against a query (Spotify-like ranking).
 * Higher = more relevant. Rewards exact title match, prefix match, word coverage,
 * artist match, and popularity (playCount), and lightly penalises remix/version variants.
 */
// Levenshtein edit distance (small strings) for typo-tolerant matching.
const editDistance = (a: string, b: string): number => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        prev = cur;
    }
    return prev[b.length];
};

// 0..1 similarity (1 = identical). Used so a misspelling still ranks the
// intended song high (e.g. "kesaria" ~ "kesariya").
const similarityRatio = (a: string, b: string): number => {
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - editDistance(a, b) / maxLen;
};

export const getRelevanceScore = (song: any, query: string): number => {
    const q = normalizeSongTitle(query);
    if (!q) return 0;

    const title = normalizeSongTitle(song.title || song.name || '');
    const artist = getArtistNameFromSong(song).toLowerCase();
    const rawTitle = (song.title || song.name || '').toLowerCase();

    let score = 0;

    // Exact title match is the strongest signal (the "official" track)
    if (title === q) score += 1000;
    // Title starts with the query
    else if (title.startsWith(q)) score += 600;
    // Query appears somewhere in the title
    else if (title.includes(q)) score += 350;
    else {
        // TYPO TOLERANCE: reward titles that are a near-match to what was typed,
        // so "kesaria" still surfaces "Kesariya". Compare against the title and its
        // leading words (so "tum he ho" ~ "tum hi ho"). No dictionary needed.
        const sim = similarityRatio(q, title);
        const prefixSim = similarityRatio(q, title.split(' ').slice(0, q.split(' ').length).join(' '));
        const best = Math.max(sim, prefixSim);
        if (best >= 0.7) score += best * 500; // strong fuzzy match
        else if (best >= 0.55) score += best * 200;
    }

    // Artist match (e.g. searching "artist song")
    if (q.includes(artist) && artist !== 'unknown artist') score += 200;

    // Word coverage: how many query words appear in the title
    const qWords = q.split(' ').filter(Boolean);
    if (qWords.length) {
        const matched = qWords.filter(w => title.includes(w)).length;
        score += (matched / qWords.length) * 250;
    }

    // Popularity boost (log-scaled). Weighted strongly so the official/most-played
    // cut wins ties between same-name results, like Spotify.
    const plays = Number(song.playCount || song.play_count || 0);
    if (plays > 0) score += Math.min(Math.log10(plays + 1) * 70, 380);

    // De-prioritise remix/version/cover variants so the official cut surfaces first.
    if (/\b(remix|acoustic|live|cover|reprise|lo-?fi|slowed|reverb|sped\s*up|version|instrumental|karaoke)\b/i.test(rawTitle)) {
        score -= 220;
    }

    // Prefer studio recordings with higher year when available (tie-breaker handled by caller)
    return score;
};

/**
 * Rank search results by relevance to the query (always applied, not just for
 * curated/trending songs). Stable: ties keep original API order.
 */
export const rankByRelevance = <T extends any>(songs: T[], query: string): T[] => {
    return songs
        .map((song, idx) => ({ song, idx, score: getRelevanceScore(song, query) }))
        .sort((a, b) => (b.score - a.score) || (a.idx - b.idx))
        .map(s => s.song);
};

export interface ProcessedSong {
    song: any;
    artistName: string;
    artistId: string | null;
    normalizedTitle: string;
}

export interface GroupedSearchResults {
    // Top result (best match)
    topResult: ProcessedSong | null;
    // Deduplicated songs
    songs: ProcessedSong[];
    // Songs grouped by artist for "More by this artist" feature
    songsByArtist: Map<string, ProcessedSong[]>;
    // Artists mentioned in songs (for quick artist suggestions)
    uniqueArtists: { name: string; id: string | null; songCount: number }[];
}

/**
 * Process search results to remove duplicates and group by artist
 * Similar to Spotify's search experience
 */
export const processSearchResults = (songs: any[]): GroupedSearchResults => {
    if (!songs || songs.length === 0) {
        return {
            topResult: null,
            songs: [],
            songsByArtist: new Map(),
            uniqueArtists: []
        };
    }

    const seen = new Set<string>();
    const dedupedSongs: ProcessedSong[] = [];
    const artistSongMap = new Map<string, ProcessedSong[]>();
    const artistInfoMap = new Map<string, { id: string | null; count: number }>();

    for (const song of songs) {
        const key = createSongKey(song);
        const artistName = getArtistNameFromSong(song);
        const artistId = getArtistIdFromSong(song);
        const normalizedTitle = normalizeSongTitle(song.title || song.name || '');

        // Skip duplicates (same title + same artist)
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);

        const processedSong: ProcessedSong = {
            song,
            artistName,
            artistId,
            normalizedTitle
        };

        dedupedSongs.push(processedSong);

        // Group by artist
        const artistKey = artistName.toLowerCase();
        if (!artistSongMap.has(artistKey)) {
            artistSongMap.set(artistKey, []);
        }
        artistSongMap.get(artistKey)!.push(processedSong);

        // Track artist info
        if (!artistInfoMap.has(artistKey)) {
            artistInfoMap.set(artistKey, { id: artistId, count: 0 });
        }
        artistInfoMap.get(artistKey)!.count++;
    }

    // Create unique artists list sorted by song count
    const uniqueArtists = Array.from(artistInfoMap.entries())
        .map(([name, info]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
            id: info.id,
            songCount: info.count
        }))
        .sort((a, b) => b.songCount - a.songCount);

    return {
        topResult: dedupedSongs[0] || null,
        songs: dedupedSongs,
        songsByArtist: artistSongMap,
        uniqueArtists
    };
};

/**
 * Get "More by this artist" songs from search results
 */
export const getMoreByArtist = (
    artistName: string,
    songsByArtist: Map<string, ProcessedSong[]>,
    excludeSongId?: string,
    limit: number = 5
): ProcessedSong[] => {
    const artistKey = artistName.toLowerCase();
    const songs = songsByArtist.get(artistKey) || [];

    return songs
        .filter(s => s.song.id !== excludeSongId)
        .slice(0, limit);
};
