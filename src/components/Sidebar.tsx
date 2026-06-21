"use client"
import Link from 'next/link';
import { Home, Search, User, Menu, X, Shield, LogIn, LogOut, Clock, ListMusic, Users, Headphones, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useFriends } from '@/context/FriendsContext';
import { useRoom } from '@/context/RoomContext';
import FriendsPanel from './FriendsPanel';
import ListenTogetherPanel from './ListenTogetherPanel';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { isAdmin } = useSettings();
    const { user, userProfile, signOut, loading } = useAuth();
    const { pendingRequests, canUseListenTogether } = useFriends();
    const { activeRoom, isInRoom } = useRoom();

    // Panel state
    const [showFriendsPanel, setShowFriendsPanel] = useState(false);
    const [showListenTogether, setShowListenTogether] = useState(false);

    // Use state for hydration-safe client-side values
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (userProfile?.arihantMode) return null;

    // Spotify-style core nav: Home / Search / Your Library.
    // Profile lives in the header avatar (mobile) and the bottom user block (desktop),
    // not as a nav slot.
    const links = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Your Library', href: '/playlists', icon: ListMusic },
    ];

    // Add Admin link only for admins (client-side only to avoid hydration issues)
    const allLinks = mounted && isAdmin
        ? [...links, { name: 'Admin', href: '/admin', icon: Shield }]
        : links;

    const toggleDrawer = () => setIsOpen(!isOpen);

    const handleSignOut = async () => {
        try {
            await signOut();
            setIsOpen(false);
        } catch (err) {
            console.error('Sign out error:', err);
        }
    };

    // Has notifications for friends (requests)
    const hasNotifications = pendingRequests.length > 0;

    return (
        <>
            {/* Desktop Sidebar - Uses calc to account for player bar height */}
            <div className="hidden md:flex w-64 bg-[var(--background)] border-r border-[var(--border)] flex-col p-6 shrink-0 fixed top-0 left-0 z-30 transition-all duration-300" style={{ height: 'calc(100vh - 96px)' }}>
                <Link href="/" className="flex items-center gap-4 mb-10 group pl-2">
                    <div className="w-9 h-9 rounded-xl overflow-hidden shadow-none ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                        <img src="/logo.png" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Nitro Logo" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-xl font-bold text-[var(--foreground)] tracking-tight shrink-0">Nitro<span className="text-[var(--foreground-muted)]">.</span></div>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1">
                    {allLinks.map(l => {

                        const Icon = l.icon;
                        const active = pathname === l.href;
                        const isAdminLink = l.name === 'Admin';
                        return (
                            <Link
                                key={l.name}
                                href={l.href}
                                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${active
                                    ? 'text-[var(--foreground)] bg-[var(--card-hover)] font-semibold'
                                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card)] font-medium'
                                    }`}
                            >
                                {active && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[var(--accent-cyan)] rounded-r-full" />
                                )}
                                <Icon size={18} className={`transition-colors ${active ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'}`} />
                                <span className="text-sm tracking-wide">{l.name}</span>
                                {isAdminLink && (
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground-muted)] rounded">
                                        Admin
                                    </span>
                                )}
                            </Link>
                        )
                    })}

                    {/* Divider */}
                    {user && (
                        <>
                            <div className="my-3 border-t border-[var(--border)]" />
                            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                                Social
                            </p>

                            {/* Friends Button */}
                            <button
                                onClick={() => setShowFriendsPanel(true)}
                                className="flex items-center gap-3.5 px-4 py-2.5 rounded-lg transition-all duration-200 group relative text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card)] font-medium w-full text-left"
                            >
                                <Users size={18} className="text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors" />
                                <span className="text-sm tracking-wide">Friends</span>
                                {hasNotifications && (
                                    <span className="ml-auto w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                                )}
                            </button>

                            {/* Listen Together Button */}
                            <button
                                onClick={() => setShowListenTogether(true)}
                                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg transition-all duration-200 group relative font-medium w-full text-left ${activeRoom
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card)]'
                                    }`}
                            >
                                <Headphones size={18} className={`transition-colors ${activeRoom ? 'text-purple-400' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'
                                    }`} />
                                <span className="text-sm tracking-wide">Listen Together</span>
                                {!canUseListenTogether && (
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded flex items-center gap-0.5">
                                        <Zap size={10} /> Elite
                                    </span>
                                )}
                                {activeRoom && (
                                    <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                )}
                            </button>
                        </>
                    )}
                </nav>

                {/* User Section at Bottom */}
                <div className="border-t border-[var(--border)] pt-3 mt-3 shrink-0">
                    {user ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2">
                                {userProfile?.photoURL ? (
                                    <img src={userProfile.photoURL} className="w-9 h-9 rounded-full object-cover" alt="" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                        {userProfile?.displayName?.[0] || 'U'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                        {userProfile?.displayName || 'User'}
                                    </p>
                                    <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 w-full p-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/auth"
                            className="flex items-center gap-3 w-full p-3 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all"
                        >
                            <LogIn size={20} />
                            <span className="font-medium">Sign In</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Desktop Sidebar Spacer - This pushes the main content */}
            <div className="hidden md:block w-64 shrink-0" />



            {/* Mobile Drawer Removed */}

            {/* Mobile Bottom Nav — Home, Search, Library, Profile (Spotify-style) */}
            {pathname !== '/auth' && !userProfile?.arihantMode && (
                <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[var(--background)]/95 backdrop-blur-lg border-t border-[var(--border)] flex justify-around items-center z-40 pb-safe">
                    {[
                        { name: 'Home', href: '/', icon: Home },
                        { name: 'Search', href: '/search', icon: Search },
                        { name: 'Library', href: '/playlists', icon: ListMusic },
                    ].map(l => {
                        const Icon = l.icon;
                        const active = pathname === l.href;
                        return (
                            <Link
                                key={l.name}
                                href={l.href}
                                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${active ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`}
                            >
                                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{l.name}</span>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Friends Panel Modal */}
            <FriendsPanel isOpen={showFriendsPanel} onClose={() => setShowFriendsPanel(false)} />

            {/* Listen Together Panel Modal */}
            <ListenTogetherPanel isOpen={showListenTogether} onClose={() => setShowListenTogether(false)} />
        </>
    )
}

