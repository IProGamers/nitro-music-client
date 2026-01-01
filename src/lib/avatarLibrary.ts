/**
 * Profile Avatar Library
 * Comprehensive collection of flat icons and avatars for user profiles
 */

// Dicebear API styles for generating avatars
export const AVATAR_STYLES = [
    'micah',
    'adventurer',
    'fun-emoji',
    'bottts',
    'avataaars',
    'lorelei',
    'notionists',
    'personas',
    'pixel-art',
    'thumbs',
    'big-smile',
    'adventurer-neutral',
    'open-peeps',
    'identicon',
    'shapes'
] as const;

export type AvatarStyle = typeof AVATAR_STYLES[number];

// Generate a Dicebear avatar URL
export const generateAvatarUrl = (
    seed: string,
    style: AvatarStyle = 'micah',
    options?: { backgroundColor?: string; size?: number }
): string => {
    const params = new URLSearchParams();
    if (options?.backgroundColor) {
        params.append('backgroundColor', options.backgroundColor);
    }
    if (options?.size) {
        params.append('size', options.size.toString());
    }
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}${params.toString() ? '&' + params.toString() : ''}`;
};

// Quick avatars - Initial selection shown during setup
export const QUICK_AVATARS = [
    // Micah - Cool & Artistic
    { url: 'https://api.dicebear.com/7.x/micah/svg?seed=Vibe&backgroundColor=ffdfbf,ffd5dc', category: 'artistic' },
    { url: 'https://api.dicebear.com/7.x/micah/svg?seed=Soul&backgroundColor=c1f4c1,d1f4ff', category: 'artistic' },
    { url: 'https://api.dicebear.com/7.x/micah/svg?seed=Jazz&backgroundColor=b6e3f4,c0aede', category: 'artistic' },
    { url: 'https://api.dicebear.com/7.x/micah/svg?seed=Melody&backgroundColor=ff9a9e,fad0c4', category: 'artistic' },
    // Adventurer - Action
    { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rock&backgroundColor=ffadad,ffd6a5', category: 'adventure' },
    { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Pop&backgroundColor=fdffb6,caffbf', category: 'adventure' },
    // Fun Emoji
    { url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Music&backgroundColor=9bf6ff,a0c4ff', category: 'emoji' },
    { url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Beat&backgroundColor=ffdfbf,ffd5dc', category: 'emoji' },
];

// Extended avatar library with categories
export const AVATAR_LIBRARY: Record<string, { label: string; color: string; avatars: string[] }> = {
    artistic: {
        label: 'Artistic',
        color: 'from-pink-500 to-purple-500',
        avatars: [
            'https://api.dicebear.com/7.x/micah/svg?seed=Artist1&backgroundColor=ffdfbf',
            'https://api.dicebear.com/7.x/micah/svg?seed=Artist2&backgroundColor=c1f4c1',
            'https://api.dicebear.com/7.x/micah/svg?seed=Artist3&backgroundColor=b6e3f4',
            'https://api.dicebear.com/7.x/micah/svg?seed=Artist4&backgroundColor=ff9a9e',
            'https://api.dicebear.com/7.x/micah/svg?seed=Artist5&backgroundColor=fad0c4',
            'https://api.dicebear.com/7.x/micah/svg?seed=Artist6&backgroundColor=a18cd1',
            'https://api.dicebear.com/7.x/micah/svg?seed=Artist7&backgroundColor=fbc2eb',
            'https://api.dicebear.com/7.x/micah/svg?seed=Singer1&backgroundColor=89f7fe',
            'https://api.dicebear.com/7.x/micah/svg?seed=Singer2&backgroundColor=66a6ff',
            'https://api.dicebear.com/7.x/micah/svg?seed=Singer3&backgroundColor=88d3ce',
            'https://api.dicebear.com/7.x/micah/svg?seed=DJ1&backgroundColor=d4fc79',
            'https://api.dicebear.com/7.x/micah/svg?seed=DJ2&backgroundColor=96e6a1',
        ]
    },
    adventure: {
        label: 'Adventure',
        color: 'from-orange-500 to-yellow-500',
        avatars: [
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero1&backgroundColor=ffadad',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero2&backgroundColor=ffd6a5',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero3&backgroundColor=fdffb6',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero4&backgroundColor=caffbf',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero5&backgroundColor=9bf6ff',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero6&backgroundColor=a0c4ff',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer1&backgroundColor=bdb2ff',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer2&backgroundColor=ffc6ff',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer3&backgroundColor=f0e68c',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer4&backgroundColor=98fb98',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Traveler1&backgroundColor=dda0dd',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Traveler2&backgroundColor=87ceeb',
        ]
    },
    emoji: {
        label: 'Fun Emoji',
        color: 'from-yellow-500 to-green-500',
        avatars: [
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy1&backgroundColor=9bf6ff',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy2&backgroundColor=a0c4ff',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy3&backgroundColor=ffdfbf',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Chill1&backgroundColor=ffd5dc',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Chill2&backgroundColor=c1f4c1',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Chill3&backgroundColor=d1f4ff',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool1&backgroundColor=b6e3f4',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool2&backgroundColor=c0aede',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Party1&backgroundColor=ff9a9e',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Party2&backgroundColor=fad0c4',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Vibes1&backgroundColor=fbc2eb',
            'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Vibes2&backgroundColor=a6c1ee',
        ]
    },
    robots: {
        label: 'Robots',
        color: 'from-cyan-500 to-blue-500',
        avatars: [
            'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1&backgroundColor=22d3ee',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2&backgroundColor=818cf8',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Robot3&backgroundColor=f472b6',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Cyborg1&backgroundColor=4ade80',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Cyborg2&backgroundColor=fbbf24',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Cyborg3&backgroundColor=fb923c',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Android1&backgroundColor=a855f7',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Android2&backgroundColor=ec4899',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Droid1&backgroundColor=14b8a6',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Droid2&backgroundColor=3b82f6',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Mecha1&backgroundColor=8b5cf6',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Mecha2&backgroundColor=06b6d4',
        ]
    },
    avataaars: {
        label: 'Classic',
        color: 'from-indigo-500 to-purple-500',
        avatars: [
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Classic1&backgroundColor=b6e3f4',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Classic2&backgroundColor=c0aede',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Classic3&backgroundColor=d1d4f9',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Person1&backgroundColor=ffd5dc',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Person2&backgroundColor=ffdfbf',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Person3&backgroundColor=c1f4c1',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=User1&backgroundColor=a0c4ff',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=User2&backgroundColor=9bf6ff',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Human1&backgroundColor=caffbf',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Human2&backgroundColor=fdffb6',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Profile1&backgroundColor=ffd6a5',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Profile2&backgroundColor=ffadad',
        ]
    },
    notionists: {
        label: 'Minimalist',
        color: 'from-slate-500 to-zinc-600',
        avatars: [
            'https://api.dicebear.com/7.x/notionists/svg?seed=Minimal1&backgroundColor=f8f9fa',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Minimal2&backgroundColor=e9ecef',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Minimal3&backgroundColor=dee2e6',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Clean1&backgroundColor=ced4da',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Clean2&backgroundColor=adb5bd',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Clean3&backgroundColor=6c757d',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Simple1&backgroundColor=f8f9fa',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Simple2&backgroundColor=e9ecef',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Simple3&backgroundColor=dee2e6',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Sleek1&backgroundColor=ced4da',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Sleek2&backgroundColor=adb5bd',
            'https://api.dicebear.com/7.x/notionists/svg?seed=Sleek3&backgroundColor=6c757d',
        ]
    },
    pixel: {
        label: 'Pixel Art',
        color: 'from-green-500 to-emerald-500',
        avatars: [
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel1&backgroundColor=4ade80',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel2&backgroundColor=22d3ee',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel3&backgroundColor=a855f7',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Retro1&backgroundColor=f472b6',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Retro2&backgroundColor=fbbf24',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Retro3&backgroundColor=fb923c',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Game1&backgroundColor=818cf8',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Game2&backgroundColor=ec4899',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Game3&backgroundColor=14b8a6',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Arcade1&backgroundColor=3b82f6',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Arcade2&backgroundColor=8b5cf6',
            'https://api.dicebear.com/7.x/pixel-art/svg?seed=Arcade3&backgroundColor=06b6d4',
        ]
    },
    shapes: {
        label: 'Abstract',
        color: 'from-red-500 to-pink-500',
        avatars: [
            'https://api.dicebear.com/7.x/shapes/svg?seed=Shape1&backgroundColor=ff6b6b',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Shape2&backgroundColor=4ecdc4',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Shape3&backgroundColor=45b7d1',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Geo1&backgroundColor=96ceb4',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Geo2&backgroundColor=ffeaa7',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Geo3&backgroundColor=dfe6e9',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Abstract1&backgroundColor=a29bfe',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Abstract2&backgroundColor=fd79a8',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Abstract3&backgroundColor=00b894',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Pattern1&backgroundColor=e17055',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Pattern2&backgroundColor=0984e3',
            'https://api.dicebear.com/7.x/shapes/svg?seed=Pattern3&backgroundColor=6c5ce7',
        ]
    }
};

// Get all avatars flattened
export const getAllAvatars = (): string[] => {
    return Object.values(AVATAR_LIBRARY).flatMap(cat => cat.avatars);
};

// Get category names
export const getCategories = (): string[] => {
    return Object.keys(AVATAR_LIBRARY);
};

// Premium profile customization options for Elite/Supreme users
export const PREMIUM_PROFILE_FEATURES = {
    // Profile banner gradients (Elite+)
    bannerGradients: [
        { id: 'sunset', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Sunset' },
        { id: 'ocean', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Ocean' },
        { id: 'forest', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', label: 'Forest' },
        { id: 'fire', gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', label: 'Fire' },
        { id: 'aurora', gradient: 'linear-gradient(135deg, #00c3ff 0%, #ffff1c 100%)', label: 'Aurora' },
        { id: 'galaxy', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', label: 'Galaxy' },
        { id: 'candy', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)', label: 'Candy' },
        { id: 'midnight', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)', label: 'Midnight' },
    ],
    // Profile border effects (Elite+)
    borderEffects: [
        { id: 'none', label: 'None', class: '' },
        { id: 'glow-cyan', label: 'Cyan Glow', class: 'ring-4 ring-cyan-400/50 shadow-lg shadow-cyan-400/30' },
        { id: 'glow-purple', label: 'Purple Glow', class: 'ring-4 ring-purple-400/50 shadow-lg shadow-purple-400/30' },
        { id: 'glow-amber', label: 'Amber Glow', class: 'ring-4 ring-amber-400/50 shadow-lg shadow-amber-400/30' },
        { id: 'glow-pink', label: 'Pink Glow', class: 'ring-4 ring-pink-400/50 shadow-lg shadow-pink-400/30' },
        { id: 'glow-emerald', label: 'Emerald Glow', class: 'ring-4 ring-emerald-400/50 shadow-lg shadow-emerald-400/30' },
        { id: 'rainbow', label: 'Rainbow', class: 'ring-4 ring-offset-2 ring-offset-black animate-pulse' },
    ],
    // Profile badges (Supreme only)
    badges: [
        { id: 'verified', emoji: '✓', label: 'Verified', color: 'bg-blue-500' },
        { id: 'og', emoji: '🔥', label: 'OG Member', color: 'bg-orange-500' },
        { id: 'music_lover', emoji: '🎵', label: 'Music Lover', color: 'bg-pink-500' },
        { id: 'audiophile', emoji: '🎧', label: 'Audiophile', color: 'bg-purple-500' },
        { id: 'dj', emoji: '🎛️', label: 'DJ', color: 'bg-cyan-500' },
        { id: 'night_owl', emoji: '🦉', label: 'Night Owl', color: 'bg-indigo-500' },
        { id: 'early_bird', emoji: '🌅', label: 'Early Bird', color: 'bg-amber-500' },
        { id: 'supporter', emoji: '❤️', label: 'Supporter', color: 'bg-red-500' },
    ],
    // Animated avatar effects (Supreme only)
    avatarEffects: [
        { id: 'none', label: 'None' },
        { id: 'pulse', label: 'Pulse', class: 'animate-pulse' },
        { id: 'bounce', label: 'Bounce', class: 'animate-bounce' },
        { id: 'spin-slow', label: 'Slow Spin', class: 'animate-spin-slow' },
        { id: 'glow', label: 'Glow', class: 'animate-glow' },
    ],
    // Profile themes (Supreme only)
    profileThemes: [
        { id: 'default', label: 'Default', description: 'Standard profile look' },
        { id: 'neon', label: 'Neon', description: 'Vibrant neon accents' },
        { id: 'minimal', label: 'Minimal', description: 'Clean and simple' },
        { id: 'retro', label: 'Retro', description: '80s inspired aesthetic' },
        { id: 'cyberpunk', label: 'Cyberpunk', description: 'Futuristic high-tech look' },
    ]
};

// Check if a feature is available for a tier
export const isFeatureAvailable = (feature: 'banners' | 'borders' | 'badges' | 'effects' | 'themes', tier: string): boolean => {
    const tierLevel = {
        'NITRO_CORE': 0,
        'NITRO_ELITE': 1,
        'NITRO_SUPREME': 2,
        'NITRO_ULTRA': 2, // Legacy tier maps to Supreme
    }[tier] || 0;

    const featureRequirements = {
        'banners': 1,    // Elite+
        'borders': 1,    // Elite+
        'badges': 2,     // Supreme only
        'effects': 2,    // Supreme only
        'themes': 2,     // Supreme only
    };

    return tierLevel >= featureRequirements[feature];
};
