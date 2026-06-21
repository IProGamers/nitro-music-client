"use client"

import { Music, Play } from 'lucide-react';
import SongContextMenu from './SongContextMenu';
import { decodeHtml } from '@/lib/utils';

interface SongCardProps {
    song: any;
    queue: any[];
    getImg: (t: any) => string;
    getName: (t: any) => string;
    getArtist: (t: any) => string;
    playTrack: (song: any, queue: any[]) => void;
}

export function SongCard({ song, queue, getImg, getName, getArtist, playTrack }: SongCardProps) {
    return (
        <div
            onClick={() => playTrack(song, queue)}
            className="group cursor-pointer w-40 md:w-52 shrink-0 p-3 md:p-4 rounded-xl bg-transparent hover:bg-[var(--surface-hover)] transition-colors duration-300"
        >
            <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-lg shadow-black/40 bg-[var(--surface)]">
                {getImg(song) ? (
                    <img
                        src={getImg(song)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={getName(song)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">
                        <Music size={32} />
                    </div>
                )}

                {/* Floating accent play button (Spotify-style: lifts in on hover) */}
                <div
                    className="absolute bottom-2.5 right-2.5 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-xl shadow-black/40 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 md:transition-all md:duration-300 max-md:translate-y-0 max-md:opacity-100"
                    style={{ background: 'var(--accent)' }}
                >
                    <Play fill="#04161a" size={18} className="ml-0.5 text-[#04161a]" />
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity duration-200 z-10" onClick={e => e.stopPropagation()}>
                    <div className="p-1.5 bg-black/50 backdrop-blur-md rounded-lg">
                        <SongContextMenu song={song} queue={queue} />
                    </div>
                </div>
            </div>
            <div className="px-0.5">
                <h3 className="font-semibold text-sm md:text-[15px] text-[var(--foreground)] truncate leading-snug mb-1">{decodeHtml(getName(song))}</h3>
                <p className="text-xs md:text-[13px] text-[var(--foreground-muted)] truncate">{decodeHtml(getArtist(song)) || 'Unknown Artist'}</p>
            </div>
        </div>
    );
}

export function RecentSongCard({ song, queue, getImg, getName, getArtist, playTrack }: SongCardProps) {
    return (
        <div
            onClick={() => playTrack(song, queue)}
            className="group flex items-center gap-3.5 p-2 rounded-lg cursor-pointer hover:bg-[var(--surface-hover)] transition-colors duration-200"
        >
            <div className="w-12 h-12 rounded-md overflow-hidden relative shrink-0 shadow-md shadow-black/40 bg-[var(--surface)]">
                {getImg(song) ? (
                    <img src={getImg(song)} className="w-full h-full object-cover" alt="" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">
                        <Music size={16} />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={16} fill="white" className="text-white ml-0.5" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-[var(--foreground)] truncate">{decodeHtml(getName(song))}</h3>
                <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{decodeHtml(getArtist(song))}</p>
            </div>
            <div className="opacity-0 md:group-hover:opacity-100 max-md:opacity-100 transition-opacity pr-1" onClick={e => e.stopPropagation()}>
                <SongContextMenu song={song} queue={queue} />
            </div>
        </div>
    );
}
