"use client"
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useSettings } from '@/context/SettingsContext';
import { sourceUrl, prefetchYtStream } from '@/lib/source';
import { Search, Clock, X, Music, User, Disc, ListMusic, ChevronRight, Trash2, Play, Sparkles, TrendingUp, Headphones, Heart, Moon, Flame } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SongContextMenu from '@/components/SongContextMenu';
import { useMusicData } from '@/context/MusicDataContext';
import { getDidYouMeanSuggestions, preprocessQuery } from '@/lib/fuzzySearch';
import { processSearchResults, rankByRelevance, type ProcessedSong, type GroupedSearchResults } from '@/lib/searchUtils';
import { reRankByTrending, getTopResultConfidence, getTrendingSongForQuery } from '@/lib/trendingSongs';
import { decodeHtml } from '@/lib/utils';
import { fetchSimilarSongs } from '@/lib/recommendations';
import { fetchWithCache, CACHE_TTL } from '@/lib/apiCache';

type SearchResults = {
    songs: { results: any[] };
    albums: { results: any[] };
    artists: { results: any[] };
    playlists: { results: any[] };
    topQuery: { results: any[] };
};

type SearchedSong = {
    id: string;
    name: string;
    artist: string;
    image: string;
    audioUrl?: string;
};

const SEARCH_PLAYED_KEY = 'nitro_search_played_songs';
const MAX_SEARCH_PLAYED = 12;

// Heuristic: is `to` a plausible typo-correction of `from` (vs an unrelated word)?
// Requires a shared 2-char prefix and similar length so we don't swap a correctly
// spelled query for a different popular song.
const looksLikeTypoFix = (from: string, to: string): boolean => {
    const a = from.toLowerCase().replace(/[^a-z0-9]/g, '');
    const b = to.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!a || !b || a === b) return false;
    if (Math.abs(a.length - b.length) > 3) return false;
    return a.slice(0, 2) === b.slice(0, 2);
};

export default function SearchPage() {
    const { playTrack } = usePlayer();
    const { musicSource } = useSettings();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [searchPlayedSongs, setSearchPlayedSongs] = useState<SearchedSong[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
    const [loadingMore, setLoadingMore] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const searchAbortControllerRef = useRef<AbortController | null>(null);
    const categoryAbortControllerRef = useRef<AbortController | null>(null);
    // When the user clicks "Search instead for <original>", skip typo-correction once.
    const skipNextCorrectionRef = useRef(false);
    const { searchCache } = useMusicData();

    // Smart search state - only for "Did you mean?" suggestions
    const [didYouMeanOptions, setDidYouMeanOptions] = useState<{ query: string; artist: string; confidence: number }[]>([]);
    // Typo-correction pill: when we auto-correct the query before searching.
    const [correctedFrom, setCorrectedFrom] = useState<{ from: string; to: string } | null>(null);
    // Last.fm "You might also like" — similar to the top search result.
    const [similarSongs, setSimilarSongs] = useState<any[]>([]);
    // "Trending now" rail for the empty/browse view — real songs from JioSaavn (like Home).
    const [trendingNow, setTrendingNow] = useState<any[]>([]);

    // Fetch trending songs once for the browse view (daily-rotating, cached like Home).
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await fetchWithCache(
                    `${sourceUrl('/search/songs')}?query=${encodeURIComponent('trending hindi songs')}&limit=15`,
                    CACHE_TTL.TRENDING,
                    { dailyKey: true }
                );
                const results = data?.success ? (data.data?.results || []) : [];
                if (alive) setTrendingNow(results.slice(0, 12));
            } catch { /* ignore — browse view just hides the rail */ }
        })();
        return () => { alive = false; };
    }, []);

    // Debounce query — short delay so results feel live as you type.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 220);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle actual search when debounced query changes
    useEffect(() => {
        const raw = debouncedQuery.trim();
        if (raw === '') {
            setResults(null);
            setLoading(false);
            setDidYouMeanOptions([]);
            setCorrectedFrom(null);
            return;
        }

        // Reset "Did you mean?" options for new search
        setDidYouMeanOptions([]);

        // Typo tolerance: correct the query (quick map + Fuse.js fuzzy) BEFORE the cache
        // check and the API call, so a misspelling resolves to the right song and the
        // cache + correction pill stay consistent. Skipped once when the user explicitly
        // chose to keep their own spelling.
        const bypass = skipNextCorrectionRef.current;
        skipNextCorrectionRef.current = false;
        const correction = bypass ? { wasCorrected: false, corrected: raw } : preprocessQuery(raw);
        // Only accept the correction if it genuinely looks like a typo fix (shared prefix
        // + similar length) — prevents a correctly-spelled but uncommon query from being
        // swapped for an unrelated popular song.
        const useCorrection = correction.wasCorrected && looksLikeTypoFix(raw, correction.corrected);
        const searchTerm = useCorrection ? correction.corrected : raw;
        setCorrectedFrom(useCorrection ? { from: raw, to: correction.corrected } : null);

        // Check cache (keyed by the corrected term)
        if (searchCache.has(searchTerm)) {
            setResults(searchCache.get(searchTerm)!);
            setLoading(false);
            return;
        }

        const performSearch = async () => {
            // Abort previous search if any
            if (searchAbortControllerRef.current) {
                searchAbortControllerRef.current.abort();
            }

            const controller = new AbortController();
            searchAbortControllerRef.current = controller;
            setLoading(true);

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

                // YouTube source: hit the YouTube module and shape it like the
                // unified JioSaavn response. Albums/artists/playlists come later.
                if (musicSource === 'youtube') {
                    const ytRes = await fetch(`${sourceUrl('/search/songs')}?query=${encodeURIComponent(searchTerm)}&limit=30`, { signal: controller.signal });
                    const ytData = await ytRes.json();
                    const ytSongs = ytData?.success ? (ytData.data?.results || []) : [];
                    const shaped: any = {
                        songs: { results: ytSongs },
                        albums: { results: [] },
                        artists: { results: [] },
                        playlists: { results: [] },
                        topQuery: { results: ytSongs.slice(0, 1) }
                    };
                    setResults(shaped);
                    searchCache.set(searchTerm, shaped);
                    setActiveTab('all');
                    setLoading(false);
                    // Warm just the top couple of results (the most likely taps) so the
                    // first play is fast WITHOUT flooding the resolver — hover + the
                    // next-in-queue prefetch cover the rest on demand.
                    ytSongs.slice(0, 2).forEach((s: any) => prefetchYtStream(s));
                    return;
                }

                // Check if this is a trending song search
                const trendingSong = getTrendingSongForQuery(searchTerm);

                // Make primary search (using the corrected term)
                const res = await fetch(`${apiUrl}/api/search?query=${encodeURIComponent(searchTerm)}`, {
                    signal: controller.signal
                });
                const data = await res.json();

                if (data.success) {
                    let songResults = data.data.songs?.results || [];

                    // If this is a trending song search, fetch the specific song and inject it at top
                    if (trendingSong && songResults.length > 0) {
                        // Make a secondary search for the specific artist + song
                        const trendingQuery = `${trendingSong.artist} ${trendingSong.title}`;
                        try {
                            const trendingRes = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(trendingQuery)}&limit=5`, {
                                signal: controller.signal
                            });
                            const trendingData = await trendingRes.json();

                            if (trendingData.success && trendingData.data?.results?.length > 0) {
                                // Find the best match from trending results
                                const trendingResults = trendingData.data.results;
                                const bestMatch = trendingResults.find((song: any) => {
                                    const title = (song.title || song.name || '').toLowerCase();
                                    const artists = (song.primaryArtists || song.artist || '').toLowerCase();
                                    return title.includes(trendingSong.title) && artists.includes(trendingSong.artist);
                                }) || trendingResults[0];

                                if (bestMatch) {
                                    // Remove any duplicates and add best match at the top
                                    songResults = songResults.filter((s: any) => s.id !== bestMatch.id);
                                    songResults.unshift(bestMatch);
                                }
                            }
                        } catch (e) {
                            // Ignore errors from secondary search, use primary results
                            console.log('Trending song fetch failed, using primary results');
                        }
                    }

                    // Rank ALL results by relevance to the query first (Spotify-like:
                    // the official/most-relevant track surfaces to the top), then apply
                    // the curated trending boost on top for known viral songs.
                    if (songResults.length > 0) {
                        songResults = rankByRelevance(songResults, searchTerm);
                        songResults = reRankByTrending(songResults, searchTerm);
                    }

                    data.data.songs.results = songResults;
                    setResults(data.data);
                    // Save to cache (keyed by the corrected term)
                    searchCache.set(searchTerm, data.data);

                    // Default to 'all' tab so users see the summary first
                    setActiveTab('all');

                    // "Did you mean?" — show a confident correction even when the API DID
                    // return (junk) results, as long as we didn't already auto-correct.
                    // This catches typos like "pefect" that match real-but-wrong songs.
                    if (!useCorrection && raw.length >= 3) {
                        const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const suggestions = getDidYouMeanSuggestions(raw, 3)
                            .filter(s => s.confidence >= 80 && normKey(s.query) !== normKey(raw));
                        setDidYouMeanOptions(suggestions);
                    }
                }
            } catch (e: any) {
                // Aborted (user kept typing) or a transient network blip while the
                // backend (re)starts — degrade quietly. console.warn, not error, so
                // Next's dev overlay doesn't surface it as a crash.
                if (e?.name !== 'AbortError') {
                    console.warn('Search request failed (showing browse view):', e?.message || e);
                }
            } finally {
                // Only set loading false if this is still the active controller
                if (searchAbortControllerRef.current === controller) {
                    setLoading(false);
                }
            }
        };

        performSearch();

        return () => {
            if (searchAbortControllerRef.current) {
                searchAbortControllerRef.current.abort();
            }
        };
    }, [debouncedQuery]);

    // Fetch more results when tab changes
    useEffect(() => {
        const q = debouncedQuery.trim();
        if (q === '' || activeTab === 'all') {
            setLoadingMore(false);
            return;
        }

        const fetchCategoryResults = async () => {
            if (categoryAbortControllerRef.current) {
                categoryAbortControllerRef.current.abort();
            }

            const controller = new AbortController();
            categoryAbortControllerRef.current = controller;
            setLoadingMore(true);

            try {
                // Using a higher limit for category-specific view
                const res = await fetch(`${sourceUrl(`/search/${activeTab}`)}?query=${encodeURIComponent(q)}&limit=50`, {
                    signal: controller.signal
                });
                const data = await res.json();

                if (data.success && controller.signal.aborted === false) {
                    setResults(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            [activeTab]: data.data
                        };
                    });
                }
            } catch (e: any) {
                if (e?.name !== 'AbortError') {
                    console.warn(`Could not fetch more ${activeTab}:`, e?.message || e);
                }
            } finally {
                if (categoryAbortControllerRef.current === controller) {
                    setLoadingMore(false);
                }
            }
        };

        fetchCategoryResults();

        return () => {
            if (categoryAbortControllerRef.current) {
                categoryAbortControllerRef.current.abort();
            }
        };
    }, [activeTab, debouncedQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };
    useEffect(() => {
        try {
            const savedSongs = localStorage.getItem(SEARCH_PLAYED_KEY);
            if (savedSongs) {
                setSearchPlayedSongs(JSON.parse(savedSongs));
            }
        } catch (e) {
            console.error('Failed to load search history:', e);
        }
    }, []);


    // Save song to search played history
    const saveToSearchHistory = (song: any) => {
        const songData: SearchedSong = {
            id: song.id,
            name: song.title || song.name,
            artist: song.primaryArtists || song.artist || getArtistName(song),
            image: getImg(song),
            audioUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[0]?.url || song.audioUrl || ''
        };

        setSearchPlayedSongs(prev => {
            // Remove duplicate if exists
            const filtered = prev.filter(s => s.id !== songData.id);
            // Add new song at the beginning
            const updated = [songData, ...filtered].slice(0, MAX_SEARCH_PLAYED);

            // Save to localStorage
            try {
                localStorage.setItem(SEARCH_PLAYED_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save search played song:', e);
            }

            return updated;
        });
    };

    // Clear search history
    const clearSearchHistory = () => {
        setSearchPlayedSongs([]);
        try {
            localStorage.removeItem(SEARCH_PLAYED_KEY);
        } catch (e) {
            console.error('Failed to clear search history:', e);
        }
    };

    // Remove a single recent item.
    const removeSearchPlayedSong = (id: string) => {
        setSearchPlayedSongs(prev => {
            const next = prev.filter(s => s.id !== id);
            try { localStorage.setItem(SEARCH_PLAYED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    // Play song from search results AND save to search history.
    // Plays as a personalized radio (similar songs) rather than queueing the other
    // search results, matching Spotify.
    const playFromSearch = (song: any, _queue: any[]) => {
        saveToSearchHistory(song);
        playTrack(song, undefined, { radio: true });
    };

    // Play song from search history (already saved, just play)
    const playFromHistory = (song: SearchedSong) => {
        // Convert to format playTrack expects
        const trackData = {
            id: song.id,
            name: song.name,
            artist: song.artist,
            image: song.image,
            audioUrl: song.audioUrl
        };
        playTrack(trackData, undefined, { radio: true });
    };
    // Removed direct doSearch to use debounced useEffect above
    const clearSearch = () => {
        setQuery('');
        setResults(null);
        if (searchAbortControllerRef.current) {
            searchAbortControllerRef.current.abort();
        }
    }

    const getImg = (t: any) => {
        if (t.image && Array.isArray(t.image) && t.image.length) {
            return t.image[t.image.length - 1].url;
        }
        if (typeof t.image === 'string') return t.image;
        return '';
    };

    // Fall back to the logo when a cover URL is broken/expired (no broken-image icon).
    const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const el = e.currentTarget;
        if (el.src.endsWith('/logo.png')) return;
        el.src = '/logo.png';
    };

    const getArtistName = (t: any) => {
        if (t.artists?.primary?.length) return decodeHtml(t.artists.primary[0].name);
        if (t.primaryArtists) return decodeHtml(t.primaryArtists);
        if (t.artist) return decodeHtml(t.artist);
        return 'Unknown Artist';
    };

    // Decoded display title for any result (handles &quot; etc. from the API).
    const getName = (t: any) => decodeHtml(t?.title || t?.name || '');

    // Process and deduplicate songs
    const processedSongs = useMemo((): GroupedSearchResults => {
        if (!results?.songs?.results) {
            return { topResult: null, songs: [], songsByArtist: new Map(), uniqueArtists: [] };
        }
        return processSearchResults(results.songs.results);
    }, [results?.songs?.results]);

    // Fetch "You might also like" (Last.fm similar to the top result). Runs once per
    // result set; no-op / empty when Last.fm isn't configured.
    useEffect(() => {
        const top = processedSongs.songs[0]?.song;
        if (!top) { setSimilarSongs([]); return; }
        let cancelled = false;
        fetchSimilarSongs(top)
            .then(songs => { if (!cancelled) setSimilarSongs(songs.slice(0, 12)); })
            .catch(() => { if (!cancelled) setSimilarSongs([]); });
        return () => { cancelled = true; };
    }, [processedSongs.songs[0]?.song?.id]);

    const handleArtistClick = (artistId: string) => {
        router.push(`/artist/${artistId}`);
    };

    const handleAlbumClick = (albumId: string) => {
        router.push(`/album/${albumId}`);
    };

    const handlePlaylistClick = (playlistId: string) => {
        router.push(`/playlist/${playlistId}`);
    };

    const tabs = [
        { id: 'all', label: 'All', icon: <Search size={14} /> },
        { id: 'songs', label: 'Songs', icon: <Music size={14} /> },
        { id: 'artists', label: 'Artists', icon: <User size={14} /> },
        { id: 'albums', label: 'Albums', icon: <Disc size={14} /> },
        { id: 'playlists', label: 'Playlists', icon: <ListMusic size={14} /> },
    ];

    // Clean, monochrome browse categories — each opens a song search.
    const browseCategories = [
        { id: 'trending', title: 'Trending', icon: <Flame size={18} />, query: `top trending hits ${new Date().getFullYear()}` },
        { id: 'new', title: 'New Releases', icon: <Disc size={18} />, query: `new releases ${new Date().getFullYear()}` },
        { id: 'charts', title: 'Top Charts', icon: <TrendingUp size={18} />, query: 'top charts global' },
        { id: 'hindi', title: 'Hindi', icon: <Music size={18} />, query: 'hindi bollywood hits' },
        { id: 'punjabi', title: 'Punjabi', icon: <Music size={18} />, query: 'punjabi hits' },
        { id: 'pop', title: 'Pop', icon: <Sparkles size={18} />, query: 'pop hits' },
        { id: 'hip-hop', title: 'Hip Hop', icon: <Music size={18} />, query: 'hip hop' },
        { id: 'rock', title: 'Rock', icon: <Music size={18} />, query: 'rock' },
        { id: 'edm', title: 'Dance / EDM', icon: <Headphones size={18} />, query: 'edm dance' },
        { id: 'romance', title: 'Romance', icon: <Heart size={18} />, query: 'romantic love songs' },
        { id: 'party', title: 'Party', icon: <Sparkles size={18} />, query: 'party hits' },
        { id: 'focus', title: 'Focus', icon: <Headphones size={18} />, query: 'lofi study focus' },
        { id: 'chill', title: 'Chill', icon: <Moon size={18} />, query: 'chill vibes' },
        { id: 'sleep', title: 'Sleep', icon: <Moon size={18} />, query: 'sleep music' },
        { id: 'devotional', title: 'Devotional', icon: <Music size={18} />, query: 'devotional bhajan' },
        { id: 'jazz', title: 'Jazz', icon: <Music size={18} />, query: 'jazz' },
        { id: 'classical', title: 'Classical', icon: <Music size={18} />, query: 'indian classical' },
    ];


    return (
        <div className="p-4 md:p-6 lg:p-8 pb-32 pt-4 md:pt-8 min-h-screen max-w-[1700px] mx-auto overflow-x-hidden">
            <div className="sticky top-0 z-30 bg-[var(--background)]/95 backdrop-blur-xl pb-4 pt-2 md:pt-0 md:static md:bg-transparent md:pb-0">
                <div className="relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${query ? 'text-cyan-400' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'}`} size={18} />
                    <input
                        type="text"
                        placeholder="What do you want to listen to?"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className={`w-full bg-[#242424] border-none rounded-full py-3 md:py-3.5 pl-11 md:pl-12 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-[#a7a7a7] text-sm md:text-base shadow-2xl ${isFocused ? 'bg-[#2a2a2a]' : ''}`}
                    />
                    {query && (
                        <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 md:p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-full transition-all">
                            <X size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                    )}
                </div>

                {query && results && (
                    <div className="flex gap-2 mt-4 md:mt-6 overflow-x-auto no-scrollbar py-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap border ${activeTab === tab.id
                                    ? 'bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/20'
                                    : 'bg-[var(--card)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--foreground-muted)]/30 hover:bg-[var(--card-hover)]'
                                    }`}
                            >
                                <span className="md:w-3.5 md:h-3.5">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Conditional Display: History vs Categories */}
            {query === '' && (
                <div className="mt-8">
                    {isFocused ? (
                        /* Search History - Shown ONLY when focused */
                        <div key="recent" className="animate-slide-up">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold flex items-center gap-2.5 text-[var(--foreground)]">
                                    <Clock className="text-[var(--foreground-muted)]" size={18} /> Recent
                                </h2>
                                {searchPlayedSongs.length > 0 && (
                                    <button
                                        onClick={clearSearchHistory}
                                        className="text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {searchPlayedSongs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                    {searchPlayedSongs.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => playFromHistory(song)}
                                            className="flex items-center gap-3.5 p-2.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer group transition-colors"
                                        >
                                            <div className="relative w-11 h-11 flex-shrink-0">
                                                <img src={song.image} onError={onImgError} className="w-full h-full rounded-md object-cover shadow-sm shadow-black/30" />
                                                <div className="absolute inset-0 rounded-md bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Play size={14} fill="white" className="text-white ml-0.5" />
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h3 className="font-medium text-sm text-[var(--foreground)] truncate">{decodeHtml(song.name)}</h3>
                                                <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{decodeHtml(song.artist)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeSearchPlayedSong(song.id); }}
                                                aria-label="Remove from recent"
                                                className="p-1.5 rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-all"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--foreground-muted)]">
                                    <Clock size={40} className="mb-3 opacity-50" />
                                    <p className="text-sm">Songs you play from search show up here</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Clean, personalised browse — recent plays + monochrome categories */
                        <div key="browse" className="space-y-8 animate-slide-up">
                            {/* Recently played (personalised) */}
                            {searchPlayedSongs.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-lg font-bold text-[var(--foreground)]">Recently played</h2>
                                        <button onClick={clearSearchHistory} className="text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Clear</button>
                                    </div>
                                    <div>
                                        {searchPlayedSongs.slice(0, 6).map((song) => (
                                            <div
                                                key={song.id}
                                                onClick={() => playFromHistory(song)}
                                                className="flex items-center gap-3 py-1.5 px-1.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer group transition-colors"
                                            >
                                                <img src={song.image} onError={onImgError} className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-[var(--card)]" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-[15px] text-[var(--foreground)] truncate leading-tight">{song.name}</p>
                                                    <p className="text-[13px] text-[var(--foreground-muted)] truncate mt-0.5">{song.artist}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeSearchPlayedSong(song.id); }}
                                                    aria-label="Remove"
                                                    className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-all"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trending now — real JioSaavn songs, compact rail (tap a tile to play) */}
                            {trendingNow.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">Trending now</h2>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                                        {trendingNow.map((song) => (
                                            <button
                                                key={song.id}
                                                onClick={() => playFromSearch(song, trendingNow)}
                                                className="w-[108px] shrink-0 text-left group"
                                            >
                                                <div className="relative w-[108px] h-[108px] rounded-lg overflow-hidden bg-[var(--card)] shadow-sm">
                                                    <img src={getImg(song)} onError={onImgError} className="w-full h-full object-cover" alt="" loading="lazy" />
                                                    <div className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-[var(--foreground)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                                        <Play size={14} className="text-[var(--background)] ml-0.5" fill="currentColor" />
                                                    </div>
                                                </div>
                                                <p className="text-[13px] font-semibold text-[var(--foreground)] truncate mt-1.5">{getName(song)}</p>
                                                <p className="text-[11px] text-[var(--foreground-muted)] truncate">{getArtistName(song)}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Browse — clean monochrome categories (no rainbow tiles) */}
                            <div>
                                <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">Browse</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                    {browseCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => router.push(`/category/${cat.id}`)}
                                            className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)] active:scale-[0.98] transition-all text-left"
                                        >
                                            <span className="text-[var(--foreground-muted)] shrink-0">{cat.icon}</span>
                                            <span className="text-sm font-semibold text-[var(--foreground)] truncate">{cat.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
            }


            {
                loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-cyan-400 gap-4">
                        <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full shadow-lg shadow-cyan-500/20"></div>
                        <p className="text-[var(--foreground-muted)] font-medium animate-pulse">Scanning the airwaves...</p>
                    </div>
                )
            }

            {
                !loading && query && results && (
                    <div className="mt-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Auto-correction notice: we fixed a typo and searched the corrected term */}
                        {correctedFrom && (
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[var(--foreground-muted)]">
                                <span>Showing results for</span>
                                <span className="text-[var(--foreground)] font-semibold">{correctedFrom.to}</span>
                                <span className="text-[var(--foreground-muted)]/50">·</span>
                                <button
                                    onClick={() => { skipNextCorrectionRef.current = true; setCorrectedFrom(null); setQuery(correctedFrom.from); }}
                                    className="text-[var(--accent)] hover:underline font-medium"
                                >
                                    Search instead for &ldquo;{correctedFrom.from}&rdquo;
                                </button>
                            </div>
                        )}
                        {/* Did you mean? suggestions when results are poor */}
                        {didYouMeanOptions.length > 0 && (
                            <div className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-sm text-[var(--foreground-muted)] mb-2 flex items-center gap-2">
                                    <Search size={14} className="text-cyan-400" />
                                    Did you mean:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {didYouMeanOptions.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setQuery(option.query)}
                                            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-all hover:scale-105"
                                        >
                                            {option.query}
                                            {option.artist && <span className="text-[var(--foreground-muted)] ml-1">• {option.artist}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Spotify-Style Top Result Card - Mobile optimized */}
                        {activeTab === 'all' && processedSongs.songs.length > 0 && (() => {
                            const topSong = processedSongs.songs[0]?.song;
                            if (!topSong) return null;
                            // Don't crown a "Top Result" for short/ambiguous input (e.g. "s").
                            // Show it once the query is a real name (>=3 chars) AND the top
                            // song's title actually matches what was typed — a direct string
                            // check that works for ANY song (not just curated/trending ones),
                            // so e.g. "saiyaara" still gets its Top Result.
                            const _norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                            const _q = _norm(query);
                            const _t = _norm(getName(topSong));
                            // "Strong" = the query clearly points at THIS title: exact, or one is a
                            // prefix of the other (you're typing the song's name). Loose mid-string
                            // matches are excluded so the Top Result never feels random — matching
                            // songs still appear first in the list below regardless.
                            // YouTube search is already relevance-ranked AND its titles carry
                            // decorations ("(From …)", "(feat …)") that break the strict
                            // prefix check — so for YouTube we trust the first result as the
                            // Top Result (also accept a contains-match for either source).
                            const strongMatch = musicSource === 'youtube'
                                ? (!!_q && !!_t)
                                : (!!_q && !!_t && (_t === _q || _t.startsWith(_q) || _q.startsWith(_t)));
                            if (query.trim().length < 3 || !strongMatch) return null;

                            return (
                                <div className="space-y-6">
                                    {/* Mobile: Full-width top result card */}
                                    <div className="block lg:hidden">
                                        <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-3">Top Result</p>
                                        <div
                                            onClick={() => playFromSearch(topSong, processedSongs.songs.map(s => s.song))}
                                            className="relative flex gap-4 p-4 bg-gradient-to-r from-[var(--card)] to-cyan-900/10 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
                                        >
                                            {/* Large Album Art for Mobile */}
                                            <img
                                                src={getImg(topSong)}
                                                onError={onImgError}
                                                alt={getName(topSong)}
                                                className="w-20 h-20 rounded-xl object-cover shadow-xl"
                                            />
                                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                                <h2 className="text-xl font-black text-[var(--foreground)] truncate">
                                                    {getName(topSong)}
                                                </h2>
                                                <p className="text-sm text-[var(--foreground-muted)] truncate mt-0.5">
                                                    {getArtistName(topSong)}
                                                </p>
                                                <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full w-fit mt-2">
                                                    Song
                                                </span>
                                            </div>
                                            {/* Always visible play button on mobile */}
                                            <button className="self-center w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                                                <Play size={22} fill="black" className="text-black ml-0.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Desktop: Side-by-side layout */}
                                    <div className="hidden lg:grid lg:grid-cols-[1fr_1.5fr] gap-6">
                                        {/* Top Result Card - Desktop */}
                                        <div className="group relative">
                                            <div
                                                onClick={() => playFromSearch(topSong, processedSongs.songs.map(s => s.song))}
                                                className="relative p-5 bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-cyan-900/20 hover:to-cyan-800/30 rounded-xl cursor-pointer transition-all duration-300 h-full min-h-[200px]"
                                            >
                                                <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-4">Top Result</p>

                                                <div className="flex items-end gap-4 h-full">
                                                    <div className="relative flex-shrink-0">
                                                        <img
                                                            src={getImg(topSong)}
                                                            onError={onImgError}
                                                            alt={getName(topSong)}
                                                            className="w-28 h-28 rounded-lg object-cover shadow-2xl"
                                                        />
                                                    </div>
                                                    <div className="flex-1 pb-1">
                                                        <h2 className="text-3xl font-black text-[var(--foreground)] line-clamp-2 mb-1">
                                                            {getName(topSong)}
                                                        </h2>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm text-[var(--foreground-muted)]">
                                                                {getArtistName(topSong)}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 bg-[var(--background)] rounded-full text-[var(--foreground-muted)]">
                                                                Song
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Play Button - Appears on hover (desktop) */}
                                                <button
                                                    className="absolute bottom-4 right-4 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-xl shadow-cyan-500/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-cyan-400"
                                                >
                                                    <Play size={24} fill="black" className="text-black ml-0.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Songs list next to Top Result (desktop only) */}
                                        <div>
                                            <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-4">Songs</p>
                                            <div className="space-y-1">
                                                {processedSongs.songs.slice(1, 5).map((ps) => (
                                                    <div
                                                        key={ps.song.id}
                                                        onClick={() => playFromSearch(ps.song, processedSongs.songs.map(s => s.song))}
                                                        onMouseEnter={() => prefetchYtStream(ps.song)}
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--card)] cursor-pointer group/item transition-colors"
                                                    >
                                                        <img src={getImg(ps.song)} onError={onImgError} className="w-10 h-10 rounded object-cover" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-[var(--foreground)] truncate">{getName(ps.song)}</p>
                                                            <p className="text-xs text-[var(--foreground-muted)] truncate">{ps.artistName}</p>
                                                        </div>
                                                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <Play size={16} className="text-[var(--foreground)]" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {activeTab !== 'all' && (
                            <button
                                onClick={() => setActiveTab('all')}
                                className="flex items-center gap-2 text-cyan-400 font-bold hover:gap-3 transition-all group"
                            >
                                <ChevronRight size={20} className="rotate-180" />
                                Back to All Results
                            </button>
                        )}

                        {/* Artists Section */}
                        {activeTab === 'artists' && results?.artists?.results?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                        <User className="text-cyan-400" /> Artists
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-5">
                                    {results.artists.results.map((artist: any) => (
                                        <div
                                            key={artist.id}
                                            onClick={() => handleArtistClick(artist.id)}
                                            className="flex flex-col items-center text-center group cursor-pointer"
                                        >
                                            <div className="relative aspect-square w-full mb-3 rounded-full overflow-hidden bg-[#181818] shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                                <img src={getImg(artist)} onError={onImgError} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-bold text-sm md:text-base text-[var(--foreground)] group-hover:underline transition-colors truncate w-full">{getName(artist)}</h3>
                                            <p className="text-xs text-[var(--foreground-muted)] mt-1">Artist</p>
                                        </div>
                                    ))}
                                </div>
                                {loadingMore && (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Songs Section - Uses deduplicated results */}
                        {(activeTab === 'all' || activeTab === 'songs') && processedSongs.songs.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                        <Music className="text-cyan-400" /> Songs
                                        {processedSongs.songs.length !== results?.songs?.results?.length && (
                                            <span className="text-xs font-normal text-[var(--foreground-muted)] bg-[var(--card)] px-2 py-0.5 rounded-full">
                                                {processedSongs.songs.length} unique
                                            </span>
                                        )}
                                    </h2>
                                    {activeTab === 'all' && (
                                        <button onClick={() => setActiveTab('songs')} className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center gap-1.5 transition-all hover:scale-105">
                                            Show all <ChevronRight size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-0">
                                    {processedSongs.songs
                                        .slice(activeTab === 'all' ? 1 : 0, activeTab === 'all' ? 12 : processedSongs.songs.length)
                                        .map((ps) => (
                                            <div
                                                key={ps.song.id}
                                                onClick={() => playFromSearch(ps.song, processedSongs.songs.map(s => s.song))}
                                                onMouseEnter={() => prefetchYtStream(ps.song)}
                                                className="flex items-center gap-3 py-1.5 px-1.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                                            >
                                                <img src={getImg(ps.song)} onError={onImgError} className="w-12 h-12 rounded-md object-cover flex-shrink-0 shadow-sm bg-[var(--card)]" />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-[15px] text-[var(--foreground)] truncate leading-tight">{getName(ps.song)}</h3>
                                                    <p className="text-[13px] text-[var(--foreground-muted)] truncate mt-0.5">
                                                        Song • {ps.artistName}
                                                    </p>
                                                </div>
                                                <div className="pr-1 text-[var(--foreground-muted)] shrink-0" onClick={e => e.stopPropagation()}>
                                                    <SongContextMenu song={ps.song} queue={processedSongs.songs.map(s => s.song)} />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                                {activeTab !== 'all' && loadingMore && (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* You might also like — Last.fm similar to the top result */}
                        {activeTab === 'all' && similarSongs.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                        <Sparkles className="text-cyan-400" size={22} /> You might also like
                                    </h2>
                                </div>
                                <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                                    {similarSongs.map((s: any) => (
                                        <div
                                            key={`sim-${s.id || s.songId}`}
                                            onClick={() => playFromSearch(s, similarSongs)}
                                            className="group cursor-pointer w-36 md:w-44 flex-shrink-0"
                                        >
                                            <div className="relative aspect-square rounded-lg overflow-hidden mb-2.5 bg-[var(--surface)] shadow-lg">
                                                <img src={getImg(s)} onError={onImgError} alt={getName(s)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all" style={{ background: 'var(--accent)' }}>
                                                    <Play size={16} fill="#04161a" className="ml-0.5 text-[#04161a]" />
                                                </div>
                                            </div>
                                            <h3 className="font-semibold text-sm text-[var(--foreground)] truncate">{getName(s)}</h3>
                                            <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{getArtistName(s)}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Artists row on the All tab (Spotify-style: Songs -> Artists -> Albums) */}
                        {activeTab === 'all' && results?.artists?.results?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                        <User className="text-cyan-400" /> Artists
                                    </h2>
                                    <button onClick={() => setActiveTab('artists')} className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center gap-1.5 transition-all hover:scale-105">
                                        Show all <ChevronRight size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-5">
                                    {results.artists.results.slice(0, 7).map((artist: any) => (
                                        <div
                                            key={artist.id}
                                            onClick={() => handleArtistClick(artist.id)}
                                            className="flex flex-col items-center text-center group cursor-pointer"
                                        >
                                            <div className="relative aspect-square w-full mb-3 rounded-full overflow-hidden bg-[var(--surface)] shadow-lg transition-transform duration-300 group-hover:scale-105">
                                                <img src={getImg(artist)} onError={onImgError} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-semibold text-sm text-[var(--foreground)] group-hover:underline truncate w-full">{getName(artist)}</h3>
                                            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Artist</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Albums Section */}
                        {(activeTab === 'all' || activeTab === 'albums') && results?.albums?.results?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                        <Disc className="text-cyan-400" /> Albums
                                    </h2>
                                    {activeTab === 'all' && (
                                        <button onClick={() => setActiveTab('albums')} className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center gap-1.5 transition-all hover:scale-105">
                                            Show all <ChevronRight size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-5">
                                    {results.albums.results.slice(0, activeTab === 'all' ? 8 : results.albums.results.length).map((album: any) => (
                                        <div key={album.id} onClick={() => handleAlbumClick(album.id)} className="group cursor-pointer">
                                            <div className="relative aspect-square mb-3 overflow-hidden rounded-md bg-[#181818] shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                                <img src={getImg(album)} onError={onImgError} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-bold text-sm md:text-base text-[var(--foreground)] group-hover:underline transition-colors truncate">{getName(album)}</h3>
                                            <p className="text-xs text-[var(--foreground-muted)] truncate mt-1">{album.artist || album.year}</p>
                                        </div>
                                    ))}
                                </div>
                                {activeTab !== 'all' && loadingMore && (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Playlists Section */}
                        {(activeTab === 'all' || activeTab === 'playlists') && results?.playlists?.results?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                        <ListMusic className="text-cyan-400" /> Playlists
                                    </h2>
                                    {activeTab === 'all' && (
                                        <button onClick={() => setActiveTab('playlists')} className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center gap-1.5 transition-all hover:scale-105">
                                            Show all <ChevronRight size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-5">
                                    {results.playlists.results.slice(0, activeTab === 'all' ? 8 : results.playlists.results.length).map((playlist: any) => (
                                        <div key={playlist.id} onClick={() => handlePlaylistClick(playlist.id)} className="group cursor-pointer">
                                            <div className="relative aspect-square mb-3 overflow-hidden rounded-md bg-[#181818] shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                                <img src={getImg(playlist)} onError={onImgError} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-bold text-sm md:text-base text-[var(--foreground)] group-hover:underline transition-colors truncate">{getName(playlist)}</h3>
                                            <p className="text-xs text-[var(--foreground-muted)] truncate mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: playlist.description }}></p>
                                        </div>
                                    ))}
                                </div>
                                {activeTab !== 'all' && loadingMore && (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                )
            }

            {
                !loading && query && (!results || (
                    !results.songs?.results?.length &&
                    !results.artists?.results?.length &&
                    !results.albums?.results?.length &&
                    !results.playlists?.results?.length
                )) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center mb-6 border border-[var(--border)]">
                            <Search size={32} className="text-[var(--foreground-muted)]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">No results found for "{query}"</h3>
                        <p className="text-[var(--foreground-muted)] max-w-xs">Try searching for something else or check your spelling.</p>
                    </div>
                )
            }
        </div >
    );
}
