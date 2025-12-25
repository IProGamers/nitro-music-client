"use client"
import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Clock, Play, Trash2, Calendar, Music } from 'lucide-react';

export default function HistoryPage() {
    const { playTrack } = usePlayer();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const res = await fetch(`${apiUrl}/api/history`);
                const data = await res.json();
                if (data.success) setHistory(data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

    const clearHistory = async () => {
        if (!confirm('Are you sure you want to clear your listening history?')) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${apiUrl}/api/history`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setHistory([]);
            }
        } catch (e) {
            console.error('Failed to clear history:', e);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-cyan-400 gap-4">
                <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full"></div>
                <p className="text-[var(--foreground-muted)]">Wait for it...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 pb-32 max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-3">
                        <Clock size={14} /> Playback Journal
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">Your History</h1>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--card)] hover:bg-red-500/10 text-[var(--foreground-muted)] hover:text-red-400 rounded-full text-xs font-bold transition-all border border-[var(--border)] hover:border-red-500/20"
                    >
                        <Trash2 size={14} /> Clear History
                    </button>
                )}
            </header>

            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {history.length === 0 ? (
                    <div className="text-center py-32 bg-[var(--card)]/50 rounded-[2.5rem] border border-[var(--border)]">
                        <Music size={48} className="text-[var(--foreground-muted)] mx-auto mb-6" />
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No history yet</h2>
                        <p className="text-[var(--foreground-muted)]">Start listening to your favorite tracks to see them here.</p>
                    </div>
                ) : (
                    history.map((t: any, index: number) => (
                        <div
                            key={`${t.id}-${index}`}
                            onClick={() => playTrack(t, history)}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--card)] hover:bg-[var(--card-hover)] border border-transparent hover:border-[var(--border)] cursor-pointer group transition-all"
                        >
                            <span className="w-6 text-[var(--foreground-muted)] font-mono text-xs text-center group-hover:text-cyan-400">
                                {history.length - index}
                            </span>
                            <div className="relative w-14 h-14 shrink-0">
                                <img src={t.image} className="w-full h-full rounded-xl object-cover shadow-xl grayscale-[50%] group-hover:grayscale-0 transition-all duration-500" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                    <Play size={18} fill="white" className="text-white" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold truncate text-[var(--foreground)] group-hover:text-[var(--foreground-secondary)] transition-colors text-base">{t.name}</h3>
                                <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{t.artist}</p>
                            </div>
                            <div className="hidden md:flex flex-col items-end text-[var(--foreground-muted)]">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                    <Calendar size={12} />
                                    {new Date(t.playedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="text-[10px] opacity-60 mt-1">
                                    {new Date(t.playedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
