"use client"
import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useMusicData } from '@/context/MusicDataContext';
import { Play, Music, Heart, Mic2, Sparkles, Zap, Crown, TrendingUp, Clock, Disc3, ArrowUpCircle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SongContextMenu from '@/components/SongContextMenu';

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

export default function Home() {
  const { playTrack } = usePlayer();
  const { user, userProfile, getUserPlaylists } = useAuth();
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
  const [loading, setLoading] = useState(!hasLoadedHome);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [greeting] = useState(getGreeting());

  const userName = userProfile?.displayName?.split(' ')[0] || '';
  const isSupreme = tier === 'NITRO_SUPREME' || (tier as string) === 'NITRO_ULTRA';
  const isElite = tier === 'NITRO_ELITE';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const responses = await Promise.allSettled([
          fetch(`${apiUrl}/api/modules`),
          fetch(`${apiUrl}/api/search/artists?query=Arijit+Singh+Ar+Rahman+Diljit+Dosanjh+Taylor+Swift+The+Weeknd&limit=15`),
          fetch(`${apiUrl}/api/search/songs?query=latest+instagram+reels+trending+viral+hits+2025&limit=30`),
          fetch(`${apiUrl}/api/search/songs?query=latest+party+anthems+bollywood+hollywood+mashup+2025&limit=50`),
          fetch(`${apiUrl}/api/search/songs?query=billboard+hot+100+western+hits+2025&limit=40`),
          fetch(`${apiUrl}/api/search/songs?query=global+pop+superstars+2025&limit=40`),
          fetch(`${apiUrl}/api/history`),
          fetch(`${apiUrl}/api/search/songs?query=bollywood+top+romantic+dance+sad+hits+2025&limit=50`)
        ]);

        const data = await Promise.all(responses.map(async (r, i) => {
          if (r.status === 'fulfilled') {
            try {
              return await r.value.json();
            } catch (err) {
              return { success: false };
            }
          }
          return { success: false };
        }));

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
          const imgCounts = new Map<string, number>();

          for (const s of unique) {
            const img = getImg(s);
            const count = imgCounts.get(img) || 0;
            if (count < 2) { // Allow max 2 songs with same image to keep diversity
              diverse.push(s);
              imgCounts.set(img, count + 1);
            }
            if (diverse.length >= limitCount) break;
          }
          return diverse;
        };

        const results = {
          trending: getDiverse([...(data[2]?.success ? data[2].data.results : []), ...(modules?.trending?.songs || [])], 12),
          newReleases: modules ? getUnique(modules.albums).slice(0, 10) : [],
          featuredArtists: data[1]?.success ? getUnique(data[1].data.results).slice(0, 10) : [],
          bollywoodHits: data[7]?.success && data[7].data.results.length > 0
            ? getDiverse(data[7].data.results, 12)
            : (modules ? getDiverse(modules.charts?.[0]?.songs || [], 12) : []),
          topCharts: modules ? modules.charts : [],
          partyMix: data[3]?.success ? getDiverse(data[3].data.results, 12) : [],
          internationalHits: data[4]?.success && data[4].data.results.length > 0 ? getDiverse(data[4].data.results, 12) : [],
          globalPop: data[5]?.success ? getDiverse(data[5].data.results, 12) : [],
          lastPlayed: data[6]?.success ? data[6].data : [],
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

        setHomeData(results);
        setHasLoadedHome(true);
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
  }, [hasLoadedHome, homeData, setHomeData, setHasLoadedHome, user, getUserPlaylists]);

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

  // Quick access for signed-in users
  const quickAccess = useMemo(() => {
    const items: any[] = [];
    if (user) {
      items.push({ id: 'liked', type: 'liked', name: 'Liked Songs', route: '/profile' });
    }
    lastPlayed.slice(0, user ? 5 : 6).forEach((song: any) => {
      items.push({ id: song.id || song.songId, type: 'song', name: getName(song), image: getImg(song), data: song });
    });
    return items.slice(0, 6);
  }, [user, lastPlayed, getName, getImg]);

  // Nitro Mixes (unique to our app)
  const nitroMixes = useMemo(() => {
    if (!user) return [];
    return [
      { id: 'nm1', name: 'Nitro Flow', desc: 'Your sonic signature', songs: lastPlayed.slice(0, 6), gradient: 'from-cyan-500 via-blue-600 to-purple-600' },
      { id: 'nm2', name: 'Bollywood Pulse', desc: 'Desi beats curated', songs: bollywoodHits.slice(0, 6), gradient: 'from-orange-500 via-pink-600 to-red-600' },
      { id: 'nm3', name: 'Global Wave', desc: 'International vibes', songs: internationalHits.slice(0, 6), gradient: 'from-emerald-500 via-teal-600 to-cyan-600' },
      { id: 'nm4', name: 'Party Mode', desc: 'Turn it up', songs: partyMix.slice(0, 6), gradient: 'from-purple-500 via-pink-600 to-red-500' },
      { id: 'nm5', name: 'Chill Zone', desc: 'Relax & unwind', songs: globalPop.slice(0, 6), gradient: 'from-blue-500 via-indigo-600 to-purple-600' },
    ].filter(m => m.songs.length >= 3);
  }, [user, lastPlayed, bollywoodHits, internationalHits, partyMix, globalPop]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[var(--background)]">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-cyan-400/30 rounded-full animate-spin border-t-cyan-400"></div>
          <Zap className="absolute inset-0 m-auto w-5 h-5 text-cyan-400 animate-pulse" />
        </div>
        <p className="text-[var(--foreground-muted)] text-sm font-medium">Loading your music...</p>
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
            {user && (isSupreme || isElite) && (
              <div className="flex items-center gap-1.5 mt-1">
                <Crown size={12} className={isSupreme ? 'text-amber-400' : 'text-purple-400'} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSupreme ? 'text-amber-400' : 'text-purple-400'}`}>
                  {isSupreme ? 'Supreme' : 'Elite'} Member
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[var(--foreground-muted)]" />
            <span className="text-xs text-[var(--foreground-muted)]">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Quick Access Grid - Mobile: 2x3, Desktop: 3x2 */}
        {quickAccess.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {quickAccess.map((item, idx) => (
              <div
                key={`qa-${item.id}-${idx}`}
                onClick={() => item.type === 'liked' ? router.push(item.route) : item.data && playTrack(item.data, lastPlayed)}
                className="group flex items-center gap-3 p-2 md:p-3 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-xl cursor-pointer transition-all border border-[var(--border)] active:scale-[0.98]"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--background-tertiary)]">
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
                <span className="flex-1 font-semibold text-xs md:text-sm text-[var(--foreground)] truncate">{item.name}</span>
                <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-cyan-500/30 flex-shrink-0">
                  <Play size={14} fill="black" className="ml-0.5 text-black" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Level Up Banner - Target Phone Users */}
        {!isSupreme && (
          <div
            onClick={() => router.push('/upgrade')}
            className="md:hidden w-full p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-lg relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
          >
            {/* Animated Background Glow */}
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-r ${isElite ? 'from-amber-500 via-orange-500 to-yellow-500' : 'from-purple-500 via-indigo-500 to-cyan-500'} animate-pulse`} />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${isElite ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  <ArrowUpCircle size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-0.5">
                    Current: {isElite ? 'Elite' : 'Core'}
                  </p>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Upgrade Plan <span className={`px-1.5 py-0.5 rounded-md text-[10px] bg-white/10 border border-white/5 ${isElite ? 'text-amber-400' : 'text-purple-400'}`}>+1 Level</span>
                  </h3>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isElite ? 'bg-amber-500 text-black' : 'bg-purple-500 text-white'}`}>
                <ChevronRight size={18} strokeWidth={3} />
              </div>
            </div>
          </div>
        )}

        {/* Premium Upgrade Advertisement - Desktop */}
        {(!isSupreme && !isElite) && (
          <div
            onClick={() => router.push('/upgrade')}
            className="hidden md:block w-full relative group cursor-pointer rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <img
              src="/ad_banner.png"
              alt="Nitro Premium"
              className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        )}

        {/* Nitro Mixes - Unique to our app */}
        {user && nitroMixes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Made for {userName || 'You'}</h2>
              </div>
              <button onClick={() => router.push('/profile')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {nitroMixes.map((mix) => (
                <div
                  key={mix.id}
                  onClick={() => mix.songs[0] && playTrack(mix.songs[0], mix.songs)}
                  className="group cursor-pointer w-[120px] md:w-[150px] flex-shrink-0"
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

        {/* Recently Played (for signed-in users) */}
        {user && lastPlayed.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--foreground-muted)]" />
                <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Recently played</h2>
              </div>
              <button onClick={() => router.push('/profile')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {lastPlayed.slice(0, 10).map((song: any, idx: number) => (
                <SongCard key={`lp-${song.id || song.songId || idx}`} song={song} queue={lastPlayed} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
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
            <button onClick={() => router.push('/search')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {trending.slice(0, 12).map((song: any, idx: number) => (
              <SongCard key={`tr-${song.id || song.songId || idx}`} song={song} queue={trending} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
            ))}
          </div>
        </section>

        {/* Plans Advertisement Section */}
        {(!isSupreme && !isElite) && (
          <section className="mb-10 px-1" onClick={() => router.push('/upgrade')}>
            <div className="flex items-center gap-2 mb-4">
              <Crown size={18} className="text-amber-400" />
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Choose your power</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <button onClick={() => router.push('/search')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
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
              <button onClick={() => router.push('/search')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {newReleases.slice(0, 10).map((album: any, idx: number) => (
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
              <button onClick={() => router.push('/search')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {bollywoodHits.slice(0, 12).map((song: any, idx: number) => (
                <SongCard key={`bw-${song.id || song.songId || idx}`} song={song} queue={bollywoodHits} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* International Hits */}
        {internationalHits.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">International hits</h2>
              <button onClick={() => router.push('/search')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {internationalHits.slice(0, 12).map((song: any, idx: number) => (
                <SongCard key={`ih-${song.id || song.songId || idx}`} song={song} queue={internationalHits} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Your Playlists */}
        {user && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Your playlists</h2>
              <button onClick={() => router.push('/profile')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
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

        {/* Party Mix */}
        {partyMix.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Party mix</h2>
              <button onClick={() => router.push('/search')} className="text-xs font-medium text-cyan-400 hover:underline">See all</button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {partyMix.slice(0, 12).map((song: any, idx: number) => (
                <SongCard key={`pm-${song.id || song.songId || idx}`} song={song} queue={partyMix} getImg={getImg} getName={getName} getArtist={getArtist} playTrack={playTrack} />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
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
      className="group cursor-pointer w-[115px] md:w-[140px] flex-shrink-0"
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
      <h3 className="font-semibold text-[11px] md:text-xs text-[var(--foreground)] truncate">{getName(song)}</h3>
      <p className="text-[9px] md:text-[10px] text-[var(--foreground-muted)] truncate">{getArtist(song)}</p>
    </div>
  );
}

