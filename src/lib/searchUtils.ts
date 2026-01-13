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
const createSongKey = (song: any): string => {
    const title = normalizeSongTitle(song.title || song.name || '');
    const artist = getArtistNameFromSong(song).toLowerCase();
    return `${title}__${artist}`;
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
