"use client"
import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Download, Share2, Copy, Check, Music, Sparkles, QrCode, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUsage } from '@/context/UsageContext';

interface ShareableCardProps {
    isOpen: boolean;
    onClose: () => void;
    song: {
        id?: string;
        name: string;
        artist?: string;
        image?: string | { url?: string; quality?: string }[] | any;
        album?: string;
        duration?: number;
        artists?: { primary?: { name: string }[] };
    } | null;
}

export default function ShareableCard({ isOpen, onClose, song }: ShareableCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [cardTheme, setCardTheme] = useState<'modern' | 'glass' | 'cyber'>('modern');
    const { user } = useAuth();
    const { checkAccess, setShowLimitModal, setLimitFeature } = useUsage();

    // Get image URL helper - handles different formats
    const getImageUrl = (): string | null => {
        if (!song?.image) return null;

        if (typeof song.image === 'string') return song.image;

        if (Array.isArray(song.image)) {
            const sorted = [...song.image].sort((a, b) => {
                const qualityOrder: Record<string, number> = { '500x500': 5, '400x400': 4, '300x300': 3, '150x150': 2, '50x50': 1 };
                return (qualityOrder[b?.quality] || 0) - (qualityOrder[a?.quality] || 0);
            });
            return sorted[0]?.url || sorted[0]?.link || null;
        }

        if (typeof song.image === 'object' && song.image.url) {
            return song.image.url;
        }

        return null;
    };

    // Get artist name helper
    const getArtist = () => {
        if (song?.artists?.primary?.[0]?.name) return song.artists.primary[0].name;
        if (song?.artist) return song.artist;
        return 'Unknown Artist';
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Generate unique "secret" code
    const getSecretCode = () => {
        if (!user || !song?.id) return 'guest';
        // Create a fake "encrypted" code using base64 or similar ensuring it looks cool
        const part1 = user.uid.slice(0, 5);
        const part2 = song.id.toString().slice(-4);
        return `${part1}x${part2}`;
    };

    // Generate card using Canvas API
    const generateCard = useCallback(async () => {
        if (!song || !canvasRef.current) return;

        setIsGenerating(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Card dimensions (Instagram story friendly - 9:16)
        canvas.width = 1080;
        canvas.height = 1920;

        // --- THEME BACKGROUNDS ---
        if (cardTheme === 'modern') {
            // Sleek Gradient Mesh
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, '#0f172a'); // Slate 900
            bgGradient.addColorStop(1, '#000000');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Mesh orbs
            const drawOrb = (x: number, y: number, r: number, color: string) => {
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, color);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            drawOrb(0, 0, 800, 'rgba(34, 211, 238, 0.15)'); // Cyan top left
            drawOrb(1080, 1920, 900, 'rgba(168, 85, 247, 0.15)'); // Purple bottom right

        } else if (cardTheme === 'glass') {
            // Bright/Holo styling
            const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
            bgGradient.addColorStop(0, '#1e1b4b'); // Indigo 950
            bgGradient.addColorStop(0.5, '#4c1d95'); // Violet 900
            bgGradient.addColorStop(1, '#be185d'); // Pink 700
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Noise
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            for (let i = 0; i < 5000; i++) {
                ctx.fillRect(Math.random() * 1080, Math.random() * 1920, 2, 2);
            }

        } else if (cardTheme === 'cyber') {
            // Matrix / Tech style
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
            ctx.lineWidth = 2;
            const gridSize = 60;
            for (let x = 0; x <= 1080; x += gridSize) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke();
            }
            for (let y = 0; y <= 1920; y += gridSize) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke();
            }
            // Tech Corners
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 4;
            ctx.strokeRect(50, 50, 980, 1820);
        }

        // --- LOGO & BRANDING (Horizontal Layout) ---
        const startY = 120;

        try {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
                logoImg.src = '/logo.png';
            });

            // Fonts configuration
            // Nitro: Bold, Cyan (#22d3ee)
            // by ipro: Small, Muted, Lowercase
            const nitroFont = "bold 60px 'Inter', sans-serif";
            const byIproFont = "bold 24px 'Inter', sans-serif";

            ctx.save();
            ctx.textBaseline = 'middle';

            // Measure
            ctx.font = nitroFont;
            const nitroWidth = ctx.measureText('Nitro').width;

            ctx.font = byIproFont;
            // Add fake tracking to measurement (approx 4px per char)
            const byIproText = 'by ipro';
            const byIproWidth = ctx.measureText(byIproText).width + (byIproText.length * 2);

            // Image Dimensions
            const logoH = 80;
            const logoAspect = logoImg.width / logoImg.height;
            const logoW = logoH * logoAspect;

            // Spacing
            const gap1 = 24; // Logo -> Nitro
            const gap2 = 16; // Nitro -> by ipro

            // Calculate Start X for centering
            const totalWidth = logoW + gap1 + nitroWidth + gap2 + byIproWidth;
            let currentX = (1080 - totalWidth) / 2;

            // 1. Draw Logo
            ctx.save();
            ctx.shadowColor = 'rgba(34, 211, 238, 0.4)'; // Cyan glow
            ctx.shadowBlur = 20;

            // Rounded Clip
            ctx.beginPath();
            ctx.roundRect(currentX, startY - logoH / 2, logoW, logoH, 20);
            ctx.clip();
            ctx.drawImage(logoImg, currentX, startY - logoH / 2, logoW, logoH);
            ctx.restore();

            currentX += logoW + gap1;

            // 2. Draw "Nitro"
            ctx.font = nitroFont;
            ctx.fillStyle = '#22d3ee'; // Cyan-400
            ctx.textAlign = 'left';
            ctx.fillText('Nitro', currentX, startY);

            currentX += nitroWidth + gap2;

            // 3. Draw "by ipro"
            ctx.font = byIproFont;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // Muted

            // Manually draw with spacing (tracking-widest)
            let iproX = currentX;
            for (let i = 0; i < byIproText.length; i++) {
                ctx.fillText(byIproText[i], iproX, startY + 6); // Slightly lower
                iproX += ctx.measureText(byIproText[i]).width + 4; // +4px tracking
            }

            ctx.restore();

        } catch (e) {
            // Fallback
            ctx.textAlign = 'center';
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 60px sans-serif';
            ctx.fillText('Nitro', 1080 / 2 - 40, startY);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '24px sans-serif';
            ctx.fillText('by ipro', 1080 / 2 + 60, startY);
        }

        // --- ARTWORK ---
        const imageUrl = getImageUrl();
        const artSize = 800;
        const artX = (1080 - artSize) / 2;
        const artY = 400;
        const radius = cardTheme === 'cyber' ? 0 : 60;

        if (imageUrl) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageUrl;
                });

                // Drop shadow
                ctx.save();
                if (cardTheme === 'cyber') {
                    ctx.shadowColor = '#22d3ee';
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#000';
                    ctx.fillRect(artX + 20, artY + 20, artSize, artSize); // Hard shadow
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 80;
                    ctx.shadowOffsetY = 40;
                }

                // Draw rounded image
                ctx.beginPath();
                ctx.roundRect(artX, artY, artSize, artSize, radius);
                if (cardTheme !== 'cyber') ctx.fill(); // Fill for shadow
                ctx.clip();

                ctx.drawImage(img, artX, artY, artSize, artSize);

                // Overlay for glass
                if (cardTheme === 'glass') {
                    const sheen = ctx.createLinearGradient(artX, artY, artX + artSize, artY + artSize);
                    sheen.addColorStop(0, 'rgba(255,255,255,0.2)');
                    sheen.addColorStop(0.5, 'transparent');
                    sheen.addColorStop(1, 'rgba(255,255,255,0.1)');
                    ctx.fillStyle = sheen;
                    ctx.fill();
                }

                ctx.restore();

                // Stroke
                if (cardTheme === 'modern') {
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(artX, artY, artSize, artSize, radius);
                    ctx.stroke();
                }
                else if (cardTheme === 'cyber') {
                    // Cyber corners
                    ctx.strokeStyle = '#22d3ee';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(artX - 10, artY - 10, artSize + 20, artSize + 20);
                }

            } catch (e) {
                // Fallback
                ctx.fillStyle = '#333';
                ctx.fillRect(artX, artY, artSize, artSize);
            }
        }

        // --- TYPOGRAPHY ---
        let textY = artY + artSize + 120;
        const textCenter = 1080 / 2;

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 80px "Inter", sans-serif';
        ctx.textAlign = 'center';

        let title = song.name;
        if (title.length > 20) {
            title = title.substring(0, 20) + '...';
        }
        ctx.fillText(title, textCenter, textY);

        // Artist
        textY += 90;
        ctx.fillStyle = cardTheme === 'cyber' ? '#22d3ee' : 'rgba(255,255,255,0.7)';
        ctx.font = '50px "Inter", sans-serif';
        ctx.fillText(getArtist(), textCenter, textY);

        // --- SECRET URL SECTION ---
        const bottomY = 1650;
        const secretCode = getSecretCode();
        const displayUrl = `nitromusic.app/listen?ref=${secretCode}`;

        // Pill Container
        const pillW = 700;
        const pillH = 100;
        const pillX = (1080 - pillW) / 2;

        ctx.save();
        if (cardTheme === 'cyber') {
            ctx.fillStyle = '#000';
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 3;
            ctx.fillRect(pillX, bottomY, pillW, pillH);
            ctx.strokeRect(pillX, bottomY, pillW, pillH);
        } else {
            // Glassmorphism Pill
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.roundRect(pillX, bottomY, pillW, pillH, 50);
            ctx.fill();

            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // URL Text
        ctx.font = cardTheme === 'cyber' ? '40px "Courier New"' : 'bold 36px monospace';
        ctx.fillStyle = cardTheme === 'cyber' ? '#22d3ee' : '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayUrl, textCenter, bottomY + (pillH / 2));

        // Label above standard
        if (cardTheme !== 'cyber') {
            ctx.font = '24px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('Tap to listen', textCenter, bottomY - 30);
        }
        ctx.restore();


        setIsGenerating(false);
    }, [song, cardTheme, user]);

    // Download card as image
    const downloadCard = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `nitro-${song?.name?.replace(/\s+/g, '-').toLowerCase() || 'song'}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    // Copy to clipboard
    const copyToClipboard = async () => {
        if (!canvasRef.current) return;
        try {
            const blob = await new Promise<Blob>((resolve) => {
                canvasRef.current!.toBlob((b) => resolve(b!), 'image/png');
            });
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    // Share (if supported)
    const shareCard = async () => {
        if (!song || !canvasRef.current || !navigator.share) return;
        try {
            const blob = await new Promise<Blob>((resolve) => {
                canvasRef.current!.toBlob((b) => resolve(b!), 'image/png');
            });
            const file = new File([blob], `nitro-${song.name}.png`, { type: 'image/png' });

            // Build real URL 
            const secretCode = getSecretCode();
            const url = `${window.location.origin}/song/${song.id}?ref=${secretCode}`;

            await navigator.share({
                files: [file],
                title: `${song.name} - ${getArtist()}`,
                text: `Vibe with me on Nitro Music! 🎵\n${url}`,
                url: url
            });
        } catch (e) {
            console.error('Share failed:', e);
        }
    };

    // Generate card when modal opens or theme changes
    useEffect(() => {
        if (isOpen && song) {
            // Small delay to ensure canvas is mounted
            const timer = setTimeout(() => {
                generateCard();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, song, cardTheme, generateCard]);

    if (!isOpen || !song) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
            <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] max-w-sm w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg">
                            <Sparkles size={14} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-[var(--foreground)]">Share Card</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[var(--card-hover)] rounded-full transition-colors">
                        <X size={18} className="text-[var(--foreground-muted)]" />
                    </button>
                </div>

                {/* Content - Scrollable if needed but fit to screen */}
                <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                    {/* Preview Area */}
                    <div className="aspect-[9/16] w-full max-h-[50vh] bg-[var(--background)] rounded-xl overflow-hidden relative shadow-lg mx-auto border border-[var(--border)]">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full object-contain"
                        />
                        {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
                            </div>
                        )}
                    </div>

                    {/* Theme Selector - Compact */}
                    <div className="flex gap-2">
                        {[
                            { id: 'modern', label: 'Modern', color: 'bg-zinc-900' },
                            { id: 'glass', label: 'Holo', color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
                            { id: 'cyber', label: 'Cyber', color: 'bg-black border border-cyan-500/50 text-cyan-400' }
                        ].map((theme, index) => {
                            const { limit } = checkAccess('share_card_themes');
                            const isLocked = limit !== undefined && limit !== -1 && index >= limit;

                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        if (isLocked) {
                                            setLimitFeature('share_card_themes');
                                            setShowLimitModal(true);
                                            return;
                                        }
                                        setCardTheme(theme.id as any);
                                        setTimeout(generateCard, 50);
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1 ${cardTheme === theme.id
                                        ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[var(--card)] border-transparent'
                                        : 'border-transparent opacity-70 hover:opacity-100'
                                        } ${theme.color} ${isLocked ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <span className={theme.id === 'cyber' ? 'text-cyan-400' : 'text-white'}>{theme.label}</span>
                                    {isLocked && <Lock size={10} className="text-white/70" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Action Buttons - Compact Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={downloadCard}
                            className="flex flex-col items-center justify-center gap-1.5 p-2 bg-[var(--card-hover)] hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-xl transition-all group h-16"
                        >
                            <Download size={18} className="text-[var(--foreground-muted)] group-hover:text-emerald-400 transition-colors" />
                            <span className="text-[10px] font-bold text-[var(--foreground-muted)] group-hover:text-emerald-400">Save</span>
                        </button>

                        <button
                            onClick={copyToClipboard}
                            className="flex flex-col items-center justify-center gap-1.5 p-2 bg-[var(--card-hover)] hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 rounded-xl transition-all group h-16"
                        >
                            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-[var(--foreground-muted)] group-hover:text-purple-400 transition-colors" />}
                            <span className="text-[10px] font-bold text-[var(--foreground-muted)] group-hover:text-purple-400">
                                {copied ? 'Copied' : 'Copy'}
                            </span>
                        </button>

                        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                            <button
                                onClick={shareCard}
                                className="flex flex-col items-center justify-center gap-1.5 p-2 bg-[var(--card-hover)] hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 rounded-xl transition-all group h-16"
                            >
                                <Share2 size={18} className="text-[var(--foreground-muted)] group-hover:text-cyan-400 transition-colors" />
                                <span className="text-[10px] font-bold text-[var(--foreground-muted)] group-hover:text-cyan-400">Share</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
