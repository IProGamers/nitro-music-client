"use client"
import { useState, useEffect } from 'react';
import { useAuth, Playlist } from '@/context/AuthContext';
import { useUsage } from '@/context/UsageContext';
import {
    X, Plus, Music, Lock, Globe,
    ListPlus, Loader2, CheckCircle2, AlertCircle, PlusCircle
} from 'lucide-react';

interface AddToPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    song: any;
}

export default function AddToPlaylistModal({ isOpen, onClose, song }: AddToPlaylistModalProps) {
    const { user, getUserPlaylists, createPlaylist, addSongToPlaylist } = useAuth();
    const { checkAccess, setShowLimitModal, setLimitFeature } = useUsage();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            loadPlaylists();
        }
    }, [isOpen, user]);

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

    const handleCreatePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;

        const { limit } = checkAccess('playlists_created');
        if (limit !== undefined && limit !== -1 && playlists.length >= limit) {
            setLimitFeature('playlists_created');
            setShowLimitModal(true);
            return;
        }

        setCreating(true);
        setStatus(null);
        try {
            const id = await createPlaylist(newPlaylistName, '', isPublic);
            if (song) {
                await addSongToPlaylist(id, song);
            }
            setStatus({ type: 'success', message: 'Playlist created and song added!' });
            setNewPlaylistName('');
            loadPlaylists();
            setTimeout(onClose, 1500);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to create playlist' });
        } finally {
            setCreating(false);
        }
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        setStatus(null);
        try {
            await addSongToPlaylist(playlistId, song);
            setStatus({ type: 'success', message: 'Added to playlist!' });
            setTimeout(onClose, 1500);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to add song' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl md:rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-4 md:p-6 border-b border-[var(--border)] flex justify-between items-center">
                    <h2 className="text-lg md:text-xl font-black text-[var(--foreground)] italic tracking-tighter uppercase">Add to Playlist</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--card-hover)] rounded-full text-[var(--foreground-muted)]">
                        <X size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>

                <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto space-y-4 md:space-y-6">
                    {/* Status Message */}
                    {status && (
                        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                            {status.type === 'success' ? <CheckCircle2 size={16} className="md:w-[18px] md:h-[18px]" /> : <AlertCircle size={16} className="md:w-[18px] md:h-[18px]" />}
                            <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest">{status.message}</p>
                        </div>
                    )}

                    {/* Create New section */}
                    <form onSubmit={handleCreatePlaylist} className="space-y-3 md:space-y-4 p-3 md:p-4 bg-[var(--card-hover)] rounded-2xl md:rounded-3xl border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-cyan-400 mb-1 md:mb-2">
                            <PlusCircle size={14} className="md:w-4 md:h-4" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Create New</span>
                        </div>
                        <input
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            placeholder="Playlist name..."
                            className="w-full bg-[var(--background)]/40 border border-[var(--border)] rounded-xl px-4 py-2.5 md:py-3 text-[var(--foreground)] text-xs md:text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
                        />
                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                type="button"
                                onClick={() => setIsPublic(!isPublic)}
                                className={`flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-lg border transition-all ${isPublic ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-[var(--card)] border-transparent text-[var(--foreground-muted)]'
                                    }`}
                            >
                                {isPublic ? <Globe size={12} className="md:w-3.5 md:h-3.5" /> : <Lock size={12} className="md:w-3.5 md:h-3.5" />}
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{isPublic ? 'Public' : 'Private'}</span>
                            </button>
                            <button
                                type="submit"
                                disabled={creating || !newPlaylistName.trim()}
                                className="flex-1 bg-[var(--foreground)] text-[var(--background)] py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-tighter hover:bg-cyan-400 hover:text-black transition-all disabled:opacity-50"
                            >
                                {creating ? <Loader2 size={14} className="animate-spin mx-auto md:w-4 md:h-4" /> : 'Create & Add'}
                            </button>
                        </div>
                    </form>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[var(--foreground-muted)] px-2">
                            <ListPlus size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Your Playlists</span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-cyan-400" />
                            </div>
                        ) : playlists.length > 0 ? (
                            <div className="grid gap-2">
                                {playlists.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleAddToPlaylist(p.id)}
                                        className="flex items-center gap-3 p-3 bg-[var(--card-hover)] hover:bg-[var(--border)] rounded-2xl border border-transparent hover:border-[var(--border)] transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[var(--card)] flex items-center justify-center text-[var(--foreground-muted)] group-hover:text-cyan-400 transition-colors">
                                            <Music size={20} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-bold text-[var(--foreground)] text-sm truncate">{p.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[var(--foreground-muted)] font-medium">{p.songs.length} tracks</span>
                                                <span className="text-[var(--foreground-muted)] font-black text-[8px]">•</span>
                                                {p.isPublic ? <Globe size={10} className="text-[var(--foreground-muted)]" /> : <Lock size={10} className="text-[var(--foreground-muted)]" />}
                                            </div>
                                        </div>
                                        <Plus size={18} className="text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-[var(--card-hover)] rounded-3xl border border-dashed border-[var(--border)]">
                                <p className="text-[var(--foreground-muted)] text-xs font-bold uppercase tracking-widest">No playlists yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
