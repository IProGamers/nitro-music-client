"use client"
import { useEffect, useMemo, useState } from 'react';
import { X, Copy, Check, Share2, Clock, Sparkles, Globe } from 'lucide-react';
import { createShareToken, buildShareUrl } from '@/lib/shareLink';
import { useSheet } from '@/hooks/useSheet';

interface SongLike {
    id?: string;
    songId?: string;
    name?: string;
    title?: string;
    artist?: string;
    artists?: { primary?: { name: string }[] };
    image?: string | { url?: string; link?: string; quality?: string }[] | any;
    source?: string;
}

interface SharePanelProps {
    isOpen: boolean;
    onClose: () => void;
    song: SongLike | null;
    onOpenCard?: () => void;
}

const resolveImg = (song: SongLike | null): string => {
    if (!song?.image) return '';
    if (typeof song.image === 'string') return song.image;
    if (Array.isArray(song.image) && song.image.length) {
        const last = song.image[song.image.length - 1];
        return last?.url || last?.link || '';
    }
    if (typeof song.image === 'object' && song.image.url) return song.image.url;
    return '';
};

const resolveArtist = (song: SongLike | null): string => {
    if (song?.artists?.primary?.[0]?.name) return song.artists.primary[0].name;
    if (typeof song?.artist === 'string') return song.artist;
    return 'Unknown Artist';
};

export default function SharePanel({ isOpen, onClose, song, onOpenCard }: SharePanelProps) {
    const [copied, setCopied] = useState(false);

    // Build a fresh 3-hour link each time the panel opens for a song.
    const url = useMemo(() => {
        if (!isOpen || !song) return '';
        const id = String(song.id || song.songId || '');
        if (!id) return '';
        const token = createShareToken({
            id,
            n: song.name || song.title || 'Unknown',
            a: resolveArtist(song),
            img: resolveImg(song),
            s: song.source,
        }, 3);
        return buildShareUrl(token);
    }, [isOpen, song]);

    useEffect(() => { setCopied(false); }, [isOpen]);

    const copy = async () => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable */ }
    };

    const nativeShare = async () => {
        if (!url || typeof navigator === 'undefined' || !navigator.share) return;
        try {
            await navigator.share({
                title: `${song?.name || song?.title} — Nitro`,
                text: `Listen to "${song?.name || song?.title}" on Nitro 🎵`,
                url,
            });
        } catch { /* user cancelled */ }
    };

    const { render, show, requestClose } = useSheet(isOpen && !!song, onClose);
    if (!render || !song) return null;

    const img = resolveImg(song);
    const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    return (
        <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-end md:items-center justify-center transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
            onClick={requestClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-[var(--background)] w-full md:w-[400px] rounded-t-3xl md:rounded-3xl border border-[var(--border)] overflow-hidden shadow-2xl transition-transform duration-300 ease-out ${show ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
                    <div className="md:hidden absolute left-1/2 -translate-x-1/2 top-2 w-9 h-1 rounded-full bg-[var(--surface-hover)]" />
                    <h2 className="text-base font-bold text-[var(--foreground)]">Share song</h2>
                    <button onClick={requestClose} className="w-8 h-8 rounded-full hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--foreground-muted)]">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Song row */}
                    <div className="flex items-center gap-3">
                        {img ? (
                            <img src={img} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-[var(--surface)] shrink-0" />
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold text-[var(--foreground)] truncate">{song.name || song.title}</p>
                            <p className="text-sm text-[var(--foreground-muted)] truncate">{resolveArtist(song)}</p>
                        </div>
                    </div>

                    {/* What this link does — plain explanation */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                        <Globe size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                        <p className="text-[12px] leading-relaxed text-[var(--foreground-muted)]">
                            Anyone with this link can <span className="text-[var(--foreground)] font-medium">play the full song</span> right away —
                            no account or app needed. For privacy, the link <span className="text-[var(--foreground)] font-medium">expires in 3 hours</span>.
                        </p>
                    </div>

                    {/* Link field */}
                    <div className="flex items-center gap-2 p-2 pl-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                        <span className="flex-1 text-xs text-[var(--foreground-secondary)] truncate font-mono">{url}</span>
                        <button
                            onClick={copy}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${copied ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[var(--accent)] text-[#04161a]'}`}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2.5">
                        {canNativeShare && (
                            <button
                                onClick={nativeShare}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm font-semibold text-[var(--foreground)] transition-colors"
                            >
                                <Share2 size={16} /> Share…
                            </button>
                        )}
                        {onOpenCard && (
                            <button
                                onClick={() => { onClose(); onOpenCard(); }}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm font-semibold text-[var(--foreground)] transition-colors ${canNativeShare ? '' : 'col-span-2'}`}
                            >
                                <Sparkles size={16} /> Story card
                            </button>
                        )}
                    </div>

                    <p className="text-[11px] text-[var(--foreground-muted)] flex items-center justify-center gap-1.5">
                        <Clock size={12} /> Link stays active for 3 hours after you create it
                    </p>
                </div>
            </div>
        </div>
    );
}
