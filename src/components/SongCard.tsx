"use client"

import { Music, Play } from 'lucide-react';
import SongContextMenu from './SongContextMenu';

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
            className="group cursor-pointer w-44 md:w-56 shrink-0 glass-card p-4 rounded-[32px] md:rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl transition-all duration-700 hover:border-cyan-500/30 hover:bg-white/[0.05]"
        >
            <div className="relative aspect-square rounded-[24px] md:rounded-[32px] overflow-hidden mb-5 shadow-2xl">
                {getImg(song) ? (
                    <img
                        src={getImg(song)}
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                        alt={getName(song)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                        <Play size={32} className="text-zinc-800" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-700" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 bg-black/40 md:bg-black/40 backdrop-blur-[1px] md:backdrop-blur-[2px]">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-2xl scale-90 md:scale-75 md:group-hover:scale-100 transition-all duration-500">
                        <Play fill="black" size={20} className="md:size-[24px] ml-1 text-black" />
                    </div>
                </div>

                <div className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-10" onClick={e => e.stopPropagation()}>
                    <div className="p-1.5 md:p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                        <SongContextMenu song={song} queue={queue} />
                    </div>
                </div>
            </div>
            <div className="px-1">
                <h3 className="font-display font-black text-sm md:text-base text-white truncate group-hover:text-cyan-400 transition-colors uppercase tracking-tight leading-none mb-2">{getName(song)}</h3>
                <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest truncate">{getArtist(song) || 'Sonic Archive'}</p>
            </div>
        </div>
    );
}

export function RecentSongCard({ song, queue, getImg, getName, getArtist, playTrack }: SongCardProps) {
    return (
        <div
            onClick={() => playTrack(song, queue)}
            className="group flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all duration-300"
        >
            <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 shadow-lg bg-zinc-900">
                {getImg(song) ? (
                    <img src={getImg(song)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-800">
                        <Music size={16} />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <Play size={16} fill="white" className="text-white" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-sm text-white truncate mb-1 group-hover:text-cyan-400 transition-colors">{getName(song)}</h3>
                <p className="text-[10px] font-bold text-zinc-500 truncate uppercase tracking-wider">{getArtist(song)}</p>
            </div>
            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all pr-2" onClick={e => e.stopPropagation()}>
                <SongContextMenu song={song} queue={queue} />
            </div>
        </div>
    );
}
