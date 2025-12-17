"use client"
import { useSettings } from '@/context/SettingsContext';
import { Download, Headphones, ToggleLeft, ToggleRight, Settings } from 'lucide-react';

export default function SettingsPage() {
    const { enableDownload, setEnableDownload, enable3DAudio, setEnable3DAudio } = useSettings();

    return (
        <div className="p-6 md:p-8 pb-32 pt-20 md:pt-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
                    <Settings size={32} className="text-cyan-400" /> Settings
                </h1>
                <p className="text-zinc-400">Manage your playback and app preferences</p>
            </div>

            <div className="space-y-6">
                {/* Playback Settings */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 text-white">Playback</h2>

                    {/* 3D Audio Toggle */}
                    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                <Headphones size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">3D Audio Effect</h3>
                                <p className="text-sm text-zinc-400">Immersive spatial audio experience</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEnable3DAudio(!enable3DAudio)}
                            className={`transition-colors ${enable3DAudio ? 'text-cyan-400' : 'text-zinc-600'}`}
                        >
                            {enable3DAudio ? <ToggleRight size={40} fill="currentColor" /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                </div>

                {/* Download Settings */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 text-white">Downloads</h2>

                    {/* Download Toggle */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                <Download size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Enable Downloads</h3>
                                <p className="text-sm text-zinc-400">Show download button in player</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEnableDownload(!enableDownload)}
                            className={`transition-colors ${enableDownload ? 'text-cyan-400' : 'text-zinc-600'}`}
                        >
                            {enableDownload ? <ToggleRight size={40} fill="currentColor" /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                </div>

                <div className="text-center text-xs text-zinc-600 mt-12">
                    Nitro Music App v1.0.0
                </div>
            </div>
        </div>
    )
}
