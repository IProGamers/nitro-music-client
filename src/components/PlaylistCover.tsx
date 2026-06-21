"use client"
import { useState } from 'react';
import { Music } from 'lucide-react';

/**
 * Spotify-style playlist cover that never looks broken:
 *  - a custom coverImage if set
 *  - else a 2x2 collage of the first 4 distinct song arts
 *  - else the single available art
 *  - else a Music-icon placeholder
 * Each <img> falls back gracefully if it fails to load.
 */
function SafeImg({ src, className }: { src: string; className?: string }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <div className={`${className} flex items-center justify-center bg-[var(--surface)] text-[var(--foreground-muted)]`}>
                <Music size={18} />
            </div>
        );
    }
    return <img src={src} alt="" className={className} loading="lazy" onError={() => setFailed(true)} />;
}

const imgOf = (s: any): string => {
    if (!s) return '';
    if (typeof s.image === 'string') return s.image;
    if (Array.isArray(s.image) && s.image.length) return s.image[s.image.length - 1]?.url || s.image[s.image.length - 1]?.link || '';
    return '';
};

export default function PlaylistCover({
    coverImage,
    songs = [],
    className = '',
    rounded = 'rounded-2xl',
}: {
    coverImage?: string | null;
    songs?: any[];
    className?: string;
    rounded?: string;
}) {
    const wrap = `${className} ${rounded} overflow-hidden bg-[var(--surface)]`;

    if (coverImage) {
        return <div className={wrap}><SafeImg src={coverImage} className="w-full h-full object-cover" /></div>;
    }

    // Collect up to 4 distinct song images for a collage.
    const imgs: string[] = [];
    const seen = new Set<string>();
    for (const s of songs) {
        const u = imgOf(s);
        if (u && !seen.has(u)) { seen.add(u); imgs.push(u); }
        if (imgs.length === 4) break;
    }

    if (imgs.length >= 4) {
        return (
            <div className={`${wrap} grid grid-cols-2 grid-rows-2`}>
                {imgs.slice(0, 4).map((u, i) => <SafeImg key={i} src={u} className="w-full h-full object-cover" />)}
            </div>
        );
    }
    if (imgs.length >= 1) {
        return <div className={wrap}><SafeImg src={imgs[0]} className="w-full h-full object-cover" /></div>;
    }
    return (
        <div className={`${wrap} flex items-center justify-center text-[var(--foreground-muted)]`}>
            <Music size={32} />
        </div>
    );
}
