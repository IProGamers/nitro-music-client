"use client"
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Loader2, Check, ClipboardList, FileUp, ListMusic, ExternalLink, ListChecks, ArrowRight, HelpCircle } from 'lucide-react';
import {
    parsePastedTracks, parseCsvTracks, matchInCatalog, type ImportTrack,
} from '@/lib/playlistImport';

type Result = { matched: number; skipped: number; total: number; name: string; missing: string[] } | null;

// Step-by-step "flashcards" shown to users before importing.
const GUIDE_STEPS = [
    {
        icon: ExternalLink,
        title: 'Open Exportify',
        body: 'Go to exportify.net and log in with your own Spotify account. It’s free and runs in your browser — we never see your Spotify login.',
    },
    {
        icon: FileUp,
        title: 'Export your playlist to CSV',
        body: 'Pick any playlist on Exportify and click "Export". A .csv file with your songs downloads to your device.',
    },
    {
        icon: ClipboardList,
        title: 'Upload it here (or paste a list)',
        body: 'Come back, choose "Upload CSV" and select that file — or just paste a list of songs, one per line ("Song - Artist").',
    },
    {
        icon: ListChecks,
        title: 'We match & build your playlist',
        body: 'We find each song in our catalog and create the playlist in your library. Songs we can’t find are listed and skipped — playback stays on Nitro.',
    },
];

export default function SpotifyImport({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { createPlaylist, addSongToPlaylist } = useAuth();
    const [showGuide, setShowGuide] = useState(true);
    const [mode, setMode] = useState<'paste' | 'csv'>('paste');
    const [pasteText, setPasteText] = useState('');
    const [csvTracks, setCsvTracks] = useState<ImportTrack[]>([]);
    const [csvName, setCsvName] = useState('');
    const [playlistName, setPlaylistName] = useState('');
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [result, setResult] = useState<Result>(null);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setPasteText(''); setCsvTracks([]); setCsvName(''); setPlaylistName('');
        setResult(null); setError(null); setProgress({ done: 0, total: 0 });
    };

    const handleClose = () => { if (!running) { reset(); onClose(); } };

    const onCsvFile = async (file: File) => {
        try {
            const text = await file.text();
            const tracks = parseCsvTracks(text);
            setCsvTracks(tracks);
            setCsvName(file.name);
            if (!playlistName) setPlaylistName(file.name.replace(/\.csv$/i, ''));
            if (tracks.length === 0) setError('No tracks found in that CSV.');
            else setError(null);
        } catch {
            setError('Could not read that file.');
        }
    };

    const runImport = async () => {
        setError(null);
        const tracks = mode === 'paste' ? parsePastedTracks(pasteText) : csvTracks;
        if (tracks.length === 0) { setError('Add some tracks first.'); return; }

        const name = playlistName.trim() || 'Imported Playlist';
        setRunning(true);
        setProgress({ done: 0, total: tracks.length });
        try {
            const newId = await createPlaylist(name, 'Imported into Nitro', false);
            let matched = 0, skipped = 0;
            const missing: string[] = [];
            for (let i = 0; i < tracks.length; i++) {
                const song = await matchInCatalog(tracks[i]);
                if (song) {
                    try { await addSongToPlaylist(newId, song); matched++; }
                    catch { skipped++; missing.push(`${tracks[i].name}${tracks[i].artist ? ' — ' + tracks[i].artist : ''}`); }
                } else {
                    skipped++;
                    missing.push(`${tracks[i].name}${tracks[i].artist ? ' — ' + tracks[i].artist : ''}`);
                }
                setProgress({ done: i + 1, total: tracks.length });
            }
            setResult({ matched, skipped, total: tracks.length, name, missing });
        } catch {
            setError('Import failed — please try again.');
        } finally {
            setRunning(false);
        }
    };

    if (!isOpen) return null;

    const pasteCount = mode === 'paste' ? parsePastedTracks(pasteText).length : csvTracks.length;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="w-full max-w-lg max-h-[88vh] overflow-y-auto bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold text-[var(--foreground)]">Import a playlist</h2>
                    <button onClick={handleClose} disabled={running} className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] disabled:opacity-40">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mb-5 leading-relaxed">
                    Bring playlists from Spotify (or anywhere) — no account connection needed. We match each
                    song to our catalog and skip what we can&apos;t find. Playback stays on Nitro.
                </p>

                {result ? (
                    <div>
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2 mb-4">
                            <Check size={16} /> Created &ldquo;{result.name}&rdquo; — {result.matched} added, {result.skipped} skipped.
                        </div>
                        {result.missing.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">Not found in our catalog ({result.missing.length})</p>
                                <div className="max-h-40 overflow-y-auto rounded-lg bg-[var(--surface)] p-3 space-y-1">
                                    {result.missing.slice(0, 100).map((m, i) => (
                                        <p key={i} className="text-xs text-[var(--foreground-muted)] truncate">{m}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={reset} className="flex-1 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-sm font-medium text-[var(--foreground)]">Import another</button>
                            <button onClick={handleClose} className="flex-1 py-2.5 rounded-full bg-[var(--foreground)] text-[var(--background)] text-sm font-semibold hover:opacity-90">Done</button>
                        </div>
                    </div>
                ) : showGuide ? (
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">How to import from Spotify</p>
                        <div className="space-y-3">
                            {GUIDE_STEPS.map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                                        <div className="relative shrink-0">
                                            <div className="w-9 h-9 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
                                                <Icon size={18} />
                                            </div>
                                            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[var(--accent)] text-[#04161a] text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-[var(--foreground)]">{step.title}</h3>
                                            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed mt-0.5">{step.body}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <a
                            href="https://exportify.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] transition-colors"
                        >
                            <ExternalLink size={15} /> Open Exportify
                        </a>
                        <button
                            onClick={() => setShowGuide(false)}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--accent)] text-[#04161a] font-semibold text-sm transition-all"
                        >
                            I have my songs — continue <ArrowRight size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setShowGuide(true)}
                            className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline mb-3"
                        >
                            <HelpCircle size={13} /> How to import from Spotify?
                        </button>
                        {/* Mode toggle */}
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => setMode('paste')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'paste' ? 'bg-[var(--foreground)] text-[var(--background)]' : 'bg-[var(--surface)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]'}`}>
                                <ClipboardList size={15} /> Paste list
                            </button>
                            <button onClick={() => setMode('csv')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'csv' ? 'bg-[var(--foreground)] text-[var(--background)]' : 'bg-[var(--surface)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]'}`}>
                                <FileUp size={15} /> Upload CSV
                            </button>
                        </div>

                        {mode === 'paste' ? (
                            <>
                                <textarea
                                    value={pasteText}
                                    onChange={e => setPasteText(e.target.value)}
                                    placeholder={"One song per line, e.g.\nPerfect - Ed Sheeran\nKesariya - Arijit Singh"}
                                    rows={7}
                                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]/50 resize-none"
                                />
                            </>
                        ) : (
                            <div>
                                <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors">
                                    <FileUp size={22} className="text-[var(--foreground-muted)]" />
                                    <span className="text-sm text-[var(--foreground)]">{csvName || 'Choose a .csv file'}</span>
                                    <span className="text-xs text-[var(--foreground-muted)]">{csvTracks.length > 0 ? `${csvTracks.length} tracks detected` : 'Exportify export works great'}</span>
                                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && onCsvFile(e.target.files[0])} />
                                </label>
                                <p className="text-[11px] text-[var(--foreground-muted)] mt-2 leading-relaxed">
                                    Tip: open <span className="text-[var(--foreground-secondary)]">exportify.net</span>, sign in with your
                                    own Spotify, export a playlist to CSV, then upload it here.
                                </p>
                            </div>
                        )}

                        <input
                            type="text"
                            value={playlistName}
                            onChange={e => setPlaylistName(e.target.value)}
                            placeholder="New playlist name"
                            className="w-full mt-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]/50"
                        />

                        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

                        <button
                            onClick={runImport}
                            disabled={running || pasteCount === 0}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--accent)] text-[#04161a] font-semibold text-sm disabled:opacity-40 transition-all"
                        >
                            {running ? (
                                <><Loader2 size={16} className="animate-spin" /> Matching {progress.done}/{progress.total}…</>
                            ) : (
                                <><ListMusic size={16} /> Import {pasteCount > 0 ? `${pasteCount} ` : ''}songs</>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
