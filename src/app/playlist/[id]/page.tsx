"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, Playlist } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import {
    Play, Pause, Heart, Clock, MoreHorizontal,
    Trash2, Globe, Lock, Share2, ArrowLeft,
    Edit2, Plus, Loader2, Music, Shuffle
} from 'lucide-react';

export default function PlaylistDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, getPlaylist, updatePlaylist, removeSongFromPlaylist } = useAuth();
    const { playTrack, currentSong, isPlaying } = usePlayer();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPublic, setEditPublic] = useState(false);

    useEffect(() => {
        loadPlaylist();
    }, [id]);

    const loadPlaylist = async () => {
        setLoading(true);
        try {
            const data = await getPlaylist(id as string);
            if (data) {
                setPlaylist(data);
                setEditName(data.name);
                setEditDesc(data.description);
                setEditPublic(data.isPublic);
            }
        } catch (err) {
            console.error('Failed to load playlist:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!playlist) return;
        try {
            await updatePlaylist(playlist.id, {
                name: editName,
                description: editDesc,
                isPublic: editPublic
            });
            setPlaylist({ ...playlist, name: editName, description: editDesc, isPublic: editPublic });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update playlist:', err);
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
        <div className="px-4 md:px-12 py-8 pb-32 max-w-7xl mx-auto space-y-10">
            {/* Header section */}
            <header className="flex flex-col md:flex-row gap-6 md:gap-8 md:items-end p-5 md:p-10 rounded-2xl md:rounded-[3rem] bg-gradient-to-b from-[var(--background)] to-transparent border border-[var(--border)] relative overflow-hidden group">
                <div className="w-40 h-40 md:w-64 md:h-64 rounded-2xl md:rounded-[2.5rem] bg-[var(--card)] shadow-2xl overflow-hidden shrink-0 border border-[var(--border)] mx-auto md:mx-0">
                    {playlist.songs.length > 0 ? (
                        <img src={playlist.songs[0].image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">
                            <Music size={60} className="md:w-20 md:h-20" />
                        </div>
                    )}
                </div>

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
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <button onClick={() => setEditPublic(!editPublic)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${editPublic ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[var(--card)] text-[var(--foreground-muted)]'}`}>
                                    {editPublic ? 'Public' : 'Private'}
                                </button>
                                <button onClick={handleSave} className="px-5 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg font-bold text-[10px] uppercase">Save</button>
                                <button onClick={() => setIsEditing(false)} className="px-5 py-2 bg-[var(--card-hover)] text-[var(--foreground)] rounded-lg font-bold text-[10px] uppercase">Cancel</button>
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
                                <img src={song.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                <div className="min-w-0">
                                    <p className={`font-bold uppercase tracking-tighter truncate ${currentSong?.id === song.id ? 'text-cyan-400' : 'text-[var(--foreground)]'}`}>
                                        {song.name}
                                    </p>
                                    <p className="text-xs text-[var(--foreground-muted)] md:hidden">{song.artist}</p>
                                </div>
                            </div>

                            <span className="hidden md:inline text-[var(--foreground-muted)] font-medium truncate">{song.artist}</span>

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
                                    {song.duration || '3:30'}
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
            </div>
        </div>
    );
}
