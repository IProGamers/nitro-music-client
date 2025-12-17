"use client"
import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Search, Clock, X } from 'lucide-react';

export default function SearchPage() {
    const { playTrack } = usePlayer();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [recents, setRecents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('http://localhost:3000/api/history')
            .then(r => r.json())
            .then(d => {
                if (d.success) setRecents(d.data.slice(0, 8));
            })
            .catch(console.error);
    }, []);

    const doSearch = async (q: string) => {
        setQuery(q);
        if (q.trim() === '') {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/search/songs?query=${encodeURIComponent(q)}&limit=20`);
            const data = await res.json();
            if (data.success) setResults(data.data.results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const clearSearch = () => {
        setQuery('');
        setResults([]);
    }

    const getImg = (t: any) => {
        if (t.image && t.image.length) {
            return t.image[t.image.length - 1].url;
        }
        if (typeof t.image === 'string') return t.image;
        return '';
    };

    const getArtist = (t: any) => {
        if (t.artists && t.artists.primary && t.artists.primary.length) {
            return t.artists.primary[0].name;
        }
        if (typeof t.artist === 'string') return t.artist;
        return 'Unknown';
    };

    return (
        <div className="p-6 md:p-8 pb-32 pt-20 md:pt-8 min-h-screen">
            <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:static md:bg-transparent md:pb-0">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search music..."
                        value={query}
                        onChange={(e) => doSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3.5 pl-12 pr-10 text-white focus:outline-none focus:border-cyan-400/50 focus:bg-zinc-900/80 transition-all placeholder:text-zinc-600"
                    />
                    {query && (
                        <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {query === '' && recents.length > 0 && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-zinc-400 uppercase tracking-wider"><Clock size={14} /> Recently Played</h2>
                    <div className="flex flex-col gap-2">
                        {recents.map((t: any) => (
                            <div key={t.id} onClick={() => playTrack(t, recents)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors border border-transparent hover:border-white/5">
                                <img src={t.image} className="w-10 h-10 rounded-lg object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-medium text-sm text-zinc-300 group-hover:text-cyan-400 transition-colors truncate">{t.name}</h3>
                                    <p className="text-xs text-zinc-600 truncate">{t.artist}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-10 text-cyan-400">
                    <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
                </div>
            )}

            <div className="flex flex-col gap-2 mt-4">
                {results.map((t: any) => (
                    <div key={t.id} onClick={() => playTrack(t, results)} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer group transition-all">
                        <img src={getImg(t)} className="w-12 h-12 rounded-lg object-cover shadow-md" />
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-semibold group-hover:text-cyan-400 transition-colors text-white truncate">{t.name}</h3>
                            <p className="text-sm text-zinc-400 truncate">{getArtist(t)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
