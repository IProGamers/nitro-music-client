"use client"
import { useEffect, useRef } from 'react';
import { useAudioFX } from '@/context/AudioFXContext';
import { useSettings } from '@/context/SettingsContext';

interface AudioVisualizerProps {
    className?: string;
    height?: number;
    showOverlay?: boolean;
}

export default function AudioVisualizer({
    className = '',
    height = 60,
    showOverlay = false
}: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { frequencyData, visualizerEnabled, visualizerIntensity } = useAudioFX();
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuration based on size
        const isSmall = height < 100;

        const draw = () => {
            // Reset canvas
            const width = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, width, h);

            if (!frequencyData || frequencyData.length === 0 || !visualizerEnabled) {
                // Draw a straight line or idle state
                if (isSmall) {
                    ctx.beginPath();
                    ctx.moveTo(0, h / 2);
                    ctx.lineTo(width, h / 2);
                    ctx.strokeStyle = "rgba(113, 113, 122, 0.3)"; // zinc-500 opacity
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            // Calculations
            // Get average amplitude for bass (lower frequencies)
            let bassSum = 0;
            for (let i = 0; i < 10; i++) bassSum += frequencyData[i];
            const bass = bassSum / 10;
            const bassNormalized = bass / 255;

            // Mode Switch
            if (isSmall) {
                drawMicroMode(ctx, frequencyData, width, h, bassNormalized);
            } else {
                drawPremiumMode(ctx, frequencyData, width, h, bassNormalized);
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [frequencyData, visualizerEnabled, height]);

    // Handle resizing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateSize = () => {
            // High DPI scaling
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            // Set display size (css properties)
            // We use inline style for height, but width is fluid
            if (canvas.width !== rect.width * dpr || canvas.height !== height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = height * dpr;

                // Normalize coordinate system if needed, but usually easier to work with pixels
            }
        };

        // Initial sizing
        updateSize();

        // Debounce can be added but simple resize listener is usually okay
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(canvas);

        return () => resizeObserver.disconnect();
    }, [height]);

    if (!visualizerEnabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className={`w-full block ${className}`}
            style={{ height: `${height}px` }}
        />
    );
}

// --- Visualizer Modes ---

// 1. Sleek "Voice" Waveform for Mini Player
function drawMicroMode(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    intensity: number
) {
    const centerY = height / 2;
    const padding = width * 0.1;
    const usableWidth = width - (padding * 2);

    // Smooth the data
    // We only need ~20 points for a smooth curve
    const pointsCount = 20;
    const step = Math.floor(data.length / pointsCount);

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    // Create a beautiful gradient path
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "rgba(34, 211, 238, 0)"); // Fade in
    gradient.addColorStop(0.2, "#22d3ee"); // Cyan
    gradient.addColorStop(0.5, "#a855f7"); // Purple
    gradient.addColorStop(0.8, "#ec4899"); // Pink
    gradient.addColorStop(1, "rgba(236, 72, 153, 0)"); // Fade out

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4 + (intensity * 4);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw Curve
    for (let i = 0; i <= pointsCount; i++) {
        // Curve formula: mix of sine waves logic + fft data
        const x = (i / pointsCount) * width;

        // Get data value mapping
        const dataIndex = Math.min(Math.floor(i * step), data.length - 1);
        const val = data[dataIndex] / 255;

        // Window function (hanning) to taper ends
        const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / pointsCount));

        const amp = val * height * 0.8 * window;
        const offset = Math.sin((i + performance.now() / 200)) * (height * 0.1); // Idle movement

        // Draw connecting quadratic curves
        // Actually simpler: Line to points for now or catmull-rom
        // Let's stick to lineTo with high resolution or just Bezier
        const y = centerY + (Math.sin(i * 0.5) * amp) * (i % 2 === 0 ? 1 : -1);

        // To make it smooth, control points
        if (i === 0) ctx.moveTo(x, centerY);
        else {
            // Simple smoothing
            const prevX = ((i - 1) / pointsCount) * width;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, y, x, centerY); // This simplifies to a flat line with bumps
            // Correction: Real organic wave
            // Just drawing many short lines is fine at 60fps
            ctx.lineTo(x, y);
        }
    }
    // ctx.stroke(); 

    // Retrying a better "Siri" style wave approach for Micro Mode
    // Draw 3 overlapping sine waves that vary by frequency
    drawSiriWave(ctx, width, height, intensity);
}

function drawSiriWave(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
    const centerY = height / 2;
    const time = performance.now() / 1000;

    const colors = [
        `rgba(34, 211, 238, ${0.4 + intensity * 0.6})`, // Cyan
        `rgba(168, 85, 247, ${0.4 + intensity * 0.6})`, // Purple
        `rgba(236, 72, 153, ${0.4 + intensity * 0.6})`  // Pink
    ];

    colors.forEach((color, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 + (intensity * 2); // Thicker on loud music

        const offset = idx * 2;
        const speed = (idx + 1) * 2;
        const amplitudeBase = (height / 3) * (0.5 + intensity);

        for (let x = 0; x <= width; x += 5) {
            // Normalized X (0 to 1) for windowing
            const nx = x / width;
            // Window function (Bell curve) to keep edges pinned to zero
            const window = Math.pow(4 * nx * (1 - nx), 2);

            const y = centerY + Math.sin(x * 0.02 + time * speed + offset) * amplitudeBase * window;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    });
}


// 2. Premium "Orb Spectrum" for Large Player
function drawPremiumMode(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    bassIntensity: number
) {
    const cx = width / 2;
    const cy = height; // Bottom anchored usually looks better for background, typically
    // However, if height is large (192px in the component), it's likely a header.
    // Let's center it vertically if it's huge, otherwise bottom.
    // Actually the usage is "absolute top-0... height 192". So it's a header banner.
    // In FullScreenVisualizer it's distinct.

    // Let's assume standard "Header" style: Waves at the bottom
    const baseY = height - 10;

    const bars = 64;
    const step = Math.floor(data.length / bars);
    const barW = (width / bars);

    // Glow effect
    ctx.shadowBlur = 20 * bassIntensity;
    ctx.shadowColor = "#22d3ee"; // Cyan glow

    // Draw Mirrored Spectrum
    for (let i = 0; i < bars; i++) {
        const val = data[i * step] / 255;
        const barH = val * height * 0.8 * (0.5 + bassIntensity); // Reacts to bass

        const x = i * barW;

        // Gradient color based on height/intensity
        const hue = 180 + (val * 120); // Cyan (180) to Purple/Pink (300)
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;

        // Rounded top bars
        // Simple rect for performance, but round cap looks nice
        const r = barW / 2;

        // Draw bar
        ctx.beginPath();
        ctx.rect(x, height - barH, barW - 2, barH + 10);
        ctx.fill();
    }
}

