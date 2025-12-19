"use client"
import { useState, useEffect } from 'react';
import { useAuth, Playlist } from '@/context/AuthContext';
import {
    Plus, Music, Globe, Lock, Loader2, Play,
    MoreHorizontal, Share2, Trash2, Edit2, Search
} from 'lucide-react';
import Link from 'next/link';

export default function PlaylistsPage() {
    const { user, getUserPlaylists, createPlaylist, deletePlaylist } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (user) {
            loadPlaylists();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadPlaylists = async () => {
        setLoading(true);
        try {
            const data = await getUserPlaylists();
            setPlaylists(data);
        } catch (err) {
            console.error('Failed to load playlists:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!user) return;
        setIsCreating(true);
        try {
            const name = `My Playlist #${playlists.length + 1}`;
            await createPlaylist(name, 'Playlist created with Nitro Music', false);
            loadPlaylists();
        } catch (err) {
            console.error('Failed to create playlist:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this playlist?')) return;
        try {
            await deletePlaylist(id);
            setPlaylists(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Failed to delete playlist:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-cyan-400" size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-[var(--background)]">
                <div className="w-24 h-24 rounded-[2rem] bg-cyan-400/10 flex items-center justify-center mb-8 rotate-12 glow-cyan-sm">
                    <Music size={40} className="text-cyan-400" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--foreground)] uppercase tracking-tighter mb-4">Your Library Awaits</h2>
                <p className="text-[var(--foreground-muted)] max-w-sm mb-8 font-medium">Create custom soundtracks for every mood. Save, share, and discover music your way.</p>
                <Link href="/auth" className="bg-cyan-400 text-black px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyan-400/20">
                    Sign In to Start
                </Link>
            </div>
        );
    }

    const filteredPlaylists = playlists.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="px-6 md:px-12 py-8 pb-32 max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400">Library</span>
                    <h1 className="text-5xl md:text-7xl font-bold text-[var(--foreground)] uppercase tracking-tighter leading-none">
                        Playlists
                    </h1>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="flex items-center justify-center gap-3 bg-[var(--foreground)] text-[var(--background)] px-8 py-4 rounded-[1.5rem] font-bold uppercase tracking-widest text-xs hover:bg-cyan-400 hover:text-black transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50"
                >
                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Create Playlist
                </button>
            </header>

            {/* Search Bar */}
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] group-focus-within:text-cyan-400 transition-colors" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your library..."
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--foreground)] focus:outline-none focus:border-cyan-400/50 transition-all font-medium text-sm focus:bg-[var(--card-hover)]"
                />
            </div>

            {filteredPlaylists.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                    {filteredPlaylists.map((p) => (
                        <Link
                            href={`/playlist/${p.id}`}
                            key={p.id}
                            className="group flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500"
                        >
                            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-[var(--card)] border border-[var(--border)] group-hover:border-cyan-400/30 transition-all duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    {p.songs.length > 0 ? (
                                        <img src={p.songs[0].image} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                                    ) : (
                                        <Music size={40} className="text-[var(--foreground-muted)] group-hover:text-cyan-400 transition-colors duration-500" />
                                    )}
                                </div>

                                {/* Hover Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                                    <div className="w-16 h-16 bg-[var(--foreground)] rounded-full flex items-center justify-center shadow-2xl">
                                        <Play size={24} fill="var(--background)" className="ml-1 text-[var(--background)]" />
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={(e) => handleDelete(p.id, e)}
                                        className="p-2 bg-[var(--background)]/40 backdrop-blur-md rounded-full text-[var(--foreground-muted)] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-[var(--foreground)] uppercase tracking-tighter truncate group-hover:text-cyan-400 transition-colors">
                                    {p.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">{p.songs.length} Tracks</p>
                                    <div className="w-1 h-1 bg-[var(--foreground-muted)] rounded-full" />
                                    {p.isPublic ? (
                                        <Globe size={10} className="text-cyan-400/60" />
                                    ) : (
                                        <Lock size={10} className="text-[var(--foreground-muted)]" />
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-[var(--card)] rounded-[3rem] border border-dashed border-[var(--border)]">
                    <Music size={48} className="text-[var(--foreground-muted)] mb-6" />
                    <p className="text-[var(--foreground-muted)] font-bold uppercase tracking-[0.2em]">No playlists found</p>
                </div>
            )}
        </div>
    );
}
