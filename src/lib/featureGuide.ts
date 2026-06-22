// Shared catalog of every Nitro feature — used by the one-time Home intro cards
// and the "How to use Nitro" guide in the profile. One source of truth.
import {
    Download, Headphones, Wand2, Radio, Mic2, Moon, SlidersHorizontal,
    Eye, Users, ListMusic, Search, Heart, type LucideIcon,
} from 'lucide-react';

export interface FeatureGuideItem {
    id: string;
    title: string;
    short: string;            // one-line teaser (cards)
    icon: LucideIcon;
    color: string;            // tailwind text color for the icon
    steps: string[];          // how to use it, step by step
    tip?: string;             // a single handy tip
}

export const FEATURES: FeatureGuideItem[] = [
    {
        id: 'search',
        title: 'Search & Browse',
        short: 'Find any song, artist or album instantly.',
        icon: Search,
        color: 'text-cyan-400',
        steps: [
            'Tap Search in the bottom bar.',
            'Type a song, artist or album — results appear as you type.',
            'Tap a category to open a full, daily-updated page.',
        ],
        tip: 'Tap the ⋮ on any song to play next, add to queue, or save it.',
    },
    {
        id: 'queue',
        title: 'Queue & Play Next',
        short: 'Line up what plays next, your way.',
        icon: ListMusic,
        color: 'text-cyan-400',
        steps: [
            'Open the ⋮ menu on any song.',
            'Choose “Play Next” or “Add to Queue”.',
            'Tap the queue icon in the player to see and reorder it.',
        ],
        tip: 'The queue button sits right on the bottom player bar.',
    },
    {
        id: 'like',
        title: 'Liked Songs',
        short: 'Heart a track and find it anytime.',
        icon: Heart,
        color: 'text-rose-400',
        steps: [
            'Tap the ♥ on the player or in a song’s ⋮ menu.',
            'Open Library → Liked Songs to see them all.',
            'Tap ⋮ → “Remove from Liked” to take one out.',
        ],
    },
    {
        id: 'offline',
        title: 'Offline Downloads',
        short: 'Download songs and play with no internet.',
        icon: Download,
        color: 'text-emerald-400',
        steps: [
            'Open a song’s ⋮ menu (or the player’s Download button).',
            'Tap “Download” and wait for it to finish.',
            'Find everything under Library → Downloaded.',
        ],
        tip: 'Downloaded songs start instantly with no buffering.',
    },
    {
        id: 'audio-fx',
        title: 'Audio Scenes & FX',
        short: '150+ scenes — Stadium, Club, Cave & more.',
        icon: Wand2,
        color: 'text-cyan-400',
        steps: [
            'Tap the wand (FX) icon on the player bar.',
            'Search or browse scenes and tap one to apply it live.',
            'Star ★ your favourites to pin them to “My Scenes”.',
        ],
        tip: 'Each scene retunes EQ + reverb to recreate a real space.',
    },
    {
        id: '3d-audio',
        title: '3D Spatial Audio',
        short: 'Immersive 360° surround sound.',
        icon: Headphones,
        color: 'text-purple-400',
        steps: [
            'Open the full player (tap the mini bar).',
            'Tap the 3D button in the controls.',
            'Pop in headphones for the full effect.',
        ],
        tip: 'Works best with headphones — speakers lose the effect.',
    },
    {
        id: 'equalizer',
        title: 'Equalizer',
        short: 'Dial in bass, mids and treble.',
        icon: SlidersHorizontal,
        color: 'text-amber-400',
        steps: [
            'Open the FX panel from the player.',
            'Go to the Equalizer section.',
            'Drag bass / mid / treble to taste.',
        ],
    },
    {
        id: 'visualizer',
        title: 'Visualizer',
        short: 'Full-screen visuals that move to the music.',
        icon: Eye,
        color: 'text-cyan-400',
        steps: [
            'Open the full player.',
            'Tap the Visual button.',
            'Pick a style and enjoy the show.',
        ],
    },
    {
        id: 'dj-mode',
        title: 'DJ Mode',
        short: 'Crossfade and blend tracks like a pro.',
        icon: Radio,
        color: 'text-pink-400',
        steps: [
            'Open the full player and tap the DJ button.',
            'Turn on DJ Mode.',
            'Set the crossfade length and let songs blend.',
        ],
        tip: 'Use A-B loop to rehearse a section before mixing.',
    },
    {
        id: 'lyrics',
        title: 'Lyrics',
        short: 'Sing along with the words on screen.',
        icon: Mic2,
        color: 'text-cyan-400',
        steps: [
            'Play a song and open the full player.',
            'Open the Lyrics view.',
            'Follow along as the song plays.',
        ],
    },
    {
        id: 'sleep-timer',
        title: 'Sleep Timer',
        short: 'Auto-stop after a set time.',
        icon: Moon,
        color: 'text-indigo-400',
        steps: [
            'Open the FX / player options.',
            'Pick a Sleep Timer duration.',
            'Music gently fades out when time’s up.',
        ],
    },
    {
        id: 'listen-together',
        title: 'Listen Together',
        short: 'Sync playback with friends in real time.',
        icon: Users,
        color: 'text-purple-400',
        steps: [
            'Open the Listen Together panel (top bar).',
            'Create a room and share the code.',
            'Friends join and everyone hears the same song in sync.',
        ],
        tip: 'Needs an approved account and the realtime server online.',
    },
];
