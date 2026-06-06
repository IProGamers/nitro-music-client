/**
 * Core Track model for Nitro Music App.
 * All providers (JioSaavn, Spotify, etc.) should map to this internal model.
 */
export interface Track {
    id: string;               // Normalized ID (songId or id)
    name: string;             // Song name
    artist: string;           // Primary artist name
    album: string;            // Album name
    image: string;            // Best quality image URL
    audioUrl?: string;        // Playable stream URL
    duration?: number;        // Duration in seconds
    playCount?: number;       // Number of times played
    isOffline?: boolean;      // Whether available in IndexedDB
    downloadUrl?: Array<{ quality: string; url: string }>;
    artists?: {
        primary: Array<{ id: string; name: string }>;
        featured?: Array<{ id: string; name: string }>;
    };
    language?: string;
    year?: number | string;
    label?: string;
    isLiked?: boolean;
}

export interface Playlist {
    id: string;
    name: string;
    description: string;
    ownerUid: string;
    ownerName?: string;
    coverImage?: string;
    songs: Track[];
    isCollaborative: boolean;
    isPublic: boolean;
    createdAt: any;
    updatedAt: any;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    username?: string;
    tier: 'NITRO_CORE' | 'NITRO_ELITE' | 'NITRO_SUPREME' | 'NITRO_ULTRA';
    isAdmin: boolean;
    preferences?: {
        languages: string[];
        genres: string[];
    };
}
