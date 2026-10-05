"use client"
import Link from 'next/link';
import { useState } from 'react';
import { Users, Headphones, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFriends } from '@/context/FriendsContext';
import { useRoom } from '@/context/RoomContext';
import { usePathname } from 'next/navigation';
import FriendsPanel from './FriendsPanel';
import ListenTogetherPanel from './ListenTogetherPanel';

export default function MobileHeader() {
    const { user, userProfile } = useAuth();
    const { pendingRequests, canUseListenTogether } = useFriends();
    const { activeRoom, isInRoom } = useRoom();
    const pathname = usePathname();

    // Panel state
    const [showFriendsPanel, setShowFriendsPanel] = useState(false);
    const [showListenTogether, setShowListenTogether] = useState(false);

    if (pathname === '/upgrade' || pathname === '/auth' || pathname?.startsWith('/play/') || userProfile?.arihantMode) return null;

    const hasNotifications = pendingRequests.length > 0;

    return (
        <>
            <div className="md:hidden sticky top-0 w-full h-14 bg-[#030303]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 z-40 transition-all duration-300">
                <Link href="/" className="flex items-center gap-2.5">
                    <img src="/logo.png" className="w-7 h-7 rounded-md shadow-md" alt="Logo" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-white tracking-tight">Nitro</span>
                        <span className="text-xs font-semibold text-neutral-400">Music</span>
                    </div>
                </Link>
                <div className="flex items-center gap-2">
                    {user && (
                        <>
                            {/* Listen Together Button */}
                            <button
                                onClick={() => setShowListenTogether(true)}
                                className={`relative p-2.5 rounded-xl transition-all active:scale-95 ${activeRoom
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-[var(--card)] text-[var(--foreground-muted)]'
                                    }`}
                            >
                                <Headphones size={20} />
                                {activeRoom && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--background)] animate-pulse" />
                                )}
                            </button>

                            {/* Friends Button */}
                            <button
                                onClick={() => setShowFriendsPanel(true)}
                                className="relative p-2.5 bg-[var(--card)] rounded-xl text-[var(--foreground-muted)] active:scale-95 transition-all"
                            >
                                <Users size={20} />
                                {hasNotifications && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-[var(--background)] animate-pulse" />
                                )}
                            </button>

                            {/* Profile Link */}
                            <Link href="/profile" className="active:scale-95 transition-all">
                                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-cyan-500/30">
                                    {userProfile?.photoURL ? (
                                        <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                                            {userProfile?.displayName?.[0] || 'U'}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Friends Panel Modal */}
            <FriendsPanel isOpen={showFriendsPanel} onClose={() => setShowFriendsPanel(false)} />

            {/* Listen Together Panel Modal */}
            <ListenTogetherPanel isOpen={showListenTogether} onClose={() => setShowListenTogether(false)} />
        </>
    );
}

