"use client"

import { useEffect, useState } from 'react';
import { Play, Plus, Volume2, MoreHorizontal, Music, Radio } from 'lucide-react';
import { extractAccent, tintGradient, type AccentColor } from '@/lib/colorExtract';

// ---------------------------------------------------------------------------
// FeaturedCard — Spotify's signature colour-tinted personalised card.
// Background gradient is pulled from the cover art (falls back to a brand tint).
// ---------------------------------------------------------------------------
interface FeaturedCardProps {
  image: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  onPlay: () => void;
  onOpen?: () => void;
}

export function FeaturedCard({ image, title, subtitle, description, badge, onPlay, onOpen }: FeaturedCardProps) {
  const [accent, setAccent] = useState<AccentColor | null>(null);

  useEffect(() => {
    let alive = true;
    extractAccent(image).then((c) => { if (alive) setAccent(c); });
    return () => { alive = false; };
  }, [image]);

  const bg = accent ? tintGradient(accent) : 'linear-gradient(160deg, #1a1a1d 0%, #0e0e10 100%)';

  return (
    <div
      className="relative rounded-2xl p-4 md:p-5 overflow-hidden transition-all duration-500"
      style={{ background: bg }}
    >
      {badge && (
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 mb-3">{badge}</div>
      )}
      <div className="flex gap-3.5 md:gap-4">
        <div
          onClick={onOpen}
          className="w-[72px] h-[72px] md:w-24 md:h-24 rounded-lg overflow-hidden shrink-0 bg-black/20 shadow-xl cursor-pointer"
        >
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Music size={26} className="text-white/40" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0" onClick={onOpen} role={onOpen ? 'button' : undefined}>
          <h3 className="text-lg md:text-xl font-extrabold text-white leading-tight line-clamp-2">{title}</h3>
          {subtitle && <p className="text-[13px] text-white/70 mt-1 truncate">{subtitle}</p>}
        </div>
        <button className="text-white/55 hover:text-white transition-colors h-fit" aria-label="More">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {description && (
        <p className="text-[12px] md:text-[13px] text-white/75 leading-relaxed mt-3 md:mt-4 line-clamp-2">{description}</p>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={onPlay}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/25 hover:bg-black/35 text-white/90 text-[12px] font-semibold transition-colors backdrop-blur-sm"
        >
          <Volume2 size={14} /> Preview
        </button>
        <button
          className="w-8 h-8 rounded-full border-[1.6px] border-white/55 text-white flex items-center justify-center hover:border-white hover:scale-105 transition-all ml-auto"
          aria-label="Add"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={onPlay}
          className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
          aria-label="Play"
        >
          <Play size={18} fill="currentColor" className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NumberedMixTile — Daily-Mix style tile: 4-up collage, dark overlay,
// coloured accent bar, big italic index badge.
// ---------------------------------------------------------------------------
interface NumberedMixTileProps {
  name: string;
  desc?: string;
  covers: string[];
  index: number;
  accentClass: string; // tailwind bg-* for the accent bar + number
  numberLight?: boolean; // dark number text on light accent
  onPlay: () => void;
}

export function NumberedMixTile({ name, desc, covers, index, accentClass, numberLight, onPlay }: NumberedMixTileProps) {
  const four = covers.slice(0, 4);
  return (
    <div onClick={onPlay} className="group cursor-pointer w-[140px] md:w-[160px] shrink-0">
      <div className="relative w-[140px] h-[140px] md:w-[160px] md:h-[160px] rounded-lg overflow-hidden shadow-lg shadow-black/40">
        <div className="absolute inset-0 grid grid-cols-2 opacity-55">
          {four.map((c, i) => (
            <div key={i} className="overflow-hidden bg-[var(--background-tertiary)]">
              {c && <img src={c} className="w-full h-full object-cover" alt="" />}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className={`absolute left-0 bottom-0 h-1 w-full ${accentClass}`} />
        <div className="absolute bottom-2.5 left-3 right-12">
          <div className="font-extrabold text-white text-[15px] leading-[1.05] drop-shadow">{name}</div>
        </div>
        <div className={`absolute right-2 bottom-2 px-1.5 rounded-[3px] text-[20px] font-black italic tracking-tighter ${accentClass} ${numberLight ? 'text-black' : 'text-white'}`}>
          {String(index).padStart(2, '0')}
        </div>
        <button className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all" aria-label="Play">
          <Play size={15} fill="black" className="ml-0.5 text-black" />
        </button>
      </div>
      {desc && <p className="text-[11px] text-[var(--foreground-muted)] mt-2 line-clamp-2 leading-snug">{desc}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RadioCard — vibrant solid tile with an overlapping circular artist collage
// and a RADIO label, à la Spotify's recommended stations.
// ---------------------------------------------------------------------------
interface RadioCardProps {
  title: string;
  covers: string[];
  bg: string;          // solid background colour (hex)
  dark?: boolean;      // dark text for light backgrounds
  subtitle?: string;
  onPlay: () => void;
}

export function RadioCard({ title, covers, bg, dark = true, subtitle, onPlay }: RadioCardProps) {
  const three = covers.slice(0, 3);
  return (
    <div onClick={onPlay} className="group cursor-pointer w-[160px] md:w-[180px] shrink-0">
      <div
        className="relative w-full h-[132px] md:h-[148px] rounded-lg overflow-hidden shadow-lg shadow-black/40"
        style={{ background: bg }}
      >
        <div className="absolute top-2 left-2 w-[18px] h-[18px] rounded-full bg-black/85 flex items-center justify-center">
          <Radio size={11} className="text-white" />
        </div>
        <div className="absolute top-2.5 right-2.5 text-[9px] font-extrabold tracking-[0.12em]" style={{ color: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)' }}>RADIO</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center">
            {three.map((c, i) => (
              <img
                key={i}
                src={c}
                alt=""
                className="rounded-full object-cover border-2 border-black/10"
                style={{
                  width: i === 1 ? 64 : 46,
                  height: i === 1 ? 64 : 46,
                  margin: i === 1 ? '0 -10px' : 0,
                  zIndex: i === 1 ? 2 : 1,
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-2.5 left-3 right-3 text-[15px] font-extrabold leading-tight line-clamp-2" style={{ color: dark ? '#101010' : '#fff' }}>{title}</div>
        <button className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all" aria-label="Play">
          <Play size={15} fill="black" className="ml-0.5 text-black" />
        </button>
      </div>
      {subtitle && <p className="text-[11px] text-[var(--foreground-muted)] mt-2 truncate">{subtitle}</p>}
    </div>
  );
}
