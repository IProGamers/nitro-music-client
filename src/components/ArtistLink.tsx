"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveArtistIdByName } from '@/lib/homeData';
import { decodeHtml } from '@/lib/utils';

/**
 * Clickable artist name that always opens the artist page.
 * Uses the song's artist id when present; otherwise resolves it by name via
 * JioSaavn artist search (falls back to a search page). Drop-in:
 *   <ArtistLink song={currentSong} className="..." />
 */
const getArtistId = (t: any): string | null => {
    if (!t) return null;
    if (t.artists?.primary?.[0]?.id) return String(t.artists.primary[0].id);
    if (t.primaryArtistsId) return String(t.primaryArtistsId).split(',')[0];
    return null;
};

const getArtistName = (t: any): string => {
    if (!t) return '';
    if (t.artists?.primary?.length) return decodeHtml(t.artists.primary[0].name);
    if (typeof t.artist === 'string') return decodeHtml(t.artist);
    if (t.primaryArtists) return decodeHtml(t.primaryArtists);
    return '';
};

export default function ArtistLink({
    song,
    className = '',
    children,
}: {
    song: any;
    className?: string;
    children?: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const go = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const id = getArtistId(song);
        if (id) { router.push(`/artist/${id}`); return; }
        const name = getArtistName(song);
        if (!name) return;
        setLoading(true);
        try {
            const resolved = await resolveArtistIdByName(name);
            router.push(resolved ? `/artist/${resolved}` : `/search?q=${encodeURIComponent(name)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <span
            onClick={go}
            role="button"
            tabIndex={0}
            className={`${className} cursor-pointer hover:underline`}
            title="View artist"
        >
            {children ?? getArtistName(song)}{loading ? '…' : ''}
        </span>
    );
}
