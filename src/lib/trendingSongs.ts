// Trending/Popular songs database for smart ranking
// These songs get boosted to the top of search results when their title matches
// This mimics Spotify's behavior of showing popular songs first

export interface TrendingSong {
    title: string;          // Song title (normalized for matching)
    artist: string;         // Primary artist
    aliases?: string[];     // Alternative names/spellings
    priority: number;       // Higher = more important (1-100)
}

// Trending songs list - Comprehensive collection of globally popular songs
export const trendingSongs: TrendingSong[] = [
    // ===========================================
    // 2024-2025 VIRAL/TRENDING SONGS
    // ===========================================
    { title: "blue", artist: "yung kai", priority: 100, aliases: ["blue yung kai", "blue minnie"] },
    { title: "die with a smile", artist: "lady gaga", priority: 99, aliases: ["die with a smile bruno mars"] },
    { title: "apt", artist: "rose", priority: 98, aliases: ["apt bruno mars", "apartment", "apt rosé"] },
    { title: "birds of a feather", artist: "billie eilish", priority: 97 },
    { title: "espresso", artist: "sabrina carpenter", priority: 96 },
    { title: "please please please", artist: "sabrina carpenter", priority: 95 },
    { title: "taste", artist: "sabrina carpenter", priority: 94 },
    { title: "we can't be friends", artist: "ariana grande", priority: 93 },
    { title: "supernatural", artist: "newjeans", priority: 92 },
    { title: "houdini", artist: "dua lipa", priority: 91 },
    { title: "illusion", artist: "dua lipa", priority: 90 },
    { title: "training season", artist: "dua lipa", priority: 89 },
    { title: "lovin on me", artist: "jack harlow", priority: 88 },
    { title: "texas hold em", artist: "beyonce", priority: 87 },
    { title: "greedy", artist: "tate mcrae", priority: 86 },
    { title: "agora hills", artist: "doja cat", priority: 85 },
    { title: "paint the town red", artist: "doja cat", priority: 84 },
    { title: "water", artist: "tyla", priority: 83 },
    { title: "end of beginning", artist: "djo", priority: 82 },
    { title: "redrum", artist: "21 savage", priority: 81 },
    { title: "million dollar baby", artist: "tommy richman", priority: 80 },
    { title: "a bar song tipsy", artist: "shaboozey", priority: 79, aliases: ["tipsy", "a bar song"] },
    { title: "not like us", artist: "kendrick lamar", priority: 78 },
    { title: "lunch", artist: "billie eilish", priority: 77 },
    { title: "beautiful things", artist: "benson boone", priority: 76 },
    { title: "i like the way you kiss me", artist: "artemas", priority: 75 },
    { title: "too sweet", artist: "hozier", priority: 74 },
    { title: "fortnight", artist: "taylor swift", priority: 73, aliases: ["fortnight post malone"] },
    { title: "i can do it with a broken heart", artist: "taylor swift", priority: 72 },
    { title: "lose control", artist: "teddy swims", priority: 71 },
    { title: "saturn", artist: "sza", priority: 70 },

    // ===========================================
    // ALL-TIME ENGLISH CLASSICS & POPULAR
    // ===========================================
    // The Weeknd
    { title: "blinding lights", artist: "the weeknd", priority: 95 },
    { title: "starboy", artist: "the weeknd", priority: 90 },
    { title: "save your tears", artist: "the weeknd", priority: 88 },
    { title: "call out my name", artist: "the weeknd", priority: 85 },
    { title: "the hills", artist: "the weeknd", priority: 84 },
    { title: "cant feel my face", artist: "the weeknd", priority: 83 },
    { title: "die for you", artist: "the weeknd", priority: 82 },
    { title: "often", artist: "the weeknd", priority: 80 },
    { title: "after hours", artist: "the weeknd", priority: 79 },

    // Ed Sheeran
    { title: "shape of you", artist: "ed sheeran", priority: 95 },
    { title: "perfect", artist: "ed sheeran", priority: 93 },
    { title: "photograph", artist: "ed sheeran", priority: 90 },
    { title: "thinking out loud", artist: "ed sheeran", priority: 88 },
    { title: "bad habits", artist: "ed sheeran", priority: 85 },
    { title: "shivers", artist: "ed sheeran", priority: 83 },
    { title: "castle on the hill", artist: "ed sheeran", priority: 80 },
    { title: "galway girl", artist: "ed sheeran", priority: 78 },

    // Adele
    { title: "someone like you", artist: "adele", priority: 92 },
    { title: "hello", artist: "adele", priority: 91 },
    { title: "rolling in the deep", artist: "adele", priority: 90 },
    { title: "easy on me", artist: "adele", priority: 88 },
    { title: "set fire to the rain", artist: "adele", priority: 85 },
    { title: "skyfall", artist: "adele", priority: 83 },

    // Billie Eilish
    { title: "lovely", artist: "billie eilish", priority: 93, aliases: ["lovely khalid"] },
    { title: "bad guy", artist: "billie eilish", priority: 91 },
    { title: "happier than ever", artist: "billie eilish", priority: 88 },
    { title: "ocean eyes", artist: "billie eilish", priority: 86 },
    { title: "when the party over", artist: "billie eilish", priority: 84 },
    { title: "everything i wanted", artist: "billie eilish", priority: 82 },

    // Olivia Rodrigo
    { title: "drivers license", artist: "olivia rodrigo", priority: 92 },
    { title: "good 4 u", artist: "olivia rodrigo", priority: 90 },
    { title: "vampire", artist: "olivia rodrigo", priority: 88 },
    { title: "traitor", artist: "olivia rodrigo", priority: 85 },
    { title: "deja vu", artist: "olivia rodrigo", priority: 83 },
    { title: "brutal", artist: "olivia rodrigo", priority: 80 },

    // Taylor Swift
    { title: "anti hero", artist: "taylor swift", priority: 95 },
    { title: "cruel summer", artist: "taylor swift", priority: 94 },
    { title: "shake it off", artist: "taylor swift", priority: 90 },
    { title: "blank space", artist: "taylor swift", priority: 88 },
    { title: "love story", artist: "taylor swift", priority: 87 },
    { title: "cardigan", artist: "taylor swift", priority: 85 },
    { title: "all too well", artist: "taylor swift", priority: 84 },
    { title: "willow", artist: "taylor swift", priority: 82 },
    { title: "style", artist: "taylor swift", priority: 80 },
    { title: "enchanted", artist: "taylor swift", priority: 78 },

    // Harry Styles
    { title: "as it was", artist: "harry styles", priority: 93 },
    { title: "watermelon sugar", artist: "harry styles", priority: 90 },
    { title: "adore you", artist: "harry styles", priority: 85 },
    { title: "sign of the times", artist: "harry styles", priority: 83 },
    { title: "late night talking", artist: "harry styles", priority: 80 },

    // Dua Lipa
    { title: "levitating", artist: "dua lipa", priority: 92 },
    { title: "dont start now", artist: "dua lipa", priority: 90 },
    { title: "new rules", artist: "dua lipa", priority: 88 },
    { title: "physical", artist: "dua lipa", priority: 85 },
    { title: "break my heart", artist: "dua lipa", priority: 82 },

    // Justin Bieber
    { title: "stay", artist: "justin bieber", priority: 92, aliases: ["stay kid laroi"] },
    { title: "peaches", artist: "justin bieber", priority: 88 },
    { title: "ghost", artist: "justin bieber", priority: 85 },
    { title: "sorry", artist: "justin bieber", priority: 83 },
    { title: "love yourself", artist: "justin bieber", priority: 82 },
    { title: "baby", artist: "justin bieber", priority: 80 },

    // Shawn Mendes
    { title: "senorita", artist: "shawn mendes", priority: 90, aliases: ["senorita camila cabello"] },
    { title: "stitches", artist: "shawn mendes", priority: 85 },
    { title: "treat you better", artist: "shawn mendes", priority: 83 },
    { title: "theres nothing holdin me back", artist: "shawn mendes", priority: 80 },
    { title: "in my blood", artist: "shawn mendes", priority: 78 },

    // Post Malone
    { title: "circles", artist: "post malone", priority: 90 },
    { title: "sunflower", artist: "post malone", priority: 88, aliases: ["sunflower swae lee"] },
    { title: "rockstar", artist: "post malone", priority: 86 },
    { title: "congratulations", artist: "post malone", priority: 84 },
    { title: "white iverson", artist: "post malone", priority: 82 },
    { title: "better now", artist: "post malone", priority: 80 },

    // Imagine Dragons
    { title: "believer", artist: "imagine dragons", priority: 90 },
    { title: "thunder", artist: "imagine dragons", priority: 88 },
    { title: "radioactive", artist: "imagine dragons", priority: 86 },
    { title: "demons", artist: "imagine dragons", priority: 84 },
    { title: "natural", artist: "imagine dragons", priority: 82 },
    { title: "enemy", artist: "imagine dragons", priority: 80 },
    { title: "bones", artist: "imagine dragons", priority: 78 },

    // The Chainsmokers
    { title: "closer", artist: "the chainsmokers", priority: 90, aliases: ["closer halsey"] },
    { title: "something just like this", artist: "the chainsmokers", priority: 85, aliases: ["something just like this coldplay"] },
    { title: "paris", artist: "the chainsmokers", priority: 82 },
    { title: "roses", artist: "the chainsmokers", priority: 80 },
    { title: "dont let me down", artist: "the chainsmokers", priority: 78 },

    // Bruno Mars
    { title: "uptown funk", artist: "bruno mars", priority: 92 },
    { title: "just the way you are", artist: "bruno mars", priority: 88 },
    { title: "thats what i like", artist: "bruno mars", priority: 85 },
    { title: "24k magic", artist: "bruno mars", priority: 83 },
    { title: "grenade", artist: "bruno mars", priority: 80 },
    { title: "leave the door open", artist: "bruno mars", priority: 78 },

    // SZA
    { title: "kill bill", artist: "sza", priority: 92 },
    { title: "snooze", artist: "sza", priority: 88 },
    { title: "good days", artist: "sza", priority: 85 },
    { title: "kiss me more", artist: "sza", priority: 83, aliases: ["kiss me more doja cat"] },

    // Drake
    { title: "gods plan", artist: "drake", priority: 90 },
    { title: "one dance", artist: "drake", priority: 88 },
    { title: "hotline bling", artist: "drake", priority: 86 },
    { title: "in my feelings", artist: "drake", priority: 84 },
    { title: "passionfruit", artist: "drake", priority: 82 },
    { title: "jimmy cooks", artist: "drake", priority: 80 },

    // Classic/Timeless
    { title: "dance monkey", artist: "tones and i", priority: 90 },
    { title: "heat waves", artist: "glass animals", priority: 88 },
    { title: "sweater weather", artist: "the neighbourhood", priority: 86 },
    { title: "heather", artist: "conan gray", priority: 84 },
    { title: "apocalypse", artist: "cigarettes after sex", priority: 82 },
    { title: "electric love", artist: "borns", priority: 80 },
    { title: "mystery of love", artist: "sufjan stevens", priority: 78 },
    { title: "dreams", artist: "fleetwood mac", priority: 85 },
    { title: "bohemian rhapsody", artist: "queen", priority: 90 },
    { title: "dont stop me now", artist: "queen", priority: 85 },
    { title: "hotel california", artist: "eagles", priority: 85 },
    { title: "stairway to heaven", artist: "led zeppelin", priority: 83 },
    { title: "smells like teen spirit", artist: "nirvana", priority: 85 },

    // One Direction
    { title: "night changes", artist: "one direction", priority: 90 },
    { title: "story of my life", artist: "one direction", priority: 88 },
    { title: "what makes you beautiful", artist: "one direction", priority: 86 },
    { title: "drag me down", artist: "one direction", priority: 82 },
    { title: "perfect", artist: "one direction", priority: 80 },

    // Charlie Puth
    { title: "attention", artist: "charlie puth", priority: 88 },
    { title: "we dont talk anymore", artist: "charlie puth", priority: 85 },
    { title: "see you again", artist: "charlie puth", priority: 90, aliases: ["see you again wiz khalifa"] },
    { title: "one call away", artist: "charlie puth", priority: 80 },
    { title: "light switch", artist: "charlie puth", priority: 78 },

    // Camila Cabello
    { title: "havana", artist: "camila cabello", priority: 90 },
    { title: "never be the same", artist: "camila cabello", priority: 82 },
    { title: "bam bam", artist: "camila cabello", priority: 78 },

    // ===========================================
    // K-POP
    // ===========================================
    // BTS
    { title: "dynamite", artist: "bts", priority: 93 },
    { title: "butter", artist: "bts", priority: 91 },
    { title: "boy with luv", artist: "bts", priority: 88 },
    { title: "spring day", artist: "bts", priority: 86 },
    { title: "fake love", artist: "bts", priority: 84 },
    { title: "dna", artist: "bts", priority: 82 },
    { title: "blood sweat tears", artist: "bts", priority: 80 },
    { title: "permission to dance", artist: "bts", priority: 78 },

    // Jungkook
    { title: "seven", artist: "jungkook", priority: 95 },
    { title: "standing next to you", artist: "jungkook", priority: 92 },
    { title: "3d", artist: "jungkook", priority: 88 },
    { title: "golden", artist: "jungkook", priority: 85 },

    // BLACKPINK
    { title: "pink venom", artist: "blackpink", priority: 92 },
    { title: "shut down", artist: "blackpink", priority: 90 },
    { title: "how you like that", artist: "blackpink", priority: 88 },
    { title: "kill this love", artist: "blackpink", priority: 86 },
    { title: "ddu du ddu du", artist: "blackpink", priority: 84 },
    { title: "lovesick girls", artist: "blackpink", priority: 82 },
    { title: "ice cream", artist: "blackpink", priority: 80 },

    // NewJeans
    { title: "super shy", artist: "newjeans", priority: 90 },
    { title: "ditto", artist: "newjeans", priority: 88 },
    { title: "hype boy", artist: "newjeans", priority: 86 },
    { title: "eta", artist: "newjeans", priority: 84 },
    { title: "attention", artist: "newjeans", priority: 82 },

    // Lisa/Jennie Solo
    { title: "money", artist: "lisa", priority: 88 },
    { title: "lalisa", artist: "lisa", priority: 85 },
    { title: "solo", artist: "jennie", priority: 88 },
    { title: "you and me", artist: "jennie", priority: 82 },

    // ===========================================
    // BOLLYWOOD / HINDI
    // ===========================================
    // Arijit Singh
    { title: "kesariya", artist: "arijit singh", priority: 98 },
    { title: "tum hi ho", artist: "arijit singh", priority: 95 },
    { title: "channa mereya", artist: "arijit singh", priority: 93 },
    { title: "agar tum saath ho", artist: "arijit singh", priority: 91 },
    { title: "tujhe kitna chahne lage", artist: "arijit singh", priority: 89 },
    { title: "apna bana le", artist: "arijit singh", priority: 96 },
    { title: "phir aur kya chahiye", artist: "arijit singh", priority: 94 },
    { title: "kalank", artist: "arijit singh", priority: 87 },
    { title: "gerua", artist: "arijit singh", priority: 85 },
    { title: "jhoome jo pathaan", artist: "arijit singh", priority: 92 },
    { title: "ve kamleya", artist: "arijit singh", priority: 90 },
    { title: "ae dil hai mushkil", artist: "arijit singh", priority: 88 },
    { title: "hawayein", artist: "arijit singh", priority: 86 },
    { title: "ilahi", artist: "arijit singh", priority: 84 },
    { title: "khairiyat", artist: "arijit singh", priority: 93 },
    { title: "shayad", artist: "arijit singh", priority: 91 },
    { title: "qaafirana", artist: "arijit singh", priority: 85 },

    // King
    { title: "maan meri jaan", artist: "king", priority: 97 },
    { title: "tu aake dekhle", artist: "king", priority: 93 },
    { title: "saawariya", artist: "king", priority: 88 },

    // Jubin Nautiyal
    { title: "raataan lambiyan", artist: "jubin nautiyal", priority: 94 },
    { title: "lut gaye", artist: "jubin nautiyal", priority: 92 },
    { title: "barsaat ki dhun", artist: "jubin nautiyal", priority: 88 },
    { title: "tum hi aana", artist: "jubin nautiyal", priority: 85 },
    { title: "bewafa tera masoom chehra", artist: "jubin nautiyal", priority: 82 },

    // Pritam/Vishal
    { title: "naacho naacho", artist: "vishal dadlani", priority: 90 },
    { title: "besharam rang", artist: "shilpa rao", priority: 88 },
    { title: "zinda banda", artist: "vishal dadlani", priority: 85 },

    // Classic Bollywood
    { title: "tujhe dekha to", artist: "kumar sanu", priority: 85 },
    { title: "pehla nasha", artist: "udit narayan", priority: 88 },
    { title: "lag ja gale", artist: "lata mangeshkar", priority: 85 },
    { title: "kal ho naa ho", artist: "sonu nigam", priority: 90 },
    { title: "abhi mujh mein kahin", artist: "sonu nigam", priority: 88 },
    { title: "chaiyya chaiyya", artist: "sukhwinder singh", priority: 85 },
    { title: "mere haath mein", artist: "sonu nigam", priority: 82 },
    { title: "tere bina", artist: "ar rahman", priority: 80 },
    { title: "jai ho", artist: "ar rahman", priority: 85 },

    // Dhvani Bhanushali
    { title: "vaaste", artist: "dhvani bhanushali", priority: 90 },
    { title: "leja leja re", artist: "dhvani bhanushali", priority: 85 },
    { title: "psycho saiyaan", artist: "dhvani bhanushali", priority: 80 },

    // Shreya Ghoshal
    { title: "teri meri", artist: "shreya ghoshal", priority: 85 },
    { title: "suno na sangemarmar", artist: "shreya ghoshal", priority: 83 },
    { title: "tujh mein rab dikhta hai", artist: "shreya ghoshal", priority: 88 },

    // Atif Aslam
    { title: "pehli dafa", artist: "atif aslam", priority: 85 },
    { title: "tera hone laga hoon", artist: "atif aslam", priority: 88 },
    { title: "dil diyan gallan", artist: "atif aslam", priority: 92 },
    { title: "tere sang yaara", artist: "atif aslam", priority: 85 },

    // ===========================================
    // PUNJABI
    // ===========================================
    // AP Dhillon
    { title: "excuses", artist: "ap dhillon", priority: 97 },
    { title: "brown munde", artist: "ap dhillon", priority: 95 },
    { title: "insane", artist: "ap dhillon", priority: 93 },
    { title: "with you", artist: "ap dhillon", priority: 91 },
    { title: "ma belle", artist: "ap dhillon", priority: 89 },
    { title: "summer high", artist: "ap dhillon", priority: 87 },
    { title: "desires", artist: "ap dhillon", priority: 85 },

    // Diljit Dosanjh
    { title: "lover", artist: "diljit dosanjh", priority: 96 },
    { title: "born to shine", artist: "diljit dosanjh", priority: 90 },
    { title: "goat", artist: "diljit dosanjh", priority: 88 },
    { title: "proper patola", artist: "diljit dosanjh", priority: 85 },
    { title: "5 taara", artist: "diljit dosanjh", priority: 82 },
    { title: "clash", artist: "diljit dosanjh", priority: 80 },
    { title: "case", artist: "diljit dosanjh", priority: 78 },

    // Shubh
    { title: "no love", artist: "shubh", priority: 96 },
    { title: "still rollin", artist: "shubh", priority: 94 },
    { title: "elevated", artist: "shubh", priority: 92 },
    { title: "cheques", artist: "shubh", priority: 90 },
    { title: "we rollin", artist: "shubh", priority: 88 },
    { title: "offshore", artist: "shubh", priority: 85 },
    { title: "baller", artist: "shubh", priority: 82 },

    // Sidhu Moosewala
    { title: "295", artist: "sidhu moosewala", priority: 98 },
    { title: "the last ride", artist: "sidhu moosewala", priority: 96 },
    { title: "levels", artist: "sidhu moosewala", priority: 94 },
    { title: "calaboose", artist: "sidhu moosewala", priority: 92 },
    { title: "so high", artist: "sidhu moosewala", priority: 90 },
    { title: "same beef", artist: "sidhu moosewala", priority: 88 },
    { title: "warning shots", artist: "sidhu moosewala", priority: 85 },
    { title: "just listen", artist: "sidhu moosewala", priority: 82 },

    // Karan Aujla
    { title: "softly", artist: "karan aujla", priority: 94 },
    { title: "admiring you", artist: "karan aujla", priority: 92 },
    { title: "52 bars", artist: "karan aujla", priority: 90 },
    { title: "players", artist: "karan aujla", priority: 88 },
    { title: "its okay", artist: "karan aujla", priority: 85 },

    // Other Punjabi
    { title: "laung laachi", artist: "mannat noor", priority: 88 },
    { title: "nadiyon paar", artist: "sachin jigar", priority: 85 },
    { title: "bijlee bijlee", artist: "harrdy sandhu", priority: 90 },
    { title: "kya baat ay", artist: "harrdy sandhu", priority: 85 },

    // ===========================================
    // SPANISH / LATIN
    // ===========================================
    { title: "despacito", artist: "luis fonsi", priority: 92, aliases: ["despacito justin bieber"] },
    { title: "mi gente", artist: "j balvin", priority: 85 },
    { title: "taki taki", artist: "dj snake", priority: 83 },
    { title: "danza kuduro", artist: "don omar", priority: 80 },
    { title: "bailando", artist: "enrique iglesias", priority: 82 },
    { title: "con calma", artist: "daddy yankee", priority: 80 },

    // Bad Bunny
    { title: "titi me pregunto", artist: "bad bunny", priority: 88 },
    { title: "dakiti", artist: "bad bunny", priority: 85 },
    { title: "callaita", artist: "bad bunny", priority: 82 },
    { title: "donde ella va", artist: "bad bunny", priority: 80 },

    // ===========================================
    // ARABIC / MIDDLE EASTERN
    // ===========================================
    { title: "habibi", artist: "ricky rich", priority: 80 },
    { title: "tamally maak", artist: "amr diab", priority: 78 },

    // ===========================================
    // THROWBACK / 90s-2000s
    // ===========================================
    { title: "its gonna be me", artist: "nsync", priority: 78 },
    { title: "bye bye bye", artist: "nsync", priority: 80 },
    { title: "i want it that way", artist: "backstreet boys", priority: 85 },
    { title: "everybody", artist: "backstreet boys", priority: 80 },
    { title: "genie in a bottle", artist: "christina aguilera", priority: 78 },
    { title: "beautiful", artist: "christina aguilera", priority: 76 },
    { title: "toxic", artist: "britney spears", priority: 85 },
    { title: "oops i did it again", artist: "britney spears", priority: 82 },
    { title: "baby one more time", artist: "britney spears", priority: 80 },
    { title: "thriller", artist: "michael jackson", priority: 90 },
    { title: "billie jean", artist: "michael jackson", priority: 88 },
    { title: "beat it", artist: "michael jackson", priority: 85 },
    { title: "smooth criminal", artist: "michael jackson", priority: 82 },
    { title: "single ladies", artist: "beyonce", priority: 88 },
    { title: "crazy in love", artist: "beyonce", priority: 85 },
    { title: "halo", artist: "beyonce", priority: 83 },
];

// Create a quick lookup map for title matching
export const trendingTitleMap: Map<string, TrendingSong> = new Map();
trendingSongs.forEach(song => {
    const normalizedTitle = song.title.toLowerCase().trim();
    // Only keep the highest priority song for each title
    const existing = trendingTitleMap.get(normalizedTitle);
    if (!existing || song.priority > existing.priority) {
        trendingTitleMap.set(normalizedTitle, song);
    }
    // Also add aliases
    song.aliases?.forEach(alias => {
        const normalizedAlias = alias.toLowerCase().trim();
        if (!trendingTitleMap.has(normalizedAlias)) {
            trendingTitleMap.set(normalizedAlias, song);
        }
    });
});

/**
 * Get the trending song match for a query
 */
export const getTrendingSongForQuery = (query: string): TrendingSong | null => {
    const normalized = query.toLowerCase().trim();
    return trendingTitleMap.get(normalized) || null;
};

/**
 * Calculate a boost score for a song based on whether it matches trending songs
 */
export const calculateTrendingBoost = (song: any, query: string): number => {
    const songTitle = (song.title || song.name || '').toLowerCase().trim();
    const songArtist = getArtistFromSong(song).toLowerCase().trim();
    const normalizedQuery = query.toLowerCase().trim();

    // Check if query matches a trending song title
    const trendingSong = trendingTitleMap.get(normalizedQuery);
    if (!trendingSong) return 0;

    // Check if this song matches the trending song
    const titleMatch = songTitle.includes(trendingSong.title) || trendingSong.title.includes(songTitle);
    const artistMatch = songArtist.includes(trendingSong.artist) || trendingSong.artist.includes(songArtist);

    if (titleMatch && artistMatch) {
        // Perfect match - high boost
        return trendingSong.priority * 10;
    } else if (titleMatch) {
        // Title matches but different artist - medium boost
        return trendingSong.priority;
    }

    return 0;
};

/**
 * Helper to get artist from song object
 */
const getArtistFromSong = (song: any): string => {
    if (song.artists?.primary?.length) {
        return song.artists.primary[0].name;
    }
    if (song.primaryArtists) {
        return song.primaryArtists.split(',')[0].trim();
    }
    if (song.artist) {
        return song.artist.split(',')[0].trim();
    }
    return '';
};

/**
 * Re-rank search results to prioritize trending songs
 * This mimics Spotify's behavior of showing popular songs first
 */
export const reRankByTrending = (songs: any[], query: string): any[] => {
    if (!songs || songs.length === 0) return songs;

    // Calculate boost scores for all songs
    const songsWithBoost = songs.map(song => ({
        song,
        boost: calculateTrendingBoost(song, query),
        originalIndex: songs.indexOf(song)
    }));

    // Sort by boost (descending), then by original position
    songsWithBoost.sort((a, b) => {
        if (b.boost !== a.boost) {
            return b.boost - a.boost;
        }
        return a.originalIndex - b.originalIndex;
    });

    return songsWithBoost.map(item => item.song);
};

/**
 * Check if the top result is a high-confidence trending match
 * Returns confidence score (0-100) and the matching trending song info
 */
export const getTopResultConfidence = (topSong: any, query: string): {
    isConfident: boolean;
    confidence: number;
    trendingSong: TrendingSong | null;
} => {
    if (!topSong) {
        return { isConfident: false, confidence: 0, trendingSong: null };
    }

    const boost = calculateTrendingBoost(topSong, query);
    const trendingSong = getTrendingSongForQuery(query);

    // If boost > 500, it's a perfect match (title + artist match)
    // boost = priority * 10 for perfect match, priority * 1 for title-only match
    const isPerfectMatch = boost >= 500;
    const isTitleMatch = boost >= 50 && boost < 500;

    if (isPerfectMatch) {
        return { isConfident: true, confidence: 99, trendingSong };
    } else if (isTitleMatch) {
        return { isConfident: true, confidence: 75, trendingSong };
    }

    return { isConfident: false, confidence: 0, trendingSong: null };
};
