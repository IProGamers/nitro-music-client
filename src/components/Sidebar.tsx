"use client"
import Link from 'next/link';
import { Home, Search, User, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    const toggleDrawer = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 bg-black border-r border-white/10 flex-col p-6 h-full shrink-0">
                <div className="text-2xl font-bold mb-10 text-cyan-400 tracking-tighter">Nitro<span className="text-white">.</span></div>
                <nav className="flex flex-col gap-4">
                    {links.map(l => {
                        const Icon = l.icon;
                        const active = pathname === l.href;
                        return (
                            <Link key={l.name} href={l.href} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${active ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                                <Icon size={20} />
                                <span className="font-medium">{l.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-black/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-40">
                <div className="text-xl font-bold text-cyan-400 tracking-tighter">Nitro<span className="text-white">.</span></div>
                <button onClick={toggleDrawer} className="text-white p-2">
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={toggleDrawer}></div>
                    <div className="relative w-3/4 max-w-xs bg-zinc-950 h-full p-6 flex flex-col border-r border-white/10 shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div className="text-2xl font-bold text-cyan-400 tracking-tighter">Nitro<span className="text-white">.</span></div>
                            <button onClick={toggleDrawer} className="text-zinc-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <nav className="flex flex-col gap-4">
                            {links.map(l => {
                                const Icon = l.icon;
                                const active = pathname === l.href;
                                return (
                                    <Link key={l.name} href={l.href} onClick={toggleDrawer} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${active ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                                        <Icon size={20} />
                                        <span className="font-medium">{l.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                        <div className="mt-auto text-xs text-zinc-600 font-mono">
                            v7.0 | Nitro Music
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-black/95 backdrop-blur-lg border-t border-white/10 flex justify-around items-center z-40 pb-safe">
                {links.map(l => {
                    const Icon = l.icon;
                    const active = pathname === l.href;
                    return (
                        <Link key={l.name} href={l.href} className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${active ? 'text-cyan-400' : 'text-zinc-500'}`}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{l.name}</span>
                        </Link>
                    )
                })}
            </div>
        </>
    )
}
