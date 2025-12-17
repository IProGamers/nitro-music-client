"use client"
import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { User, Heart, Clock, Settings, Edit2, Share2, Music, Play } from 'lucide-react';

export default function ProfilePage() {
    const { playTrack } = usePlayer();
    const [favorites, setFavorites] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fRes = await fetch('http://localhost:3000/api/favorites');
                const fData = await fRes.json();
                if (fData.success) setFavorites(fData.data);

                const hRes = await fetch('http://localhost:3000/api/history');
                const hData = await hRes.json();
                if (hData.success) setHistory(hData.data);
            } catch (e) {
                console.error(e);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white pb-32 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-cyan-900/20 to-black pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 p-6 md:p-8 pt-24 md:pt-12 max-w-5xl mx-auto">

                {/* Profile Header Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-zinc-900 border-4 border-white/10 flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
                                <User size={64} className="text-zinc-400" />
                            </div>
                            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                            <button className="absolute bottom-0 right-0 p-2 bg-cyan-400 rounded-full text-black hover:bg-cyan-300 transition-colors shadow-lg z-20">
                                <Edit2 size={16} />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2 justify-center md:justify-start">
                                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Guest User</h1>
                                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider w-fit mx-auto md:mx-0">
                                    Premium
                                </span>
                            </div>
                            <p className="text-zinc-400 mb-6 max-w-md mx-auto md:mx-0">Music enthusiast & audiophile. Exploring the universe of sound one track at a time.</p>

                            <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
                                <div className="text-center md:text-left">
                                    <div className="font-bold text-white text-lg">{favorites.length}</div>
                                    <div className="text-zinc-500">Favorites</div>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div className="text-center md:text-left">
                                    <div className="font-bold text-white text-lg">{history.length}</div>
                                    <div className="text-zinc-500">Played</div>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div className="text-center md:text-left">
                                    <div className="font-bold text-white text-lg">24</div>
                                    <div className="text-zinc-500">Following</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <a href="/settings" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all hover:scale-105">
                                <Settings size={20} />
                            </a>
                            <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all hover:scale-105">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-center md:justify-start mb-8">
                    <div className="bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white/10 inline-flex">
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'favorites' ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Heart size={16} className={activeTab === 'favorites' ? 'fill-black' : ''} /> Favorites
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Clock size={16} /> Recently Played
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[300px]">
                    {activeTab === 'favorites' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {favorites.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                    <Heart size={48} className="mb-4 opacity-20" />
                                    <p className="text-lg font-medium">No favorites yet</p>
                                    <p className="text-sm opacity-60">Start liking songs to see them here</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {favorites.map((t: any) => (
                                        <div key={t.id} onClick={() => playTrack(t, favorites)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20">
                                            <div className="relative w-16 h-16 shrink-0">
                                                <img src={t.image} className="w-full h-full rounded-xl object-cover shadow-lg" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                    <Music size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-hidden min-w-0">
                                                <h3 className="font-bold truncate group-hover:text-cyan-400 transition-colors text-white text-lg">{t.name}</h3>
                                                <p className="text-sm text-zinc-400 truncate">{t.artist}</p>
                                            </div>
                                            <button className="p-2 rounded-full hover:bg-white/10 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Heart size={18} fill="currentColor" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                    <Clock size={48} className="mb-4 opacity-20" />
                                    <p className="text-lg font-medium">No history yet</p>
                                    <p className="text-sm opacity-60">Play some music to build your history</p>
                                </div>
                            ) : (
                                <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
                                    {history.map((t: any) => (
                                        <div key={t.id} onClick={() => playTrack(t, history)} className="min-w-[160px] md:min-w-[180px] cursor-pointer group relative">
                                            <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 relative bg-zinc-900 shadow-xl border border-white/5 group-hover:shadow-cyan-500/20 transition-all duration-500">
                                                <img src={t.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                                                <div className="absolute bottom-4 right-4 w-12 h-12 bg-cyan-400 rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg text-black">
                                                    <Play size={24} fill="currentColor" className="ml-1" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold truncate text-base text-white group-hover:text-cyan-400 transition-colors">{t.name}</h3>
                                            <p className="text-sm text-zinc-500 truncate font-medium">{t.artist}</p>
                                            <div className="mt-2 text-xs text-zinc-600 font-mono">
                                                Played recently
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
