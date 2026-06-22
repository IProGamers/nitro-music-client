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
    if (pathname?.startsWith('/play/')) return null; // standalone public share page (/play/[token]) — NOT /playlists

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

    // Keep a nav item highlighted on its sub-pages too. "Your Library" owns the
    // playlist detail pages, Liked Songs and Downloads, so opening a playlist
    // shouldn't drop the Library highlight.
    const isLinkActive = (href: string) => {
        if (href === '/') return pathname === '/';
        if (href === '/playlists') {
            return pathname.startsWith('/playlist') || pathname === '/liked' || pathname === '/downloads';
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

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
                        const active = isLinkActive(l.href);
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

            {/* Mobile Bottom Nav — personalised Nitro tab bar */}
            {pathname !== '/auth' && !userProfile?.arihantMode && (
                <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--background)]/90 backdrop-blur-2xl border-t border-[var(--border)] z-40 pb-safe">
                    <div className="flex justify-around items-stretch h-[58px]">
                        {[
                            { name: 'Home', href: '/', icon: Home },
                            { name: 'Search', href: '/search', icon: Search },
                            { name: 'Library', href: '/playlists', icon: ListMusic },
                        ].map(l => {
                            const Icon = l.icon;
                            const active = isLinkActive(l.href);
                            return (
                                <Link
                                    key={l.name}
                                    href={l.href}
                                    className="relative flex flex-col items-center justify-center gap-1 flex-1 group"
                                >
                                    {active && <span className="absolute top-0 w-8 h-[3px] rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />}
                                    <Icon
                                        size={23}
                                        strokeWidth={active ? 2.6 : 2}
                                        className={`transition-colors ${active ? 'text-cyan-400' : 'text-[var(--foreground-muted)] group-active:text-[var(--foreground)]'}`}
                                    />
                                    <span className={`text-[10px] tracking-tight transition-colors ${active ? 'text-cyan-400 font-semibold' : 'text-[var(--foreground-muted)] font-medium'}`}>{l.name}</span>
                                </Link>
                            );
                        })}

                        {/* Profile tab — uses the user's own avatar (personalised) */}
                        {(() => {
                            const profileHref = mounted && user ? '/profile' : '/auth';
                            const active = pathname === profileHref || pathname === '/profile';
                            const initial = userProfile?.displayName?.[0]?.toUpperCase() || 'U';
                            return (
                                <Link href={profileHref} className="relative flex flex-col items-center justify-center gap-1 flex-1 group">
                                    {active && <span className="absolute top-0 w-8 h-[3px] rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />}
                                    <div className={`w-[26px] h-[26px] rounded-full overflow-hidden flex items-center justify-center transition-all ${active ? 'ring-2 ring-cyan-400' : 'ring-1 ring-[var(--border)]'}`}>
                                        {mounted && user && userProfile?.photoURL ? (
                                            <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="" />
                                        ) : mounted && user ? (
                                            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold">{initial}</div>
                                        ) : (
                                            <User size={16} className={active ? 'text-cyan-400' : 'text-[var(--foreground-muted)]'} />
                                        )}
                                    </div>
                                    <span className={`text-[10px] tracking-tight transition-colors ${active ? 'text-cyan-400 font-semibold' : 'text-[var(--foreground-muted)] font-medium'}`}>{mounted && user ? 'You' : 'Sign in'}</span>
                                </Link>
                            );
                        })()}
                    </div>
                </nav>
            )}

            {/* Friends Panel Modal */}
            <FriendsPanel isOpen={showFriendsPanel} onClose={() => setShowFriendsPanel(false)} />

            {/* Listen Together Panel Modal */}
            <ListenTogetherPanel isOpen={showListenTogether} onClose={() => setShowListenTogether(false)} />
        </>
    )
}

