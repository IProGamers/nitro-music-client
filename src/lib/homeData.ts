// Native JioSaavn home/browse data — pulled directly from JioSaavn's own
// "browse modules" (the same data that powers jiosaavn.com's home page) via our
// backend. No keyword searches, no external services. One call returns new
// releases, charts, top playlists, and trending songs/albums.

import { sourceUrl } from './source';

export interface BrowseModules {
    albums: any[];        // new releases
    charts: any[];        // curated charts (playlists)
    playlists: any[];     // top / featured playlists
    trendingSongs: any[];
    trendingAlbums: any[];
}

const EMPTY: BrowseModules = { albums: [], charts: [], playlists: [], trendingSongs: [], trendingAlbums: [] };

/**
 * Fetch JioSaavn's native browse modules for the home page.
 * Returns empty arrays on failure so the UI degrades gracefully.
 */
export const fetchBrowseModules = async (): Promise<BrowseModules> => {
    try {
        const res = await fetch(sourceUrl('/modules'));
        if (!res.ok) return EMPTY;
        const data = await res.json();
        if (!data?.success || !data.data) return EMPTY;
        const d = data.data;
        return {
            albums: d.albums || [],
            charts: d.charts || [],
            playlists: d.playlists || [],
            trendingSongs: d.trending?.songs || [],
            trendingAlbums: d.trending?.albums || [],
        };
    } catch {
        return EMPTY;
    }
};

/** Fetch a JioSaavn playlist (with its songs) by ID. */
export const fetchJioSaavnPlaylist = async (id: string): Promise<any | null> => {
    try {
        const res = await fetch(`${sourceUrl('/playlists')}?id=${encodeURIComponent(id)}&limit=100`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.success ? data.data : null;
    } catch {
        return null;
    }
};

/** Resolve an artist ID from a name via JioSaavn artist search (for when a song
 *  object has the artist name but no ID). */
export const resolveArtistIdByName = async (name: string): Promise<string | null> => {
    if (!name) return null;
    try {
        const res = await fetch(`${sourceUrl('/search/artists')}?query=${encodeURIComponent(name)}&limit=1`);
        if (!res.ok) return null;
        const data = await res.json();
        const a = data?.data?.results?.[0] || data?.data?.artists?.results?.[0];
        return a?.id ? String(a.id) : null;
    } catch {
        return null;
    }
};
