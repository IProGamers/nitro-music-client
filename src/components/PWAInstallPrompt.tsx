"use client";
import { useState, useEffect } from 'react';
import { X, Smartphone, Apple, ChevronRight, Home, Share, MoreVertical, Plus } from 'lucide-react';

export default function PWAInstallPrompt() {
    const [show, setShow] = useState(false);
    const [device, setDevice] = useState<'android' | 'ios' | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Only show on mobile and if not already dismissed
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const dismissed = localStorage.getItem('nitro_pwa_prompt_dismissed');

        if (isMobile && !dismissed && !standalone) {
            // Delay showing for better UX
            const timer = setTimeout(() => setShow(true), 3000);
            return () => clearTimeout(timer);
        }

        // Add event listener for manual trigger
        const handleManualTrigger = () => {
            setShow(true);
            setDevice(null);
        };

        window.addEventListener('nitro_show_pwa_prompt', handleManualTrigger);
        return () => window.removeEventListener('nitro_show_pwa_prompt', handleManualTrigger);
    }, []);

    const dismiss = () => {
        localStorage.setItem('nitro_pwa_prompt_dismissed', 'true');
        setShow(false);
    };

    if (!show || isStandalone) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="relative p-6 pb-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                    <button
                        onClick={dismiss}
                        className="absolute top-4 right-4 p-2 rounded-full bg-[var(--background)]/50 hover:bg-[var(--background)] transition-colors"
                    >
                        <X size={18} className="text-[var(--foreground-muted)]" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg">
                            <Home size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--foreground)]">Install Nitro App</h2>
                            <p className="text-sm text-[var(--foreground-muted)]">Add to your home screen for the best experience</p>
                        </div>
                    </div>
                </div>

                {/* Device Selection */}
                {!device && (
                    <div className="p-6 space-y-3">
                        <p className="text-xs text-[var(--foreground-muted)] text-center mb-4">Select your device to see instructions</p>

                        <button
                            onClick={() => setDevice('android')}
                            className="w-full flex items-center gap-4 p-4 bg-[var(--background)] hover:bg-[var(--card-hover)] rounded-2xl border border-[var(--border)] transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Smartphone size={24} className="text-emerald-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-bold text-[var(--foreground)]">Android</h3>
                                <p className="text-xs text-[var(--foreground-muted)]">Chrome, Samsung Browser</p>
                            </div>
                            <ChevronRight size={20} className="text-[var(--foreground-muted)] group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => setDevice('ios')}
                            className="w-full flex items-center gap-4 p-4 bg-[var(--background)] hover:bg-[var(--card-hover)] rounded-2xl border border-[var(--border)] transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-zinc-500/20 flex items-center justify-center">
                                <Apple size={24} className="text-zinc-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-bold text-[var(--foreground)]">iPhone / iPad</h3>
                                <p className="text-xs text-[var(--foreground-muted)]">Safari Browser</p>
                            </div>
                            <ChevronRight size={20} className="text-[var(--foreground-muted)] group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}

                {/* Android Instructions */}
                {device === 'android' && (
                    <div className="p-6">
                        <button onClick={() => setDevice(null)} className="text-xs text-cyan-400 mb-4 flex items-center gap-1">
                            ← Back
                        </button>
                        <h3 className="font-bold text-[var(--foreground)] mb-4">Android Installation</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
                                <div>
                                    <p className="font-medium text-[var(--foreground)] text-sm">Tap the menu button</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Look for <MoreVertical size={12} className="inline" /> (three dots) in the top right corner</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">2</div>
                                <div>
                                    <p className="font-medium text-[var(--foreground)] text-sm">Select "Add to Home screen"</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Or "Install app" if available</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">3</div>
                                <div>
                                    <p className="font-medium text-[var(--foreground)] text-sm">Tap "Add" to confirm</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Nitro will appear on your home screen!</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={dismiss} className="w-full mt-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold transition-colors">
                            Got it!
                        </button>
                    </div>
                )}

                {/* iOS Instructions */}
                {device === 'ios' && (
                    <div className="p-6">
                        <button onClick={() => setDevice(null)} className="text-xs text-cyan-400 mb-4 flex items-center gap-1">
                            ← Back
                        </button>
                        <h3 className="font-bold text-[var(--foreground)] mb-4">iPhone / iPad Installation</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
                                <div>
                                    <p className="font-medium text-[var(--foreground)] text-sm">Open in Safari</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">This feature only works in Safari browser</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">2</div>
                                <div>
                                    <p className="font-medium text-[var(--foreground)] text-sm">Tap the Share button</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Look for <Share size={12} className="inline" /> at the bottom of the screen</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">3</div>
                                <div>
                                    <p className="font-medium text-[var(--foreground)] text-sm">Tap "Add to Home Screen"</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Scroll down in the share menu to find it</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">4</div>
                                <div>
                                    <p className="font-medium text-[var(--foreground)] text-sm">Tap "Add" to confirm</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Nitro will appear on your home screen!</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={dismiss} className="w-full mt-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-colors">
                            Got it!
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
