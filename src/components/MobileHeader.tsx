"use client"
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function MobileHeader() {
    const { user, userProfile } = useAuth();
    const pathname = usePathname();

    if (pathname === '/upgrade' || pathname === '/auth' || userProfile?.arihantMode) return null;

    return (
        <div className="md:hidden w-full h-16 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0 z-40 transition-all duration-300">
            <Link href="/" className="flex items-center gap-3">
                <img src="/logo.png" className="w-8 h-8 rounded-lg shadow-lg" alt="Logo" />
                <div className="flex items-baseline gap-1.5">
                    <div className="text-xl font-bold text-cyan-400 tracking-tighter">Nitro</div>
                    <div className="text-[8px] font-bold text-[var(--foreground-muted)] tracking-widest lowercase opacity-60">by ipro</div>
                </div>
            </Link>
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
    );
}
