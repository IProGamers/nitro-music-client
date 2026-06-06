// Scene Library — 100+ Audio Scene Presets
// Each scene has tuned EQ (bass/mid/treble), reverb (duration/decay/reverse), and wet/dry mix

export interface ScenePreset {
    id: string;
    name: string;
    emoji: string;
    description: string;
    color: string;
    category: SceneCategory;
    eq: { bass: number; mid: number; treble: number };
    reverb: { duration: number; decay: number; reverse?: boolean };
    mix: { dry: number; wet: number };
}

export type SceneCategory =
    | 'live_venues'
    | 'nature'
    | 'rooms'
    | 'moods'
    | 'vehicles'
    | 'genres'
    | 'iconic'
    | 'gaming'
    | 'experimental';

export const SCENE_CATEGORIES: { id: SceneCategory; name: string; emoji: string; color: string }[] = [
    { id: 'live_venues', name: 'Live Venues', emoji: '🎤', color: 'text-orange-400' },
    { id: 'nature', name: 'Nature', emoji: '🌿', color: 'text-green-400' },
    { id: 'rooms', name: 'Rooms', emoji: '🏠', color: 'text-blue-400' },
    { id: 'moods', name: 'Moods', emoji: '✨', color: 'text-[var(--accent-cyan)]' },
    { id: 'vehicles', name: 'Vehicles', emoji: '🚗', color: 'text-red-400' },
    { id: 'genres', name: 'Genres', emoji: '🎵', color: 'text-[var(--accent-cyan)]' },
    { id: 'iconic', name: 'Iconic Eras', emoji: '📻', color: 'text-[var(--accent-cyan)]' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮', color: 'text-cyan-400' },
    { id: 'experimental', name: 'Experimental', emoji: '🧪', color: 'text-[var(--accent-cyan)]' },
];

export const ALL_SCENES: ScenePreset[] = [
    // ═══════════════════════ LIVE VENUES ═══════════════════════
    { id: 'stadium', name: 'Stadium', emoji: '🏟️', description: 'Massive open-air arena', color: 'text-orange-400', category: 'live_venues', eq: { bass: 5, mid: -4, treble: 4 }, reverb: { duration: 4.5, decay: 1.2 }, mix: { dry: 0.35, wet: 0.85 } },
    { id: 'arena', name: 'Arena', emoji: '🎪', description: 'Indoor sports arena', color: 'text-orange-300', category: 'live_venues', eq: { bass: 6, mid: -2, treble: 3 }, reverb: { duration: 3.5, decay: 1.5 }, mix: { dry: 0.4, wet: 0.8 } },
    { id: 'club', name: 'Club', emoji: '🪩', description: 'Deep bass nightclub', color: 'text-[var(--accent-cyan)]', category: 'live_venues', eq: { bass: 10, mid: 2, treble: 6 }, reverb: { duration: 0.5, decay: 3 }, mix: { dry: 0.5, wet: 0.7 } },
    { id: 'jazz_club', name: 'Jazz Club', emoji: '🎷', description: 'Intimate jazz lounge', color: 'text-[var(--accent-cyan)]', category: 'live_venues', eq: { bass: 4, mid: 3, treble: 2 }, reverb: { duration: 1.2, decay: 3.5 }, mix: { dry: 0.45, wet: 0.75 } },
    { id: 'concert', name: 'Concert Hall', emoji: '🎻', description: 'Classical acoustics', color: 'text-cyan-400', category: 'live_venues', eq: { bass: 3, mid: 1, treble: 5 }, reverb: { duration: 2.0, decay: 2.5 }, mix: { dry: 0.4, wet: 0.8 } },
    { id: 'amphitheater', name: 'Amphitheater', emoji: '🏛️', description: 'Ancient open-air stage', color: 'text-[var(--accent-cyan)]', category: 'live_venues', eq: { bass: 2, mid: 3, treble: 6 }, reverb: { duration: 3.0, decay: 1.8 }, mix: { dry: 0.35, wet: 0.8 } },
    { id: 'opera_house', name: 'Opera House', emoji: '🎭', description: 'Grand opera resonance', color: 'text-[var(--accent-cyan)]', category: 'live_venues', eq: { bass: 2, mid: 5, treble: 4 }, reverb: { duration: 3.5, decay: 1.4 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'bar', name: 'Dive Bar', emoji: '🍺', description: 'Gritty bar acoustics', color: 'text-[var(--accent-cyan)]', category: 'live_venues', eq: { bass: 6, mid: -3, treble: -2 }, reverb: { duration: 0.4, decay: 5 }, mix: { dry: 0.55, wet: 0.6 } },
    { id: 'rooftop', name: 'Rooftop', emoji: '🌃', description: 'Open-air rooftop party', color: 'text-[var(--accent-cyan)]', category: 'live_venues', eq: { bass: 4, mid: 0, treble: 3 }, reverb: { duration: 1.0, decay: 4 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'street', name: 'Street Performance', emoji: '🎸', description: 'Raw street sound', color: 'text-stone-400', category: 'live_venues', eq: { bass: 3, mid: -1, treble: 2 }, reverb: { duration: 0.8, decay: 4 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'subway', name: 'Subway', emoji: '🚇', description: 'Underground tunnel echo', color: 'text-zinc-400', category: 'live_venues', eq: { bass: 7, mid: -5, treble: -3 }, reverb: { duration: 2.5, decay: 1.5 }, mix: { dry: 0.4, wet: 0.8 } },
    { id: 'church', name: 'Church', emoji: '⛪', description: 'Sacred hall reverb', color: 'text-sky-400', category: 'live_venues', eq: { bass: 3, mid: 4, treble: 2 }, reverb: { duration: 4.0, decay: 1.0 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'cathedral', name: 'Cathedral', emoji: '🏰', description: 'Massive stone reverb', color: 'text-violet-400', category: 'live_venues', eq: { bass: 4, mid: 5, treble: 3 }, reverb: { duration: 5.0, decay: 0.8 }, mix: { dry: 0.25, wet: 0.9 } },
    { id: 'warehouse', name: 'Warehouse Rave', emoji: '🏭', description: 'Industrial echo', color: 'text-gray-400', category: 'live_venues', eq: { bass: 9, mid: -2, treble: 4 }, reverb: { duration: 2.0, decay: 2.0 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'festival', name: 'Music Festival', emoji: '🎆', description: 'Outdoor festival stage', color: 'text-[var(--accent-cyan)]', category: 'live_venues', eq: { bass: 7, mid: -1, treble: 5 }, reverb: { duration: 2.5, decay: 2.0 }, mix: { dry: 0.4, wet: 0.75 } },

    // ═══════════════════════ NATURE ═══════════════════════
    { id: 'forest', name: 'Forest', emoji: '🌲', description: 'Woodland ambience', color: 'text-green-400', category: 'nature', eq: { bass: 3, mid: 1, treble: 4 }, reverb: { duration: 2.5, decay: 1.8 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'beach', name: 'Beach', emoji: '🏖️', description: 'Coastal breeze', color: 'text-[var(--accent-cyan)]', category: 'nature', eq: { bass: 2, mid: 0, treble: 5 }, reverb: { duration: 1.5, decay: 2.5 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'rain', name: 'Rainy Day', emoji: '🌧️', description: 'Soft rain atmosphere', color: 'text-blue-300', category: 'nature', eq: { bass: 4, mid: -3, treble: -1 }, reverb: { duration: 1.8, decay: 2.0 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'thunderstorm', name: 'Thunderstorm', emoji: '⛈️', description: 'Deep rumbling storm', color: 'text-slate-400', category: 'nature', eq: { bass: 8, mid: -4, treble: -2 }, reverb: { duration: 3.0, decay: 1.2 }, mix: { dry: 0.35, wet: 0.8 } },
    { id: 'waterfall', name: 'Waterfall', emoji: '💧', description: 'Rushing water mist', color: 'text-cyan-300', category: 'nature', eq: { bass: 5, mid: -2, treble: 3 }, reverb: { duration: 2.0, decay: 1.8 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'ocean', name: 'Deep Ocean', emoji: '🌊', description: 'Abyssal depths', color: 'text-blue-500', category: 'nature', eq: { bass: 7, mid: -6, treble: -8 }, reverb: { duration: 3.0, decay: 1.0 }, mix: { dry: 0.35, wet: 0.8 } },
    { id: 'cave', name: 'Cave', emoji: '🕳️', description: 'Deep echo chamber', color: 'text-[var(--accent-cyan)]', category: 'nature', eq: { bass: 4, mid: 6, treble: -2 }, reverb: { duration: 4.0, decay: 0.8 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'underwater', name: 'Underwater', emoji: '🐠', description: 'Submerged sound', color: 'text-blue-400', category: 'nature', eq: { bass: 8, mid: -10, treble: -24 }, reverb: { duration: 1.5, decay: 0.5, reverse: true }, mix: { dry: 0.35, wet: 0.85 } },
    { id: 'mountain', name: 'Mountain Peak', emoji: '🏔️', description: 'High altitude echo', color: 'text-slate-300', category: 'nature', eq: { bass: -2, mid: 2, treble: 6 }, reverb: { duration: 5.0, decay: 0.6 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'desert', name: 'Desert', emoji: '🏜️', description: 'Dry open expanse', color: 'text-[var(--accent-cyan)]', category: 'nature', eq: { bass: 1, mid: -1, treble: 8 }, reverb: { duration: 1.0, decay: 4 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'campfire', name: 'Campfire', emoji: '🔥', description: 'Crackling fireside', color: 'text-orange-500', category: 'nature', eq: { bass: 5, mid: 2, treble: -2 }, reverb: { duration: 0.6, decay: 4 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'garden', name: 'Garden', emoji: '🌺', description: 'Tranquil garden', color: 'text-green-300', category: 'nature', eq: { bass: 2, mid: 2, treble: 3 }, reverb: { duration: 1.0, decay: 3 }, mix: { dry: 0.5, wet: 0.6 } },
    { id: 'snow', name: 'Snowfall', emoji: '❄️', description: 'Muffled winter quiet', color: 'text-sky-200', category: 'nature', eq: { bass: 3, mid: -4, treble: -6 }, reverb: { duration: 1.5, decay: 2.5 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'jungle', name: 'Jungle', emoji: '🦜', description: 'Dense tropical canopy', color: 'text-lime-400', category: 'nature', eq: { bass: 5, mid: 3, treble: 2 }, reverb: { duration: 1.8, decay: 2.2 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'aurora', name: 'Aurora Night', emoji: '🌌', description: 'Arctic sky stillness', color: 'text-violet-300', category: 'nature', eq: { bass: 2, mid: -1, treble: 5 }, reverb: { duration: 3.5, decay: 1.0 }, mix: { dry: 0.35, wet: 0.8 } },

    // ═══════════════════════ ROOMS ═══════════════════════
    { id: 'bedroom', name: 'Bedroom', emoji: '🛏️', description: 'Cozy late night', color: 'text-[var(--accent-cyan)]', category: 'rooms', eq: { bass: 2, mid: -2, treble: -3 }, reverb: { duration: 0.3, decay: 6 }, mix: { dry: 0.6, wet: 0.5 } },
    { id: 'bathroom', name: 'Bathroom', emoji: '🚿', description: 'Tiled room echo', color: 'text-sky-300', category: 'rooms', eq: { bass: 3, mid: 4, treble: 5 }, reverb: { duration: 1.5, decay: 2.0 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'living_room', name: 'Living Room', emoji: '🛋️', description: 'Home speaker feel', color: 'text-[var(--accent-cyan)]', category: 'rooms', eq: { bass: 3, mid: 1, treble: 1 }, reverb: { duration: 0.5, decay: 4 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'studio', name: 'Recording Studio', emoji: '🎙️', description: 'Dead room clarity', color: 'text-zinc-300', category: 'rooms', eq: { bass: 0, mid: 0, treble: 1 }, reverb: { duration: 0.1, decay: 12 }, mix: { dry: 0.7, wet: 0.35 } },
    { id: 'garage', name: 'Garage', emoji: '🔧', description: 'Raw garage band', color: 'text-stone-400', category: 'rooms', eq: { bass: 5, mid: -2, treble: 2 }, reverb: { duration: 0.8, decay: 3.5 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'basement', name: 'Basement', emoji: '🪜', description: 'Underground room', color: 'text-gray-400', category: 'rooms', eq: { bass: 7, mid: -1, treble: -3 }, reverb: { duration: 1.2, decay: 2.5 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'library', name: 'Library', emoji: '📚', description: 'Whisper quiet', color: 'text-[var(--accent-cyan)]', category: 'rooms', eq: { bass: -2, mid: 2, treble: 3 }, reverb: { duration: 0.8, decay: 3 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'elevator', name: 'Elevator', emoji: '🛗', description: 'Tiny box acoustics', color: 'text-zinc-300', category: 'rooms', eq: { bass: 5, mid: 6, treble: 4 }, reverb: { duration: 0.3, decay: 8 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'theater', name: 'Home Theater', emoji: '🎬', description: 'Surround sound', color: 'text-[var(--accent-cyan)]', category: 'rooms', eq: { bass: 4, mid: 2, treble: 3 }, reverb: { duration: 3.0, decay: 1.5 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'hallway', name: 'Hallway', emoji: '🚪', description: 'Long corridor', color: 'text-neutral-400', category: 'rooms', eq: { bass: 2, mid: 3, treble: 4 }, reverb: { duration: 2.0, decay: 2.0 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'closet', name: 'Closet', emoji: '👕', description: 'Ultra tight space', color: 'text-[var(--accent-cyan)]', category: 'rooms', eq: { bass: 6, mid: -3, treble: -6 }, reverb: { duration: 0.15, decay: 10 }, mix: { dry: 0.65, wet: 0.45 } },

    // ═══════════════════════ MOODS ═══════════════════════
    { id: 'lofi', name: 'Lo-Fi', emoji: '📼', description: 'Warm vinyl vibes', color: 'text-[var(--accent-cyan)]', category: 'moods', eq: { bass: 5, mid: -6, treble: -12 }, reverb: { duration: 0.1, decay: 10 }, mix: { dry: 0.6, wet: 0.5 } },
    { id: 'vaporwave', name: 'Vaporwave', emoji: '🌴', description: 'Slowed dreamy retro', color: 'text-[var(--accent-cyan)]', category: 'moods', eq: { bass: 6, mid: -4, treble: -8 }, reverb: { duration: 2.0, decay: 1.5 }, mix: { dry: 0.35, wet: 0.8 } },
    { id: 'dreamy', name: 'Dreamy', emoji: '💭', description: 'Floating in clouds', color: 'text-violet-300', category: 'moods', eq: { bass: 2, mid: -2, treble: 4 }, reverb: { duration: 3.0, decay: 1.2 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'ethereal', name: 'Ethereal', emoji: '👼', description: 'Angelic atmosphere', color: 'text-sky-300', category: 'moods', eq: { bass: -2, mid: 3, treble: 8 }, reverb: { duration: 4.0, decay: 0.8 }, mix: { dry: 0.25, wet: 0.9 } },
    { id: 'dark', name: 'Dark', emoji: '🌑', description: 'Menacing deep tone', color: 'text-gray-500', category: 'moods', eq: { bass: 10, mid: -4, treble: -8 }, reverb: { duration: 2.5, decay: 1.5 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'psychedelic', name: 'Psychedelic', emoji: '🍄', description: 'Mind-bending swirl', color: 'text-fuchsia-400', category: 'moods', eq: { bass: 4, mid: 6, treble: 3 }, reverb: { duration: 3.5, decay: 1.0, reverse: true }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'meditative', name: 'Meditative', emoji: '🧘', description: 'Deep inner peace', color: 'text-[var(--accent-cyan)]', category: 'moods', eq: { bass: 2, mid: -3, treble: 2 }, reverb: { duration: 4.0, decay: 0.6 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'romantic', name: 'Romantic', emoji: '❤️', description: 'Intimate and warm', color: 'text-[var(--accent-cyan)]', category: 'moods', eq: { bass: 3, mid: 2, treble: -1 }, reverb: { duration: 1.5, decay: 2.5 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'melancholic', name: 'Melancholic', emoji: '😢', description: 'Emotional depth', color: 'text-blue-300', category: 'moods', eq: { bass: 2, mid: 4, treble: -2 }, reverb: { duration: 2.5, decay: 1.5 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'euphoric', name: 'Euphoric', emoji: '🤩', description: 'Peak energy rush', color: 'text-[var(--accent-cyan)]', category: 'moods', eq: { bass: 8, mid: 2, treble: 6 }, reverb: { duration: 1.0, decay: 3 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'chill', name: 'Chill', emoji: '😎', description: 'Laid-back relaxation', color: 'text-[var(--accent-cyan)]', category: 'moods', eq: { bass: 4, mid: -2, treble: 1 }, reverb: { duration: 0.8, decay: 3.5 }, mix: { dry: 0.55, wet: 0.6 } },
    { id: 'intense', name: 'Intense', emoji: '🔥', description: 'Maximum impact', color: 'text-red-500', category: 'moods', eq: { bass: 10, mid: 4, treble: 8 }, reverb: { duration: 0.3, decay: 5 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'nostalgic', name: 'Nostalgic', emoji: '📸', description: 'Warm memory lane', color: 'text-[var(--accent-cyan)]', category: 'moods', eq: { bass: 5, mid: 2, treble: -4 }, reverb: { duration: 1.0, decay: 3 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'focus', name: 'Deep Focus', emoji: '🎯', description: 'Concentration mode', color: 'text-blue-400', category: 'moods', eq: { bass: -2, mid: 1, treble: 2 }, reverb: { duration: 0.2, decay: 8 }, mix: { dry: 0.65, wet: 0.4 } },
    { id: 'asmr', name: 'ASMR', emoji: '🤫', description: 'Ultra intimate whisper', color: 'text-[var(--accent-cyan)]', category: 'moods', eq: { bass: -4, mid: 6, treble: 8 }, reverb: { duration: 0.3, decay: 6 }, mix: { dry: 0.6, wet: 0.5 } },

    // ═══════════════════════ VEHICLES ═══════════════════════
    { id: 'car', name: 'Car Audio', emoji: '🚗', description: 'Punchy car bass', color: 'text-red-400', category: 'vehicles', eq: { bass: 8, mid: 4, treble: 5 }, reverb: { duration: 0.15, decay: 8 }, mix: { dry: 0.6, wet: 0.5 } },
    { id: 'train', name: 'Train', emoji: '🚂', description: 'Rhythmic rail journey', color: 'text-[var(--accent-cyan)]', category: 'vehicles', eq: { bass: 5, mid: -2, treble: -1 }, reverb: { duration: 0.8, decay: 3.5 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'airplane', name: 'Airplane', emoji: '✈️', description: 'Cabin noise isolation', color: 'text-sky-400', category: 'vehicles', eq: { bass: 3, mid: 4, treble: 2 }, reverb: { duration: 0.2, decay: 8 }, mix: { dry: 0.6, wet: 0.45 } },
    { id: 'motorcycle', name: 'Motorcycle', emoji: '🏍️', description: 'Open road rumble', color: 'text-orange-400', category: 'vehicles', eq: { bass: 9, mid: -3, treble: 2 }, reverb: { duration: 0.5, decay: 5 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'spaceship', name: 'Spaceship', emoji: '🚀', description: 'Zero gravity echo', color: 'text-[var(--accent-cyan)]', category: 'vehicles', eq: { bass: 6, mid: -4, treble: 6 }, reverb: { duration: 5.0, decay: 0.5 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'boat', name: 'Yacht', emoji: '⛵', description: 'Ocean deck vibes', color: 'text-cyan-400', category: 'vehicles', eq: { bass: 3, mid: 0, treble: 4 }, reverb: { duration: 1.0, decay: 3 }, mix: { dry: 0.5, wet: 0.6 } },
    { id: 'helicopter', name: 'Helicopter', emoji: '🚁', description: 'Aerial vibration', color: 'text-green-400', category: 'vehicles', eq: { bass: 7, mid: -5, treble: -3 }, reverb: { duration: 0.4, decay: 5 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'convertible', name: 'Convertible', emoji: '🏎️', description: 'Wind in your hair', color: 'text-[var(--accent-cyan)]', category: 'vehicles', eq: { bass: 6, mid: -1, treble: 5 }, reverb: { duration: 0.3, decay: 5 }, mix: { dry: 0.55, wet: 0.55 } },

    // ═══════════════════════ GENRES ═══════════════════════
    { id: 'hiphop_studio', name: 'Hip-Hop Studio', emoji: '🎤', description: 'Boom bap booth', color: 'text-red-400', category: 'genres', eq: { bass: 10, mid: 2, treble: 4 }, reverb: { duration: 0.3, decay: 5 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'edm_rave', name: 'EDM Rave', emoji: '🎛️', description: 'Massive drop bass', color: 'text-[var(--accent-cyan)]', category: 'genres', eq: { bass: 12, mid: 3, treble: 8 }, reverb: { duration: 0.5, decay: 4 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'rock_stage', name: 'Rock Stage', emoji: '🎸', description: 'Distorted live stage', color: 'text-orange-500', category: 'genres', eq: { bass: 6, mid: 5, treble: 6 }, reverb: { duration: 1.5, decay: 2.5 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'classical', name: 'Classical Hall', emoji: '🎼', description: 'Symphony orchestra', color: 'text-[var(--accent-cyan)]', category: 'genres', eq: { bass: 2, mid: 3, treble: 4 }, reverb: { duration: 3.5, decay: 1.2 }, mix: { dry: 0.35, wet: 0.8 } },
    { id: 'bollywood', name: 'Bollywood', emoji: '💃', description: 'Desi beats enhanced', color: 'text-[var(--accent-cyan)]', category: 'genres', eq: { bass: 6, mid: 4, treble: 5 }, reverb: { duration: 1.0, decay: 3 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'acoustic_cafe', name: 'Acoustic Café', emoji: '☕', description: 'Unplugged warmth', color: 'text-[var(--accent-cyan)]', category: 'genres', eq: { bass: 2, mid: 3, treble: 3 }, reverb: { duration: 0.8, decay: 3.5 }, mix: { dry: 0.55, wet: 0.6 } },
    { id: 'metal', name: 'Metal Pit', emoji: '🤘', description: 'Aggressive mosh', color: 'text-gray-400', category: 'genres', eq: { bass: 8, mid: 6, treble: 8 }, reverb: { duration: 0.6, decay: 4 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'reggae', name: 'Reggae Beach', emoji: '🇯🇲', description: 'Island rhythm', color: 'text-green-400', category: 'genres', eq: { bass: 8, mid: -2, treble: 2 }, reverb: { duration: 1.0, decay: 3 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'kpop', name: 'K-Pop Arena', emoji: '🩷', description: 'Bright pop stage', color: 'text-[var(--accent-cyan)]', category: 'genres', eq: { bass: 6, mid: 4, treble: 8 }, reverb: { duration: 1.0, decay: 3 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'r_and_b', name: 'R&B Suite', emoji: '🎶', description: 'Smooth silk vocals', color: 'text-violet-400', category: 'genres', eq: { bass: 6, mid: 3, treble: 2 }, reverb: { duration: 1.2, decay: 2.8 }, mix: { dry: 0.5, wet: 0.65 } },
    { id: 'country', name: 'Country Ranch', emoji: '🤠', description: 'Southern twang', color: 'text-[var(--accent-cyan)]', category: 'genres', eq: { bass: 3, mid: 4, treble: 5 }, reverb: { duration: 0.8, decay: 3.5 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'punk', name: 'Punk Garage', emoji: '🏴', description: 'Raw fast energy', color: 'text-lime-400', category: 'genres', eq: { bass: 7, mid: 3, treble: 7 }, reverb: { duration: 0.4, decay: 5 }, mix: { dry: 0.55, wet: 0.55 } },

    // ═══════════════════════ ICONIC ERAS ═══════════════════════
    { id: '80s_synth', name: '80s Synth', emoji: '🕹️', description: 'Neon synthwave', color: 'text-fuchsia-400', category: 'iconic', eq: { bass: 6, mid: -2, treble: 8 }, reverb: { duration: 2.0, decay: 2.0 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: '90s_grunge', name: '90s Grunge', emoji: '🎸', description: 'Seattle distortion', color: 'text-[var(--accent-cyan)]', category: 'iconic', eq: { bass: 7, mid: 4, treble: -2 }, reverb: { duration: 1.5, decay: 2.5 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'vinyl', name: 'Vinyl Record', emoji: '📀', description: 'Crackling warmth', color: 'text-[var(--accent-cyan)]', category: 'iconic', eq: { bass: 5, mid: -4, treble: -10 }, reverb: { duration: 0.1, decay: 10 }, mix: { dry: 0.6, wet: 0.45 } },
    { id: 'cassette', name: 'Cassette Tape', emoji: '📼', description: 'Tape hiss nostalgia', color: 'text-orange-300', category: 'iconic', eq: { bass: 4, mid: -3, treble: -8 }, reverb: { duration: 0.15, decay: 8 }, mix: { dry: 0.6, wet: 0.5 } },
    { id: 'am_radio', name: 'AM Radio', emoji: '📻', description: 'Mono broadcast', color: 'text-[var(--accent-cyan)]', category: 'iconic', eq: { bass: -8, mid: 12, treble: -12 }, reverb: { duration: 0.1, decay: 10 }, mix: { dry: 0.65, wet: 0.4 } },
    { id: 'telephone', name: 'Phone Call', emoji: '📞', description: 'Tinny phone speaker', color: 'text-green-500', category: 'iconic', eq: { bass: -12, mid: 10, treble: -10 }, reverb: { duration: 0.05, decay: 15 }, mix: { dry: 0.7, wet: 0.35 } },
    { id: '70s_disco', name: '70s Disco', emoji: '🕺', description: 'Funky dance floor', color: 'text-[var(--accent-cyan)]', category: 'iconic', eq: { bass: 7, mid: 3, treble: 5 }, reverb: { duration: 1.0, decay: 3 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: '60s_psychedelic', name: '60s Psychedelic', emoji: '☮️', description: 'Woodstock era', color: 'text-orange-400', category: 'iconic', eq: { bass: 4, mid: 5, treble: 2 }, reverb: { duration: 2.5, decay: 1.5, reverse: true }, mix: { dry: 0.35, wet: 0.8 } },
    { id: '2000s_pop', name: '2000s Pop', emoji: '✨', description: 'Auto-tune era', color: 'text-[var(--accent-cyan)]', category: 'iconic', eq: { bass: 5, mid: 5, treble: 6 }, reverb: { duration: 0.5, decay: 4 }, mix: { dry: 0.5, wet: 0.6 } },
    { id: 'old_tv', name: 'Old TV', emoji: '📺', description: 'CRT static', color: 'text-gray-400', category: 'iconic', eq: { bass: -10, mid: 8, treble: -6 }, reverb: { duration: 0.1, decay: 10 }, mix: { dry: 0.65, wet: 0.4 } },

    // ═══════════════════════ GAMING ═══════════════════════
    { id: '8bit', name: '8-Bit', emoji: '👾', description: 'Retro chiptune', color: 'text-green-400', category: 'gaming', eq: { bass: -6, mid: 8, treble: 6 }, reverb: { duration: 0.1, decay: 10 }, mix: { dry: 0.65, wet: 0.4 } },
    { id: 'cyberpunk', name: 'Cyberpunk', emoji: '🤖', description: 'Neon dystopia', color: 'text-cyan-400', category: 'gaming', eq: { bass: 8, mid: -2, treble: 8 }, reverb: { duration: 2.0, decay: 2.0 }, mix: { dry: 0.4, wet: 0.75 } },
    { id: 'fantasy_rpg', name: 'Fantasy RPG', emoji: '⚔️', description: 'Epic quest ambience', color: 'text-[var(--accent-cyan)]', category: 'gaming', eq: { bass: 4, mid: 3, treble: 5 }, reverb: { duration: 3.0, decay: 1.5 }, mix: { dry: 0.35, wet: 0.8 } },
    { id: 'horror', name: 'Horror', emoji: '👻', description: 'Eerie dread', color: 'text-red-600', category: 'gaming', eq: { bass: 8, mid: -6, treble: -4 }, reverb: { duration: 4.0, decay: 0.8, reverse: true }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'scifi', name: 'Sci-Fi', emoji: '🛸', description: 'Space station hum', color: 'text-[var(--accent-cyan)]', category: 'gaming', eq: { bass: 5, mid: -3, treble: 7 }, reverb: { duration: 3.5, decay: 1.0 }, mix: { dry: 0.35, wet: 0.8 } },
    { id: 'racing', name: 'Racing', emoji: '🏁', description: 'High speed adrenaline', color: 'text-red-400', category: 'gaming', eq: { bass: 9, mid: 3, treble: 6 }, reverb: { duration: 0.3, decay: 5 }, mix: { dry: 0.55, wet: 0.55 } },
    { id: 'minecraft', name: 'Pixel World', emoji: '⛏️', description: 'Blocky peaceful', color: 'text-green-300', category: 'gaming', eq: { bass: -2, mid: 4, treble: 4 }, reverb: { duration: 1.5, decay: 2.5 }, mix: { dry: 0.45, wet: 0.65 } },
    { id: 'battle_royale', name: 'Battle Royale', emoji: '🎯', description: 'Combat zone', color: 'text-orange-500', category: 'gaming', eq: { bass: 10, mid: 2, treble: 5 }, reverb: { duration: 0.5, decay: 4 }, mix: { dry: 0.5, wet: 0.6 } },

    // ═══════════════════════ EXPERIMENTAL ═══════════════════════
    { id: 'reverse', name: 'Reverse Echo', emoji: '⏪', description: 'Backward reverb', color: 'text-[var(--accent-cyan)]', category: 'experimental', eq: { bass: 3, mid: 0, treble: 4 }, reverb: { duration: 2.0, decay: 1.5, reverse: true }, mix: { dry: 0.35, wet: 0.8 } },
    { id: 'robot', name: 'Robot Voice', emoji: '🤖', description: 'Metallic processing', color: 'text-cyan-500', category: 'experimental', eq: { bass: -4, mid: 10, treble: 8 }, reverb: { duration: 0.3, decay: 6 }, mix: { dry: 0.45, wet: 0.7 } },
    { id: 'slowed', name: 'Slowed + Reverb', emoji: '🐌', description: 'TikTok slowed edit', color: 'text-[var(--accent-cyan)]', category: 'experimental', eq: { bass: 8, mid: -4, treble: -6 }, reverb: { duration: 3.0, decay: 1.0 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'sped_up', name: 'Nightcore', emoji: '⚡', description: 'Sped up anime edit', color: 'text-[var(--accent-cyan)]', category: 'experimental', eq: { bass: 4, mid: 2, treble: 10 }, reverb: { duration: 0.5, decay: 4 }, mix: { dry: 0.5, wet: 0.6 } },
    { id: 'void', name: 'The Void', emoji: '🕳️', description: 'Infinite emptiness', color: 'text-gray-600', category: 'experimental', eq: { bass: 12, mid: -10, treble: -15 }, reverb: { duration: 6.0, decay: 0.3 }, mix: { dry: 0.2, wet: 0.95 } },
    { id: 'glitch', name: 'Glitch', emoji: '📡', description: 'Corrupted signal', color: 'text-lime-400', category: 'experimental', eq: { bass: -3, mid: 8, treble: -5 }, reverb: { duration: 0.1, decay: 12 }, mix: { dry: 0.6, wet: 0.5 } },
    { id: 'crystals', name: 'Crystal Cave', emoji: '💎', description: 'Sparkling resonance', color: 'text-cyan-300', category: 'experimental', eq: { bass: -2, mid: 2, treble: 10 }, reverb: { duration: 3.0, decay: 1.0 }, mix: { dry: 0.3, wet: 0.85 } },
    { id: 'dimension', name: 'Another Dimension', emoji: '🌀', description: 'Reality warped', color: 'text-fuchsia-500', category: 'experimental', eq: { bass: 6, mid: -8, treble: 6 }, reverb: { duration: 4.0, decay: 0.6, reverse: true }, mix: { dry: 0.25, wet: 0.9 } },
    { id: 'heaven', name: 'Heaven', emoji: '😇', description: 'Celestial chorus', color: 'text-[var(--accent-cyan)]', category: 'experimental', eq: { bass: -4, mid: 4, treble: 8 }, reverb: { duration: 5.0, decay: 0.5 }, mix: { dry: 0.2, wet: 0.95 } },
    { id: 'hell', name: 'Underworld', emoji: '😈', description: 'Demonic resonance', color: 'text-red-700', category: 'experimental', eq: { bass: 12, mid: -6, treble: -10 }, reverb: { duration: 4.0, decay: 0.8 }, mix: { dry: 0.3, wet: 0.85 } },
];

// Default starter scenes (shown by default in the Scene tab)
export const DEFAULT_SCENE_IDS: string[] = [
    'lofi', 'club', 'concert', 'car', 'bedroom', 'rain', 'stadium', 'jazz_club',
];

// get scene by id
export const getSceneById = (id: string): ScenePreset | undefined => {
    return ALL_SCENES.find(s => s.id === id);
};

// search scenes
export const searchScenes = (query: string): ScenePreset[] => {
    const q = query.toLowerCase().trim();
    if (!q) return ALL_SCENES;
    return ALL_SCENES.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.emoji.includes(q)
    );
};

// get scenes by category
export const getScenesByCategory = (category: SceneCategory): ScenePreset[] => {
    return ALL_SCENES.filter(s => s.category === category);
};
