"use client"
import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Play, ChevronRight, Music, Heart, Mic2, Crown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Decode HTML entities outside component to avoid re-creation
const decodeHtml = (html: string): string => {
  if (!html || typeof window === 'undefined') return html || '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

export default function Home() {
  const { playTrack } = usePlayer();
  const { user, userProfile } = useAuth();
  const { tier } = useSettings();
  const router = useRouter();
  const [trending, setTrending] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);
  const [bollywoodHits, setBollywoodHits] = useState<any[]>([]);
  const [topCharts, setTopCharts] = useState<any[]>([]);
  const [partyMix, setPartyMix] = useState<any[]>([]);
  const [lastPlayed, setLastPlayed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user qualifies for personalized section (includes legacy NITRO_ULTRA)
  const isEligibleForPersonalized = user && (tier === 'NITRO_ELITE' || tier === 'NITRO_SUPREME' || (tier as string) === 'NITRO_ULTRA');
  const isSupremeTier = tier === 'NITRO_SUPREME' || (tier as string) === 'NITRO_ULTRA';
  const userName = userProfile?.displayName?.split(' ')[0] || 'You';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const responses = await Promise.all([
          fetch(`${apiUrl}/api/search/songs?query=latest+hits&limit=12`),
          fetch(`${apiUrl}/api/search/songs?query=new+releases&limit=20`),
          fetch(`${apiUrl}/api/search/artists?query=popular+artists&limit=10`),
          fetch(`${apiUrl}/api/search/songs?query=bollywood+hits&limit=12`),
          fetch(`${apiUrl}/api/search/songs?query=trending+songs&limit=24`),
          fetch(`${apiUrl}/api/search/songs?query=party+mix&limit=12`),
          fetch(`${apiUrl}/api/history`)
        ]);

        const data = await Promise.all(responses.map(r => r.json()));

        if (data[0].success) setTrending(data[0].data.results);
        if (data[1].success) setNewReleases(data[1].data.results);
        if (data[2].success) setFeaturedArtists(data[2].data.results);
        if (data[3].success) setBollywoodHits(data[3].data.results);
        if (data[4].success) setTopCharts(data[4].data.results);
        if (data[5].success) setPartyMix(data[5].data.results);
        if (data[6].success) setLastPlayed(data[6].data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoize helper functions to prevent re-creation
  const getImg = useCallback((t: any): string => {
    if (!t) return '';
    if (t.image && Array.isArray(t.image) && t.image.length) {
      const img = t.image.find((i: any) => i.quality === '500x500') || t.image[t.image.length - 1];
      return img?.url || img?.link || '';
    }
    if (typeof t.image === 'string') return t.image;
    return '';
  }, []);

  const getName = useCallback((t: any): string => {
    return decodeHtml(t?.name || t?.title || '');
  }, []);

  const getArtist = useCallback((t: any): string => {
    if (!t) return '';
    if (t.artists && t.artists.primary && t.artists.primary.length) {
      return decodeHtml(t.artists.primary[0].name);
    }
    if (typeof t.artist === 'string') return decodeHtml(t.artist);
    return 'Various Artists';
  }, []);

  // Memoize personalized feed to prevent re-shuffle on every render
  const personalizedFeed = useMemo(() => {
    if (!isEligibleForPersonalized || lastPlayed.length < 6) return [];
    // Shuffle once when lastPlayed changes
    const shuffled = [...lastPlayed].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, [isEligibleForPersonalized, lastPlayed]);

  // Hero Banner Slider Logic
  const [heroIndex, setHeroIndex] = useState(0);
  const heroSlides = useMemo(() => {
    const slides = [];

    // Add 2 featured tracks if available
    if (trending.length > 0) {
      slides.push({
        type: 'track',
        data: trending[0],
        tag: 'Featured Track',
        title: getName(trending[0]),
        img: getImg(trending[0])
      });
    }

    // Nitro Supreme Promo Slide
    slides.push({
      type: 'promo',
      tag: 'Premium Upgrade',
      title: isSupremeTier ? 'You are on NITRO SUPREME' : 'Experience Nitro Supreme',
      desc: 'Unlock 3D Audio, Lossless Downloads, and Unlimited History.',
      img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80',
      action: () => router.push(isSupremeTier ? '/profile' : '/upgrade'),
      buttonText: isSupremeTier ? 'View Benefits' : 'Upgrade Now'
    });

    // Add another track if available
    if (trending.length > 1) {
      slides.push({
        type: 'track',
        data: trending[1],
        tag: 'Trending Now',
        title: getName(trending[1]),
        img: getImg(trending[1])
      });
    }

    // Add another promo or track
    if (trending.length > 2) {
      slides.push({
        type: 'track',
        data: trending[2],
        tag: 'Top Discovery',
        title: getName(trending[2]),
        img: getImg(trending[2])
      });
    }

    return slides;
  }, [trending, getName, getImg, tier, router]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides]);

  // Swipe Gesture Logic for Hero Slider
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      setHeroIndex(prev => (prev + 1) % heroSlides.length);
    } else if (isRightSwipe) {
      setHeroIndex(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-cyan-400 gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full"></div>
        <p className="text-zinc-500 font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 pb-32 pt-20 md:pt-8 max-w-7xl mx-auto space-y-6 md:space-y-12">

      {/* Hero Banner Carousel */}
      <section
        className="relative h-[280px] md:h-[450px] lg:h-[500px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group shadow-2xl bg-zinc-950"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === heroIndex ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'
              }`}
          >
            {/* Background Layer: Mobile Full Image, Desktop Blurred */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={slide.img || 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80'}
                className="w-full h-full object-cover md:blur-[80px] md:opacity-30 md:scale-110"
                alt=""
              />
              {/* Mobile Overlay: Stronger at bottom for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 md:hidden" />
              {/* Desktop Overlays */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
              <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative h-full flex flex-col md:flex-row items-end md:items-center justify-start md:justify-between px-6 md:px-16 lg:px-24 py-12 md:py-12 gap-3 md:gap-8">

              {/* Desktop Floating Art (Hidden on Mobile as it's the BG now) */}
              <div className="hidden md:block relative z-10 md:order-last">
                <div className="w-[280px] lg:w-[320px] aspect-square relative animate-in fade-in zoom-in duration-1000 delay-500">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                  <img
                    src={slide.img || 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80'}
                    className="relative w-full h-full object-cover rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10"
                    alt={slide.title}
                  />
                </div>
              </div>

              {/* Text Content: Bottom aligned on mobile, centered/left on desktop */}
              <div className="flex-1 space-y-3 md:space-y-6 text-left z-10 w-full mb-8 md:mb-0">
                <div className="flex items-center justify-start gap-2 animate-in fade-in slide-in-from-left-4 duration-500 delay-300">
                  <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] ${slide.type === 'promo' ? 'bg-amber-500 text-black' : 'bg-cyan-400 text-black'
                    }`}>
                    {slide.tag}
                  </span>
                  {slide.type === 'promo' && <Crown size={12} className="text-amber-400 md:w-3 md:h-3" />}
                </div>

                <div className="space-y-1 md:space-y-2 max-w-2xl px-0">
                  <h1 className="text-3xl md:text-5xl lg:text-5xl font-bold text-white leading-tight tracking-tighter uppercase animate-in fade-in slide-in-from-left-6 duration-700 delay-500">
                    {slide.title}
                  </h1>
                  {slide.desc && (
                    <p className="text-zinc-200 md:text-zinc-400 text-xs md:text-base font-medium max-w-md animate-in fade-in slide-in-from-left-8 duration-700 delay-700 opacity-90 leading-relaxed md:line-clamp-none">
                      {slide.desc}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-start gap-3 md:gap-4 pt-2 md:pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
                  {slide.type === 'track' ? (
                    <button
                      onClick={() => slide.data && playTrack(slide.data, trending)}
                      className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-[10px] md:text-sm hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-xl group/btn"
                    >
                      <Play fill="black" size={14} className="group-hover/btn:scale-110 transition-transform md:w-4 md:h-4" /> START LISTENING
                    </button>
                  ) : (
                    <button
                      onClick={slide.action}
                      className="flex items-center gap-2 bg-amber-500 text-black px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-[10px] md:text-sm hover:bg-amber-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
                    >
                      <Sparkles size={14} fill="black" className="md:w-4 md:h-4" /> {slide.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Indicator Dots */}
        <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 flex items-center gap-1.5 md:gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`h-1 transition-all duration-500 rounded-full ${i === heroIndex ? 'w-8 md:w-12 bg-white' : 'w-2 md:w-2 bg-white/20 hover:bg-white/40'
                }`}
            />
          ))}
        </div>

        {/* Progress Bar (Autoplay timer indicator) - MOVED TO BOTTOM */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 opacity-50 z-20">
          <div
            key={heroIndex}
            className="h-full bg-cyan-400/50 animate-hero-progress origin-left"
          />
        </div>
      </section>


      {/* Made For You - Premium Feature */}
      {isEligibleForPersonalized && personalizedFeed.length >= 6 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isSupremeTier ? 'bg-amber-500/20' : 'bg-purple-500/20'}`}>
                {isSupremeTier ? (
                  <Crown size={16} className="text-amber-400" />
                ) : (
                  <Sparkles size={16} className="text-purple-400" />
                )}
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white">Made for {userName}</h2>
            </div>
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${isSupremeTier ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {isSupremeTier ? 'SUPREME' : 'ELITE'} EXCLUSIVE
            </span>
          </div>
          <p className="text-zinc-500 text-xs md:text-sm mb-4">Personalized picks based on your listening history</p>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {personalizedFeed.map((t: any, idx: number) => (
              <div key={`pf-${t.id || t.songId}-${idx}`} onClick={() => playTrack(t, personalizedFeed)} className="group cursor-pointer min-w-[100px] md:min-w-[160px]">
                <div className="relative aspect-square mb-2 overflow-hidden rounded-xl bg-zinc-900 border border-white/5">
                  {getImg(t) ? (
                    <img src={getImg(t)} className="w-full h-full object-cover" alt={getName(t)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <Music size={20} className="text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg">
                      <Play size={14} fill="black" className="ml-0.5 text-black md:w-5 md:h-5" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-[10px] md:text-sm text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">{getName(t)}</h3>
                <p className="text-[8px] md:text-[10px] text-zinc-500 truncate mt-0.5">{getArtist(t)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Hits - Vertical + Horizontal Hybrid for Phone */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight">Top Hits Today</h2>
            <p className="text-zinc-500 text-[10px] md:text-sm mt-0.5">Most played tracks this week</p>
          </div>
        </div>

        {/* Mobile: Top 5 Vertical List - Compacted */}
        <div className="md:hidden space-y-1.5 mb-6">
          {trending.slice(0, 5).map((t: any, idx: number) => (
            <div
              key={`th-v-${t.id}`}
              onClick={() => playTrack(t, trending)}
              className="flex items-center gap-3 p-1.5 rounded-xl bg-zinc-900/40 border border-white/5 active:bg-zinc-800 transition-all"
            >
              <div className="text-[10px] font-black text-white/20 italic w-3">{idx + 1}</div>
              <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden">
                <img src={getImg(t)} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xs text-white truncate leading-tight">{getName(t)}</h3>
                <p className="text-[9px] text-zinc-500 font-medium uppercase truncate mt-0.5">{getArtist(t)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View & Mobile Remaining (Horizontal Scroll) */}
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {/* Hide first 5 on Mobile, show all on Desktop */}
          {trending.slice(0, 15).map((t: any, idx: number) => (
            <div
              key={t.id}
              onClick={() => playTrack(t, trending)}
              className={`group cursor-pointer min-w-[100px] md:min-w-[180px] ${idx < 5 ? 'hidden md:block' : ''}`}
            >
              <div className="relative aspect-square mb-1.5 md:mb-3 overflow-hidden rounded-lg md:rounded-xl bg-zinc-900 border border-white/5">
                {getImg(t) ? (
                  <img src={getImg(t)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={getName(t)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Music size={24} className="text-zinc-600 md:w-8 md:h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-9 h-9 md:w-12 md:h-12 bg-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    <Play size={16} fill="black" className="ml-1 text-black md:w-6 md:h-6" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-[11px] md:text-sm text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">{getName(t)}</h3>
              <p className="text-[9px] md:text-xs text-zinc-500 truncate mt-0.5">{getArtist(t)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Artists */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Popular Artists</h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5">Artists you might like</p>
          </div>
          <button onClick={() => router.push('/search')} className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {featuredArtists.map((artist: any) => (
            <div
              key={artist.id}
              onClick={() => router.push(`/artist/${artist.id}`)}
              className="flex flex-col items-center group cursor-pointer min-w-[70px] md:min-w-[120px]"
            >
              <div className="w-14 h-14 md:w-24 md:h-24 rounded-full overflow-hidden mb-2 bg-zinc-900 ring-2 ring-transparent group-hover:ring-cyan-400 transition-shadow">
                {getImg(artist) ? (
                  <img src={getImg(artist)} className="w-full h-full object-cover" alt={getName(artist)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Mic2 size={20} className="text-zinc-600" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-[11px] md:text-sm text-zinc-300 group-hover:text-white transition-colors text-center truncate w-full">{getName(artist)}</h3>
              <p className="text-[9px] md:text-[10px] text-zinc-600">Artist</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Charts */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Trending Now</h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5">What's hot right now</p>
          </div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-3 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="grid grid-rows-3 grid-flow-col gap-x-3 gap-y-2 pb-2">
            {topCharts.map((t: any, i: number) => (
              <div
                key={t.id}
                onClick={() => playTrack(t, topCharts)}
                className="flex items-center gap-2 p-1.5 md:p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800 cursor-pointer group transition-colors min-w-[240px] md:min-w-[350px]"
              >
                <span className="text-xs md:text-base font-bold text-zinc-700 w-4 text-center">{i + 1}</span>
                <div className="relative w-9 h-9 md:w-12 md:h-12 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                  {getImg(t) ? (
                    <img src={getImg(t)} className="w-full h-full object-cover" alt={getName(t)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={14} className="text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs text-zinc-100 group-hover:text-cyan-400 transition-colors truncate">{getName(t)}</h3>
                  <p className="text-[9px] text-zinc-500 truncate">{getArtist(t)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Releases */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">New Releases</h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5">Fresh tracks just for you</p>
          </div>
        </div>
        <div className="flex gap-2.5 md:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {newReleases.slice(0, 15).map((t: any) => (
            <div key={t.id} onClick={() => playTrack(t, newReleases)} className="group cursor-pointer min-w-[110px] md:min-w-[180px]">
              <div className="relative aspect-square mb-2 md:mb-3 overflow-hidden rounded-xl bg-zinc-900 border border-white/5">
                {getImg(t) ? (
                  <img src={getImg(t)} className="w-full h-full object-cover" alt={getName(t)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Music size={24} className="text-zinc-600 md:w-8 md:h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg">
                    <Play size={18} fill="black" className="ml-0.5 text-black md:w-6 md:h-6" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-xs md:text-sm text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">{getName(t)}</h3>
              <p className="text-[10px] md:text-xs text-zinc-500 truncate mt-0.5">{getArtist(t)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bollywood Hits */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Bollywood Hits</h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5">Popular Hindi songs</p>
          </div>
        </div>
        <div className="flex gap-2.5 md:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {bollywoodHits.slice(0, 10).map((t: any) => (
            <div key={t.id} onClick={() => playTrack(t, bollywoodHits)} className="group cursor-pointer min-w-[90px] md:min-w-[160px]">
              <div className="relative aspect-square mb-2 overflow-hidden rounded-xl bg-zinc-900 border border-white/5">
                {getImg(t) ? (
                  <img src={getImg(t)} className="w-full h-full object-cover" alt={getName(t)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Music size={20} className="text-zinc-600 md:w-6 md:h-6" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40">
                    <Play size={14} fill="black" className="ml-0.5 text-black md:w-6 md:h-6" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-[10px] md:text-sm text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">{getName(t)}</h3>
              <p className="text-[8px] md:text-[10px] text-zinc-500 truncate mt-0.5">{getArtist(t)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Party Mix */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Party Mix</h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5">Get the party started</p>
          </div>
        </div>
        <div className="flex gap-2.5 md:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {partyMix.slice(0, 8).map((t: any) => (
            <div key={t.id} onClick={() => playTrack(t, partyMix)} className="min-w-[110px] md:min-w-[180px] group cursor-pointer">
              <div className="relative aspect-square mb-2 md:mb-3 overflow-hidden rounded-xl bg-zinc-900 border border-white/5">
                {getImg(t) ? (
                  <img src={getImg(t)} className="w-full h-full object-cover" alt={getName(t)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Music size={24} className="text-zinc-600 md:w-8 md:h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40">
                    <Play size={18} fill="black" className="ml-0.5 text-black md:w-6 md:h-6" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-xs md:text-sm text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">{getName(t)}</h3>
              <p className="text-[10px] md:text-xs text-zinc-500 truncate mt-0.5">{getArtist(t)}</p>
            </div>
          ))}
        </div>
      </section>


      {/* 3D Audio Banner */}
      <section className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Experience 3D Audio</h2>
          <p className="text-cyan-100 text-sm">Immersive spatial sound for your music</p>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="px-6 py-2.5 bg-white text-cyan-600 rounded-full font-semibold text-sm hover:bg-cyan-50 transition-colors"
        >
          Try Now
        </button>
      </section>

      {/* Recently Searched - Home style */}
      <section className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-tighter">Recent Discovery</h2>
          <button onClick={() => router.push('/search')} className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">See History</button>
        </div>
        <div className="space-y-1.5">
          {trending.slice(5, 9).map((t: any, i: number) => (
            <div
              key={`rs-${t.id}`}
              onClick={() => playTrack(t, trending)}
              className="flex items-center gap-3 p-1.5 rounded-xl bg-zinc-900/30 border border-white/5 cursor-pointer group"
            >
              <div className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                <img src={getImg(t)} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[11px] text-zinc-200 truncate group-hover:text-cyan-400 leading-tight">{getName(t)}</h3>
                <p className="text-[9px] text-zinc-600 truncate">{getArtist(t)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 pb-4 border-t border-zinc-800 text-center">
        <p className="text-lg font-bold text-white mb-2">Nitro<span className="text-cyan-400">.</span></p>
        <p className="text-xs text-zinc-600">Made with ♥ for music lovers</p>
      </footer>
    </div>
  );
}
