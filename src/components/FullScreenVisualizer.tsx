"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAudioFX } from '@/context/AudioFXContext';
import { usePlayer } from '@/context/PlayerContext';
import { X, Maximize2, Minimize2, Palette } from 'lucide-react';

interface FullScreenVisualizerProps {
    isOpen: boolean;
    onClose: () => void;
}

type VisualizerStyle = 'bars' | 'wave' | 'circle' | 'particles' | 'spectrum';

export default function FullScreenVisualizer({ isOpen, onClose }: FullScreenVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const { analyserNode } = useAudioFX();
    const { currentSong, isPlaying } = usePlayer();

    // Local state for full screen visualizer - independent from AudioFXPanel settings
    const [style, setStyle] = useState<VisualizerStyle>('circle');
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const getImg = (t: any) => {
        if (!t) return '';
        if (t.image && Array.isArray(t.image) && t.image.length) {
            return t.image[t.image.length - 1].url || t.image[t.image.length - 1].link || '';
        }
        return t.image || '';
    };

    // Draw visualizer
    useEffect(() => {
        if (!isOpen || !isPlaying || !canvasRef.current || !analyserNode) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = 0;
            }
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const renderFrame = () => {
            animationId = requestAnimationFrame(renderFrame);

            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            const W = canvas.width;
            const H = canvas.height;
            const cx = W / 2;
            const cy = H / 2;
            const time = performance.now() / 1000;

            analyserNode.getByteFrequencyData(dataArray);

            // Audio metrics
            const bass = dataArray[0] / 255;
            const mid = dataArray[Math.floor(bufferLength * 0.2)] / 255;
            const treble = dataArray[Math.floor(bufferLength * 0.5)] / 255;
            const volume = dataArray.reduce((s, v) => s + v, 0) / (bufferLength * 255);

            // BG
            if (style === 'particles') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(0, 0, W, H);
            } else {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, W, H);
            }

            switch (style) {
                case 'bars': {
                    const barCount = 100;
                    const barW = (W / barCount) * 0.8;
                    const step = Math.floor(bufferLength / barCount / 2);

                    for (let i = 0; i < barCount; i++) {
                        const val = dataArray[i * step] / 255;
                        const h = val * (H * 0.6);
                        const hue = (i / barCount) * 120 + 180; // Cyan -> Purple
                        const x = (i / (barCount - 1)) * W;

                        const grad = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
                        grad.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
                        grad.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${0.6 + val * 0.4})`);
                        grad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

                        ctx.fillStyle = grad;
                        ctx.shadowBlur = val * 15;
                        ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.5)`;
                        ctx.fillRect(x - barW / 2, cy - h / 2, barW, h);

                        // Top/Bottom pins
                        ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${val})`;
                        ctx.fillRect(x - barW / 2, cy - h / 2 - 2, barW, 2);
                        ctx.fillRect(x - barW / 2, cy + h / 2, barW, 2);
                    }
                    ctx.shadowBlur = 0;
                    break;
                }

                case 'wave': {
                    const layers = 6;
                    for (let l = 0; l < layers; l++) {
                        ctx.beginPath();
                        ctx.lineWidth = l === 0 ? 3 : 1;
                        const alpha = l === 0 ? 1 : 0.25;
                        const hue = 160 + (l * 40);
                        ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;

                        const amp = (volume * H * 0.5) * (1 - l * 0.12);
                        const freq = 0.003 + (l * 0.001);
                        const speed = time * (1.5 + l * 0.5);

                        for (let x = 0; x <= W; x += 4) {
                            const nx = x / W;
                            const window = Math.pow(Math.sin(nx * Math.PI), 2.5);
                            const y = cy + Math.sin(x * freq + speed) * amp * window;
                            if (x === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                    break;
                }

                case 'circle': {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(time * 0.1);

                    const baseRadius = Math.min(W, H) * 0.15;
                    const segments = 128;
                    const step = Math.floor(bufferLength / segments / 2);

                    for (let i = 0; i < segments; i++) {
                        const val = dataArray[i * step] / 255;
                        const barH = val * baseRadius * 1.5;
                        const angle = (i / segments) * Math.PI * 2;

                        ctx.save();
                        ctx.rotate(angle);

                        const hue = (i / segments) * 60 + 180 + (time * 10);
                        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.5 + val * 0.5})`;

                        // Main Bar
                        ctx.beginPath();
                        ctx.arc(0, baseRadius + 10, 2, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillRect(-1.5, baseRadius + 15, 3, barH);

                        // Outer glow dot
                        ctx.beginPath();
                        ctx.arc(0, baseRadius + 15 + barH, 2.5, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.restore();
                    }

                    // Core Orb
                    const orbSize = baseRadius * (0.8 + bass * 0.4);
                    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbSize);
                    grad.addColorStop(0, 'white');
                    grad.addColorStop(0.3, 'cyan');
                    grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.3)');
                    grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(0, 0, orbSize, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                    break;
                }

                case 'particles': {
                    const count = 180;
                    for (let i = 0; i < count; i++) {
                        const f = dataArray[Math.floor(i * bufferLength / count / 2)] / 255;
                        // Particle follows a radial path
                        const angle = (i / count) * Math.PI * 2 + (time * 0.08);
                        const distance = (i / count) * (Math.min(W, H) * 0.5) + (f * 150);

                        const x = cx + Math.cos(angle) * distance;
                        const y = cy + Math.sin(angle) * distance;

                        const hue = (i / count) * 360 + (time * 20);
                        const radius = 1 + f * 10;

                        ctx.shadowBlur = f * 10;
                        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 1)`;
                        ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${0.4 + f * 0.6})`;

                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();

                        if (f > 0.8 && i % 4 === 0) {
                            ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.15)`;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(x, y);
                            ctx.stroke();
                        }
                    }
                    ctx.shadowBlur = 0;
                    break;
                }

                case 'spectrum': {
                    const points = 120;
                    const step = Math.floor(bufferLength / points / 1.5);

                    ctx.beginPath();
                    ctx.moveTo(0, H);

                    for (let i = 0; i < points; i++) {
                        const val = dataArray[i * step] / 255;
                        const x = (i / (points - 1)) * W;
                        const y = H - (val * H * 0.75) - 30;

                        if (i === 0) ctx.moveTo(x, y);
                        else {
                            const prevX = ((i - 1) / (points - 1)) * W;
                            const prevVal = dataArray[(i - 1) * step] / 255;
                            const prevY = H - (prevVal * H * 0.75) - 30;
                            ctx.quadraticCurveTo((prevX + x) / 2, (prevY + y) / 2, x, y);
                        }
                    }

                    ctx.lineTo(W, H);
                    ctx.lineTo(0, H);
                    ctx.closePath();

                    const grad = ctx.createLinearGradient(0, H, 0, H * 0.2);
                    grad.addColorStop(0, 'rgba(12, 74, 110, 0.4)'); // Deep Cyan
                    grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.6)'); // Purple
                    grad.addColorStop(1, 'rgba(34, 211, 238, 0.9)'); // Bright Cyan

                    ctx.fillStyle = grad;
                    ctx.fill();

                    // Top stroke
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = '#22d3ee';
                    ctx.stroke();

                    // Mirror reflection at bottom
                    ctx.save();
                    ctx.translate(0, H);
                    ctx.scale(1, -0.2);
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.restore();
                    break;
                }
            }
        };

        renderFrame();
        return () => cancelAnimationFrame(animationId);
    }, [isOpen, isPlaying, analyserNode, style]);

    // Toggle fullscreen
    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Auto-hide controls
    useEffect(() => {
        if (!isOpen) return;
        let timeout: NodeJS.Timeout;

        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        handleMouseMove();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeout);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black z-[300]" onClick={() => setShowControls(!showControls)}>
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Song Info Overlay */}
            {currentSong && (
                <div className={`absolute bottom-32 left-1/2 -translate-x-1/2 text-center transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    {getImg(currentSong) && (
                        <img
                            src={getImg(currentSong)}
                            alt={currentSong.name}
                            className="w-32 h-32 rounded-2xl mx-auto mb-4 shadow-2xl"
                        />
                    )}
                    <h2 className="text-2xl font-bold text-white mb-1">{currentSong.name}</h2>
                    <p className="text-sm text-white/60">
                        {currentSong.artists?.primary?.[0]?.name || currentSong.artist}
                    </p>
                </div>
            )}

            {/* Controls */}
            <div className={`absolute top-0 left-0 right-0 p-6 flex items-center justify-between transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="p-3 bg-black/50 hover:bg-black/70 rounded-xl backdrop-blur-sm"
                >
                    <X size={24} className="text-white" />
                </button>

                <div className="flex items-center gap-3">
                    {/* Style Selector */}
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-xl p-2">
                        <Palette size={18} className="text-cyan-400 ml-2" />
                        {(['bars', 'wave', 'circle', 'particles', 'spectrum'] as VisualizerStyle[]).map(s => (
                            <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); setStyle(s); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${style === s ? 'bg-cyan-400 text-black' : 'text-white/60 hover:text-white'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                        className="p-3 bg-black/50 hover:bg-black/70 rounded-xl backdrop-blur-sm"
                    >
                        {isFullscreen ? <Minimize2 size={20} className="text-white" /> : <Maximize2 size={20} className="text-white" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
