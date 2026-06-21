"use client"
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useMusicData } from '@/context/MusicDataContext';
import { Play, Music, Heart, Mic2, Sparkles, Zap, Crown, TrendingUp, Clock, Disc3, ArrowUpCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SongContextMenu from '@/components/SongContextMenu';
import FeatureDiscoveryCards from '@/components/FeatureDiscoveryCards';
import { fetchWithCache, CACHE_TTL, preloadCriticalData } from '@/lib/apiCache';

// Decode HTML entities
const decodeHtml = (html: string): string => {
  if (!html || typeof window === 'undefined') return html || '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

// Get time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Seeded random shuffle using date - songs change order daily automatically
const getDailySeed = (): number => {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
};

const seededRandom = (seed: number): () => number => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const shuffleWithSeed = <T,>(array: T[], seed: number): T[] => {
  const arr = [...array];
  const random = seededRandom(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function Home() {
  const { playTrack } = usePlayer();
  const { user, userProfile, getUserPlaylists, getRecentPlays } = useAuth();
  const { tier } = useSettings();
  const router = useRouter();
  const { homeData, setHomeData, hasLoadedHome, setHasLoadedHome } = useMusicData();

  const [trending, setTrending] = useState<any[]>(homeData?.trending || []);
  const [newReleases, setNewReleases] = useState<any[]>(homeData?.newReleases || []);
  const [featuredArtists, setFeaturedArtists] = useState<any[]>(homeData?.featuredArtists || []);
  const [bollywoodHits, setBollywoodHits] = useState<any[]>(homeData?.bollywoodHits || []);
  const [topCharts, setTopCharts] = useState<any[]>(homeData?.topCharts || []);
  const [partyMix, setPartyMix] = useState<any[]>(homeData?.partyMix || []);
  const [internationalHits, setInternationalHits] = useState<any[]>(homeData?.internationalHits || []);
  const [globalPop, setGlobalPop] = useState<any[]>(homeData?.globalPop || []);
  const [lastPlayed, setLastPlayed] = useState<any[]>(homeData?.lastPlayed || []);
  const [iconicEnglish, setIconicEnglish] = useState<any[]>(homeData?.iconicEnglish || []);
  const [iconicHindi, setIconicHindi] = useState<any[]>(homeData?.iconicHindi || []);
  const [punjabiHits, setPunjabiHits] = useState<any[]>(homeData?.punjabiHits || []);
  const [topArtists, setTopArtists] = useState<any[]>(homeData?.topArtists || []);
  const [madeForYou, setMadeForYou] = useState<any[]>(homeData?.madeForYou || []);
  const [loading, setLoading] = useState(!hasLoadedHome);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [greeting] = useState(getGreeting());
  const [heroSlide, setHeroSlide] = useState(0);
  const heroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const userName = userProfile?.displayName?.split(' ')[0] || '';
  const isSupreme = tier === 'NITRO_SUPREME' || (tier as string) === 'NITRO_ULTRA';
  const isElite = tier === 'NITRO_ELITE';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        // Fetch listening history from Firebase (user-specific, not server)
        let firebaseHistory: any[] = [];
        if (user) {
          try {
            firebaseHistory = await getRecentPlays(50);
          } catch (err) {
            console.log('Could not fetch Firebase history:', err);
          }
        }

        // Daily rotating keywords for fresh content every day
        const dayOfWeek = new Date().getDay(); // 0-6
        const trendingKeywords = [
          'trending india new 2025',
          'viral hits india bollywood',
          'top chartbusters 2025 hindi',
          'latest bollywood punjabi hits',
          'new release songs india',
          'hot trending music 2025',
          'popular songs india today'
        ][dayOfWeek];

        const partyKeywords = [
          'party anthems bollywood dance',
          'club hits indian remix',
          'dance floor bangers 2025',
          'dj mix bollywood party',
          'bass boosted hindi songs',
          'night party songs indian',
          'groove hits bollywood mashup'
        ][dayOfWeek];

        const englishArtists = [
          'ed sheeran taylor swift dua lipa',
          'imagine dragons coldplay maroon 5',
          'the weeknd bruno mars justin bieber',
          'adele billie eilish ariana grande',
          'post malone drake travis scott',
          'harry styles olivia rodrigo doja cat',
          'sia charlie puth shawn mendes'
        ][dayOfWeek];

        const hindiSongs = [
          'tum hi ho channa mereya gerua',
          'kal ho naa ho kabhi khushi',
          'tujhe dekha to ye jaana sanam',
          'pehla nasha chaiyya chaiyya',
          'lag ja gale tere naam',
          'kesariya brahmastra tu jhoothi',
          'raataan lambiyan shershaah'
        ][dayOfWeek];

        const punjabiArtists = [
          'diljit dosanjh ap dhillon',
          'sidhu moose wala karan aujla',
          'guru randhawa harrdy sandhu',
          'jassi gill jass manak',
          'garry sandhu amrit maan',
          'parmish verma b praak',
          'yo yo honey singh badshah'
        ][dayOfWeek];

        // Use cached fetch for all API calls - dailyKey ensures fresh content each day
        const responses = await Promise.allSettled([
          fetchWithCache(`${apiUrl}/api/modules`, CACHE_TTL.MODULES),
          fetchWithCache(`${apiUrl}/api/search/artists?query=Arijit+Singh+Ar+Rahman+Diljit+Dosanjh+Taylor+Swift+The+Weeknd&limit=15`, CACHE_TTL.SEARCH),
          // Rotating content with dailyKey for fresh songs every day
          fetchWithCache(`${apiUrl}/api/search/songs?query=${encodeURIComponent(trendingKeywords)}&limit=40`, CACHE_TTL.TRENDING, { dailyKey: true }),
          fetchWithCache(`${apiUrl}/api/search/songs?query=${encodeURIComponent(partyKeywords)}&limit=50`, CACHE_TTL.SEARCH, { dailyKey: true }),
          fetchWithCache(`${apiUrl}/api/search/songs?query=billboard+hot+100+western+hits+2025&limit=40`, CACHE_TTL.SEARCH, { dailyKey: true }),
          fetchWithCache(`${apiUrl}/api/search/songs?query=global+pop+superstars+2025&limit=40`, CACHE_TTL.SEARCH, { dailyKey: true }),
          Promise.resolve({ success: true, data: firebaseHistory }), // Firebase history (already fetched)
          fetchWithCache(`${apiUrl}/api/search/songs?query=bollywood+top+romantic+dance+sad+hits+2025&limit=50`, CACHE_TTL.SEARCH, { dailyKey: true }),
          // Iconic English songs - Rotating artists each day
          fetchWithCache(`${apiUrl}/api/search/songs?query=${encodeURIComponent(englishArtists)}&limit=30`, CACHE_TTL.SEARCH, { dailyKey: true }),
          // Iconic Hindi songs - Rotating songs each day
          fetchWithCache(`${apiUrl}/api/search/songs?query=${encodeURIComponent(hindiSongs)}&limit=30`, CACHE_TTL.SEARCH, { dailyKey: true }),
          // Top Artists (combined Hindi + English)
          fetchWithCache(`${apiUrl}/api/search/artists?query=Arijit+Singh+Ed+Sheeran+Taylor+Swift+Atif+Aslam+The+Weeknd+Shreya+Ghoshal+Imagine+Dragons+Pritam+Dua+Lipa+Neha+Kakkar&limit=20`, CACHE_TTL.SEARCH),
          // Punjabi Hits - Rotating artists each day
          fetchWithCache(`${apiUrl}/api/search/songs?query=${encodeURIComponent(punjabiArtists + ' punjabi hits')}&limit=40`, CACHE_TTL.SEARCH, { dailyKey: true })
        ]);

        const data = responses.map((r) => {
          if (r.status === 'fulfilled') {
            return r.value;
          }
          return { success: false };
        });

        const modules = data[0]?.success ? data[0].data : null;

        const getUnique = (songs: any[]) => {
          if (!songs || !Array.isArray(songs)) return [];
          const seen = new Set();
          return songs.filter((song: any) => {
            const id = song.id || song.songId;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        };


        const getDiverse = (songs: any[], limitCount = 12) => {
          const unique = getUnique(songs);
          const diverse: any[] = [];
          const seenImages = new Set<string>();
          const seenNames = new Set<string>(); // Track song names to avoid same song different cover

          // Normalize song name for comparison (lowercase, remove special chars)
          const normalizeName = (name: string) => {
            if (!name) return '';
            return name.toLowerCase()
              .replace(/[^a-z0-9\s]/g, '') // Remove special chars
              .replace(/\s+/g, ' ')        // Normalize spaces
              .trim()
              .substring(0, 30);           // Compare first 30 chars only
          };

          for (const s of unique) {
            const img = getImg(s);
            const name = normalizeName(getName(s));

            // Skip if we've seen this image OR this song name before
            if (seenImages.has(img) || (name && seenNames.has(name))) {
              continue;
            }

            diverse.push(s);
            seenImages.add(img);
            if (name) seenNames.add(name);

            if (diverse.length >= limitCount) break;
          }
          return diverse;
        };

        // Get daily seed for consistent shuffling throughout the day
        const dailySeed = getDailySeed();

        // Helper to shuffle sections for fresh daily content
        const shuffleDaily = <T,>(arr: T[]): T[] => shuffleWithSeed(arr, dailySeed);

        const results = {
          trending: shuffleDaily(getDiverse([...(data[2]?.success ? data[2].data.results : []), ...(modules?.trending?.songs || [])], 15)),
          newReleases: shuffleDaily(modules ? getUnique(modules.albums).slice(0, 12) : []),
          featuredArtists: shuffleDaily(data[1]?.success ? getUnique(data[1].data.results).slice(0, 12) : []),
          bollywoodHits: shuffleDaily(data[7]?.success && data[7].data.results.length > 0
            ? getDiverse(data[7].data.results, 30) // Increased for Romantic moods section
            : (modules ? getDiverse(modules.charts?.[0]?.songs || [], 30) : [])),
          topCharts: modules ? modules.charts : [],
          partyMix: shuffleDaily(data[3]?.success ? getDiverse(data[3].data.results, 15) : []),
          internationalHits: shuffleDaily(data[4]?.success && data[4].data.results.length > 0 ? getDiverse(data[4].data.results, 30) : []), // Increased for Throwback classics
          globalPop: shuffleDaily(data[5]?.success ? getDiverse(data[5].data.results, 15) : []),
          lastPlayed: data[6]?.success && Array.isArray(data[6].data)
            ? data[6].data.map((h: any) => ({
              id: h.songId || h.id,
              name: h.name,
              artist: h.artist,
              image: h.image,
              artists: { primary: [{ name: h.artist }] }, // For compatibility with getArtist helper
              playedAt: h.playedAt
            }))
            : [], // Don't shuffle recently played - keep in order
          iconicEnglish: shuffleDaily(data[8]?.success ? getDiverse(data[8].data.results, 18) : []),
          iconicHindi: shuffleDaily(data[9]?.success ? getDiverse(data[9].data.results, 18) : []),
          topArtists: shuffleDaily(data[10]?.success ? getUnique(data[10].data.results).slice(0, 15) : []),
          // Punjabi hits with fallback - if primary search fails, try combining with Bollywood data
          punjabiHits: (() => {
            const primary = data[11]?.success ? getDiverse(data[11].data.results, 18) : [];
            if (primary.length >= 5) return shuffleDaily(primary);
            // Fallback: Try to extract Punjabi songs from party mix and other sources
            const fallbackSongs = [...(data[3]?.success ? data[3].data.results : []), ...(data[2]?.success ? data[2].data.results : [])]
              .filter((song: any) => {
                const name = (song.name || song.title || '').toLowerCase();
                const artist = (song.artists?.primary?.[0]?.name || song.artist || '').toLowerCase();
                return /diljit|sidhu|ap dhillon|karan aujla|guru randhawa|hardy|harrdy|punjabi|kudiye|nachdi/i.test(name + ' ' + artist);
              });
            return shuffleDaily(getDiverse([...primary, ...fallbackSongs], 18));
          })(),
          madeForYou: [], // Will be populated based on listening history
          lastFetchedAt: Date.now()
        };

        setTrending(results.trending);
        setNewReleases(results.newReleases);
        setFeaturedArtists(results.featuredArtists);
        setBollywoodHits(results.bollywoodHits);
        setTopCharts(results.topCharts);
        setPartyMix(results.partyMix);
        setInternationalHits(results.internationalHits);
        setGlobalPop(results.globalPop);
        setLastPlayed(results.lastPlayed);
        setIconicEnglish(results.iconicEnglish);
        setIconicHindi(results.iconicHindi);
        setPunjabiHits(results.punjabiHits);
        setTopArtists(results.topArtists);

        setHomeData(results);
        setHasLoadedHome(true);

        // Fetch "Made for You" based on listening history - Smarter algorithm
        if (results.lastPlayed.length > 0) {
          try {
            // Extract top artists from play history
            const artistCounts: Record<string, number> = {};
            results.lastPlayed.forEach((s: any) => {
              const artistName = s.artists?.primary?.[0]?.name || (typeof s.artist === 'string' ? s.artist : '');
              if (artistName) {
                artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
              }
            });

            // Get top 5 most played artists
            const topArtistsFromHistory = Object.entries(artistCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name]) => name);

            // Extract possible genres/moods from song names
            const songNames = results.lastPlayed.slice(0, 10).map((s: any) => s.name || s.title || '').join(' ').toLowerCase();
            const hasHindi = /hindi|bollywood|pyar|ishq|dil|tu|tum|main|tere|mera/i.test(songNames);
            const hasPunjabi = /punjabi|desi|bhangra|nachdi|gaana|kudiye/i.test(songNames);
            const hasEnglish = /love|heart|night|dance|party|summer|feel/i.test(songNames);
            const hasSad = /sad|broken|alone|pain|miss|cry/i.test(songNames);

            // Build smarter queries
            const queries: string[] = [];

            // Primary: Top artists
            if (topArtistsFromHistory.length > 0) {
              queries.push(topArtistsFromHistory.slice(0, 2).join(' '));
            }

            // Secondary: Genre/mood based
            if (hasHindi) queries.push('latest hindi bollywood hits 2025');
            if (hasPunjabi) queries.push('punjabi trending songs');
            if (hasEnglish) queries.push('top english pop songs');
            if (hasSad) queries.push('emotional hindi songs');

            // Fallback: Add remaining artists
            if (topArtistsFromHistory.length > 2) {
              queries.push(topArtistsFromHistory.slice(2, 4).join(' '));
            }

            // Fetch from multiple queries and combine results
            const allSuggestions: any[] = [];
            const playedIds = new Set(results.lastPlayed.map((s: any) => String(s.id || s.songId)));

            for (const query of queries.slice(0, 3)) {
              try {
                const mfyRes = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(query)}&limit=15`);
                const mfyData = await mfyRes.json();
                if (mfyData.success && mfyData.data?.results) {
                  mfyData.data.results.forEach((song: any) => {
                    if (!playedIds.has(String(song.id)) && !allSuggestions.find(s => s.id === song.id)) {
                      allSuggestions.push(song);
                    }
                  });
                }
              } catch (e) {
                // Continue with other queries
              }
            }

            // Shuffle using daily seed for fresh but consistent content
            const shuffled = shuffleWithSeed(allSuggestions, dailySeed);
            setMadeForYou(getDiverse(shuffled, 15));
          } catch (err) {
            console.log('Could not fetch made for you:', err);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const fetchPlaylists = async () => {
      if (!user) return;
      try {
        const plist = await getUserPlaylists();
        setUserPlaylists(plist);
      } catch (e) { }
    };

    const thirtyMinutes = 30 * 60 * 1000;
    const isStale = homeData && homeData.lastFetchedAt && (Date.now() - homeData.lastFetchedAt > thirtyMinutes);

    if (!hasLoadedHome || isStale) {
      fetchData();
    } else {
      setLoading(false);
    }

    if (user) fetchPlaylists();
  }, [hasLoadedHome, homeData, setHomeData, setHasLoadedHome, user, getUserPlaylists, getRecentPlays]);

  // Hero slider auto-rotation for PC only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    // Auto-rotate hero slides every 5 seconds
    heroIntervalRef.current = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % Math.max(1, trending.length > 0 ? Math.min(5, trending.length) : 1));
    }, 5000);

    return () => {
      if (heroIntervalRef.current) clearInterval(heroIntervalRef.current);
    };
  }, [trending.length]);

  // Helpers
  const getImg = useCallback((t: any): string => {
    if (!t) return '';
    if (t.image && Array.isArray(t.image) && t.image.length) {
      const img = t.image.find((i: any) => i.quality === '500x500') || t.image[t.image.length - 1];
      return img?.url || img?.link || '';
    }
    if (typeof t.image === 'string') return t.image;
    return '';
  }, []);

  const getName = useCallback((t: any): string => decodeHtml(t?.name || t?.title || ''), []);

  const getArtist = useCallback((t: any): string => {
    if (!t) return '';
    if (t.artists && t.artists.primary && t.artists.primary.length) {
      return decodeHtml(t.artists.primary.map((a: any) => a.name).join(', '));
    }
    if (typeof t.artist === 'string') return decodeHtml(t.artist);
    return 'Various Artists';
  }, []);

  // Quick access for signed-in users - shows most listened songs (sorted by play count)
  const quickAccess = useMemo(() => {
    const items: any[] = [];
    if (user) {
      items.push({ id: 'liked', type: 'liked', name: 'Liked Songs', route: '/profile' });
    }
    // Sort by playCount if available, otherwise just use lastPlayed order
    const sortedByPlays = [...lastPlayed].sort((a, b) => (b.playCount || 1) - (a.playCount || 1));
    sortedByPlays.slice(0, user ? 5 : 6).forEach((song: any) => {
      items.push({ id: song.id || song.songId, type: 'song', name: getName(song), image: getImg(song), data: song });
    });
    return items.slice(0, 6);
  }, [user, lastPlayed, getName, getImg]);

  // Nitro Mixes (unique to our app) - based on user's listening history
  const nitroMixes = useMemo(() => {
    if (!user) return [];

    // Sort by play count for most listened
    const mostListened = [...lastPlayed].sort((a, b) => (b.playCount || 1) - (a.playCount || 1));

    return [
      { id: 'nm1', name: 'Your Top Picks', desc: 'Songs you love most', songs: mostListened.slice(0, 10), gradient: 'from-cyan-500 via-blue-600 to-purple-600' },
      { id: 'nm2', name: 'Play Again', desc: 'Revisit your favorites', songs: lastPlayed.slice(0, 10), gradient: 'from-green-500 via-emerald-600 to-teal-600' },
      { id: 'nm3', name: 'Bollywood Pulse', desc: 'Desi beats curated', songs: bollywoodHits.slice(0, 10), gradient: 'from-orange-500 via-pink-600 to-red-600' },
      { id: 'nm4', name: 'Global Wave', desc: 'International vibes', songs: internationalHits.slice(0, 10), gradient: 'from-emerald-500 via-teal-600 to-cyan-600' },
      { id: 'nm5', name: 'Party Mode', desc: 'Turn it up', songs: partyMix.slice(0, 10), gradient: 'from-purple-500 via-pink-600 to-red-500' },
      { id: 'nm6', name: 'Chill Zone', desc: 'Relax & unwind', songs: globalPop.slice(0, 10), gradient: 'from-blue-500 via-indigo-600 to-purple-600' },
    ].filter(m => m.songs.length >= 3);
  }, [user, lastPlayed, bollywoodHits, internationalHits, partyMix, globalPop]);


  if (loading) {
    // Use skeleton loader for better perceived performance
    return (
      <div className="min-h-screen bg-[var(--background)] pb-32">
        <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 max-w-[1600px] mx-auto space-y-6 md:space-y-8">
          {/* Greeting skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 rounded bg-[var(--card)] animate-pulse" />
            <div className="h-4 w-24 rounded bg-[var(--card)] animate-pulse" />
          </div>

          {/* Quick Access skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-xl h-14 md:h-16 border border-[var(--border)]">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[var(--background)] animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-[var(--background)] animate-pulse" />
              </div>
            ))}
          </div>

          {/* Hero skeleton - Desktop only */}
          <div className="hidden md:block w-full h-[280px] lg:h-[340px] rounded-3xl bg-[var(--card)] border border-[var(--border)] animate-pulse" />

          {/* Song sections skeleton */}
          {[...Array(3)].map((_, sectionIdx) => (
            <section key={sectionIdx}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 rounded bg-[var(--card)] animate-pulse" />
                <div className="h-5 w-32 rounded bg-[var(--card)] animate-pulse" />
              </div>
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-[115px] md:w-[140px] flex-shrink-0">
                    <div className="aspect-square rounded-lg bg-[var(--card)] animate-pulse" />
                    <div className="h-3 mt-2 rounded bg-[var(--card)] animate-pulse" />
                    <div className="h-2 mt-1 w-2/3 rounded bg-[var(--card)] animate-pulse" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-32">
      <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 max-w-[1600px] mx-auto space-y-6 md:space-y-8">

        {/* Greeting Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              {greeting}{userName ? `, ${userName}` : ''}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[var(--foreground-muted)]" />
            <span className="text-xs text-[var(--foreground-muted)]">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Quick Access Grid - More Compact */}
        {quickAccess.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {quickAccess.map((item, idx) => (
              <div
                key={`qa-${item.id}-${idx}`}
                onClick={() => item.type === 'liked' ? router.push(item.route) : item.data && playTrack(item.data, lastPlayed)}
                className="group flex items-center gap-2 p-2 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-xl cursor-pointer transition-all border border-[var(--border)] active:scale-[0.98] h-14 md:h-16"
              >
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--background-tertiary)] shadow-sm">
                  {item.type === 'liked' ? (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                      <Heart size={16} fill="white" className="text-white" />
                    </div>
                  ) : item.image ? (
                    <img src={item.image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={16} className="text-[var(--foreground-muted)]" />
                    </div>
                  )}
                </div>
                <span className="flex-1 font-bold text-[9px] md:text-[10px] text-[var(--foreground)] truncate pr-1 uppercase tracking-tight">{item.name}</span>
                <div className="w-7 h-7 bg-cyan-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-cyan-500/30 flex-shrink-0 mr-1">
                  <Play size={12} fill="black" className="ml-0.5 text-black" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature Discovery Cards - For New Users */}
        <FeatureDiscoveryCards />

        {/* Hero Slider - Desktop Only */}
        {trending.length >= 3 && (
          <div className="hidden md:block relative w-full h-[280px] lg:h-[340px] rounded-3xl overflow-hidden bg-[var(--card)] border border-[var(--border)]">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={getImg(trending[heroSlide])}
                className="w-full h-full object-cover transition-all duration-700"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center h-full px-10 lg:px-16">
              <div className="max-w-[50%]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-3">Trending Now</div>
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight leading-[1.05] line-clamp-2">
                  {getName(trending[heroSlide])}
                </h2>
                <p className="text-base text-white/60 mb-6">{getArtist(trending[heroSlide])}</p>
                <button
                  onClick={() => playTrack(trending[heroSlide], trending)}
                  className="px-8 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-semibold rounded-full flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-95"
                >
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                  Play Now
                </button>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {trending.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${heroSlide === idx ? 'bg-cyan-400 w-6' : 'bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <button
              onClick={() => setHeroSlide(prev => prev === 0 ? Math.min(4, trending.length - 1) : prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setHeroSlide(prev => (prev + 1) % Math.min(5, trending.length))}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Made for You - Premium Personalized Section */}
        {user && madeForYou.length > 0 && (
          <section className="relative">
            {/* Premium gradient background */}
            <div className="absolute inset-0 -mx-4 md:-mx-12 bg-gradient-to-br from-purple-500/5 via-cyan-500/5 to-pink-500/5 rounded-3xl blur-xl -z-10" />

            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">
                    Made for {userName || 'You'}
                  </h2>
                  <p className="text-[10px] md:text-xs text-[var(--foreground-muted)]">
                    Fresh picks just for you • Updated daily ✨
                  </p>
                </div>
              </div>
            </div>

            {/* Premium song cards with larger images */}
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
              {madeForYou.slice(0, 15).map((song: any, idx: number) => (
                <div
                  key={`mfy-${song.id || idx}`}
                  onClick={() => playTrack(song, madeForYou)}
                  className="group cursor-pointer w-[130px] md:w-[160px] flex-shrink-0 snap-start"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl mb-2.5 ring-1 ring-white/5">
                    <img
                      src={getImg(song)}
                      alt={getName(song)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Play button on hover */}
                    <button className="absolute bottom-3 right-3 w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all">
                      <Play size={18} fill="black" className="ml-0.5 text-black" />
                    </button>
                    {/* 3-dots Context Menu */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                      <SongContextMenu song={song} queue={madeForYou} />
                    </div>
                    {/* Recommendation reason badge */}
                    {idx < 6 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full">
                        <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider">
                          {idx < 2 ? '🔥 Hot Pick' : idx < 4 ? '✨ For You' : '🎵 Similar'}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-[var(--foreground)] truncate group-hover:text-cyan-400 transition-colors">{getName(song)}</h3>
                  <p className="text-[10px] md:text-xs text-[var(--foreground-muted)] truncate">{getArtist(song)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nitro Mixes - Unique to our app (curated playlists) */}
        {user && nitroMixes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-purple-400" />
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Nitro Mixes</h2>
              </div>
              <button onClick={() => router.push('/playlists')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {nitroMixes.map((mix) => (
                <div
                  key={mix.id}
                  onClick={() => mix.songs[0] && playTrack(mix.songs[0], mix.songs)}
                  className="group cursor-pointer w-[110px] md:w-[140px] flex-shrink-0"
                >
                  <div className={`relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${mix.gradient} shadow-xl mb-3`}>
                    {/* 4-image grid */}
                    <div className="absolute inset-0 grid grid-cols-2 opacity-60">
                      {mix.songs.slice(0, 4).map((song: any, i: number) => (
                        <div key={i} className="overflow-hidden">
                          {getImg(song) && <img src={getImg(song)} className="w-full h-full object-cover" alt="" />}
                        </div>
                      ))}
                    </div>
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {/* Content */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-white text-sm drop-shadow-lg">{mix.name}</h3>
                      <p className="text-[10px] text-white/70">{mix.desc}</p>
                    </div>
                    {/* Play button */}
                    <button className="absolute top-3 right-3 w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all">
                      <Play size={18} fill="black" className="ml-0.5 text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Played - Sleek Compact Design */}
        {user && lastPlayed.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-cyan-400" />
                <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] tracking-tight">Recently played</h2>
              </div>
              <button
                onClick={() => router.push('/recent')}
                className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-400/10 px-3 py-1.5 rounded-full"
              >
                See all
                <ChevronRight size={14} />
              </button>
            </div>

            {/* 2-Row Ultra-Compact Grid */}
            <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 md:-mx-0 md:px-0 scroll-smooth">
              <div className="grid grid-rows-2 grid-flow-col gap-x-3 gap-y-2">
                {lastPlayed.slice(0, 20).map((song: any, idx: number) => (
                  <RecentSongCard
                    key={`rp-${song.id || song.songId || idx}`}
                    song={song}
                    queue={lastPlayed}
                    getImg={getImg}
                    getName={getName}
                    getArtist={getArtist}
                    playTrack={playTrack}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trending Now */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-pink-400" />
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Trending now</h2>
            </div>
            <button onClick={() => router.push('/section?title=trending+now&q=trending+viral+hits+2025')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {trending.slice(0, 20).map((song: any, idx: number) => (
              <SongCard key={`tr-${song.id || song.songId || idx}`} song={song} queue={trending} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
            ))}
          </div>
        </section>

        {/* Plans Advertisement Section — removed under the binary access model */}
        {false && (
          <section className="mb-10 px-1">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={18} className="text-amber-400" />
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Upgrade your experience</h2>
            </div>

            {/* Mobile: Single Elite Card */}
            <div className="md:hidden">
              <div
                onClick={() => router.push('/upgrade')}
                className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40 rounded-2xl p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <Zap size={50} className="text-purple-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={18} className="text-purple-400" />
                  <h3 className="text-lg font-bold text-purple-400">Nitro Elite</h3>
                  <span className="text-[9px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">POPULAR</span>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mb-3">Unlock 3D Audio, HD Streaming, and more</p>
                <ul className="space-y-1.5 mb-4">
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-purple-400">✓</span> 3D Spatial Audio</li>
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-purple-400">✓</span> No Ads</li>
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-purple-400">✓</span> Unlimited Audio FX</li>
                </ul>
                <button className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2">
                  <ArrowUpCircle size={16} />
                  View All Plans
                </button>
              </div>
            </div>

            {/* Desktop: All 3 Cards */}
            <div className="hidden md:grid md:grid-cols-3 gap-4" onClick={() => router.push('/upgrade')}>
              {/* Nitro Core */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 relative overflow-hidden group cursor-default">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Music size={40} />
                </div>
                <h3 className="text-lg font-bold text-zinc-400 mb-1">Nitro Core</h3>
                <p className="text-xs text-[var(--foreground-muted)] mb-4 font-medium uppercase tracking-wider">The Standard</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]"><span className="text-zinc-500">✓</span> Standard Audio</li>
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]"><span className="text-zinc-500">✓</span> Ad-Supported</li>
                </ul>
                <div className="w-full py-2 bg-zinc-500/10 rounded-lg text-center text-xs font-bold text-zinc-400">Current Plan</div>
              </div>

              {/* Nitro Elite */}
              <div className="bg-[var(--card)] border border-purple-500/30 rounded-2xl p-5 relative overflow-hidden group cursor-pointer hover:border-purple-500 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Zap size={40} className="text-purple-500" />
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                <h3 className="text-lg font-bold text-purple-400 mb-1">Nitro Elite</h3>
                <p className="text-xs text-[var(--foreground-muted)] mb-4 font-medium uppercase tracking-wider">Most Popular</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-purple-400">✓</span> 3D Spatial Audio</li>
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-purple-400">✓</span> No Ads</li>
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-purple-400">✓</span> HD Streaming</li>
                </ul>
                <button className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-center text-xs font-bold transition-colors shadow-lg shadow-purple-500/20">Upgrade</button>
              </div>

              {/* Nitro Supreme */}
              <div className="bg-[var(--card)] border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden group cursor-pointer hover:border-amber-500 transition-colors md:col-span-1">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Crown size={40} className="text-amber-500" />
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                <h3 className="text-lg font-bold text-amber-400 mb-1">Nitro Supreme</h3>
                <p className="text-xs text-[var(--foreground-muted)] mb-4 font-medium uppercase tracking-wider">Ultimate Access</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-amber-400">✓</span> Everything in Elite</li>
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-amber-400">✓</span> Lossless Audio</li>
                  <li className="flex items-center gap-2 text-xs text-[var(--foreground)]"><span className="text-amber-400">✓</span> Offline Downloads</li>
                </ul>
                <button className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white rounded-lg text-center text-xs font-bold transition-opacity shadow-lg shadow-amber-500/20">Go Supreme</button>
              </div>
            </div>
          </section>
        )}

        {/* Popular Artists - Circular */}
        {featuredArtists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mic2 size={16} className="text-purple-400" />
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Popular artists</h2>
              </div>
              <button onClick={() => router.push('/section?title=popular+artists&q=top+indian+western+artists+singers+2025')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {featuredArtists.slice(0, 10).map((artist: any, idx: number) => (
                <div
                  key={`art-${artist.id || idx}`}
                  onClick={() => router.push(`/artist/${artist.id}`)}
                  className="group cursor-pointer w-[90px] md:w-[110px] flex flex-col items-center flex-shrink-0"
                >
                  <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden bg-[var(--card)] shadow-lg ring-2 ring-transparent group-hover:ring-cyan-400 transition-all mb-2">
                    {getImg(artist) ? (
                      <img src={getImg(artist)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--background-tertiary)]">
                        <Mic2 size={20} className="text-[var(--foreground-muted)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={18} fill="white" className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-[10px] md:text-xs text-[var(--foreground)] truncate w-full text-center">{getName(artist)}</h3>
                  <p className="text-[9px] text-[var(--foreground-muted)]">Artist</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Releases */}
        {newReleases.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Disc3 size={16} className="text-emerald-400" />
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">New releases</h2>
              </div>
              <button onClick={() => router.push('/section?title=new+releases&q=new+releases+2025')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {newReleases.slice(0, 20).map((album: any, idx: number) => (
                <div
                  key={`nr-${album.id || idx}`}
                  onClick={() => router.push(`/album/${album.id}`)}
                  className="group cursor-pointer w-[115px] md:w-[140px] flex-shrink-0"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-[var(--card)] shadow-md mb-2 border border-[var(--border)]">
                    {getImg(album) ? (
                      <img src={getImg(album)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--background-tertiary)]">
                        <Music size={24} className="text-[var(--foreground-muted)]" />
                      </div>
                    )}
                    <button className="absolute bottom-1.5 right-1.5 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                      <Play size={14} fill="black" className="ml-0.5 text-black" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-[11px] md:text-xs text-[var(--foreground)] truncate">{getName(album)}</h3>
                  <p className="text-[9px] md:text-[10px] text-[var(--foreground-muted)]">Album</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bollywood Hits */}
        {bollywoodHits.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Bollywood hits</h2>
              <button onClick={() => router.push('/section?title=bollywood+hits&q=bollywood+hits+2025')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {bollywoodHits.slice(0, 20).map((song: any, idx: number) => (
                <SongCard key={`bw-${song.id || song.songId || idx}`} song={song} queue={bollywoodHits} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}


        {/* Timeless English Classics - Gradient Background */}
        {iconicEnglish.length > 0 && (
          <section className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-6 rounded-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">🌍</span>
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Timeless english classics</h2>
              </div>
              <button onClick={() => router.push('/section?title=english+classics&q=believer+shape+of+you+love+me+like+you+do+counting+stars+someone+like+you')} className="text-xs font-medium text-emerald-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar">
              {iconicEnglish.slice(0, 15).map((song: any, idx: number) => (
                <SongCard key={`ie-${song.id || song.songId || idx}`} song={song} queue={iconicEnglish} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Legendary Hindi Songs */}
        {iconicHindi.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">🎭</span>
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Legendary hindi songs</h2>
              </div>
              <button onClick={() => router.push('/section?title=legendary+hindi&q=tum+hi+ho+kal+ho+naa+ho+kabhi+khushi+channa+mereya+gerua')} className="text-xs font-medium text-orange-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {iconicHindi.slice(0, 15).map((song: any, idx: number) => (
                <SongCard key={`hl-${song.id || song.songId || idx}`} song={song} queue={iconicHindi} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Punjabi Hits - Trending Punjabi Songs */}
        {punjabiHits.length > 0 && (
          <section className="bg-gradient-to-r from-yellow-500/5 via-amber-500/5 to-orange-500/5 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-6 rounded-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">🎤</span>
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Punjabi hits</h2>
              </div>
              <button onClick={() => router.push('/section?title=punjabi+hits&q=diljit+dosanjh+sidhu+moose+wala+ap+dhillon+karan+aujla+guru+randhawa')} className="text-xs font-medium text-amber-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar">
              {punjabiHits.slice(0, 15).map((song: any, idx: number) => (
                <SongCard key={`pj-${song.id || song.songId || idx}`} song={song} queue={punjabiHits} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Top Artists - Hindi & English Combined */}
        {topArtists.length > 0 && (
          <section className="bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-rose-500/5 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-6 rounded-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-purple-400" />
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Top artists worldwide</h2>
              </div>
              <button onClick={() => router.push('/section?title=top+artists&q=arijit+singh+ed+sheeran+taylor+swift+the+weeknd+shreya+ghoshal')} className="text-xs font-medium text-purple-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 no-scrollbar">
              {topArtists.map((artist: any, idx: number) => (
                <div
                  key={`ta-${artist.id || idx}`}
                  onClick={() => router.push(`/artist/${artist.id}`)}
                  className="group cursor-pointer w-[90px] md:w-[110px] flex flex-col items-center flex-shrink-0"
                >
                  <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden bg-[var(--card)] shadow-lg ring-2 ring-transparent group-hover:ring-purple-400 transition-all mb-2">
                    {getImg(artist) ? (
                      <img src={getImg(artist)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--background-tertiary)]">
                        <Mic2 size={20} className="text-[var(--foreground-muted)]" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-[10px] md:text-xs text-[var(--foreground)] truncate text-center w-full">{getName(artist)}</h3>
                  <p className="text-[8px] md:text-[9px] text-purple-400 font-medium">Artist</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {user && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Your playlists</h2>
              <button onClick={() => router.push('/playlists')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {/* Liked Songs */}
              <div
                onClick={() => router.push('/profile')}
                className="group cursor-pointer w-[115px] md:w-[140px] flex-shrink-0"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 shadow-md mb-2 flex items-center justify-center">
                  <Heart size={28} fill="white" className="text-white drop-shadow-lg" />
                  <button className="absolute bottom-1.5 right-1.5 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    <Play size={14} fill="black" className="ml-0.5 text-black" />
                  </button>
                </div>
                <h3 className="font-semibold text-[11px] md:text-xs text-[var(--foreground)] truncate">Liked Songs</h3>
                <p className="text-[9px] md:text-[10px] text-[var(--foreground-muted)]">Playlist</p>
              </div>

              {userPlaylists.slice(0, 5).map((playlist: any) => (
                <div
                  key={playlist.id}
                  onClick={() => router.push(`/playlist/${playlist.id}`)}
                  className="group cursor-pointer w-[115px] md:w-[140px] flex-shrink-0"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-[var(--card)] shadow-md mb-2 border border-[var(--border)]">
                    {playlist.coverImage ? (
                      <img src={playlist.coverImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--background-tertiary)]">
                        <Music size={24} className="text-[var(--foreground-muted)]" />
                      </div>
                    )}
                    <button className="absolute bottom-1.5 right-1.5 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                      <Play size={14} fill="black" className="ml-0.5 text-black" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-[11px] md:text-xs text-[var(--foreground)] truncate">{playlist.name}</h3>
                  <p className="text-[9px] md:text-[10px] text-[var(--foreground-muted)]">{playlist.songs?.length || 0} songs</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* International Hits */}
        {internationalHits.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">International hits</h2>
              <button onClick={() => router.push('/section?title=international+hits&q=billboard+hot+100+international+hits+2025')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {internationalHits.slice(0, 20).map((song: any, idx: number) => (
                <SongCard key={`ih-${song.id || song.songId || idx}`} song={song} queue={internationalHits} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Party Mix */}
        {partyMix.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Party mix</h2>
              <button onClick={() => router.push('/section?title=party+mix&q=party+mix+dance+hits+2025')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {partyMix.slice(0, 20).map((song: any, idx: number) => (
                <SongCard key={`pm-${song.id || song.songId || idx}`} song={song} queue={partyMix} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Chill Vibes Section - Muted Aesthetic */}
        {globalPop.length > 0 && (
          <section className="bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-6 rounded-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">☾</span>
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Chill vibes</h2>
              </div>
              <button onClick={() => router.push('/section?title=chill+vibes&q=chill+vibes+lofi+relaxing+2025')} className="text-xs font-medium text-blue-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar">
              {globalPop.slice(0, 20).map((song: any, idx: number) => (
                <SongCard key={`cv-${song.id || song.songId || idx}`} song={song} queue={globalPop} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Workout Beats - Energetic */}
        {partyMix.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">🔥</span>
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Workout beats</h2>
              </div>
              <button onClick={() => router.push('/section?title=workout+beats&q=workout+gym+motivation+beats+2025')} className="text-xs font-medium text-orange-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {trending.slice(10, 30).map((song: any, idx: number) => (
                <SongCard key={`wb-${song.id || song.songId || idx}`} song={song} queue={trending} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Romantic Moods - Pink/Red theme */}
        {bollywoodHits.length > 0 && (
          <section className="bg-gradient-to-r from-rose-500/5 via-pink-500/5 to-red-500/5 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-6 rounded-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-rose-400" />
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Romantic moods</h2>
              </div>
              <button onClick={() => router.push('/section?title=romantic+moods&q=romantic+love+songs+2025')} className="text-xs font-medium text-rose-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar">
              {bollywoodHits.slice(10, 30).map((song: any, idx: number) => (
                <SongCard key={`rm-${song.id || song.songId || idx}`} song={song} queue={bollywoodHits} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Throwback Classics */}
        {topCharts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Disc3 size={16} className="text-amber-400" />
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Throwback classics</h2>
              </div>
              <button onClick={() => router.push('/section?title=throwback+classics&q=90s+2000s+classics+throwback+hits')} className="text-xs font-medium text-amber-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {internationalHits.slice(10, 30).map((song: any, idx: number) => (
                <SongCard key={`tc-${song.id || song.songId || idx}`} song={song} queue={topCharts} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        <footer className="pt-12 pb-8 border-t border-[var(--border)]">
          <div className="flex flex-col items-center gap-3">
            <img src="/logo.png" className="w-10 h-10 rounded-xl shadow-lg" alt="Nitro" />
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--foreground)]">Nitro <span className="text-[10px] font-medium text-[var(--foreground-muted)]">by ipro</span></p>
              <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mt-1">Defining the future of premium sound</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Reusable Song Card Component
function SongCard({ song, queue, getImg, getName, getArtist, playTrack }: { song: any, queue: any[], getImg: (t: any) => string, getName: (t: any) => string, getArtist: (t: any) => string, playTrack: (song: any, queue: any[]) => void }) {
  return (
    <div
      onClick={() => playTrack(song, queue)}
      className="group cursor-pointer w-[115px] md:w-[145px] flex-shrink-0"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-[var(--card)] shadow-md mb-2 border border-[var(--border)]">
        {getImg(song) ? (
          <img src={getImg(song)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={getName(song)} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--background-tertiary)]">
            <Music size={24} className="text-[var(--foreground-muted)]" />
          </div>
        )}
        {/* Cyan Play Button - Nitro Style */}
        <button className="absolute bottom-1.5 right-1.5 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-cyan-300 active:scale-95">
          <Play size={14} fill="black" className="ml-0.5 text-black" />
        </button>
        {/* Context Menu */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
          <SongContextMenu song={song} queue={queue} />
        </div>
      </div>
      <h3 className="font-semibold text-xs md:text-[13px] text-[var(--foreground)] truncate leading-snug">{getName(song)}</h3>
      <p className="text-[11px] md:text-xs text-[var(--foreground-muted)] truncate mt-0.5">{getArtist(song)}</p>
    </div>
  );
}
// Compact Song Card for Recently Played
function RecentSongCard({ song, queue, getImg, getName, getArtist, playTrack }: { song: any, queue: any[], getImg: (t: any) => string, getName: (t: any) => string, getArtist: (t: any) => string, playTrack: (song: any, queue: any[]) => void }) {
  return (
    <div
      onClick={() => playTrack(song, queue)}
      className="group flex items-center gap-2.5 p-1.5 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-xl cursor-pointer transition-all border border-[var(--border)] active:scale-[0.98] w-[200px] md:w-[240px] h-12 md:h-14 shrink-0 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 relative"
    >
      <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg overflow-hidden shrink-0 shadow-sm relative">
        {getImg(song) ? (
          <img src={getImg(song)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--background-tertiary)]">
            <Music size={16} className="text-[var(--foreground-muted)]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <h3 className="font-medium text-xs md:text-[13px] text-[var(--foreground)] truncate leading-snug">{getName(song)}</h3>
        <p className="text-[10px] md:text-[11px] text-[var(--foreground-muted)] truncate mt-0.5">{getArtist(song)}</p>
      </div>
      {/* 3-dots Context Menu */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
        <SongContextMenu song={song} queue={queue} />
      </div>
      {/* Play button on hover */}
      <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0 shadow-lg shadow-cyan-500/20">
        <Play size={10} fill="black" className="ml-0.5 text-black" />
      </div>
    </div>
  );
}
