"use client"
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Play, Pause, Loader2, Clock, LinkIcon, Music2 } from 'lucide-react';
import { decodeShareToken, isShareExpired, expiresInLabel, resolveShareStream, type SharePayload } from '@/lib/shareLink';

type State = 'loading' | 'invalid' | 'expired' | 'ready' | 'error';

const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function PlayTokenPage() {
    const params = useParams();
    const token = Array.isArray(params?.token) ? params.token[0] : (params?.token as string);

    const audioRef = useRef<HTMLAudioElement>(null);
    const [payload, setPayload] = useState<SharePayload | null>(null);
    const [state, setState] = useState<State>('loading');
    const [streamUrl, setStreamUrl] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Decode token + fetch the stream
    useEffect(() => {
        let cancelled = false;
        const p = token ? decodeShareToken(token) : null;
        if (!p) { setState('invalid'); return; }
        if (isShareExpired(p)) { setPayload(p); setState('expired'); return; }
        setPayload(p);

        (async () => {
            try {
                // Resolve from the correct backend based on the song's source
                // (YouTube proxy vs. JioSaavn). YouTube ids 500 on /api/songs.
                const url = await resolveShareStream(p);
                if (cancelled) return;
                if (!url) { setState('error'); return; }
                setStreamUrl(url);
                setState('ready');
            } catch {
                if (!cancelled) setState('error');
            }
        })();

        return () => { cancelled = true; };
    }, [token]);

    const toggle = () => {
        const el = audioRef.current;
        if (!el || !streamUrl) return;
        if (el.paused) {
            el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
            el.pause();
            setIsPlaying(false);
        }
    };

    const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const el = audioRef.current;
        if (!el) return;
        const t = Number(e.target.value);
        el.currentTime = t;
        setProgress(t);
    };

    return (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[var(--background)] px-6 overflow-hidden">
            {/* ambient glow */}
            {payload?.img && state === 'ready' && (
                <div
                    className="absolute inset-0 -z-10 opacity-30 blur-3xl scale-125"
                    style={{ backgroundImage: `url(${payload.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
            )}
            <div className="absolute inset-0 -z-10 bg-[var(--background)]/80" />

            {/* Brand */}
            <Link href="/" className="absolute top-6 left-6 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    <Music2 size={15} className="text-white" />
                </div>
                <span className="font-bold text-[var(--foreground)]">Nitro</span>
            </Link>

            {state === 'loading' && (
                <div className="flex flex-col items-center gap-3 text-[var(--foreground-muted)]">
                    <Loader2 size={30} className="animate-spin text-[var(--accent)]" />
                    <p className="text-sm">Loading shared song…</p>
                </div>
            )}

            {(state === 'invalid' || state === 'error') && (
                <div className="text-center max-w-xs">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                        <LinkIcon size={24} className="text-[var(--foreground-muted)]" />
                    </div>
                    <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
                        {state === 'invalid' ? "This link isn't valid" : "Couldn't load this song"}
                    </h1>
                    <p className="text-sm text-[var(--foreground-muted)] mb-6">
                        {state === 'invalid'
                            ? 'The shared link looks broken or incomplete.'
                            : 'The track may no longer be available. Try opening Nitro and searching for it.'}
                    </p>
                    <Link href="/" className="inline-flex px-5 py-2.5 rounded-full bg-[var(--accent)] text-[#04161a] font-semibold text-sm">
                        Open Nitro
                    </Link>
                </div>
            )}

            {state === 'expired' && (
                <div className="text-center max-w-xs">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                        <Clock size={24} className="text-amber-400" />
                    </div>
                    <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">This link has expired</h1>
                    <p className="text-sm text-[var(--foreground-muted)] mb-6">
                        Shared song links last a few hours. Ask whoever sent it to share a fresh one — or find the song on Nitro.
                    </p>
                    <Link href="/" className="inline-flex px-5 py-2.5 rounded-full bg-[var(--accent)] text-[#04161a] font-semibold text-sm">
                        Open Nitro
                    </Link>
                </div>
            )}

            {state === 'ready' && payload && (
                <div className="w-full max-w-sm flex flex-col items-center text-center">
                    <img
                        src={payload.img}
                        alt=""
                        className="w-64 h-64 rounded-3xl object-cover shadow-2xl mb-7"
                        onError={(e) => { (e.currentTarget.style.visibility = 'hidden'); }}
                    />
                    <h1 className="text-2xl font-bold text-[var(--foreground)] leading-tight line-clamp-2">{payload.n}</h1>
                    <p className="text-[var(--foreground-muted)] mt-1">{payload.a}</p>

                    {/* seek */}
                    <div className="w-full mt-7">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={progress}
                            onChange={onSeek}
                            className="w-full h-1.5 bg-[var(--surface-hover)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                        />
                        <div className="flex justify-between text-[11px] text-[var(--foreground-muted)] mt-1.5">
                            <span>{fmt(progress)}</span>
                            <span>{fmt(duration)}</span>
                        </div>
                    </div>

                    {/* play */}
                    <button
                        onClick={toggle}
                        className="mt-6 w-16 h-16 rounded-full bg-[var(--accent)] text-[#04161a] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
                    </button>

                    <p className="text-[11px] text-[var(--foreground-muted)] mt-6 flex items-center gap-1.5">
                        <Clock size={12} /> Temporary link · expires in {expiresInLabel(payload)}
                    </p>

                    <Link href="/" className="mt-5 inline-flex px-5 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--surface-hover)] transition-colors">
                        Get the full app — Nitro
                    </Link>

                    <audio
                        ref={audioRef}
                        src={streamUrl}
                        crossOrigin="anonymous"
                        playsInline
                        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                        onEnded={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                </div>
            )}
        </div>
    );
}
