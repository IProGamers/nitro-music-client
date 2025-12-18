"use client"
import { useEffect, useRef } from 'react';
import { useAudioFX } from '@/context/AudioFXContext';

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
    const { frequencyData, visualizerStyle, visualizerIntensity, visualizerEnabled } = useAudioFX();
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            if (!frequencyData || frequencyData.length === 0 || !visualizerEnabled) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            const intensity = visualizerIntensity;

            switch (visualizerStyle) {
                case 'bars':
                    drawBars(ctx, frequencyData, width, height, intensity);
                    break;
                case 'wave':
                    drawWave(ctx, frequencyData, width, height, intensity);
                    break;
                case 'circle':
                    drawCircle(ctx, frequencyData, width, height, intensity);
                    break;
                case 'particles':
                    drawParticles(ctx, frequencyData, width, height, intensity);
                    break;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [frequencyData, visualizerStyle, visualizerIntensity, visualizerEnabled]);

    // Update canvas size
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateSize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [height]);

    // Don't render anything if visualizer is disabled
    if (!visualizerEnabled) {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            className={`w-full ${className}`}
            style={{ height: `${height}px` }}
        />
    );
}

// Draw bars visualization
function drawBars(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    intensity: number
) {
    const barCount = 64;
    const barWidth = (width / barCount) * 0.8;
    const gap = (width / barCount) * 0.2;
    const step = Math.floor(data.length / barCount);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#22d3ee'); // Cyan
    gradient.addColorStop(0.5, '#a855f7'); // Purple
    gradient.addColorStop(1, '#ec4899'); // Pink

    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.5)';

    for (let i = 0; i < barCount; i++) {
        const start = i * step;
        const end = start + step;
        let sum = 0;
        for (let j = start; j < end; j++) sum += data[j];
        const value = (sum / step) * intensity;

        const barHeight = (value / 255) * height * 0.9;
        const x = i * (barWidth + gap);
        const y = 0;

        ctx.fillStyle = gradient;

        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [0, 0, radius, radius]);
        ctx.fill();

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#22d3ee';
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y + barHeight - 2, barWidth, 2);
        ctx.shadowBlur = 0;
    }
    ctx.shadowBlur = 0;
}

// Draw wave visualization (Modern Smooth Glow Wave)
function drawWave(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    intensity: number
) {
    const centerY = height / 2;

    // Draw multiple wave layers for depth
    const layers = [
        { opacity: 0.3, lineWidth: 8, offset: 0, color: 'rgba(34, 211, 238, 0.3)' },
        { opacity: 0.6, lineWidth: 4, offset: 0, color: 'rgba(34, 211, 238, 0.6)' },
        { opacity: 1, lineWidth: 2, offset: 0, color: '#22d3ee' },
    ];

    layers.forEach(layer => {
        ctx.beginPath();
        ctx.lineWidth = layer.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Create gradient stroke
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(34, 211, 238, 0.5)');
        gradient.addColorStop(0.25, '#a855f7');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(0.75, '#a855f7');
        gradient.addColorStop(1, 'rgba(34, 211, 238, 0.5)');
        ctx.strokeStyle = gradient;

        if (layer.opacity === 1) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#22d3ee';
        }

        const step = Math.floor(data.length / 64);
        const sliceWidth = width / 64;

        for (let i = 0; i <= 64; i++) {
            const dataIndex = Math.min(i * step, data.length - 1);
            const v = (data[dataIndex] / 255) * intensity;
            const amplitude = v * (height / 3);
            const x = i * sliceWidth;
            const y = centerY + Math.sin(i * 0.2 + layer.offset) * amplitude;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                // Use quadratic curves for smoothness
                const prevX = (i - 1) * sliceWidth;
                const cpX = (prevX + x) / 2;
                ctx.quadraticCurveTo(prevX, ctx.canvas.height / 2 + Math.sin((i - 1) * 0.2) * ((data[Math.min((i - 1) * step, data.length - 1)] / 255) * intensity * height / 3), cpX, y);
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    });

    // Add subtle fill under the main wave
    ctx.beginPath();
    const fillGradient = ctx.createLinearGradient(0, centerY, 0, height);
    fillGradient.addColorStop(0, 'rgba(34, 211, 238, 0.15)');
    fillGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    const step = Math.floor(data.length / 64);
    const sliceWidth = width / 64;

    ctx.moveTo(0, centerY);
    for (let i = 0; i <= 64; i++) {
        const dataIndex = Math.min(i * step, data.length - 1);
        const v = (data[dataIndex] / 255) * intensity;
        const amplitude = v * (height / 3);
        const x = i * sliceWidth;
        const y = centerY + Math.sin(i * 0.2) * amplitude;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = fillGradient;
    ctx.fill();
}

// Draw circle visualization
function drawCircle(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    intensity: number
) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 3;

    // Outer glow
    const glow = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, baseRadius * 1.5);
    glow.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
    glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.setLineDash([5, 5]);

    for (let i = 0; i < data.length; i++) {
        const angle = (i / data.length) * Math.PI * 2;
        const value = (data[i] / 255) * intensity;
        const radius = baseRadius + value * 50;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        // Drawing "rays"
        if (i % 8 === 0) {
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.moveTo(centerX + Math.cos(angle) * baseRadius, centerY + Math.sin(angle) * baseRadius);
            ctx.lineTo(x, y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${value * 0.5})`;
            ctx.stroke();
            ctx.restore();
        }
    }

    ctx.closePath();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Core
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
}

// Particles storage
const particles: { x: number; y: number; vx: number; vy: number; life: number; hue: number }[] = [];

// Draw particles visualization
function drawParticles(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    intensity: number
) {
    // Calculate average amplitude
    const avg = data.reduce((a, b) => a + b, 0) / data.length;

    // Spawn new particles based on amplitude
    if (avg > 100 && particles.length < 100) {
        const hue = Math.random() * 60 + 180; // Cyan to purple
        particles.push({
            x: Math.random() * width,
            y: 0,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 5 * intensity + 2,
            life: 1,
            hue
        });
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // Accelerate downwards

        p.life -= 0.02;

        if (p.life <= 0 || p.y > height) {
            particles.splice(i, 1);
            continue;
        }

        const size = p.life * 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.life})`;
        ctx.fill();

        // Glow
        ctx.shadowColor = `hsla(${p.hue}, 80%, 60%, 1)`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
