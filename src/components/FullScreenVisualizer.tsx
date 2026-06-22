"use client"
import React, { useRef, useEffect, useState } from 'react';
import { useAudioFX } from '@/context/AudioFXContext';
import { usePlayer } from '@/context/PlayerContext';
import { X, Maximize2, Minimize2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { extractAccent, rgbString, type AccentColor } from '@/lib/colorExtract';

interface FullScreenVisualizerProps {
    isOpen: boolean;
    onClose: () => void;
}

type Style = 'orb' | 'bars' | 'wave' | 'particles';
const STYLES: { id: Style; label: string }[] = [
    { id: 'orb', label: 'Orb' },
    { id: 'bars', label: 'Bars' },
    { id: 'wave', label: 'Wave' },
    { id: 'particles', label: 'Particles' },
];

const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

export default function FullScreenVisualizer({ isOpen, onClose }: FullScreenVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const { analyserNode } = useAudioFX();
    const { currentSong, isPlaying, togglePlay, next, prev, progress, duration, seek } = usePlayer();

    const [style, setStyle] = useState<Style>('orb');
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [accent, setAccent] = useState<AccentColor>({ r: 34, g: 211, b: 238 });

    const getImg = (t: any): string => {
        if (!t) return '';
        if (Array.isArray(t.image) && t.image.length) return t.image[t.image.length - 1].url || t.image[t.image.length - 1].link || '';
        return typeof t.image === 'string' ? t.image : '';
    };
    const cover = getImg(currentSong);

    // Pull the visualizer's colour from the cover art so it matches the song.
    useEffect(() => {
        if (!cover) return;
        let alive = true;
        extractAccent(cover).then(c => { if (alive) setAccent(c); });
        return () => { alive = false; };
    }, [cover]);

    // ---- Render loop: always animates (real audio data when available, gentle idle otherwise) ----
    useEffect(() => {
        if (!isOpen) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const buf = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;
        const A = accent;
        const light: AccentColor = {
            r: Math.min(255, A.r + 90), g: Math.min(255, A.g + 90), b: Math.min(255, A.b + 90),
        };

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
            const t = performance.now() / 1000;
            const live = !!(analyserNode && buf && isPlaying);
            if (analyserNode && buf) analyserNode.getByteFrequencyData(buf);
            const n = buf ? buf.length : 256;

            // Normalised amplitude at position i∈[0,1); idle = soft breathing wave.
            const amp = (i: number) => {
                if (live && buf) return buf[Math.min(n - 1, Math.floor(i * n * 0.5))] / 255;
                const base = isPlaying ? 0.42 : 0.22;
                return base + Math.sin(t * 1.4 + i * 7) * (isPlaying ? 0.14 : 0.07);
            };
            const bass = live && buf ? buf[2] / 255 : (isPlaying ? 0.4 : 0.25) + Math.sin(t * 2) * 0.08;

            // Trails for particles, hard clear otherwise.
            ctx.fillStyle = style === 'particles' ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.32)';
            ctx.fillRect(0, 0, W, H);

            if (style === 'orb') {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(t * 0.12);
                const R = Math.min(W, H) * 0.16;
                const seg = 110;
                for (let i = 0; i < seg; i++) {
                    const v = amp(i / seg);
                    const bar = v * R * 1.6;
                    ctx.save();
                    ctx.rotate((i / seg) * Math.PI * 2);
                    ctx.fillStyle = rgbString(i % 2 ? light : A, 0.45 + v * 0.55);
                    ctx.fillRect(-1.6, R + 12, 3.2, bar);
                    ctx.beginPath();
                    ctx.arc(0, R + 14 + bar, 2.3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                const orb = R * (0.85 + bass * 0.45);
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, orb);
                g.addColorStop(0, '#ffffff');
                g.addColorStop(0.35, rgbString(light, 0.9));
                g.addColorStop(0.7, rgbString(A, 0.35));
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, orb, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (style === 'bars') {
                const count = 84;
                const bw = (W / count) * 0.7;
                for (let i = 0; i < count; i++) {
                    const v = amp(i / count);
                    const h = v * H * 0.55;
                    const x = (i / (count - 1)) * W;
                    const grad = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
                    grad.addColorStop(0, rgbString(light, 0));
                    grad.addColorStop(0.5, rgbString(light, 0.5 + v * 0.5));
                    grad.addColorStop(1, rgbString(A, 0));
                    ctx.fillStyle = grad;
                    ctx.fillRect(x - bw / 2, cy - h / 2, bw, h);
                }
            } else if (style === 'wave') {
                for (let l = 0; l < 5; l++) {
                    ctx.beginPath();
                    ctx.lineWidth = l === 0 ? 3 : 1.4;
                    ctx.strokeStyle = rgbString(l === 0 ? light : A, l === 0 ? 0.95 : 0.22);
                    const a = (live ? 1 : 0.7) * H * 0.22 * (1 - l * 0.13);
                    const freq = 0.004 + l * 0.0012;
                    const sp = t * (1.3 + l * 0.5);
                    for (let x = 0; x <= W; x += 4) {
                        const win = Math.pow(Math.sin((x / W) * Math.PI), 2.2);
                        const v = amp(x / W);
                        const y = cy + Math.sin(x * freq + sp) * a * win * (0.5 + v);
                        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
            } else { // particles
                const count = 150;
                for (let i = 0; i < count; i++) {
                    const f = amp(i / count);
                    const ang = (i / count) * Math.PI * 2 + t * 0.1;
                    const dist = (i / count) * Math.min(W, H) * 0.48 + f * 140;
                    const x = cx + Math.cos(ang) * dist;
                    const y = cy + Math.sin(ang) * dist;
                    ctx.fillStyle = rgbString(i % 3 ? A : light, 0.4 + f * 0.6);
                    ctx.beginPath();
                    ctx.arc(x, y, 1 + f * 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };

        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [isOpen, analyserNode, style, accent, isPlaying]);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); setIsFullscreen(true); }
            else { await document.exitFullscreen(); setIsFullscreen(false); }
        } catch { /* not supported */ }
    };

    // Auto-hide controls after inactivity.
    useEffect(() => {
        if (!isOpen) return;
        let timeout: NodeJS.Timeout;
        const wake = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3500);
        };
        window.addEventListener('mousemove', wake);
        window.addEventListener('touchstart', wake);
        wake();
        return () => {
            window.removeEventListener('mousemove', wake);
            window.removeEventListener('touchstart', wake);
            clearTimeout(timeout);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black overflow-hidden" onClick={() => setShowControls(s => !s)}>
            {/* Ambient art backdrop (keeps the screen alive even with no audio data) */}
            {cover && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-125" />}
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 42%, ${rgbString(accent, 0.28)} 0%, transparent 62%)` }} />
            <div className="absolute inset-0 bg-black/45" />

            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Top bar */}
            <div className={`absolute top-0 inset-x-0 p-5 flex items-center justify-between transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                    <X size={20} />
                </button>
                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full p-1">
                    {STYLES.map(s => (
                        <button
                            key={s.id}
                            onClick={(e) => { e.stopPropagation(); setStyle(s.id); }}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${style === s.id ? 'text-[#04161a]' : 'text-white/70 hover:text-white'}`}
                            style={style === s.id ? { background: rgbString(accent, 1) } : undefined}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            {/* Bottom: now-playing + controls */}
            {currentSong && (
                <div className={`absolute bottom-0 inset-x-0 p-6 md:p-10 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="max-w-xl mx-auto">
                        <div className="flex items-center gap-4 mb-5">
                            {cover && <img src={cover} alt="" className="w-16 h-16 rounded-xl object-cover shadow-2xl shrink-0" />}
                            <div className="min-w-0">
                                <h2 className="text-xl md:text-2xl font-bold text-white truncate">{currentSong.name}</h2>
                                <p className="text-sm text-white/60 truncate">{currentSong.artists?.primary?.[0]?.name || currentSong.artist}</p>
                            </div>
                        </div>

                        {/* Seek */}
                        <div onClick={e => e.stopPropagation()}>
                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                value={progress}
                                onChange={(e) => seek(Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                style={{ accentColor: rgbString(accent, 1), background: 'rgba(255,255,255,0.18)' }}
                            />
                            <div className="flex justify-between text-[11px] text-white/50 mt-1">
                                <span>{fmt(progress)}</span>
                                <span>{fmt(duration)}</span>
                            </div>
                        </div>

                        {/* Transport */}
                        <div className="flex items-center justify-center gap-8 mt-4" onClick={e => e.stopPropagation()}>
                            <button onClick={prev} className="text-white/80 hover:text-white transition-colors"><SkipBack size={26} fill="currentColor" /></button>
                            <button
                                onClick={togglePlay}
                                className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
                                style={{ background: rgbString(accent, 1) }}
                            >
                                {isPlaying ? <Pause size={26} className="text-[#04161a]" fill="currentColor" /> : <Play size={26} className="text-[#04161a] ml-1" fill="currentColor" />}
                            </button>
                            <button onClick={next} className="text-white/80 hover:text-white transition-colors"><SkipForward size={26} fill="currentColor" /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
