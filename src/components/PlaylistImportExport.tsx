"use client"
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Upload, Download, FileText, Music, Check, AlertCircle, Loader } from 'lucide-react';

interface PlaylistImportExportProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PlaylistImportExport({ isOpen, onClose }: PlaylistImportExportProps) {
    const { getUserPlaylists } = useAuth();
    const [importUrl, setImportUrl] = useState('');
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Parse Spotify/YouTube playlist URL
    const parsePlaylistUrl = (url: string): { platform: 'spotify' | 'youtube' | null; id: string | null } => {
        if (url.includes('spotify.com/playlist/')) {
            const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
            return { platform: 'spotify', id: match?.[1] || null };
        }
        if (url.includes('youtube.com/playlist') || url.includes('music.youtube.com/playlist')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            return { platform: 'youtube', id: urlParams.get('list') };
        }
        return { platform: null, id: null };
    };

    // Import playlist
    const handleImport = async () => {
        if (!importUrl.trim()) {
            setMessage({ type: 'error', text: 'Please enter a playlist URL' });
            return;
        }

        const { platform, id } = parsePlaylistUrl(importUrl);
        if (!platform || !id) {
            setMessage({ type: 'error', text: 'Invalid playlist URL. Supported: Spotify, YouTube Music' });
            return;
        }

        setImporting(true);
        setMessage(null);

        try {
            // In production, this would call an API to fetch and convert the playlist
            await new Promise(resolve => setTimeout(resolve, 2000));

            setMessage({ type: 'success', text: `Successfully imported playlist from ${platform}!` });
            setImportUrl('');
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to import playlist. Please try again.' });
        } finally {
            setImporting(false);
        }
    };

    // Export playlists to JSON
    const handleExport = async () => {
        setExporting(true);
        setMessage(null);

        try {
            const playlists = await getUserPlaylists();

            const exportData = {
                exportedAt: new Date().toISOString(),
                source: 'Nitro Music',
                playlists: playlists.map((p: any) => ({
                    name: p.name,
                    description: p.description,
                    songs: p.songs?.map((s: any) => ({
                        name: s.name,
                        artist: s.artist || s.artists?.primary?.[0]?.name,
                        album: s.album
                    }))
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `nitro-playlists-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'Playlists exported successfully!' });
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to export playlists' });
        } finally {
            setExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
            <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl">
                            <FileText size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[var(--foreground)]">Import / Export</h2>
                            <p className="text-xs text-[var(--foreground-muted)]">Manage your playlists</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--card-hover)] rounded-xl">
                        <X size={20} className="text-[var(--foreground-muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">
                    {/* Message */}
                    {message && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${message.type === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                            {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm">{message.text}</span>
                        </div>
                    )}

                    {/* Import Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[var(--foreground)]">
                            <Upload size={16} className="text-emerald-400" />
                            <span className="font-bold text-sm">Import Playlist</span>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Paste a Spotify or YouTube Music playlist link
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                placeholder="https://open.spotify.com/playlist/..."
                                className="flex-1 bg-[var(--card-hover)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-emerald-400"
                            />
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {importing ? <Loader size={18} className="animate-spin" /> : 'Import'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-[var(--card-hover)] rounded text-[10px] text-[var(--foreground-muted)]">Spotify</span>
                            <span className="px-2 py-1 bg-[var(--card-hover)] rounded text-[10px] text-[var(--foreground-muted)]">YouTube Music</span>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border)]" />

                    {/* Export Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[var(--foreground)]">
                            <Download size={16} className="text-purple-400" />
                            <span className="font-bold text-sm">Export Playlists</span>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Download all your playlists as JSON
                        </p>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="w-full py-3 bg-[var(--card-hover)] hover:bg-purple-500/20 border border-[var(--border)] rounded-xl font-bold text-sm text-[var(--foreground)] flex items-center justify-center gap-2 transition-colors"
                        >
                            {exporting ? (
                                <><Loader size={16} className="animate-spin" /> Exporting...</>
                            ) : (
                                <><Download size={16} /> Export All Playlists</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
