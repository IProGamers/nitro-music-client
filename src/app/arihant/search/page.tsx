"use client"
import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Search, Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Song {
    id: string;
    name: string;
    image?: any;
    artists?: any;
    downloadUrl?: any;
}

export default function ArihantSearch() {
    const { playTrack } = usePlayer();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Live search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!query.trim()) {
                setResults([]);
                setSearched(false);
                return;
            }

            setLoading(true);
            setSearched(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            try {
                // Auto-append jain stavan to search query (relaxed filtering)
                const searchQuery = `${query} jain stavan`;
                const res = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(searchQuery)}&limit=25`);
                const data = await res.json();

                if (data.success && data.data?.results) {
                    setResults(data.data.results);
                } else {
                    setResults([]);
                }
            } catch (e) {
                console.error('Search failed:', e);
                setResults([]);
            }

            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        // Live search handles this, but we keep it for form submission UX
    };

    const getImg = (song: Song) => {
        if (!song) return '';
        if (song.image && Array.isArray(song.image) && song.image.length) {
            return song.image[song.image.length - 1]?.url || song.image[song.image.length - 1]?.link || '';
        }
        return '';
    };

    const getArtist = (song: Song) => {
        if (song.artists?.primary?.[0]?.name) return song.artists.primary[0].name;
        return 'Unknown Artist';
    };

    const handlePlay = (song: Song) => {
        // Play with auto-queue of all results
        playTrack(song, results);
    };

    return (
        <div className="py-6">
            {/* Back Button */}
            <Link
                href="/arihant"
                className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-4 text-xs font-bold uppercase tracking-widest"
            >
                <ArrowLeft size={16} />
                Back to Home
            </Link>

            {/* Search Header */}
            <h1 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">🔍 Search Stavans</h1>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex flex-col gap-2">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type song name here..."
                            className="w-full pl-12 pr-4 py-2.5 bg-[#1a1a2f] border border-white/10 rounded-xl text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all shadow-inner"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-orange-500/10 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : '🔍 SEARCH NOW'}
                    </button>
                </div>
            </form>

            {/* Loading */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Searching...</p>
                </div>
            )}

            {/* Results */}
            {!loading && searched && (
                <div>
                    <p className="text-white/60 mb-4">
                        {results.length > 0
                            ? `Found ${results.length} stavans`
                            : 'No stavans found. Try a different search.'}
                    </p>

                    <div className="space-y-3">
                        {results.map((song, idx) => (
                            <button
                                key={song.id || idx}
                                onClick={() => handlePlay(song)}
                                className="w-full bg-[#1a1a2f] hover:bg-[#252545] border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.99] group"
                            >
                                {/* Image */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-orange-500/10 flex-shrink-0 relative">
                                    {getImg(song) ? (
                                        <img
                                            src={getImg(song)}
                                            alt={song.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                            🙏
                                        </div>
                                    )}
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Play size={24} className="text-white" fill="white" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-left min-w-0">
                                    <h3 className="font-bold text-white text-lg truncate">
                                        {song.name}
                                    </h3>
                                    <p className="text-white/50 truncate">
                                        {getArtist(song)}
                                    </p>
                                </div>

                                {/* Play Icon */}
                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play size={22} className="text-white ml-1" fill="white" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Initial State */}
            {!loading && !searched && (
                <div className="text-center py-12">
                    <p className="text-6xl mb-4">🙏</p>
                    <p className="text-white/60 text-lg">
                        Search for your favorite Jain Stavans
                    </p>
                </div>
            )}
        </div>
    );
}
