"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, Playlist } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import {
    Play, Pause, Heart, Clock, MoreHorizontal,
    Trash2, Globe, Lock, Share2, ArrowLeft,
    Edit2, Plus, Loader2, Music, Shuffle, Download, Check
} from 'lucide-react';
import { useOffline } from '@/context/OfflineContext';
import { fetchJioSaavnPlaylist } from '@/lib/homeData';
import { getTrackImageUrl, getTrackArtistName, decodeHtml } from '@/lib/utils';
import { fetchJioSaavnSuggestions, rankByTaste } from '@/lib/recommendations';
import PlaylistCover from '@/components/PlaylistCover';

// Format a duration that may be raw seconds (e.g. 249) or already "m:ss".
const formatDuration = (d: any): string => {
    if (d == null) return '';
    if (typeof d === 'string' && d.includes(':')) return d;
    const n = Number(d);
    if (!n || !isFinite(n)) return '';
    const m = Math.floor(n / 60);
    const s = Math.floor(n % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
};

export default function PlaylistDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, getPlaylist, updatePlaylist, removeSongFromPlaylist, createPlaylist, addSongToPlaylist, deletePlaylist } = useAuth();
    const { playTrack, currentSong, isPlaying } = usePlayer();
    const { downloadPlaylist, playlistDownloadProgress, isDownloaded } = useOffline();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPublic, setEditPublic] = useState(false);
    const [editCover, setEditCover] = useState('');
    const [isDownloadingPlaylist, setIsDownloadingPlaylist] = useState(false);
    // JioSaavn (external) playlist support
    const [isExternal, setIsExternal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    // Taste-based "Recommended Songs" (Spotify-style auto-suggest)
    const [recommended, setRecommended] = useState<any[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    useEffect(() => {
        loadPlaylist();
    }, [id]);

    // Also reload when user changes (to check ownership)
    useEffect(() => {
        if (playlist && user) {
            // Just update the ownership state without full reload
        }
    }, [user?.uid]);

    // Load taste-based recommendations for the owner's own playlist.
    useEffect(() => {
        if (playlist && !isExternal && user?.uid === playlist.ownerId) {
            loadRecommendations(playlist);
        } else {
            setRecommended([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlist?.id, isExternal, user?.uid, playlist?.songs.length]);

    const loadPlaylist = async () => {
        setLoading(true);
        try {
            // 1) Try the user's own (Firestore) playlist
            const data = await getPlaylist(id as string);
            if (data) {
                setPlaylist(data);
                setIsExternal(false);
                setEditName(data.name);
                setEditDesc(data.description);
                setEditPublic(data.isPublic);
                setEditCover((data as any).coverImage || '');
                return;
            }
            // 2) Fall back to a JioSaavn (curated/shared) playlist
            const ext = await fetchJioSaavnPlaylist(id as string);
            if (ext) {
                const mapped: any = {
                    id: String(ext.id),
                    name: decodeHtml(ext.name || 'Playlist'),
                    description: decodeHtml(ext.description || ''),
                    isPublic: true,
                    ownerId: '',
                    ownerName: ext.artists?.[0]?.name ? decodeHtml(ext.artists[0].name) : 'JioSaavn',
                    songs: (ext.songs || []).map((s: any) => ({
                        ...s,
                        id: String(s.id || s.songId),
                        name: decodeHtml(s.name || s.title || ''),
                        artist: decodeHtml(getTrackArtistName(s)),
                        image: getTrackImageUrl(s),
                    })),
                };
                setPlaylist(mapped as Playlist);
                setIsExternal(true);
            }
        } catch (err) {
            console.error('Failed to load playlist:', err);
        } finally {
            setLoading(false);
        }
    };

    // Save a JioSaavn playlist into the user's own library (like / follow).
    const handleSaveToLibrary = async () => {
        if (!playlist || !user || saving || saved) return;
        setSaving(true);
        try {
            const newId = await createPlaylist(playlist.name, playlist.description || 'Saved from JioSaavn', false);
            for (const s of playlist.songs) {
                try { await addSongToPlaylist(newId, s); } catch { /* skip a failed song */ }
            }
            setSaved(true);
        } catch (err) {
            console.error('Failed to save playlist:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlaylist = async () => {
        if (!playlist || user?.uid !== playlist.ownerId) return;
        if (!confirm(`Delete "${playlist.name}"? This can't be undone.`)) return;
        try {
            await deletePlaylist(playlist.id);
            router.push('/playlists');
        } catch (err) {
            console.error('Failed to delete playlist:', err);
        }
    };

    const handleSave = async () => {
        if (!playlist) return;
        try {
            await updatePlaylist(playlist.id, {
                name: editName,
                description: editDesc,
                isPublic: editPublic,
                coverImage: editCover || null,
            });
            setPlaylist({ ...playlist, name: editName, description: editDesc, isPublic: editPublic, coverImage: editCover || null });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update playlist:', err);
        }
    };

    // Build a taste-based "Recommended Songs" list from the playlist's own tracks,
    // seeded through JioSaavn's song-radio engine and ranked by listening taste.
    const loadRecommendations = async (pl: Playlist | null) => {
        if (!pl || pl.songs.length === 0) { setRecommended([]); return; }
        setLoadingRecs(true);
        try {
            const inPlaylist = new Set(pl.songs.map(s => String(s.id)));
            // Seed from a few recent tracks for variety (last added first).
            const seeds = [...pl.songs].slice(-4).reverse();
            const batches = await Promise.all(seeds.map(s => fetchJioSaavnSuggestions(s).catch(() => [])));
            const seen = new Set<string>();
            const merged: any[] = [];
            for (const batch of batches) {
                for (const s of batch) {
                    const k = String(s?.id || s?.songId || '');
                    if (!k || seen.has(k) || inPlaylist.has(k)) continue;
                    seen.add(k);
                    merged.push(s);
                }
            }
            setRecommended(rankByTaste(merged).slice(0, 12));
        } catch (err) {
            console.error('Failed to load recommendations:', err);
        } finally {
            setLoadingRecs(false);
        }
    };

    const handleAddRecommended = async (song: any, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playlist) return;
        const key = String(song?.id || song?.songId || '');
        setAddingId(key);
        try {
            await addSongToPlaylist(playlist.id, song);
            setPlaylist({ ...playlist, songs: [...playlist.songs, song] });
            setRecommended(prev => prev.filter(s => String(s?.id || s?.songId) !== key));
        } catch (err) {
            console.error('Failed to add song:', err);
        } finally {
            setAddingId(null);
        }
    };

    const handleRemoveSong = async (songId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playlist) return;
        try {
            await removeSongFromPlaylist(playlist.id, songId);
            setPlaylist({
                ...playlist,
                songs: playlist.songs.filter(s => s.id !== songId)
            });
        } catch (err) {
            console.error('Failed to remove song:', err);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Playlist link copied to clipboard!');
    };

    const shufflePlay = () => {
        if (!playlist || playlist.songs.length === 0) return;
        const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
        playTrack(shuffled[0], shuffled);
    };

    const handleDownloadPlaylist = async () => {
        if (!playlist || playlist.songs.length === 0) return;

        setIsDownloadingPlaylist(true);
        try {
            await downloadPlaylist(playlist.songs, playlist.name);
        } catch (err) {
            console.error('Failed to download playlist:', err);
            alert('Failed to download some songs. Check your storage limit.');
        } finally {
            setIsDownloadingPlaylist(false);
        }
    };

    // Check how many songs are already downloaded
    const downloadedCount = playlist?.songs.filter(s => isDownloaded(s.id)).length || 0;
    const allDownloaded = playlist && downloadedCount === playlist.songs.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-cyan-400" size={32} />
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl text-[var(--foreground)] font-bold uppercase">Playlist Not Found</h2>
                <button onClick={() => router.back()} className="mt-4 text-cyan-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mx-auto">
                    <ArrowLeft size={14} /> Go Back
                </button>
            </div>
        );
    }

    const isOwner = user?.uid === playlist.ownerId;

    return (
        <div className="px-4 md:px-12 pt-4 pb-32 md:py-8 max-w-7xl mx-auto space-y-6">
            {/* Back to Library */}
            <button
                onClick={() => router.push('/playlists')}
                className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
                <ArrowLeft size={18} /> Your Library
            </button>

            {/* Header section */}
            <header className="flex flex-col md:flex-row gap-6 md:gap-8 md:items-end p-5 md:p-10 rounded-2xl md:rounded-[3rem] bg-gradient-to-b from-[var(--background)] to-transparent border border-[var(--border)] relative overflow-hidden group">
                <PlaylistCover
                    coverImage={playlist.coverImage}
                    songs={playlist.songs}
                    className="w-40 h-40 md:w-64 md:h-64 shadow-2xl shrink-0 border border-[var(--border)] mx-auto md:mx-0"
                    rounded="rounded-2xl md:rounded-[2.5rem]"
                />

                <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400">Playlist</span>
                        {playlist.isPublic ? <Globe size={10} className="text-[var(--foreground-muted)]" /> : <Lock size={10} className="text-[var(--foreground-muted)]" />}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4 max-w-xl mx-auto md:mx-0">
                            <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full bg-[var(--card-hover)] border border-[var(--border)] rounded-xl px-4 py-2 text-2xl md:text-3xl font-bold text-[var(--foreground)] uppercase"
                                placeholder="Edit name..."
                            />
                            <textarea
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                className="w-full bg-[var(--card-hover)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--foreground-muted)] text-sm"
                                placeholder="Edit description..."
                                rows={2}
                            />
                            {/* Custom cover */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--card)] border border-[var(--border)] shrink-0">
                                        {(editCover || playlist.songs[0]?.image) ? (
                                            <img src={editCover || playlist.songs[0]?.image} alt="" className="w-full h-full object-cover" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]"><Music size={20} /></div>}
                                    </div>
                                    <input
                                        value={editCover}
                                        onChange={e => setEditCover(e.target.value)}
                                        className="flex-1 bg-[var(--card-hover)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--foreground-muted)] text-xs"
                                        placeholder="Cover image URL (or pick a song cover below)"
                                    />
                                    {editCover && (
                                        <button onClick={() => setEditCover('')} className="text-[10px] font-bold uppercase text-[var(--foreground-muted)] hover:text-rose-400">Reset</button>
                                    )}
                                </div>
                                {playlist.songs.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        {playlist.songs.slice(0, 12).map((s: any, i: number) => s.image && (
                                            <button key={i} onClick={() => setEditCover(s.image)} className={`w-10 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-all ${editCover === s.image ? 'border-cyan-400' : 'border-transparent hover:border-[var(--border)]'}`}>
                                                <img src={s.image} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <button onClick={() => setEditPublic(!editPublic)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${editPublic ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[var(--card)] text-[var(--foreground-muted)]'}`}>
                                    {editPublic ? 'Public' : 'Private'}
                                </button>
                                <button onClick={handleSave} className="px-5 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg font-bold text-[10px] uppercase">Save</button>
                                <button onClick={() => setIsEditing(false)} className="px-5 py-2 bg-[var(--card-hover)] text-[var(--foreground)] rounded-lg font-bold text-[10px] uppercase">Cancel</button>
                                {isOwner && (
                                    <button onClick={handleDeletePlaylist} className="px-5 py-2 bg-red-500/15 text-red-400 rounded-lg font-bold text-[10px] uppercase hover:bg-red-500/25 flex items-center gap-1.5">
                                        <Trash2 size={13} /> Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <h1 className="text-3xl md:text-7xl font-bold text-[var(--foreground)] uppercase tracking-tighter leading-none shrink-0 truncate max-w-2xl px-2 md:px-0">
                                {playlist.name}
                            </h1>
                            <p className="text-[var(--foreground-muted)] font-medium max-w-xl line-clamp-2 text-xs md:text-base opacity-80">
                                {playlist.description || "No description provided."}
                            </p>
                            <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                                <span className="text-xs md:text-sm font-bold text-[var(--foreground)] uppercase">{playlist.ownerName}</span>
                                <span className="text-[var(--foreground-muted)] font-bold">•</span>
                                <span className="text-xs md:text-sm font-bold text-[var(--foreground-muted)] uppercase">{playlist.songs.length} Tracks</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-row md:flex-row items-center justify-center gap-3 mt-4 md:mt-0 w-full md:w-auto px-4 md:px-0">
                    <button
                        onClick={() => playlist.songs.length > 0 && playTrack(playlist.songs[0], playlist.songs)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-cyan-400 text-black px-6 md:px-10 py-3.5 md:py-5 rounded-xl md:rounded-[2rem] font-bold uppercase tracking-tight md:tracking-widest shadow-xl shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all text-xs md:text-sm"
                    >
                        <Play size={18} fill="black" /> Play
                    </button>
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <button
                            onClick={shufflePlay}
                            className="p-3.5 md:p-5 bg-[var(--card-hover)] hover:bg-[var(--border)] rounded-xl md:rounded-[2rem] text-[var(--foreground)] transition-all hover:scale-110 active:scale-90 border border-[var(--border)]"
                            title="Shuffle Play"
                        >
                            <Shuffle size={18} className="md:w-6 md:h-6" />
                        </button>
                        <button
                            onClick={handleDownloadPlaylist}
                            disabled={isDownloadingPlaylist || allDownloaded || playlist.songs.length === 0}
                            className={`p-3.5 md:p-5 rounded-xl md:rounded-[2rem] transition-all hover:scale-110 active:scale-90 border border-[var(--border)] relative ${allDownloaded
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : isDownloadingPlaylist
                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                    : 'bg-[var(--card-hover)] hover:bg-[var(--border)] text-[var(--foreground)]'
                                } ${isDownloadingPlaylist ? 'cursor-wait' : ''}`}
                            title={allDownloaded ? 'All songs downloaded' : isDownloadingPlaylist ? `Downloading ${playlistDownloadProgress?.current || 0}/${playlistDownloadProgress?.total || 0}` : 'Download playlist for offline'}
                        >
                            {isDownloadingPlaylist ? (
                                <div className="relative">
                                    <Loader2 size={18} className="md:w-6 md:h-6 animate-spin" />
                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap">
                                        {playlistDownloadProgress?.current}/{playlistDownloadProgress?.total}
                                    </span>
                                </div>
                            ) : (
                                <Download size={18} className="md:w-6 md:h-6" />
                            )}
                        </button>
                        {isExternal && user && (
                            <button
                                onClick={handleSaveToLibrary}
                                disabled={saving || saved}
                                className={`p-3.5 md:p-5 rounded-xl md:rounded-[2rem] transition-all hover:scale-110 active:scale-90 border ${saved
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-[var(--card-hover)] hover:bg-[var(--border)] text-[var(--foreground)] border-[var(--border)]'}`}
                                title={saved ? 'Saved to your library' : 'Save to your library'}
                            >
                                {saving ? <Loader2 size={18} className="md:w-6 md:h-6 animate-spin" />
                                    : saved ? <Check size={18} className="md:w-6 md:h-6" />
                                        : <Heart size={18} className="md:w-6 md:h-6" />}
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-3.5 md:p-5 bg-[var(--card-hover)] hover:bg-[var(--border)] rounded-xl md:rounded-[2rem] text-[var(--foreground)] transition-all hover:scale-110 active:scale-90 border border-[var(--border)]"
                            >
                                <Edit2 size={18} className="md:w-6 md:h-6" />
                            </button>
                        )}
                        <button
                            onClick={handleShare}
                            className="p-3.5 md:p-5 bg-[var(--card-hover)] hover:bg-[var(--border)] rounded-xl md:rounded-[2rem] text-[var(--foreground)] transition-all hover:scale-110 active:scale-90 border border-[var(--border)]"
                        >
                            <Share2 size={18} className="md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Song list */}
            <div className="space-y-1">
                <div className="grid grid-cols-[40px,1fr,1fr,auto] gap-4 px-6 py-4 border-b border-[var(--border)] text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest hidden md:grid">
                    <span>#</span>
                    <span>Track</span>
                    <span>Artist</span>
                    <span className="text-right"><Clock size={14} className="ml-auto" /></span>
                </div>

                {playlist.songs.length > 0 ? (
                    playlist.songs.map((song, idx) => (
                        <div
                            key={song.id}
                            className={`group grid grid-cols-[auto,1fr,auto] md:grid-cols-[40px,1fr,1fr,auto] gap-4 px-6 py-4 rounded-3xl hover:bg-[var(--card-hover)] transition-all cursor-pointer items-center border border-transparent hover:border-[var(--border)] ${currentSong?.id === song.id ? 'bg-cyan-400/5 border-cyan-400/10' : ''}`}
                            onClick={() => playTrack(song, playlist.songs)}
                        >
                            <span className={`hidden md:inline font-bold text-sm ${currentSong?.id === song.id ? 'text-cyan-400' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'}`}>
                                {currentSong?.id === song.id && isPlaying ? (
                                    <div className="flex gap-0.5 items-end h-3">
                                        <div className="w-0.5 h-full bg-cyan-400 animate-music-bar-1" />
                                        <div className="w-0.5 h-full bg-cyan-400 animate-music-bar-2" />
                                        <div className="w-0.5 h-full bg-cyan-400 animate-music-bar-3" />
                                    </div>
                                ) : idx + 1}
                            </span>

                            <div className="flex items-center gap-4 min-w-0">
                                <img
                                    src={getTrackImageUrl(song) || (typeof song.image === 'string' ? song.image : '') || '/logo.png'}
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                                    alt=""
                                    className="w-12 h-12 rounded-xl object-cover shrink-0 bg-[var(--surface)]"
                                />
                                <div className="min-w-0">
                                    <p className={`font-bold uppercase tracking-tighter truncate ${currentSong?.id === song.id ? 'text-cyan-400' : 'text-[var(--foreground)]'}`}>
                                        {decodeHtml(song.name)}
                                    </p>
                                    <p className="text-xs text-[var(--foreground-muted)] md:hidden">{decodeHtml(song.artist)}</p>
                                </div>
                            </div>

                            <span className="hidden md:inline text-[var(--foreground-muted)] font-medium truncate">{decodeHtml(song.artist)}</span>

                            <div className="flex items-center gap-4">
                                {isOwner && (
                                    <button
                                        onClick={(e) => handleRemoveSong(song.id, e)}
                                        className="p-2 text-[var(--foreground-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <span className="text-[var(--foreground-muted)] font-bold tabular-nums text-xs">
                                    {formatDuration(song.duration)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                        <Plus size={48} className="text-[var(--foreground-muted)] mb-6" />
                        <p className="font-bold uppercase tracking-widest text-sm">Add some fire to this playlist</p>
                    </div>
                )}

                {/* Recommended Songs — taste-based auto-suggest (Spotify-style) */}
                {isOwner && !isExternal && playlist.songs.length > 0 && (recommended.length > 0 || loadingRecs) && (
                    <div className="mt-12 pt-8 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between mb-1 px-2 md:px-6">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)]">Recommended Songs</h2>
                                <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-0.5">Based on the songs in this playlist</p>
                            </div>
                            <button
                                onClick={() => loadRecommendations(playlist)}
                                disabled={loadingRecs}
                                className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors shrink-0"
                            >
                                {loadingRecs ? 'Loading…' : 'Refresh'}
                            </button>
                        </div>

                        {loadingRecs && recommended.length === 0 ? (
                            <div className="flex justify-center py-12"><Loader2 size={26} className="animate-spin text-[var(--accent)]" /></div>
                        ) : (
                            <div className="mt-4">
                                {recommended.map((song) => {
                                    const key = String(song?.id || song?.songId || '');
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => playTrack(song, recommended)}
                                            className="group flex items-center gap-4 px-2 md:px-6 py-2.5 rounded-2xl hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                                        >
                                            <img
                                                src={getTrackImageUrl(song) || (typeof song.image === 'string' ? song.image : '') || '/logo.png'}
                                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                                                alt=""
                                                className="w-12 h-12 rounded-xl object-cover shrink-0 bg-[var(--surface)]"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-[var(--foreground)] truncate">{decodeHtml(song.name || song.title)}</p>
                                                <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{decodeHtml(getTrackArtistName(song) || song.artist || '')}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleAddRecommended(song, e)}
                                                disabled={addingId === key}
                                                className="shrink-0 w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 disabled:opacity-50 transition-colors"
                                                title="Add to playlist"
                                            >
                                                {addingId === key ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
