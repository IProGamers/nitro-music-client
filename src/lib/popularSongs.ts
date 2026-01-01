// Popular songs database for fuzzy search with common misspellings and lyrics
// This is a lightweight, cached-in-memory database for instant matching

export interface PopularSong {
    name: string;
    artist: string;
    aliases: string[];  // Common misspellings
    lyrics?: string[];  // Famous lyric lines (optional)
}

// Curated list of popular songs with common misspellings
export const popularSongs: PopularSong[] = [
    // International Hits
    {
        name: "Shape of You",
        artist: "Ed Sheeran",
        aliases: ["shaap of you", "shape of u", "shap of you", "shape off you", "shapeofyou", "shape ov you"],
        lyrics: ["in love with the shape of you", "your body", "im in love with your body"]
    },
    {
        name: "Blinding Lights",
        artist: "The Weeknd",
        aliases: ["bleinding lights", "blinding lites", "blindinglights", "bliding lights", "blending lights"],
        lyrics: ["i been tryna call", "sin city", "blinded by the lights"]
    },
    {
        name: "Starboy",
        artist: "The Weeknd",
        aliases: ["star boy", "starboii", "starboi"],
        lyrics: ["look what you done", "im a starboy"]
    },
    {
        name: "Perfect",
        artist: "Ed Sheeran",
        aliases: ["perfact", "perfekt", "ed sheeran perfect"],
        lyrics: ["baby im dancing in the dark", "i found a love for me"]
    },
    {
        name: "Someone Like You",
        artist: "Adele",
        aliases: ["some one like you", "someone like u", "sumone like you"],
        lyrics: ["never mind ill find someone like you", "i heard that youre settled down"]
    },
    {
        name: "Rolling in the Deep",
        artist: "Adele",
        aliases: ["rolling in deep", "rollin in the deep", "rolling the deep"],
        lyrics: ["we could have had it all", "rolling in the deep"]
    },
    {
        name: "Uptown Funk",
        artist: "Bruno Mars",
        aliases: ["up town funk", "uptownfunk", "uptown funck"],
        lyrics: ["dont believe me just watch", "saturday night"]
    },
    {
        name: "Stay",
        artist: "The Kid LAROI & Justin Bieber",
        aliases: ["stay justin bieber", "stay kid laroi", "stay song"],
        lyrics: ["i do the same thing i told you", "said youd never leave"]
    },
    {
        name: "Heat Waves",
        artist: "Glass Animals",
        aliases: ["heat wave", "heatwaves", "heat wavez"],
        lyrics: ["sometimes all i think about is you", "late nights in the middle of june"]
    },
    {
        name: "Levitating",
        artist: "Dua Lipa",
        aliases: ["levitaing", "levatating", "dua lipa levitating"],
        lyrics: ["if you wanna run away with me", "glitter in the sky"]
    },

    // Bollywood Hits
    {
        name: "Tum Hi Ho",
        artist: "Arijit Singh",
        aliases: ["tum hi ho", "tumhiho", "tum he ho", "tum hi hoo", "arijit tum hi ho"],
        lyrics: ["tum hi ho", "ab tum hi ho", "meri aashiqui"]
    },
    {
        name: "Channa Mereya",
        artist: "Arijit Singh",
        aliases: ["channa meriya", "chana mereya", "channa mareya", "channna mereya"],
        lyrics: ["achha chalta hoon", "duaon mein yaad rakhna"]
    },
    {
        name: "Kesariya",
        artist: "Arijit Singh",
        aliases: ["kesaria", "kasariya", "kesriya", "keshariya"],
        lyrics: ["kesariya tera ishq hai piya", "rang jaaun"]
    },
    {
        name: "Tere Hawaale",
        artist: "Arijit Singh",
        aliases: ["tere hawale", "tere havale", "tera hawaale"],
        lyrics: ["tere hawaale kar diya", "ae dil hai mushkil"]
    },
    {
        name: "Raataan Lambiyan",
        artist: "Jubin Nautiyal",
        aliases: ["ratan lambiyan", "raataan lambian", "raat lambiyan", "raata lambiyan"],
        lyrics: ["raataan lambiyan", "lambi judai"]
    },
    {
        name: "Pasoori",
        artist: "Ali Sethi & Shae Gill",
        aliases: ["pasori", "pasoori song", "psoori", "pasuri"],
        lyrics: ["agg lage basti nu", "saanu vi tu"]
    },
    {
        name: "Apna Bana Le",
        artist: "Arijit Singh",
        aliases: ["apna banale", "apna bana le piya", "apna bnaley"],
        lyrics: ["apna bana le piya", "tu mujhe lena"]
    },
    {
        name: "Agar Tum Saath Ho",
        artist: "Arijit Singh",
        aliases: ["agar tum sath ho", "agar tu saath ho", "agr tum saath ho"],
        lyrics: ["agar tum saath ho", "silsile shuru ho"]
    },
    {
        name: "Maan Meri Jaan",
        artist: "King",
        aliases: ["mann meri jaan", "maan meri jan", "maan meri jaan song"],
        lyrics: ["maan meri jaan", "tu meri jaan"]
    },
    {
        name: "Tujhe Kitna Chahne Lage",
        artist: "Arijit Singh",
        aliases: ["tujhe kitna chahne lage hum", "tujhe kitna chaahne lage", "kitna chahne lage"],
        lyrics: ["tujhe kitna chahne lage hum", "kabir singh song"]
    },

    // Punjabi Hits
    {
        name: "Excuses",
        artist: "AP Dhillon",
        aliases: ["excuse", "excusez", "ap dhillon excuses"],
        lyrics: ["excuses", "brown munde"]
    },
    {
        name: "Brown Munde",
        artist: "AP Dhillon",
        aliases: ["brown munda", "brown mundey", "ap dhillon brown munde"],
        lyrics: ["brown munde", "ap dhillon"]
    },
    {
        name: "Lover",
        artist: "Diljit Dosanjh",
        aliases: ["lover diljit", "loverr", "diljit lover"],
        lyrics: ["lover", "diljit dosanjh"]
    },
    {
        name: "Naina",
        artist: "Diljit Dosanjh",
        aliases: ["naiana", "nainaa", "naina song"],
        lyrics: ["naina", "crew song"]
    },
    {
        name: "Laal Peeli Akhiyaan",
        artist: "Raftaar",
        aliases: ["lal peli akhiyaan", "laal peeli ankhiyan", "red yellow eyes"],
        lyrics: ["laal peeli akhiyaan", "teri meri chemistry"]
    },
    {
        name: "O Maahi",
        artist: "Arijit Singh",
        aliases: ["o mahi", "maahi", "dunki maahi"],
        lyrics: ["o maahi", "o maahi mere"]
    },
    {
        name: "Softly",
        artist: "Karan Aujla",
        aliases: ["softtly", "softly song", "karan aujla softly"],
        lyrics: ["softly softly"]
    },
    {
        name: "Tauba Tauba",
        artist: "Karan Aujla",
        aliases: ["tauba tauba song", "toba toba", "tauba karan aujla"],
        lyrics: ["tauba tauba", "bad newz"]
    },

    // Classic English
    {
        name: "Bohemian Rhapsody",
        artist: "Queen",
        aliases: ["bohemian rapsody", "bohemian rhapsody queen", "bohemiam rhapsody"],
        lyrics: ["is this the real life", "mama just killed a man", "easy come easy go"]
    },
    {
        name: "Hotel California",
        artist: "Eagles",
        aliases: ["hotel california eagles", "hotel califonia", "hotel cali"],
        lyrics: ["welcome to the hotel california", "on a dark desert highway"]
    },
    {
        name: "Stairway to Heaven",
        artist: "Led Zeppelin",
        aliases: ["stairway to heaven led zeppelin", "stairway heaven", "stair way to heaven"],
        lyrics: ["and shes buying a stairway to heaven"]
    },
    {
        name: "Billie Jean",
        artist: "Michael Jackson",
        aliases: ["billy jean", "billie jean mj", "billi jean"],
        lyrics: ["billie jean is not my lover", "the kid is not my son"]
    },
    {
        name: "Thriller",
        artist: "Michael Jackson",
        aliases: ["thriler", "thriller mj", "thiller"],
        lyrics: ["cause this is thriller", "thriller night"]
    },
    {
        name: "Smells Like Teen Spirit",
        artist: "Nirvana",
        aliases: ["smells like teen spirit nirvana", "teen spirit", "smell like teen spirit"],
        lyrics: ["with the lights out", "here we are now entertain us"]
    },

    // Recent Hits 2023-2024
    {
        name: "Flowers",
        artist: "Miley Cyrus",
        aliases: ["flower", "flowers miley", "flowers song"],
        lyrics: ["i can buy myself flowers", "i can love me better"]
    },
    {
        name: "Anti-Hero",
        artist: "Taylor Swift",
        aliases: ["anti hero", "antihero", "taylor swift anti hero"],
        lyrics: ["its me hi im the problem", "im the problem its me"]
    },
    {
        name: "Vampire",
        artist: "Olivia Rodrigo",
        aliases: ["vampier", "olivia rodrigo vampire"],
        lyrics: ["bloodsucker", "you said it was true love"]
    },
    {
        name: "Last Night",
        artist: "Morgan Wallen",
        aliases: ["last night morgan wallen", "lastnight"],
        lyrics: ["last night we let the liquor talk"]
    },
    {
        name: "Calm Down",
        artist: "Rema & Selena Gomez",
        aliases: ["calmdown", "calm down rema", "calm down selena"],
        lyrics: ["baby calm down", "another banger"]
    },
    {
        name: "Creepin",
        artist: "Metro Boomin",
        aliases: ["creeping", "creepin metro boomin", "i been creepin"],
        lyrics: ["i been creepin"]
    },

    // More Bollywood
    {
        name: "Tera Ban Jaunga",
        artist: "Akhil Sachdeva",
        aliases: ["tera ban jaunga kabir singh", "tera ban jaaunga", "tera ban javunga"],
        lyrics: ["tera ban jaunga", "main tera ban jaunga"]
    },
    {
        name: "Bekhayali",
        artist: "Sachet Tandon",
        aliases: ["bekhyali", "bekhayli", "bekhyali kabir singh"],
        lyrics: ["bekhayali mein bhi tera", "kabir singh"]
    },
    {
        name: "Khairiyat",
        artist: "Arijit Singh",
        aliases: ["khairiyat pucho", "khairiat", "chhichhore khairiyat"],
        lyrics: ["khairiyat pucho", "chhichhore song"]
    },
    {
        name: "Shayad",
        artist: "Arijit Singh",
        aliases: ["shayad love aaj kal", "shaayd", "sayad"],
        lyrics: ["shayad", "mujhe pyar ho gaya"]
    },
    {
        name: "Dil Bechara",
        artist: "A.R. Rahman",
        aliases: ["dil bechara title track", "dil bechara song"],
        lyrics: ["dil bechara", "khulke jeene ka"]
    },
    {
        name: "Jo Tum Mere Ho",
        artist: "Anuv Jain",
        aliases: ["jo tu mere ho", "jo tum mere ho anuv jain"],
        lyrics: ["jo tum mere ho", "animal song"]
    },
    {
        name: "Satranga",
        artist: "Arijit Singh",
        aliases: ["satranga animal", "saatranga", "sat ranga"],
        lyrics: ["satranga", "seven colors"]
    },
    {
        name: "Teri Baaton Mein Aisa Uljha Jiya",
        artist: "Raghav & Tanishk",
        aliases: ["teri baton mein", "teri baaton mein", "uljha jiya"],
        lyrics: ["teri baaton mein aisa uljha jiya"]
    },
    {
        name: "Phir Aur Kya Chahiye",
        artist: "Arijit Singh",
        aliases: ["phir aur kya chahie", "fir aur kya chahiye", "zara hatke zara bachke"],
        lyrics: ["phir aur kya chahiye", "zindagi hai haseen"]
    }
];

// Pre-computed search index for faster lookups
export const songNameMap: Map<string, string> = new Map();
export const artistMap: Map<string, string> = new Map();

// Build indexes on module load (runs once, instant)
popularSongs.forEach(song => {
    const normalizedName = song.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    songNameMap.set(normalizedName, song.name);

    // Add all aliases
    song.aliases.forEach(alias => {
        const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        songNameMap.set(normalizedAlias, song.name);
    });

    // Add lyrics mappings
    song.lyrics?.forEach(lyric => {
        const normalizedLyric = lyric.toLowerCase().replace(/[^a-z0-9]/g, '');
        songNameMap.set(normalizedLyric, song.name);
    });

    // Artist mapping
    const normalizedArtist = song.artist.toLowerCase().replace(/[^a-z0-9]/g, '');
    artistMap.set(normalizedArtist, song.artist);
});
