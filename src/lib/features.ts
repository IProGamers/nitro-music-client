import { SubscriptionTier } from '@/context/AuthContext';

export type FeatureKey =
    | 'visualizer_sessions'
    | 'dj_mode_sessions'
    | 'audio_fx_sessions'
    | 'downloads'
    | 'download_storage' // in bytes
    | 'playlists_created'
    | 'songs_per_playlist'
    | 'play_history'
    | 'share_card_themes';

export interface FeatureLimit {
    max: number; // -1 for unlimited
    period?: 'day' | 'month' | 'forever';
}

// Storage limits in bytes
export const DOWNLOAD_STORAGE_LIMITS = {
    NITRO_CORE: 250 * 1024 * 1024,    // 250MB
    NITRO_ELITE: 1024 * 1024 * 1024,   // 1GB
    NITRO_SUPREME: -1                   // Unlimited
};

// Quick access constants for playlist/history limits
export const PLAYLIST_SONG_LIMITS = {
    NITRO_CORE: 50,
    NITRO_ELITE: 100,
    NITRO_SUPREME: -1  // Unlimited
};

export const PLAY_HISTORY_LIMITS = {
    NITRO_CORE: 25,
    NITRO_ELITE: 50,
    NITRO_SUPREME: -1  // Unlimited
};

export const PLAN_LIMITS: Record<SubscriptionTier, Record<FeatureKey, FeatureLimit>> = {
    NITRO_CORE: {
        visualizer_sessions: { max: 3, period: 'day' },
        dj_mode_sessions: { max: 1, period: 'day' },
        audio_fx_sessions: { max: 3, period: 'day' },
        downloads: { max: 10, period: 'month' },
        download_storage: { max: 250 * 1024 * 1024, period: 'forever' }, // 250MB
        playlists_created: { max: 3, period: 'forever' },
        songs_per_playlist: { max: 50, period: 'forever' },
        play_history: { max: 25, period: 'forever' },
        share_card_themes: { max: 1, period: 'forever' } // Only Modern
    },
    NITRO_ELITE: {
        visualizer_sessions: { max: -1 }, // Unlimited
        dj_mode_sessions: { max: -1 },
        audio_fx_sessions: { max: -1 },
        downloads: { max: -1 },
        download_storage: { max: 1024 * 1024 * 1024, period: 'forever' }, // 1GB
        playlists_created: { max: 20, period: 'forever' },
        songs_per_playlist: { max: 100, period: 'forever' },
        play_history: { max: 50, period: 'forever' },
        share_card_themes: { max: 2, period: 'forever' } // Modern + Glass
    },
    NITRO_SUPREME: {
        visualizer_sessions: { max: -1 },
        dj_mode_sessions: { max: -1 },
        audio_fx_sessions: { max: -1 },
        downloads: { max: -1 },
        download_storage: { max: -1, period: 'forever' }, // Unlimited
        playlists_created: { max: -1 },
        songs_per_playlist: { max: -1 },
        play_history: { max: -1 },
        share_card_themes: { max: -1 } // All
    }
};

export const FEATURE_NAMES: Record<FeatureKey, string> = {
    visualizer_sessions: 'Visualizer Sessions',
    dj_mode_sessions: 'DJ Mode Sessions',
    audio_fx_sessions: 'Audio FX Customization',
    downloads: 'Offline Downloads',
    download_storage: 'Download Storage',
    playlists_created: 'Playlists',
    songs_per_playlist: 'Songs per Playlist',
    play_history: 'Play History',
    share_card_themes: 'Share Card Themes'
};
