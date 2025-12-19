"use client"
import Link from 'next/link';
import { Home, Search, User, Menu, X, Shield, LogIn, LogOut, Clock, ListMusic } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { isAdmin } = useSettings();
    const { user, userProfile, signOut, loading } = useAuth();

    // Use state for hydration-safe client-side values
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Base links - Profile href is static, we'll redirect in the Profile page if not logged in
    const links = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Playlists', href: '/playlists', icon: ListMusic, desktopOnly: true },
        { name: 'Recently Played', href: '/recent', icon: Clock, desktopOnly: true },
        // Use consistent href for SSR/CSR - profile page handles auth redirect
        { name: 'Profile', href: mounted && user ? '/profile' : '/auth', icon: User },
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

    return (
        <>
            {/* Desktop Sidebar - Uses calc to account for player bar height */}
            <div className="hidden md:flex w-64 bg-[var(--background)] border-r border-[var(--border)] flex-col p-6 shrink-0 fixed top-0 left-0 z-30 transition-all duration-300" style={{ height: 'calc(100vh - 96px)' }}>
                <div className="text-2xl font-bold mb-6 text-cyan-400 tracking-tighter shrink-0">Nitro<span className="text-[var(--foreground)]">.</span></div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
                    {allLinks.filter(l => !l.desktopOnly).concat(allLinks.filter(l => l.desktopOnly)).map(l => {

                        const Icon = l.icon;
                        const active = pathname === l.href;
                        const isAdminLink = l.name === 'Admin';
                        return (
                            <Link
                                key={l.name}
                                href={l.href}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${active
                                    ? isAdminLink
                                        ? 'bg-amber-900/20 text-amber-400 border border-amber-500/20'
                                        : 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20'
                                    : isAdminLink
                                        ? 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10'
                                        : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                                    } transition-colors duration-300`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{l.name}</span>
                                {isAdminLink && (
                                    <span className="ml-auto text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                                        Admin
                                    </span>
                                )}
                            </Link>
                        )
                    })}
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

            {/* Mobile Header - Removed Hamburger Menu */}
            <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-between px-6 z-40 transition-all duration-300">
                <div className="text-xl font-bold text-cyan-400 tracking-tighter">Nitro<span className="text-[var(--foreground)]">.</span></div>
                <div className="flex items-center gap-4">
                    {user && (
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
                    )}
                </div>
            </div>

            {/* Mobile Drawer Removed */}

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[var(--background)]/95 backdrop-blur-lg border-t border-[var(--border)] flex justify-around items-center z-40 pb-safe transition-all duration-300">
                {links.filter(l => !l.desktopOnly).map(l => {
                    const Icon = l.icon;
                    const active = pathname === l.href;
                    return (
                        <Link key={l.name} href={l.href} className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${active ? 'text-cyan-400' : 'text-[var(--foreground-muted)]'}`}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{l.name}</span>
                        </Link>
                    )
                })}
            </div>
        </>
    )
}
