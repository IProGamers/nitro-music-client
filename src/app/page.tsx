"use client"
import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, ChevronRight, ChevronLeft, Clock } from 'lucide-react';

export default function Home() {
  const { playTrack } = usePlayer();
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [lastPlayed, setLastPlayed] = useState([]);
  const [newReleasesPage, setNewReleasesPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const r1 = await fetch(`${apiUrl}/api/search/songs?query=english+top+hits&limit=15`);
        const d1 = await r1.json();
        if (d1.success) setTrending(d1.data.results);

        const r2 = await fetch(`${apiUrl}/api/search/songs?query=new+english+songs&limit=45`);
        const d2 = await r2.json();
        if (d2.success) setNewReleases(d2.data.results);

        const r3 = await fetch(`${apiUrl}/api/history`);
        const d3 = await r3.json();
        if (d3.success) setLastPlayed(d3.data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);

  const getImg = (t: any) => {
    if (t.image && t.image.length) {
      return t.image[t.image.length - 1].url;
    }
    if (typeof t.image === 'string') return t.image;
    return '';
  };

  const getArtist = (t: any) => {
    if (t.artists && t.artists.primary && t.artists.primary.length) {
      return t.artists.primary[0].name;
    }
    if (typeof t.artist === 'string') return t.artist;
    return 'Unknown';
  };

  const itemsPerPage = 9;
  const totalPages = Math.ceil(newReleases.length / itemsPerPage);
  const currentNewReleases = newReleases.slice(newReleasesPage * itemsPerPage, (newReleasesPage + 1) * itemsPerPage);

  const nextPage = () => {
    setNewReleasesPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setNewReleasesPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="p-6 md:p-8 pb-32 pt-20 md:pt-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-white">Discover</h1>
        <p className="text-zinc-400">Listen to the latest hits</p>
      </div>

      {/* Trending Section */}
      <div className="mb-10">
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-lg font-bold text-white tracking-wide">Trending Now</h2>
          <span className="text-xs font-bold text-cyan-400 cursor-pointer hover:text-cyan-300">SEE ALL</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
          {trending.map((t: any) => (
            <div key={t.id} onClick={() => playTrack(t, trending)} className="min-w-[150px] md:min-w-[180px] cursor-pointer group relative">
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 relative bg-zinc-900 shadow-lg border border-white/5">
                <img src={getImg(t)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute bottom-3 right-3 w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                  <Play size={20} fill="black" className="ml-1 text-black" />
                </div>
              </div>
              <h3 className="font-bold truncate text-sm md:text-base text-white group-hover:text-cyan-400 transition-colors">{t.name}</h3>
              <p className="text-xs text-zinc-500 truncate font-medium">{getArtist(t)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New Releases Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide">New Releases</h2>
          <div className="flex gap-2">
            <button onClick={prevPage} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-50">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextPage} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-50">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentNewReleases.map((t: any) => (
            <div key={t.id} onClick={() => playTrack(t, newReleases)} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/5">
              <div className="relative w-16 h-16 shrink-0">
                <img src={getImg(t)} className="w-full h-full rounded-lg object-cover shadow-md" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <Play size={20} fill="white" className="text-white" />
                </div>
              </div>
              <div className="flex-1 overflow-hidden min-w-0">
                <h3 className="font-semibold truncate group-hover:text-cyan-400 transition-colors text-base text-white">{t.name}</h3>
                <p className="text-sm text-zinc-400 truncate">{getArtist(t)}</p>
              </div>
              <div className="text-zinc-600 hover:text-white p-2">
                <span className="text-xs font-mono">3:42</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Played Section */}
      {lastPlayed.length > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-end mb-4 px-1">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <Clock size={20} className="text-cyan-400" /> Last Played
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {lastPlayed.map((t: any) => (
              <div key={t.id} onClick={() => playTrack(t, lastPlayed)} className="min-w-[150px] md:min-w-[180px] cursor-pointer group relative">
                <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 relative bg-zinc-900 shadow-lg border border-white/5">
                  <img src={getImg(t)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                    <Play size={20} fill="black" className="ml-1 text-black" />
                  </div>
                </div>
                <h3 className="font-bold truncate text-sm md:text-base text-white group-hover:text-cyan-400 transition-colors">{t.name}</h3>
                <p className="text-xs text-zinc-500 truncate font-medium">{getArtist(t)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
