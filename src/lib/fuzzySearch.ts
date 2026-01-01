// Lightweight fuzzy search utilities for smart search
// Optimized for instant results - all operations are O(1) or O(n) with small n

import Fuse from 'fuse.js';
import { popularSongs, songNameMap, type PopularSong } from './popularSongs';

// Pre-built Fuse instance (created once, reused)
let fuseInstance: Fuse<PopularSong> | null = null;

// Lazy initialization of Fuse.js
const getFuse = (): Fuse<PopularSong> => {
    if (!fuseInstance) {
        fuseInstance = new Fuse(popularSongs, {
            keys: [
                { name: 'name', weight: 0.4 },
                { name: 'artist', weight: 0.2 },
                { name: 'aliases', weight: 0.3 },
                { name: 'lyrics', weight: 0.1 }
            ],
            threshold: 0.4,        // 40% difference allowed
            distance: 100,         // Character distance
            includeScore: true,
            minMatchCharLength: 2,
            ignoreLocation: true   // Match anywhere in string
        });
    }
    return fuseInstance;
};

// Common keyboard typos - adjacent keys on QWERTY
const keyboardAdjacent: Record<string, string[]> = {
    'a': ['s', 'q', 'z'],
    'e': ['w', 'r', 'd'],
    'i': ['u', 'o', 'k'],
    'o': ['i', 'p', 'l'],
    'u': ['y', 'i', 'j'],
};

// Common phonetic substitutions for sound-alike matching
const phoneticMap: Record<string, string> = {
    'ph': 'f',
    'ck': 'k',
    'gh': 'g',
    'wh': 'w',
    'ee': 'i',
    'oo': 'u',
    'aa': 'a',
    'ii': 'i',
    'ou': 'o',
    'ie': 'i',
    'ei': 'i',
    'ey': 'i',
    'ay': 'e',
    'ai': 'e',
    'tion': 'shun',
    'sion': 'shun',
};

/**
 * Normalize a query for matching - O(n) where n is query length
 */
export const normalizeQuery = (query: string): string => {
    return query
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')           // Multiple spaces to single
        .replace(/['']/g, "'")          // Normalize quotes
        .replace(/[""]/g, '"');
};

/**
 * Create a phonetic key for sound-alike matching
 */
export const createPhoneticKey = (str: string): string => {
    let result = str.toLowerCase();

    // Apply phonetic substitutions
    Object.entries(phoneticMap).forEach(([from, to]) => {
        result = result.replace(new RegExp(from, 'g'), to);
    });

    // Remove vowels for consonant skeleton matching
    return result.replace(/[aeiou]/g, '');
};

/**
 * Quick lookup for exact/near-exact matches from pre-computed index
 * This is the FASTEST path - O(1) hash map lookup
 */
export const getQuickCorrection = (query: string): string | null => {
    const normalized = query.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Direct lookup in pre-computed map
    const match = songNameMap.get(normalized);
    if (match) return match;

    // Try without numbers
    const noNumbers = normalized.replace(/[0-9]/g, '');
    const matchNoNum = songNameMap.get(noNumbers);
    if (matchNoNum) return matchNoNum;

    return null;
};

/**
 * Fuzzy search using Fuse.js - for when quick lookup fails
 * Returns top matches with confidence scores
 */
export interface FuzzyMatch {
    song: PopularSong;
    score: number;      // 0 = perfect match, 1 = no match
    query: string;      // The corrected query to use
}

export const fuzzySearch = (query: string, limit: number = 3): FuzzyMatch[] => {
    const normalized = normalizeQuery(query);

    // First try quick exact match
    const quickMatch = getQuickCorrection(normalized);
    if (quickMatch) {
        const song = popularSongs.find(s => s.name === quickMatch);
        if (song) {
            return [{ song, score: 0, query: quickMatch }];
        }
    }

    // Fall back to Fuse.js fuzzy search
    const fuse = getFuse();
    const results = fuse.search(normalized, { limit });

    return results
        .filter(r => r.score !== undefined && r.score < 0.5)  // Only good matches
        .map(r => ({
            song: r.item,
            score: r.score!,
            query: r.item.name
        }));
};

/**
 * Preprocess a search query - fix common issues before API call
 * This runs BEFORE the main search for instant fixes
 */
export const preprocessQuery = (query: string): {
    original: string;
    corrected: string;
    wasCorrected: boolean;
    suggestion?: string;
} => {
    const original = query.trim();
    if (!original || original.length < 2) {
        return { original, corrected: original, wasCorrected: false };
    }

    // Step 1: Quick exact match from our database
    const quickMatch = getQuickCorrection(original);
    if (quickMatch && quickMatch.toLowerCase() !== original.toLowerCase()) {
        return {
            original,
            corrected: quickMatch,
            wasCorrected: true,
            suggestion: quickMatch
        };
    }

    // Step 2: Try fuzzy matching
    const fuzzyMatches = fuzzySearch(original, 1);
    if (fuzzyMatches.length > 0 && fuzzyMatches[0].score < 0.35) {
        return {
            original,
            corrected: fuzzyMatches[0].song.name,
            wasCorrected: true,
            suggestion: `${fuzzyMatches[0].song.name} by ${fuzzyMatches[0].song.artist}`
        };
    }

    // No correction needed/found
    return { original, corrected: original, wasCorrected: false };
};

/**
 * Get "Did you mean?" suggestions when results are poor
 * Returns multiple suggestions for user to choose from
 */
export const getDidYouMeanSuggestions = (query: string, maxResults: number = 3): {
    query: string;
    artist: string;
    confidence: number;  // 0-100, higher is better
}[] => {
    const fuzzyMatches = fuzzySearch(query, maxResults);

    return fuzzyMatches.map(m => ({
        query: m.song.name,
        artist: m.song.artist,
        confidence: Math.round((1 - m.score) * 100)
    }));
};

/**
 * Check if search results seem poor (to trigger "Did you mean?")
 */
export const areResultsPoor = (resultsCount: number, query: string): boolean => {
    // If very few results and query is long enough, results might be poor
    if (query.length >= 4 && resultsCount < 3) return true;
    if (query.length >= 6 && resultsCount < 5) return true;
    return false;
};
