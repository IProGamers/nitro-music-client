"use client"
import { useState, useEffect } from 'react';
import { useAuth, Playlist } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import {
    Plus, Music, Globe, Lock, Loader2, Play,
    Search, Clock, Download, Heart, ArrowUpDown, LayoutGrid, List
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SpotifyImport from '@/components/SpotifyImport';
import PlaylistCover from '@/components/PlaylistCover';
import { useOffline } from '@/context/OfflineContext';

export default function PlaylistsPage() {
    const router = useRouter();
    const { user, getUserPlaylists, createPlaylist, getRecentPlays } = useAuth();
    const { playTrack } = usePlayer();
    const { downloads } = useOffline();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [recent, setRecent] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'playlists' | 'recent' | 'downloaded'>('playlists');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showSpotify, setShowSpotify] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'count'>('recent');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        if (user) {
            loadPlaylists();
            getRecentPlays?.(50).then((r: any[]) => setRecent(r || [])).catch(() => { });
        } else {
            setLoading(false);
        }
    }, [user]);

    // Refresh playlists after an import closes.
    const closeSpotify = () => {
        setShowSpotify(false);
        if (user) loadPlaylists();
    };

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

    // New playlist now asks for a name (no more auto "My Playlist #N").
    const confirmCreate = async () => {
        if (!user) return;
        const name = newName.trim();
        if (!name) return;
        setIsCreating(true);
        try {
            const id = await createPlaylist(name, '', false);
            setShowCreateModal(false);
            setNewName('');
            if (id) router.push(`/playlist/${id}`);
            else loadPlaylists();
        } catch (err) {
            console.error('Failed to create playlist:', err);
        } finally {
            setIsCreating(false);
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

    const sortedPlaylists = [...filteredPlaylists].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'count') return b.songs.length - a.songs.length;
        return 0; // 'recent' — keep the order returned by the API
    });

    const sortLabel = sortBy === 'name' ? 'A–Z' : sortBy === 'count' ? 'Songs' : 'Recent';
    const cycleSort = () => setSortBy(s => (s === 'recent' ? 'name' : s === 'name' ? 'count' : 'recent'));

    return (
        <div className="px-6 md:px-12 py-8 pb-32 max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight leading-none">
                        Your Library
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setNewName(''); setShowCreateModal(true); }}
                        className="flex items-center justify-center gap-2 bg-[var(--foreground)] text-[var(--background)] px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-all hover:scale-[1.03] active:scale-95"
                    >
                        <Plus size={16} />
                        New Playlist
                    </button>
                    <button
                        onClick={() => setShowSpotify(true)}
                        className="flex items-center justify-center gap-2 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] px-5 py-2.5 rounded-full font-semibold text-sm transition-all border border-[var(--border)]"
                    >
                        <Download size={16} />
                        Import playlist
                    </button>
                </div>
            </header>

            <SpotifyImport isOpen={showSpotify} onClose={closeSpotify} />

            {/* Create playlist — asks for a name */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !isCreating && setShowCreateModal(false)}>
                    <div className="w-full max-w-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">New playlist</h2>
                        <input
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmCreate(); }}
                            placeholder="Playlist name"
                            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]/50"
                        />
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowCreateModal(false)} disabled={isCreating} className="flex-1 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-sm font-medium text-[var(--foreground)] disabled:opacity-50">Cancel</button>
                            <button onClick={confirmCreate} disabled={isCreating || !newName.trim()} className="flex-1 py-2.5 rounded-full bg-[var(--accent)] text-[#04161a] text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                                {isCreating ? <Loader2 size={15} className="animate-spin" /> : null} Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 -mt-6">
                {([['playlists', 'Playlists'], ['recent', 'Recently Played'], ['downloaded', 'Downloaded']] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === key
                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                            : 'bg-[var(--surface)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'downloaded' ? (
                downloads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                        {downloads.map((song: any, idx: number) => (
                            <div
                                key={`dl-${song.id || song.songId || idx}`}
                                onClick={() => playTrack(song, downloads)}
                                className="group flex items-center gap-3.5 p-2.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                            >
                                <div className="relative w-11 h-11 flex-shrink-0">
                                    <img src={song.image || '/logo.png'} alt="" className="w-full h-full rounded-md object-cover shadow-sm shadow-black/30" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}} />
                                    <div className="absolute inset-0 rounded-md bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Play size={14} fill="white" className="text-white ml-0.5" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm text-[var(--foreground)] truncate">{song.name || song.title}</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{song.artist}</p>
                                </div>
                                <Download size={15} className="text-emerald-400 shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center text-[var(--foreground-muted)]">
                        <Download size={40} className="mb-3 opacity-50" />
                        <p className="text-sm">Songs you download for offline play show up here</p>
                    </div>
                )
            ) : activeTab === 'recent' ? (
                recent.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                        {recent.map((song, idx) => (
                            <div
                                key={`rec-${song.id || song.songId || idx}`}
                                onClick={() => playTrack(song, recent)}
                                className="group flex items-center gap-3.5 p-2.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                            >
                                <div className="relative w-11 h-11 flex-shrink-0">
                                    <img src={song.image || '/logo.png'} alt="" className="w-full h-full rounded-md object-cover shadow-sm shadow-black/30" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}} />
                                    <div className="absolute inset-0 rounded-md bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Play size={14} fill="white" className="text-white ml-0.5" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm text-[var(--foreground)] truncate">{song.name || song.title}</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{song.artist}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center text-[var(--foreground-muted)]">
                        <Clock size={40} className="mb-3 opacity-50" />
                        <p className="text-sm">Songs you play will show up here</p>
                    </div>
                )
            ) : (
            <>
            {/* Pinned Liked Songs (Spotify-style) */}
            <Link href="/liked" className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-700 flex items-center justify-center shrink-0 shadow-lg">
                    <Heart size={24} className="text-white" fill="white" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--foreground)]">Liked Songs</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">Playlist · your likes</p>
                </div>
            </Link>

            {/* Search Bar */}
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your library..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/50 transition-all text-sm"
                />
            </div>

            {/* Sort + view toggle */}
            {filteredPlaylists.length > 0 && (
                <div className="flex items-center justify-between -mb-4">
                    <button
                        onClick={cycleSort}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        title="Change sort order"
                    >
                        <ArrowUpDown size={14} /> {sortLabel}
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-[var(--surface-hover)] text-[var(--foreground)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                            title="List view"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[var(--surface-hover)] text-[var(--foreground)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                            title="Grid view"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>
            )}

            {sortedPlaylists.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-[var(--card)] rounded-[3rem] border border-dashed border-[var(--border)]">
                    <Music size={48} className="text-[var(--foreground-muted)] mb-6" />
                    <p className="text-[var(--foreground-muted)] font-bold uppercase tracking-[0.2em]">No playlists found</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {sortedPlaylists.map((p) => (
                        <Link href={`/playlist/${p.id}`} key={p.id} className="group">
                            <div className="aspect-square rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] mb-2 shadow-sm">
                                <PlaylistCover coverImage={p.coverImage} songs={p.songs} className="w-full h-full" rounded="rounded-xl" />
                            </div>
                            <h3 className="font-semibold text-sm text-[var(--foreground)] truncate group-hover:text-cyan-400 transition-colors">{p.name}</h3>
                            <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">Playlist · {p.songs.length} {p.songs.length === 1 ? 'song' : 'songs'}</p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div>
                    {sortedPlaylists.map((p) => (
                        <Link
                            href={`/playlist/${p.id}`}
                            key={p.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors group"
                        >
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--card)] border border-[var(--border)]">
                                <PlaylistCover coverImage={p.coverImage} songs={p.songs} className="w-full h-full" rounded="rounded-lg" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-[15px] text-[var(--foreground)] truncate group-hover:text-cyan-400 transition-colors">
                                    {p.name}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mt-0.5">
                                    <span>Playlist · {p.songs.length} {p.songs.length === 1 ? 'song' : 'songs'}</span>
                                    {p.isPublic ? (
                                        <Globe size={11} className="shrink-0" />
                                    ) : (
                                        <Lock size={11} className="shrink-0" />
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            </>
            )}
        </div>
    );
}
