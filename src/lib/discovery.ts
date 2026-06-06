import { getTrackArtistName, normalizeTrackId } from "./utils";

type TrackLike = {
    id?: string;
    songId?: string;
    name?: string;
    title?: string;
    artist?: string;
    primaryArtists?: string;
};

type SessionSnapshot = {
    totalListeningTime?: number;
    topArtists?: Array<{ name?: string; count?: number }>;
};

export type DiscoveryProfile = {
    topArtists: string[];
    topLanguages: string[];
    topMoods: string[];
    repeatedTrackIds: string[];
    skippedTrackIds: string[];
    sessionMinutes: number;
    socialAffinity: "solo" | "shared";
};

export type DiscoveryQueries = {
    trending: string;
    party: string;
    focus: string;
    regional: string;
    madeForYou: string[];
};

const LANGUAGE_RULES = [
    { key: "hindi", match: /\b(dil|ishq|pyaar|pyar|tera|meri|mohabbat|safar|yaar|raataan)\b/i },
    { key: "punjabi", match: /\b(kudi|kudiyan|bhangra|nach|gabru|sajna|sardar|diljit|aujla)\b/i },
    { key: "tamil", match: /\b(anbe|thalapathy|kollywood|kaadhal|uyire)\b/i },
    { key: "telugu", match: /\b(tollywood|prema|nuvvu|sye|mass)\b/i },
    { key: "english", match: /\b(love|night|summer|heart|dream|dance|party|baby)\b/i },
];

const MOOD_RULES = [
    { key: "party", match: /\b(party|dance|club|bass|anthem|night|turn up)\b/i },
    { key: "romantic", match: /\b(love|dil|heart|romance|ishq|pyaar|sajna)\b/i },
    { key: "sad", match: /\b(sad|alone|cry|miss|broken|pain|judai)\b/i },
    { key: "focus", match: /\b(lofi|study|focus|calm|instrumental|ambient)\b/i },
    { key: "devotional", match: /\b(bhajan|aarti|shiv|krishna|allah|waheguru|devotional)\b/i },
];

const cleanText = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/gi, " ").replace(/\s+/g, " ").trim();

const getTrackTitle = (track: TrackLike) => cleanText(track.name || track.title || "");

const getTrackArtist = (track: TrackLike) => cleanText(getTrackArtistName(track));

const addWeighted = (map: Map<string, number>, key: string, weight: number) => {
    if (!key) return;
    map.set(key, (map.get(key) || 0) + weight);
};

const rankedKeys = (map: Map<string, number>, limit = 3) =>
    [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([key]) => key);

const inferLanguages = (tracks: TrackLike[]) => {
    const counts = new Map<string, number>();

    for (const track of tracks) {
        const haystack = `${getTrackTitle(track)} ${getTrackArtist(track)}`;
        let matched = false;

        for (const rule of LANGUAGE_RULES) {
            if (rule.match.test(haystack)) {
                addWeighted(counts, rule.key, 1);
                matched = true;
            }
        }

        if (!matched) addWeighted(counts, "indian", 0.5);
    }

    const languages = rankedKeys(counts, 3);
    return languages.length > 0 ? languages : ["indian"];
};

const inferMoods = (tracks: TrackLike[], sessionMinutes: number) => {
    const counts = new Map<string, number>();

    for (const track of tracks) {
        const haystack = `${getTrackTitle(track)} ${getTrackArtist(track)}`;
        for (const rule of MOOD_RULES) {
            if (rule.match.test(haystack)) addWeighted(counts, rule.key, 1);
        }
    }

    if (sessionMinutes >= 45) addWeighted(counts, "focus", 1);
    if (sessionMinutes >= 20) addWeighted(counts, "party", 0.5);

    const moods = rankedKeys(counts, 3);
    return moods.length > 0 ? moods : ["feel good"];
};

const getSessionSnapshot = (): SessionSnapshot => {
    if (typeof window === "undefined") return {};

    try {
        const raw = window.localStorage.getItem("nitro_listening_stats_session");
        if (!raw) return {};
        return JSON.parse(raw) as SessionSnapshot;
    } catch {
        return {};
    }
};

const getDiscoverySignals = () => {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem("nitro_discovery_signals");
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
};

export const buildDiscoveryProfile = (input: {
    recentPlays: TrackLike[];
    likedSongs: TrackLike[];
    playlists: Array<{ isCollaborative?: boolean; isPublic?: boolean }>;
}): DiscoveryProfile => {
    const session = getSessionSnapshot();
    const signals = getDiscoverySignals();
    const recentPlays = input.recentPlays || [];
    const likedSongs = input.likedSongs || [];
    const sourceTracks = [...recentPlays, ...likedSongs];
    const artistWeights = new Map<string, number>();
    const repeatWeights = new Map<string, number>();
    const skippedTrackIds: string[] = [];

    // Process playback signals
    Object.entries(signals).forEach(([id, stats]: [string, any]) => {
        if (stats.skips > (stats.plays || 0) * 0.5) {
            skippedTrackIds.push(id);
        }
        if (stats.repeats > 0) {
            addWeighted(repeatWeights, id, stats.repeats * 2);
        }
    });

    for (const track of recentPlays) {
        addWeighted(artistWeights, getTrackArtist(track), 1);
        addWeighted(repeatWeights, normalizeTrackId(track), 1);
    }

    for (const track of likedSongs) {
        addWeighted(artistWeights, getTrackArtist(track), 3); // Liked songs weigh more
        addWeighted(repeatWeights, normalizeTrackId(track), 3);
    }

    for (const artist of session.topArtists || []) {
        addWeighted(artistWeights, cleanText(artist.name || ""), artist.count || 1);
    }

    const sessionMinutes = Math.round((session.totalListeningTime || 0) / 60);
    const socialAffinity = input.playlists.some((playlist) => playlist.isCollaborative || playlist.isPublic)
        ? "shared"
        : "solo";

    return {
        topArtists: rankedKeys(artistWeights, 5),
        topLanguages: inferLanguages(sourceTracks),
        topMoods: inferMoods(sourceTracks, sessionMinutes),
        repeatedTrackIds: rankedKeys(repeatWeights, 8),
        skippedTrackIds,
        sessionMinutes,
        socialAffinity,
    };
};

export const buildDiscoveryQueries = (profile: DiscoveryProfile): DiscoveryQueries => {
    const primaryLanguage = profile.topLanguages[0] || "indian";
    const secondaryLanguage = profile.topLanguages[1] || primaryLanguage;
    const primaryMood = profile.topMoods[0] || "feel good";
    const secondaryMood = profile.topMoods[1] || primaryMood;
    const artistSeed = profile.topArtists.slice(0, 2).join(" ").trim();
    const energyMood = profile.sessionMinutes >= 45 ? "focus" : primaryMood;
    const regionalSeed =
        primaryLanguage === "punjabi"
            ? "punjabi pop"
            : primaryLanguage === "tamil"
              ? "tamil hits"
              : primaryLanguage === "telugu"
                ? "telugu hits"
                : "bollywood hits";

    const madeForYou = [
        `${primaryLanguage} ${primaryMood} ${artistSeed}`.trim(),
        `${secondaryLanguage} ${secondaryMood} songs`.trim(),
        `${regionalSeed} ${artistSeed}`.trim(),
        profile.socialAffinity === "shared"
            ? `community playlist ${primaryLanguage} ${primaryMood}`
            : `late night ${primaryLanguage} ${primaryMood}`,
    ];

    return {
        trending: `${primaryLanguage} trending ${primaryMood} ${artistSeed}`.trim(),
        party: `${primaryLanguage} party dance ${artistSeed}`.trim(),
        focus: `${primaryLanguage} ${energyMood} focus ${artistSeed}`.trim(),
        regional: `${regionalSeed} ${secondaryMood}`.trim(),
        madeForYou,
    };
};
