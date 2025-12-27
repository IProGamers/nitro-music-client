"use client"
import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Music, Mic2, User, ListMusic, ChevronLeft, ChevronRight, ExternalLink, Disc } from 'lucide-react';
import Link from 'next/link';

export default function RightSidebar() {
    const { currentSong, queue, currentIndex, isRadioMode } = usePlayer();
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'lyrics' | 'queue' | 'artist'>('lyrics');
    const [lyrics, setLyrics] = useState<string | null>(null);
    const [loadingLyrics, setLoadingLyrics] = useState(false);

    const getImg = (t: any) => {
        if (!t) return '';
        if (t.image && Array.isArray(t.image) && t.image.length) {
            return t.image[t.image.length - 1].url || t.image[t.image.length - 1].link || '';
        }
        if (typeof t.image === 'string') return t.image;
        return '';
    };

    const getArtist = (t: any) => {
        if (!t) return 'Unknown';
        if (t.artists && t.artists.primary && t.artists.primary.length) {
            return t.artists.primary[0].name;
        }
        if (typeof t.artist === 'string') return t.artist;
        return 'Unknown';
    };

    const getArtistId = (t: any) => {
        if (!t) return null;
        if (t.artists?.primary?.[0]?.id) return t.artists.primary[0].id;
        if (t.primaryArtistsId) return t.primaryArtistsId.split(',')[0];
        return null;
    };

    // Fetch lyrics when song changes
    useEffect(() => {
        const fetchLyrics = async () => {
            if (!currentSong) {
                setLyrics(null);
                return;
            }

            setLoadingLyrics(true);
            try {
                const songId = currentSong.id || currentSong.songId;
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${apiUrl}/api/songs/${songId}/lyrics`);
                const data = await res.json();

                if (data.success && data.data?.lyrics) {
                    setLyrics(data.data.lyrics);
                } else {
                    setLyrics(null);
                }
            } catch (err) {
                console.error('Failed to fetch lyrics:', err);
                setLyrics(null);
            } finally {
                setLoadingLyrics(false);
            }
        };

        fetchLyrics();
    }, [currentSong]);

    // Only show on large screens (xl+) and when a song is playing
    if (!currentSong) return null;

    return (
        <div className={`hidden xl:block fixed right-0 top-0 h-full bg-[var(--card)]/80 backdrop-blur-xl border-l border-[var(--border)] z-30 transition-all duration-300 ${isOpen ? 'w-80' : 'w-0'}`}>
            {/* Toggle Button - positioned at top-2/3 to avoid overlap with FriendActivitySidebar */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -left-10 top-2/3 -translate-y-1/2 w-10 h-16 bg-[var(--card)] border border-r-0 border-[var(--border)] rounded-l-xl flex items-center justify-center text-[var(--foreground-muted)] hover:text-cyan-400 transition-colors"
            >
                {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {isOpen && (
                <div className="h-full flex flex-col overflow-hidden">
                    {/* Now Playing Header */}
                    <div className="p-4 border-b border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative">
                                {getImg(currentSong) ? (
                                    <img
                                        src={getImg(currentSong)}
                                        className="w-16 h-16 rounded-xl object-cover shadow-lg"
                                        alt=""
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-[var(--background)] flex items-center justify-center">
                                        <Music size={24} className="text-[var(--foreground-muted)]" />
                                    </div>
                                )}
                                {isRadioMode && (
                                    <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-[8px] font-bold text-white rounded-full uppercase">
                                        Radio
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-[var(--foreground)] truncate">
                                    {currentSong.name || currentSong.title}
                                </h3>
                                <p className="text-xs text-[var(--foreground-muted)] truncate">
                                    {getArtist(currentSong)}
                                </p>
                                {currentSong.album?.name && (
                                    <p className="text-[10px] text-[var(--foreground-muted)]/60 truncate mt-0.5">
                                        {currentSong.album.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-[var(--background)]/50 rounded-lg p-1">
                            {[
                                { id: 'lyrics', label: 'Lyrics', icon: Mic2 },
                                { id: 'queue', label: 'Queue', icon: ListMusic },
                                { id: 'artist', label: 'Artist', icon: User },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                                        ? 'bg-[var(--card)] text-cyan-400 shadow-sm'
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    <tab.icon size={12} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'lyrics' && (
                            <div>
                                {loadingLyrics ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : lyrics ? (
                                    <div className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap leading-relaxed">
                                        {lyrics}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Mic2 size={32} className="text-[var(--foreground-muted)]/30 mx-auto mb-3" />
                                        <p className="text-sm text-[var(--foreground-muted)]">No lyrics available</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'queue' && (
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-[var(--foreground-muted)] font-bold mb-3">
                                    Up Next ({queue.length - currentIndex - 1} songs)
                                </p>
                                {queue.slice(currentIndex + 1, currentIndex + 6).map((song, i) => (
                                    <div
                                        key={`${song.id || song.songId}-${i}`}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                                    >
                                        <span className="text-[10px] text-[var(--foreground-muted)] w-4">
                                            {i + 1}
                                        </span>
                                        <img
                                            src={getImg(song)}
                                            className="w-8 h-8 rounded object-cover"
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-[var(--foreground)] truncate">
                                                {song.name || song.title}
                                            </p>
                                            <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                                                {getArtist(song)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {queue.length - currentIndex - 1 > 5 && (
                                    <p className="text-center text-[10px] text-[var(--foreground-muted)] pt-2">
                                        +{queue.length - currentIndex - 6} more
                                    </p>
                                )}
                            </div>
                        )}

                        {activeTab === 'artist' && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl font-bold text-white">
                                            {getArtist(currentSong)[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-[var(--foreground)]">
                                        {getArtist(currentSong)}
                                    </h4>
                                </div>

                                {getArtistId(currentSong) && (
                                    <Link
                                        href={`/artist/${getArtistId(currentSong)}`}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--background)] hover:bg-cyan-500/10 border border-[var(--border)] hover:border-cyan-400/50 rounded-xl text-sm font-medium text-[var(--foreground)] transition-all"
                                    >
                                        <User size={14} />
                                        View Artist Page
                                        <ExternalLink size={12} className="text-[var(--foreground-muted)]" />
                                    </Link>
                                )}

                                {(currentSong.album?.id || currentSong.albumId) && (
                                    <Link
                                        href={`/album/${currentSong.album?.id || currentSong.albumId}`}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--background)] hover:bg-purple-500/10 border border-[var(--border)] hover:border-purple-400/50 rounded-xl text-sm font-medium text-[var(--foreground)] transition-all"
                                    >
                                        <Disc size={14} />
                                        View Album
                                        <ExternalLink size={12} className="text-[var(--foreground-muted)]" />
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
