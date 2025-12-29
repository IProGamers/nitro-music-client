"use client"
import { useState, useEffect, useMemo } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, RefreshCw, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Stavan search categories
const STAVAN_CATEGORIES = [
    { name: 'Latest Stavans', query: 'latest jain stavan 2024 2025', emoji: '✨' },
    { name: 'Paryushan Special', query: 'paryushan stavan pratikraman', emoji: '🕉️' },
    { name: 'Morning Bhakti', query: 'jain morning stavan prabhatia', emoji: '🌅' },
    { name: 'Evening Aarti', query: 'jain sandhya aarti mangal deep', emoji: '🪔' },
    { name: 'Mahavir Swami', query: 'mahavir swami stavan bhajan', emoji: '🙏' },
    { name: 'Navkar Mantra', query: 'navkar mantra dhun', emoji: '📿' },
    { name: 'Popular Singers', query: 'vikram hazra shreyans shah jain bhajan', emoji: '🎤' },
    { name: 'Soulful Dhun', query: 'jain dhun peaceful mantra', emoji: '🧘' },
    { name: 'Legendary Classics', query: 'old old jain stavan hits legendary', emoji: '📻' },
    { name: 'Auspicious Bhakti', query: 'navpad oli stavan tirthankar bhakti', emoji: '🔱' },
];

const FAMOUS_STAVANS_QUERIES = [
    'jani kiki kali che stavan', // User requested specific spelling
    'jaini kiki kali che stavan',
    'maan maru mandiru stavan',
    'tu mane bhagwan ek vardaan api de',
    'o mara dev tame mara ho',
    'ek baar shri mahavir swami stavan',
    'shyam tulsini jaat stavan',
    'taro vaibhav rangmol ma stavan',
    'dada taro darbar stavan',
    'navkar mantra dhun',
    'bhagwan meri naiya stavan',
    'sankheswar parshwanath stavan',
    'girnar taro sadu stavan',
    'adijinvar aadeshwar stavan',
    'aaj mara mandiriya ma stavan'
];

interface Song {
    id: string;
    name: string;
    image?: any;
    artists?: any;
    downloadUrl?: any;
}

export default function ArihantHome() {
    const { playTrack } = usePlayer();
    const router = useRouter();
    const [categories, setCategories] = useState<{ name: string; emoji: string; songs: Song[] }[]>([]);
    const [famousSongs, setFamousSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Live Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [liveResults, setLiveResults] = useState<Song[]>([]);
    const [isSearchingLive, setIsSearchingLive] = useState(false);

    // Debounced Live Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setLiveResults([]);
                setIsSearchingLive(false);
                return;
            }

            setIsSearchingLive(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            try {
                // Relaxed search query to ensure results appear
                const q = `${searchQuery} jain stavan`;
                const res = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(q)}&limit=10`);
                const data = await res.json();
                if (data.success && data.data?.results) {
                    setLiveResults(data.data.results);
                }
            } catch (e) {
                console.error('Live search failed:', e);
            }
            setIsSearchingLive(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch stavans
    useEffect(() => {
        const fetchStavans = async () => {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            try {
                // Fetch Famous Stavans specifically
                // Shuffle queries to get different set each time
                const shuffledQueries = [...FAMOUS_STAVANS_QUERIES].sort(() => Math.random() - 0.5).slice(0, 8);
                const famousResults = await Promise.all(
                    shuffledQueries.map(q =>
                        fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(q)}&limit=5`)
                            .then(r => r.json())
                            .then(d => d.success ? d.data.results : [])
                    )
                );

                // Flatten and remove duplicates by ID
                const flatFamous = famousResults.flat();
                const uniqueFamous = Array.from(new Map(flatFamous.map(s => [s.id, s])).values());
                // Shuffle the final list for randomness
                const finalFamous = uniqueFamous.sort(() => Math.random() - 0.5);
                setFamousSongs(finalFamous.slice(0, 40)); // Keep more songs for the queue

                // Fetch Category Stavans
                const shuffledCategories = [...STAVAN_CATEGORIES].sort(() => Math.random() - 0.5).slice(0, 8);
                const results = await Promise.all(
                    shuffledCategories.map(async (cat) => {
                        try {
                            const res = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(cat.query)}&limit=10`);
                            const data = await res.json();
                            if (data.success && data.data?.results) {
                                return { name: cat.name, emoji: cat.emoji, songs: data.data.results };
                            }
                        } catch (e) {
                            console.error('Failed to fetch', cat.name, e);
                        }
                        return { name: cat.name, emoji: cat.emoji, songs: [] };
                    })
                );

                setCategories(results.filter(r => r.songs.length > 0));
            } catch (error) {
                console.error('Data fetch error:', error);
            }
            setLoading(false);
        };

        fetchStavans();
    }, [refreshKey]);

    const getImg = (song: Song) => {
        if (!song) return '';
        if (song.image && Array.isArray(song.image) && song.image.length) {
            return song.image[song.image.length - 1]?.url || song.image[song.image.length - 1]?.link || '';
        }
        return '';
    };

    const getArtist = (song: Song) => {
        if (song.artists?.primary?.[0]?.name) return song.artists.primary[0].name;
        return 'Jain Stavan';
    };

    const handlePlay = (song: Song, allSongs: Song[]) => {
        playTrack(song, allSongs);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white/60 text-base font-medium">🙏 Jai Jinendra</p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-2 space-y-6">
            {/* Greeting Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-orange-400">Jai Jinendra 🙏</h1>
                    <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Have a peaceful day!</p>
                </div>
                <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    className="p-2 bg-orange-500/10 text-orange-400 rounded-xl active:scale-90 transition-transform"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Search Bar Interactive */}
            <div className="relative group">
                <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-orange-500' : 'text-orange-400/50'}`} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for Stavans, Bhakti..."
                    className="w-full pl-12 pr-10 py-3 bg-[#1a1a2f] border border-white/5 rounded-xl text-white text-sm font-medium transition-all focus:outline-none focus:border-orange-500/50 focus:bg-[#252545] placeholder:text-white/20"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Live Search Results Section */}
            {searchQuery.trim().length >= 2 && (
                <section className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🔍</span>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Search Results</h2>
                        </div>
                        {isSearchingLive && <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {liveResults.length > 0 ? (
                            liveResults.map((song, idx) => (
                                <button
                                    key={song.id || idx}
                                    onClick={() => handlePlay(song, liveResults)}
                                    className="flex items-center gap-3 p-2 bg-[#252545] border border-orange-500/20 rounded-xl text-left active:scale-[0.98] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-orange-500/10 shrink-0">
                                        {getImg(song) ? (
                                            <img src={getImg(song)} alt={song.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">🙏</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[11px] font-bold text-white truncate">{song.name}</h3>
                                        <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold mt-0.5">{getArtist(song)}</p>
                                    </div>
                                    <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center">
                                        <Play size={12} className="text-orange-500 ml-0.5" fill="currentColor" />
                                    </div>
                                </button>
                            ))
                        ) : !isSearchingLive && (
                            <div className="py-8 text-center bg-[#1a1a2f] rounded-xl border border-white/5">
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest">No results found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                    <div className="h-px bg-white/5 my-6" />
                </section>
            )}

            <section>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">📿</span>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Daily Bhakti</h2>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {famousSongs.slice(0, 5).map((song, idx) => (
                        <button
                            key={song.id || idx}
                            onClick={() => handlePlay(song, famousSongs)}
                            className="flex items-center gap-3 p-2 bg-[#1a1a2f] hover:bg-[#252545] border border-white/5 rounded-xl text-left active:scale-[0.98] transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-orange-500/10 shrink-0">
                                {getImg(song) ? (
                                    <img src={getImg(song)} alt={song.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl">🙏</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[11px] font-bold text-white truncate">{song.name}</h3>
                                <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold mt-0.5">{getArtist(song)}</p>
                            </div>
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                <Play size={14} className="text-white ml-0.5" fill="white" />
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Category Sections */}
            {categories.map((category, catIdx) => (
                <section key={catIdx}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="text-lg">{category.emoji}</span>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">{category.name}</h2>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                        {category.songs.map((song, idx) => (
                            <button
                                key={song.id || idx}
                                onClick={() => handlePlay(song, category.songs)}
                                className="w-[140px] shrink-0 group active:scale-[0.97] transition-all text-left"
                            >
                                <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-[#1a1a2f] border border-white/5">
                                    {getImg(song) ? (
                                        <img src={getImg(song)} alt={song.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">🙏</div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
                                            <Play size={12} className="text-white ml-0.5" fill="white" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="font-bold text-white text-[11px] truncate px-1">{song.name}</h3>
                                <p className="text-white/40 text-[9px] truncate px-1 uppercase tracking-tighter mt-0.5">{getArtist(song)}</p>
                            </button>
                        ))}
                    </div>
                </section>
            ))}

            {/* Empty State */}
            {categories.length === 0 && !loading && (
                <div className="text-center py-12 bg-[#1a1a2f] rounded-2xl border border-orange-500/10">
                    <p className="text-white/40 text-sm">No results found. Try again.</p>
                    <button
                        onClick={() => setRefreshKey(k => k + 1)}
                        className="mt-4 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
                    >
                        🙏 Refresh
                    </button>
                </div>
            )}
        </div>
    );
}


