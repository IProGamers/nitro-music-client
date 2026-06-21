"use client"
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    X, Loader2, Check, Music, Download, ExternalLink, AlertCircle,
} from 'lucide-react';
import {
    isSpotifyConfigured, beginSpotifyAuth, getStoredSpotifyToken, clearSpotifyToken,
    getSpotifyPlaylists, getSpotifyPlaylistTracks, matchInCatalog,
    type SpotifyPlaylist,
} from '@/lib/spotify';

type ImportState = { running: boolean; playlistId: string | null; matched: number; skipped: number; total: number; done: boolean; createdName?: string };

export default function SpotifyImport({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { createPlaylist, addSongToPlaylist } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imp, setImp] = useState<ImportState>({ running: false, playlistId: null, matched: 0, skipped: 0, total: 0, done: false });

    useEffect(() => {
        if (!isOpen) return;
        const t = getStoredSpotifyToken();
        setToken(t);
        if (t) loadPlaylists(t);
    }, [isOpen]);

    const loadPlaylists = async (t: string) => {
        setLoading(true);
        setError(null);
        try {
            setPlaylists(await getSpotifyPlaylists(t));
        } catch (e: any) {
            if (e?.message === 'SPOTIFY_UNAUTHORIZED') {
                clearSpotifyToken();
                setToken(null);
            } else {
                setError('Could not load your Spotify playlists.');
            }
        } finally {
            setLoading(false);
        }
    };

    const connect = async () => {
        try {
            window.location.href = await beginSpotifyAuth();
        } catch {
            setError('Could not start Spotify sign-in.');
        }
    };

    const importPlaylist = async (pl: SpotifyPlaylist) => {
        if (!token || imp.running) return;
        setError(null);
        setImp({ running: true, playlistId: pl.id, matched: 0, skipped: 0, total: 0, done: false });
        try {
            const tracks = await getSpotifyPlaylistTracks(token, pl.id);
            const newId = await createPlaylist(pl.name, `Imported from Spotify · ${pl.name}`, false);
            let matched = 0, skipped = 0;
            for (let i = 0; i < tracks.length; i++) {
                const song = await matchInCatalog(tracks[i]);
                if (song) {
                    try { await addSongToPlaylist(newId, song); matched++; }
                    catch { skipped++; }
                } else {
                    skipped++; // not in our catalog — skipped, never streamed from Spotify
                }
                setImp(s => ({ ...s, matched, skipped, total: tracks.length }));
            }
            setImp({ running: false, playlistId: pl.id, matched, skipped, total: tracks.length, done: true, createdName: pl.name });
        } catch (e: any) {
            if (e?.message === 'SPOTIFY_UNAUTHORIZED') { clearSpotifyToken(); setToken(null); }
            setError('Import failed. Your Spotify session may have expired — reconnect and try again.');
            setImp(s => ({ ...s, running: false }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center">
                            <Music size={18} className="text-black" />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--foreground)]">Import from Spotify</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)]">
                        <X size={18} />
                    </button>
                </div>

                {!isSpotifyConfigured() ? (
                    <div className="text-center py-8">
                        <AlertCircle size={28} className="text-amber-400 mx-auto mb-3" />
                        <p className="text-[var(--foreground)] font-medium mb-2">Spotify import isn&apos;t configured yet</p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                            Set <code className="text-[var(--foreground-secondary)]">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> and add
                            <code className="text-[var(--foreground-secondary)]"> /spotify/callback</code> as a redirect URI in your
                            Spotify Developer dashboard. See docs/SPOTIFY_IMPORT_DESIGN.md.
                        </p>
                    </div>
                ) : error ? (
                    <div className="text-center py-6">
                        <AlertCircle size={26} className="text-red-400 mx-auto mb-3" />
                        <p className="text-sm text-[var(--foreground)] mb-4">{error}</p>
                        <button onClick={() => token ? loadPlaylists(token) : connect()} className="px-5 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-sm font-medium text-[var(--foreground)]">
                            Try again
                        </button>
                    </div>
                ) : !token ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-[var(--foreground-muted)] mb-6 leading-relaxed">
                            Connect your Spotify account to import your playlists. We&apos;ll match each song to our
                            catalog and play it here — songs we can&apos;t find are skipped. (Spotify is used only for
                            import; playback stays on Nitro.)
                        </p>
                        <button onClick={connect} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1DB954] hover:brightness-110 text-black font-semibold text-sm transition-all">
                            <ExternalLink size={16} /> Connect with Spotify
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {imp.done && (
                            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
                                <Check size={16} /> Imported &ldquo;{imp.createdName}&rdquo; — {imp.matched} added, {imp.skipped} skipped.
                            </div>
                        )}
                        {loading ? (
                            <div className="flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--accent)]" /></div>
                        ) : playlists.length === 0 ? (
                            <p className="text-sm text-[var(--foreground-muted)] text-center py-10">No playlists found on your Spotify account.</p>
                        ) : (
                            playlists.map(pl => {
                                const isThis = imp.running && imp.playlistId === pl.id;
                                return (
                                    <div key={pl.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                                        <div className="w-11 h-11 rounded-md overflow-hidden bg-[var(--surface)] flex-shrink-0">
                                            {pl.image ? <img src={pl.image} alt="" className="w-full h-full object-cover" /> : <Music size={16} className="text-[var(--foreground-muted)] m-auto mt-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--foreground)] truncate">{pl.name}</p>
                                            <p className="text-xs text-[var(--foreground-muted)] truncate">
                                                {isThis ? `Matching ${imp.matched + imp.skipped}/${imp.total}…` : `${pl.trackCount} tracks`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => importPlaylist(pl)}
                                            disabled={imp.running}
                                            className="px-3 py-1.5 rounded-full bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
                                        >
                                            {isThis ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                            Import
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
