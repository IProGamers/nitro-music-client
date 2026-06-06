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

    // Artist match (e.g. searching "artist song")
    if (q.includes(artist) && artist !== 'unknown artist') score += 200;

    // Word coverage: how many query words appear in the title
    const qWords = q.split(' ').filter(Boolean);
    if (qWords.length) {
        const matched = qWords.filter(w => title.includes(w)).length;
        score += (matched / qWords.length) * 250;
    }

    // Popularity boost (log-scaled so it never overrides a strong title match)
    const plays = Number(song.playCount || song.play_count || 0);
    if (plays > 0) score += Math.min(Math.log10(plays + 1) * 40, 200);

    // Slightly de-prioritise remix/version/cover variants so the official cut wins
    if (/\b(remix|acoustic|live|cover|reprise|lo-?fi|slowed|reverb|sped\s*up|version|instrumental|karaoke)\b/i.test(rawTitle)) {
        score -= 120;
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
