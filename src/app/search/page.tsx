"use client"
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Search, Clock, X, Music, User, Disc, ListMusic, ChevronRight, Trash2, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SongContextMenu from '@/components/SongContextMenu';
import { useMusicData } from '@/context/MusicDataContext';
import { getDidYouMeanSuggestions } from '@/lib/fuzzySearch';
import { processSearchResults, rankByRelevance, type ProcessedSong, type GroupedSearchResults } from '@/lib/searchUtils';
import { reRankByTrending, getTopResultConfidence, getTrendingSongForQuery } from '@/lib/trendingSongs';

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

export default function SearchPage() {
    const { playTrack } = usePlayer();
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
    const { searchCache } = useMusicData();

    // Smart search state - only for "Did you mean?" suggestions
    const [didYouMeanOptions, setDidYouMeanOptions] = useState<{ query: string; artist: string; confidence: number }[]>([]);

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            // Reset active tab to 'all' when query changes significantly? 
            // Better to keep it if the user is refining their search in a category
        }, 400); // 400ms delay for debouncing

        return () => clearTimeout(timer);
    }, [query]);

    // Handle actual search when debounced query changes
    useEffect(() => {
        const q = debouncedQuery.trim();
        if (q === '') {
            setResults(null);
            setLoading(false);
            setDidYouMeanOptions([]);
            return;
        }

        // Reset "Did you mean?" options for new search
        setDidYouMeanOptions([]);

        // Check cache first
        if (searchCache.has(q)) {
            setResults(searchCache.get(q)!);
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

                // Check if this is a trending song search
                const trendingSong = getTrendingSongForQuery(q);

                // Make primary search
                const res = await fetch(`${apiUrl}/api/search?query=${encodeURIComponent(q)}`, {
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
                        songResults = rankByRelevance(songResults, q);
                        songResults = reRankByTrending(songResults, q);
                    }

                    data.data.songs.results = songResults;
                    setResults(data.data);
                    // Save to cache (with re-ranked results)
                    searchCache.set(q, data.data);

                    // Default to 'all' tab so users see the summary first
                    setActiveTab('all');

                    // Only show "Did you mean?" when there are NO song results at all
                    const songCount = songResults.length;

                    // Only suggest alternatives if we have ZERO songs and query is long enough
                    if (songCount === 0 && q.length >= 4) {
                        const suggestions = getDidYouMeanSuggestions(q, 3);
                        // Only show if we have very confident suggestions (70%+)
                        const goodSuggestions = suggestions.filter(s => s.confidence >= 70);
                        setDidYouMeanOptions(goodSuggestions);
                    }
                }
            } catch (e: any) {
                if (e.name !== 'AbortError') {
                    console.error('Search error:', e);
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
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                // Using a higher limit for category-specific view
                const res = await fetch(`${apiUrl}/api/search/${activeTab}?query=${encodeURIComponent(q)}&limit=50`, {
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
                if (e.name !== 'AbortError') {
                    console.error(`Error fetching more ${activeTab}:`, e);
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

    // Play song from search results AND save to search history
    const playFromSearch = (song: any, queue: any[]) => {
        saveToSearchHistory(song);
        playTrack(song, queue);
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
        playTrack(trackData, searchPlayedSongs.map(s => ({
            id: s.id,
            name: s.name,
            artist: s.artist,
            image: s.image,
            audioUrl: s.audioUrl
        })));
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

    const getArtistName = (t: any) => {
        if (t.artists?.primary?.length) return t.artists.primary[0].name;
        if (t.primaryArtists) return t.primaryArtists;
        if (t.artist) return t.artist;
        return 'Unknown Artist';
    };

    // Process and deduplicate songs
    const processedSongs = useMemo((): GroupedSearchResults => {
        if (!results?.songs?.results) {
            return { topResult: null, songs: [], songsByArtist: new Map(), uniqueArtists: [] };
        }
        return processSearchResults(results.songs.results);
    }, [results?.songs?.results]);

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

    const categories = [
        { id: 'pop', title: 'Pop', color: 'bg-pink-600', query: 'pop hits' },
        { id: 'hip-hop', title: 'Hip Hop', color: 'bg-orange-600', query: 'hip hop' },
        { id: 'rock', title: 'Rock', color: 'bg-red-700', query: 'rock' },
        { id: 'bollywood', title: 'Bollywood', color: 'bg-yellow-600', query: 'bollywood' },
        { id: 'punjabi', title: 'Punjabi', color: 'bg-blue-600', query: 'punjabi hits' },
        { id: 'edm', title: 'EDM', color: 'bg-purple-600', query: 'edm' },
        { id: 'romance', title: 'Romance', color: 'bg-rose-500', query: 'romance' },
        { id: 'focus', title: 'Focus', color: 'bg-indigo-600', query: 'lofi study' },
        { id: 'party', title: 'Party', color: 'bg-cyan-600', query: 'party hits' },
        { id: 'sleep', title: 'Sleep', color: 'bg-slate-700', query: 'sleep music' },
        { id: 'jazz', title: 'Jazz', color: 'bg-amber-800', query: 'jazz' },
        { id: 'classical', title: 'Classical', color: 'bg-emerald-800', query: 'classical' },
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
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isFocused ? (
                        /* Search History - Shown ONLY when focused */
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-3 text-[var(--foreground)]">
                                    <Clock className="text-cyan-400" size={20} /> Recently Played
                                </h2>
                                {searchPlayedSongs.length > 0 && (
                                    <button
                                        onClick={clearSearchHistory}
                                        className="text-xs font-bold text-[var(--foreground-muted)] hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={14} />
                                        Clear
                                    </button>
                                )}
                            </div>

                            {searchPlayedSongs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {searchPlayedSongs.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => playFromHistory(song)}
                                            className="flex items-center gap-3 p-2 rounded-xl bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] hover:border-cyan-500/30 cursor-pointer group transition-all"
                                        >
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                                <img src={song.image} className="w-full h-full rounded-lg object-cover" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h3 className="font-bold text-xs text-[var(--foreground)] group-hover:text-cyan-400 transition-colors truncate">{song.name}</h3>
                                                <p className="text-[9px] text-[var(--foreground-muted)] truncate mt-0.5">{song.artist}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors" />
                                            <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <SongContextMenu song={song} queue={searchPlayedSongs} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <Clock size={48} className="mb-4" />
                                    <p className="text-sm font-medium">Your recent searches will appear here</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Browse Categories - Shown by default when NOT focused */
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 md:mb-6">Browse All</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4 lg:gap-5">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            // Simply set the query to trigger song search
                                            setQuery(cat.query);
                                            setActiveTab('songs');
                                        }}
                                        className={`${cat.color} relative aspect-[16/9] md:aspect-square rounded-xl md:rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-xl`}
                                    >
                                        <div className="p-3 md:p-4 text-left h-full">
                                            <h3 className="text-base md:text-xl lg:text-2xl font-bold text-white tracking-tighter leading-tight drop-shadow-md">
                                                {cat.title}
                                            </h3>
                                        </div>
                                        {/* Abstract background shape for premium look */}
                                        <div className="absolute -bottom-4 -right-4 w-24 h-24 md:w-32 md:h-32 bg-white/20 rotate-12 group-hover:rotate-45 transition-transform duration-700 blur-2xl rounded-full" />
                                        <div className="absolute -top-12 -right-8 w-24 h-24 md:w-32 md:h-32 bg-black/10 -rotate-12 group-hover:-rotate-45 transition-transform duration-700 blur-xl rounded-full" />

                                        {/* Play icon mask on hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                            <Search className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300" size={32} />
                                        </div>
                                    </button>
                                ))}
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
                            const { isConfident, confidence } = getTopResultConfidence(topSong, query);

                            if (!isConfident || confidence < 75) return null;

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
                                                alt={topSong.title || topSong.name}
                                                className="w-20 h-20 rounded-xl object-cover shadow-xl"
                                            />
                                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                                <h2 className="text-xl font-black text-[var(--foreground)] truncate">
                                                    {topSong.title || topSong.name}
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
                                                            alt={topSong.title || topSong.name}
                                                            className="w-28 h-28 rounded-lg object-cover shadow-2xl"
                                                        />
                                                    </div>
                                                    <div className="flex-1 pb-1">
                                                        <h2 className="text-3xl font-black text-[var(--foreground)] line-clamp-2 mb-1">
                                                            {topSong.title || topSong.name}
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
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--card)] cursor-pointer group/item transition-colors"
                                                    >
                                                        <img src={getImg(ps.song)} className="w-10 h-10 rounded object-cover" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-[var(--foreground)] truncate">{ps.song.title || ps.song.name}</p>
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
                                                <img src={getImg(artist)} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-bold text-sm md:text-base text-[var(--foreground)] group-hover:underline transition-colors truncate w-full">{artist.title || artist.name}</h3>
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

                                {/* Top Result with "More by this artist" - Only show on 'all' tab */}
                                {activeTab === 'all' && processedSongs.topResult && processedSongs.uniqueArtists[0]?.songCount > 1 && (
                                    <div className="mb-6 p-4 bg-gradient-to-r from-[var(--card)] to-transparent border border-[var(--border)] rounded-2xl">
                                        <div className="flex items-start gap-4">
                                            {/* Top song */}
                                            <div
                                                onClick={() => playFromSearch(processedSongs.topResult!.song, processedSongs.songs.map(s => s.song))}
                                                className="flex items-center gap-4 flex-1 cursor-pointer group"
                                            >
                                                <div className="relative w-16 h-16 flex-shrink-0">
                                                    <img src={getImg(processedSongs.topResult.song)} className="w-full h-full rounded-lg object-cover shadow-xl" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">Top Result</p>
                                                    <h3 className="font-bold text-lg text-[var(--foreground)] truncate group-hover:text-cyan-400 transition-colors">
                                                        {processedSongs.topResult.song.title || processedSongs.topResult.song.name}
                                                    </h3>
                                                    <p className="text-sm text-[var(--foreground-muted)] truncate">
                                                        {processedSongs.topResult.artistName}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* More by this artist */}
                                        {processedSongs.uniqueArtists[0]?.songCount > 1 && (
                                            <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                                <p className="text-xs text-[var(--foreground-muted)] mb-2">
                                                    More by <span className="text-cyan-400">{processedSongs.topResult.artistName}</span>
                                                </p>
                                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                                    {processedSongs.songs
                                                        .filter(s => s.artistName.toLowerCase() === processedSongs.topResult!.artistName.toLowerCase() && s.song.id !== processedSongs.topResult!.song.id)
                                                        .slice(0, 4)
                                                        .map((ps) => (
                                                            <div
                                                                key={ps.song.id}
                                                                onClick={() => playFromSearch(ps.song, processedSongs.songs.map(s => s.song))}
                                                                className="flex items-center gap-2 px-3 py-2 bg-[var(--background)] rounded-lg cursor-pointer hover:bg-[var(--card-hover)] transition-colors flex-shrink-0"
                                                            >
                                                                <img src={getImg(ps.song)} className="w-8 h-8 rounded object-cover" />
                                                                <span className="text-sm text-[var(--foreground)] truncate max-w-[120px]">
                                                                    {ps.song.title || ps.song.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-1">
                                    {processedSongs.songs
                                        .slice(activeTab === 'all' ? 1 : 0, activeTab === 'all' ? 12 : processedSongs.songs.length)
                                        .map((ps) => (
                                            <div
                                                key={ps.song.id}
                                                onClick={() => playFromSearch(ps.song, processedSongs.songs.map(s => s.song))}
                                                className="flex items-center gap-3 p-2 rounded-xl bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] hover:border-cyan-500/30 cursor-pointer group transition-all"
                                            >
                                                <div className="relative w-10 h-10 flex-shrink-0">
                                                    <img src={getImg(ps.song)} className="w-full h-full rounded object-cover shadow-lg" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h3 className="font-bold text-sm text-[var(--foreground)] truncate">{ps.song.title || ps.song.name}</h3>
                                                    <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">
                                                        {ps.artistName}
                                                    </p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2" onClick={e => e.stopPropagation()}>
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
                                                <img src={getImg(album)} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-bold text-sm md:text-base text-[var(--foreground)] group-hover:underline transition-colors truncate">{album.title || album.name}</h3>
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
                                                <img src={getImg(playlist)} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-bold text-sm md:text-base text-[var(--foreground)] group-hover:underline transition-colors truncate">{playlist.title || playlist.name}</h3>
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
