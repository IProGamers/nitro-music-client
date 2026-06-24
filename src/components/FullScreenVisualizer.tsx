"use client"
import React, { useRef, useEffect, useState } from 'react';
import { useAudioFX } from '@/context/AudioFXContext';
import { usePlayer } from '@/context/PlayerContext';
import { X, Maximize2, Minimize2, Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
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

const mix = (a: AccentColor, b: AccentColor, t: number): AccentColor => ({
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
});

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

    // Keep latest play state inside the rAF loop without re-subscribing the loop.
    const playStateRef = useRef({ isPlaying, progress, duration });
    playStateRef.current = { isPlaying, progress, duration };

    // Pull the visualizer's colour from the cover art so it matches the song.
    useEffect(() => {
        if (!cover) return;
        let alive = true;
        extractAccent(cover).then(c => { if (alive) setAccent(c); });
        return () => { alive = false; };
    }, [cover]);

    // ---- Load the album-art image once per cover so we can paint it on the canvas.
    const artImgRef = useRef<HTMLImageElement | null>(null);
    const artReadyRef = useRef(false);
    useEffect(() => {
        artReadyRef.current = false;
        artImgRef.current = null;
        if (!cover) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { artImgRef.current = img; artReadyRef.current = true; };
        img.onerror = () => { artReadyRef.current = false; };
        img.src = cover;
    }, [cover]);

    // ---- Render loop: always animates (real audio data when available, gentle idle otherwise) ----
    useEffect(() => {
        if (!isOpen) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Frequency + time-domain buffers (only when a live analyser exists).
        const bins = analyserNode ? analyserNode.frequencyBinCount : 0;
        const freq = analyserNode ? new Uint8Array(bins) : null;
        const wave = analyserNode ? new Uint8Array(analyserNode.fftSize) : null;

        const A = accent;
        const light: AccentColor = {
            r: Math.min(255, A.r + 110), g: Math.min(255, A.g + 110), b: Math.min(255, A.b + 110),
        };
        const white: AccentColor = { r: 255, g: 255, b: 255 };

        // Smoothed spectrum (one slot per drawn bar/segment) for fluid motion.
        const SMOOTH = 96;
        const spectrum = new Float32Array(SMOOTH);
        // Per-frame state we carry between frames for envelopes / beat detection.
        let bassEnv = 0;        // smoothed bass level
        let beatPulse = 0;      // decays after each detected beat (0..1)
        let prevBass = 0;       // for onset detection
        let energyEnv = 0;      // overall loudness envelope
        let discRot = 0;        // album disc rotation angle (radians)
        let lastTs = performance.now();

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);

            const now = performance.now();
            const dt = Math.min(0.05, (now - lastTs) / 1000);
            lastTs = now;
            const t = now / 1000;

            // Resize backing store to the displayed size (account for DPR, capped at 2).
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const cssW = window.innerWidth, cssH = window.innerHeight;
            if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
                canvas.width = Math.round(cssW * dpr);
                canvas.height = Math.round(cssH * dpr);
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const W = cssW, H = cssH, cx = W / 2, cy = H / 2;

            const { isPlaying: playing, progress: prog, duration: dur } = playStateRef.current;
            const live = !!(analyserNode && freq && wave && playing);
            if (live && analyserNode) {
                analyserNode.getByteFrequencyData(freq!);
                analyserNode.getByteTimeDomainData(wave!);
            }

            // --- Build a normalised spectrum (live) or a smooth synthetic one (idle/mobile).
            if (live && freq) {
                // Use roughly the lower 70% of bins (musical range), log-ish spread.
                const usable = Math.floor(bins * 0.7);
                for (let i = 0; i < SMOOTH; i++) {
                    const idx = Math.min(usable - 1, Math.floor(Math.pow(i / SMOOTH, 1.35) * usable));
                    const target = freq[idx] / 255;
                    // Asymmetric smoothing: snap up fast, fall slowly (feels punchy).
                    spectrum[i] += (target - spectrum[i]) * (target > spectrum[i] ? 0.5 : 0.12);
                }
            } else {
                // Time-based fallback so it never looks frozen. Seed motion from
                // playback progress so paused vs playing differ, with a gentle wave.
                const speed = playing ? 1 : 0.45;
                const amplitude = playing ? 1 : 0.55;
                const base = (prog || t) * speed;
                for (let i = 0; i < SMOOTH; i++) {
                    const p = i / SMOOTH;
                    const v = 0.30 +
                        Math.sin(base * 1.6 + p * 9) * 0.18 +
                        Math.sin(base * 2.7 - p * 5) * 0.10 +
                        Math.sin(base * 0.9 + p * 17) * 0.06;
                    const target = Math.max(0.04, v * amplitude);
                    spectrum[i] += (target - spectrum[i]) * 0.08;
                }
            }

            // --- Bass / energy envelopes + simple beat (onset) detection.
            let bassRaw: number, energyRaw: number;
            if (live && freq) {
                let bsum = 0; for (let i = 1; i < 6; i++) bsum += freq[i];
                bassRaw = bsum / (5 * 255);
                let esum = 0; const cap = Math.floor(bins * 0.5);
                for (let i = 0; i < cap; i++) esum += freq[i];
                energyRaw = esum / (cap * 255);
            } else {
                const base = (prog || t);
                bassRaw = (playing ? 0.45 : 0.28) + Math.sin(base * 2.4) * (playing ? 0.18 : 0.08);
                energyRaw = (playing ? 0.40 : 0.25) + Math.sin(base * 1.2) * 0.08;
            }
            bassEnv += (bassRaw - bassEnv) * 0.18;
            energyEnv += (energyRaw - energyEnv) * 0.10;

            // Onset: a sharp rise in bass above the running average triggers a pulse.
            const onset = bassRaw - prevBass;
            if (onset > 0.10 && bassRaw > bassEnv * 1.04 && bassRaw > 0.30) {
                beatPulse = Math.min(1, beatPulse + Math.min(1, onset * 3));
            }
            prevBass = bassRaw;
            // Idle fallback: synthesize a soft pulse so the disc still breathes.
            if (!live && playing) beatPulse = Math.max(beatPulse, (Math.sin((prog || t) * 2.4) * 0.5 + 0.5) * 0.5);
            beatPulse *= Math.pow(0.0008, dt); // exponential decay (~fast)

            // Disc rotates faster with more energy; pauses gently when stopped.
            discRot += dt * (0.18 + energyEnv * 0.9) * (playing ? 1 : 0.25);

            const amp = (i: number) => spectrum[Math.min(SMOOTH - 1, Math.floor(i * SMOOTH))];

            // ---- Clear with motion trails (lighter for particles).
            ctx.fillStyle = style === 'particles' ? 'rgba(6,8,12,0.20)' : 'rgba(6,8,12,0.30)';
            ctx.fillRect(0, 0, W, H);

            const minDim = Math.min(W, H);

            if (style === 'orb' || style === 'particles') {
                // Both styles share the central album-art disc; the surrounding field differs.
                const baseR = minDim * 0.16;
                const discR = baseR * (1 + beatPulse * 0.10 + bassEnv * 0.06);

                if (style === 'orb') {
                    // Radial spectrum ring around the disc.
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(t * 0.05);
                    const seg = SMOOTH;
                    ctx.lineCap = 'round';
                    for (let i = 0; i < seg; i++) {
                        const v = amp(i / seg);
                        const len = v * baseR * 1.9 + 4;
                        const ang = (i / seg) * Math.PI * 2;
                        const inner = discR + 14;
                        const c = mix(A, light, Math.min(1, v * 1.3));
                        ctx.strokeStyle = rgbString(c, 0.35 + v * 0.65);
                        ctx.lineWidth = Math.max(2, minDim * 0.006);
                        ctx.beginPath();
                        ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
                        ctx.lineTo(Math.cos(ang) * (inner + len), Math.sin(ang) * (inner + len));
                        ctx.stroke();
                    }
                    ctx.restore();
                } else {
                    // Particles: orbiting motes pushed outward by the spectrum + beat.
                    const count = 140;
                    for (let i = 0; i < count; i++) {
                        const f = amp(i / count);
                        const ang = (i / count) * Math.PI * 2 + t * 0.18 + discRot * 0.2;
                        const dist = discR + 30 + (i / count) * minDim * 0.34 + f * 150 + beatPulse * 40;
                        const x = cx + Math.cos(ang) * dist;
                        const y = cy + Math.sin(ang) * dist;
                        const c = i % 3 ? A : light;
                        ctx.fillStyle = rgbString(c, 0.25 + f * 0.7);
                        ctx.beginPath();
                        ctx.arc(x, y, 1 + f * 7 + beatPulse * 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                drawDisc(ctx, cx, cy, discR, discRot, beatPulse, bassEnv, A, light, white);
            } else if (style === 'bars') {
                // Mirrored spectrum bars across the bottom + soft reflection.
                const count = SMOOTH;
                const gap = 2;
                const bw = Math.max(2, (W / count) - gap);
                const baseY = H * 0.74;
                for (let i = 0; i < count; i++) {
                    const v = amp(i / count);
                    const h = v * H * 0.5 * (0.5 + beatPulse * 0.4) + 4;
                    const x = i * (W / count) + gap / 2;
                    const c = mix(A, light, Math.min(1, v * 1.2));
                    const grad = ctx.createLinearGradient(0, baseY - h, 0, baseY);
                    grad.addColorStop(0, rgbString(light, 0.95));
                    grad.addColorStop(1, rgbString(c, 0.45));
                    ctx.fillStyle = grad;
                    ctx.fillRect(x, baseY - h, bw, h);
                    // reflection
                    ctx.fillStyle = rgbString(c, 0.10);
                    ctx.fillRect(x, baseY + 2, bw, h * 0.4);
                }
                // Album disc floats above the bars.
                const discR = minDim * 0.13 * (1 + beatPulse * 0.10 + bassEnv * 0.05);
                drawDisc(ctx, cx, H * 0.34, discR, discRot, beatPulse, bassEnv, A, light, white);
            } else { // wave
                // Layered time-domain / synthetic waveform.
                for (let l = 0; l < 4; l++) {
                    ctx.beginPath();
                    ctx.lineWidth = l === 0 ? Math.max(3, minDim * 0.005) : 1.6;
                    const c = l === 0 ? light : A;
                    ctx.strokeStyle = rgbString(c, l === 0 ? 0.95 : 0.22);
                    const ampScale = H * 0.20 * (1 - l * 0.16) * (0.6 + energyEnv + beatPulse * 0.5);
                    const step = 4;
                    for (let x = 0; x <= W; x += step) {
                        const p = x / W;
                        const win = Math.pow(Math.sin(p * Math.PI), 1.6);
                        let s: number;
                        if (live && wave) {
                            const wi = Math.floor(p * (wave.length - 1));
                            s = (wave[wi] - 128) / 128; // -1..1
                        } else {
                            const base = (playStateRef.current.progress || t);
                            s = Math.sin(p * 14 + base * (1.6 + l * 0.5)) * (0.4 + amp(p) * 0.6);
                        }
                        const y = cy + s * ampScale * win + Math.sin(t * (1 + l * 0.4) + p * 6) * 6 * win;
                        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
                // Small album disc centered.
                const discR = minDim * 0.12 * (1 + beatPulse * 0.10 + bassEnv * 0.05);
                drawDisc(ctx, cx, cy, discR, discRot, beatPulse, bassEnv, A, light, white);
            }
        };

        // Draws the circular album-art disc (with art when loaded, gradient fallback otherwise).
        const drawDisc = (
            c: CanvasRenderingContext2D, x: number, y: number, R: number,
            rot: number, pulse: number, bass: number,
            base: AccentColor, lite: AccentColor, wht: AccentColor
        ) => {
            c.save();
            c.translate(x, y);

            // Glow halo that swells with the beat.
            const glowR = R * (1.7 + pulse * 0.6);
            const halo = c.createRadialGradient(0, 0, R * 0.5, 0, 0, glowR);
            halo.addColorStop(0, rgbString(lite, 0.45 + pulse * 0.3));
            halo.addColorStop(0.5, rgbString(base, 0.18));
            halo.addColorStop(1, 'transparent');
            c.fillStyle = halo;
            c.beginPath();
            c.arc(0, 0, glowR, 0, Math.PI * 2);
            c.fill();

            // Accent rim ring.
            c.lineWidth = Math.max(2, R * 0.03);
            c.strokeStyle = rgbString(lite, 0.8);
            c.beginPath();
            c.arc(0, 0, R + c.lineWidth, 0, Math.PI * 2);
            c.stroke();

            // Rotating disc body.
            c.rotate(rot);
            c.beginPath();
            c.arc(0, 0, R, 0, Math.PI * 2);
            c.closePath();
            c.save();
            c.clip();
            if (artReadyRef.current && artImgRef.current) {
                c.drawImage(artImgRef.current, -R, -R, R * 2, R * 2);
                // Subtle vignette for depth.
                const vg = c.createRadialGradient(0, 0, R * 0.4, 0, 0, R);
                vg.addColorStop(0, 'rgba(0,0,0,0)');
                vg.addColorStop(1, 'rgba(0,0,0,0.45)');
                c.fillStyle = vg;
                c.fillRect(-R, -R, R * 2, R * 2);
            } else {
                // Fallback: themed gradient disc with a music glyph feel.
                const g = c.createLinearGradient(-R, -R, R, R);
                g.addColorStop(0, rgbString(lite, 1));
                g.addColorStop(1, rgbString(base, 1));
                c.fillStyle = g;
                c.fillRect(-R, -R, R * 2, R * 2);
                c.fillStyle = 'rgba(255,255,255,0.85)';
                c.font = `${R * 0.9}px sans-serif`;
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('♪', 0, R * 0.05); // ♪
            }
            c.restore(); // un-clip

            // Center spindle hole (vinyl feel) — drawn after un-clip so it sits on top.
            c.fillStyle = 'rgba(8,10,14,0.92)';
            c.beginPath();
            c.arc(0, 0, R * 0.14, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = rgbString(wht, 0.9);
            c.beginPath();
            c.arc(0, 0, R * 0.05, 0, Math.PI * 2);
            c.fill();

            c.restore();
        };

        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [isOpen, analyserNode, style, accent]);

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
                            {cover ? (
                                <img src={cover} alt="" className="w-16 h-16 rounded-xl object-cover shadow-2xl shrink-0" />
                            ) : (
                                <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center shadow-2xl" style={{ background: rgbString(accent, 1) }}>
                                    <Music size={26} className="text-white/90" />
                                </div>
                            )}
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
