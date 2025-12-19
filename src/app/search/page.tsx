"use client"
import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Search, Clock, X, Music, User, Disc, ListMusic, ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SongContextMenu from '@/components/SongContextMenu';
import { useMusicData } from '@/context/MusicDataContext';

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
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const searchAbortControllerRef = useRef<AbortController | null>(null);
    const { searchCache } = useMusicData();

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 400); // 400ms delay for debouncing

        return () => clearTimeout(timer);
    }, [query]);

    // Handle actual search when debounced query changes
    useEffect(() => {
        const q = debouncedQuery.trim();
        if (q === '') {
            setResults(null);
            setLoading(false);
            return;
        }

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
                const res = await fetch(`${apiUrl}/api/search?query=${encodeURIComponent(q)}`, {
                    signal: controller.signal
                });
                const data = await res.json();

                if (data.success) {
                    setResults(data.data);
                    // Save to cache
                    searchCache.set(q, data.data);

                    // Auto-switching tab logic
                    if (q.length <= 4) {
                        setActiveTab('songs');
                    } else {
                        const hasStrongArtistMatch = data.data.artists?.results?.some(
                            (a: any) => a.title.toLowerCase().includes(q.toLowerCase()) ||
                                q.toLowerCase().includes(a.title.toLowerCase())
                        );

                        if (hasStrongArtistMatch && q.length > 5) {
                            setActiveTab('all');
                        } else {
                            setActiveTab('songs');
                        }
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SEARCH_PLAYED_KEY);
            if (saved) {
                setSearchPlayedSongs(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load search played songs:', e);
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

    // Clear search played history
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
        <div className="p-4 md:p-8 pb-32 pt-20 md:pt-8 min-h-screen max-w-7xl mx-auto overflow-x-hidden">
            <div className="sticky top-0 z-30 bg-[var(--background)]/90 backdrop-blur-2xl pb-4 md:static md:bg-transparent md:pb-0">
                <div className="relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${query ? 'text-cyan-400' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search for songs, artists, or albums..."
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className={`w-full bg-[var(--card)] border border-[var(--border)] rounded-xl md:rounded-2xl py-3 md:py-4 pl-11 md:pl-12 pr-10 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-[var(--card-hover)] transition-all placeholder:text-[var(--foreground-muted)] text-base md:text-lg shadow-2xl ${isFocused ? 'ring-2 ring-cyan-500/30 bg-[var(--card-hover)]' : ''}`}
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
                                    <Clock className="text-cyan-400" size={20} /> Recently Searched
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
                            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-6">Browse All</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setQuery(cat.query)}
                                        className={`${cat.color} relative aspect-[16/9] md:aspect-square rounded-xl md:rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-xl`}
                                    >
                                        <div className="p-4 md:p-6 text-left h-full">
                                            <h3 className="text-lg md:text-2xl font-bold text-white tracking-tighter leading-tight drop-shadow-md">
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
            )}


            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-cyan-400 gap-4">
                    <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full shadow-lg shadow-cyan-500/20"></div>
                    <p className="text-[var(--foreground-muted)] font-medium animate-pulse">Scanning the airwaves...</p>
                </div>
            )}

            {!loading && query && results && (
                <div className="mt-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Artists Section */}
                    {(activeTab === 'all' || activeTab === 'artists') && results.artists?.results?.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                    <User className="text-cyan-400" /> Artists
                                </h2>
                                {activeTab === 'all' && (
                                    <button onClick={() => setActiveTab('artists')} className="text-sm font-bold text-cyan-400 hover:underline flex items-center">
                                        View All <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                                {results.artists.results.slice(0, activeTab === 'all' ? 6 : 24).map((artist: any) => (
                                    <div
                                        key={artist.id}
                                        onClick={() => handleArtistClick(artist.id)}
                                        className="flex flex-col items-center text-center group cursor-pointer"
                                    >
                                        <div className="relative aspect-square w-full mb-4 rounded-full overflow-hidden bg-[var(--card)] border-2 border-transparent group-hover:border-cyan-400/50 transition-all shadow-xl group-hover:shadow-cyan-500/10">
                                            <img src={getImg(artist)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        </div>
                                        <h3 className="font-bold text-[var(--foreground)] group-hover:text-cyan-400 transition-colors truncate w-full">{artist.title}</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1 uppercase tracking-wider">{artist.type}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Songs Section - Uses playFromSearch to save to history */}
                    {(activeTab === 'all' || activeTab === 'songs') && results.songs?.results?.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                    <Music className="text-cyan-400" /> Songs
                                </h2>
                                {activeTab === 'all' && (
                                    <button onClick={() => setActiveTab('songs')} className="text-sm font-bold text-cyan-400 hover:underline flex items-center">
                                        View All <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.songs.results.slice(0, activeTab === 'all' ? 6 : 50).map((song: any) => (
                                    <div
                                        key={song.id}
                                        onClick={() => playFromSearch(song, results.songs.results)}
                                        className="flex items-center gap-3 p-2 rounded-xl bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] hover:border-cyan-500/30 cursor-pointer group transition-all"
                                    >
                                        <div className="relative w-11 h-11 flex-shrink-0">
                                            <img src={getImg(song)} className="w-full h-full rounded-lg object-cover" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="font-bold text-xs md:text-sm text-[var(--foreground)] group-hover:text-cyan-400 transition-colors truncate">{song.title}</h3>
                                            <p className="text-[9px] md:text-xs text-[var(--foreground-muted)] truncate mt-0.5">{song.primaryArtists || song.album}</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                            <SongContextMenu song={song} queue={results.songs.results} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Albums Section */}
                    {(activeTab === 'all' || activeTab === 'albums') && results.albums?.results?.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                    <Disc className="text-cyan-400" /> Albums
                                </h2>
                                {activeTab === 'all' && (
                                    <button onClick={() => setActiveTab('albums')} className="text-sm font-bold text-cyan-400 hover:underline flex items-center">
                                        View All <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                                {results.albums.results.slice(0, activeTab === 'all' ? 6 : 30).map((album: any) => (
                                    <div key={album.id} onClick={() => handleAlbumClick(album.id)} className="group cursor-pointer">
                                        <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl bg-[var(--card)] shadow-xl group-hover:shadow-cyan-500/10 border border-[var(--border)]">
                                            <img src={getImg(album)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                                    <Disc className="text-black" size={20} />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-[var(--foreground)] group-hover:text-cyan-400 transition-colors truncate">{album.title}</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] truncate mt-1">{album.artist || album.year}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Playlists Section */}
                    {(activeTab === 'all' || activeTab === 'playlists') && results.playlists?.results?.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                    <ListMusic className="text-cyan-400" /> Playlists
                                </h2>
                                {activeTab === 'all' && (
                                    <button onClick={() => setActiveTab('playlists')} className="text-sm font-bold text-cyan-400 hover:underline flex items-center">
                                        View All <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                                {results.playlists.results.slice(0, activeTab === 'all' ? 6 : 30).map((playlist: any) => (
                                    <div key={playlist.id} onClick={() => handlePlaylistClick(playlist.id)} className="group cursor-pointer">
                                        <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl">
                                            <img src={getImg(playlist)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-tighter">
                                                Playlist
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-[var(--foreground)] group-hover:text-cyan-400 transition-colors truncate">{playlist.title}</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] truncate mt-1" dangerouslySetInnerHTML={{ __html: playlist.description }}></p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {!loading && query && (!results || (
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
                )}
        </div>
    )
}
