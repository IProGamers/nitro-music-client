"use client"
import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';

export default function HistoryPage() {
    const { playTrack } = usePlayer();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/history');
                const data = await res.json();
                if (data.success) setHistory(data.data);
            } catch (e) {
                console.error(e);
            }
        }
        fetchHistory();
    }, []);

    return (
        <div className="p-4 md:p-8 pb-32">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">History</h1>
            <div className="flex flex-col gap-2">
                {history.map((t: any) => (
                    <div key={t.id} onClick={() => playTrack(t, history)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group">
                        <img src={t.image} className="w-12 h-12 rounded-lg object-cover bg-zinc-800" />
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-semibold truncate group-hover:text-cyan-400 transition-colors text-sm md:text-base">{t.name}</h3>
                            <p className="text-xs md:text-sm text-zinc-400 truncate">{t.artist}</p>
                        </div>
                        <div className="text-[10px] md:text-xs text-zinc-500 whitespace-nowrap">
                            {new Date(t.playedAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
