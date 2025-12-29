"use client"
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { PlayerProvider } from '@/context/PlayerContext';
import { AudioFXProvider } from '@/context/AudioFXContext';
import ArihantPlayer from '@/components/ArihantPlayer';

export default function ArihantLayout({ children }: { children: React.ReactNode }) {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Redirect non-arihant users away
    useEffect(() => {
        if (!loading && userProfile && !userProfile.arihantMode) {
            router.replace('/');
        }
    }, [userProfile, loading, router]);

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white/60 text-base">🙏 Jai Jinendra</p>
                </div>
            </div>
        );
    }

    // Block access if not in arihant mode
    if (!userProfile?.arihantMode) {
        return null;
    }

    return (
        <PlayerProvider>
            <AudioFXProvider>
                <div className="min-h-screen bg-[#0a0a0f] text-white">
                    {/* Top Navigation */}
                    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-orange-500/20">
                        <div className="max-w-3xl mx-auto px-4 py-4">
                            <div className="flex items-center justify-between">
                                {/* Logo */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🙏</span>
                                    <span className="text-lg font-bold text-orange-400">Arihant</span>
                                </div>

                                {/* Navigation Links */}
                                <div className="flex items-center gap-4">
                                    <a
                                        href="/arihant"
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${pathname === '/arihant'
                                            ? 'bg-orange-500 text-white shadow-lg'
                                            : 'text-white/50 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        Home
                                    </a>
                                    <a
                                        href="/arihant/search"
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${pathname === '/arihant/search'
                                            ? 'bg-orange-500 text-white shadow-lg'
                                            : 'text-white/50 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        Search
                                    </a>
                                </div>
                            </div>
                        </div>
                    </nav>

                    {/* Main Content */}
                    <main className="pt-20 pb-32 px-4 max-w-3xl mx-auto">
                        {children}
                    </main>

                    {/* Simplified Player */}
                    <ArihantPlayer />
                </div>
            </AudioFXProvider>
        </PlayerProvider>
    );
}
