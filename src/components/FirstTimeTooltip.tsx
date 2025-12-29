"use client";
import { useState, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface TooltipConfig {
    id: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface FirstTimeTooltipProps {
    id: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    children: ReactNode;
    className?: string;
}

const STORAGE_KEY = 'nitro_tooltips_seen';

function getSeenTooltips(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}

function markTooltipSeen(id: string) {
    const seen = getSeenTooltips();
    seen.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

export default function FirstTimeTooltip({
    id,
    content,
    position = 'top',
    children,
    className = ''
}: FirstTimeTooltipProps) {
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        // Check after a small delay for better UX
        const timer = setTimeout(() => {
            const seen = getSeenTooltips();
            if (!seen.has(id)) {
                setDismissed(false);
                setShow(true);

                // Auto-dismiss after 8 seconds
                const autoHide = setTimeout(() => {
                    handleDismiss();
                }, 8000);

                return () => clearTimeout(autoHide);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [id]);

    const handleDismiss = () => {
        setShow(false);
        markTooltipSeen(id);
        setTimeout(() => setDismissed(true), 300);
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-cyan-500/80',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-cyan-500/80',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-cyan-500/80',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-cyan-500/80',
    };

    return (
        <div className={`relative ${className}`}>
            {children}

            {!dismissed && (
                <div
                    className={`absolute z-[200] ${positionClasses[position]} transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                    <div className="relative bg-gradient-to-r from-cyan-500/90 to-purple-500/90 backdrop-blur-xl text-white px-4 py-2.5 rounded-xl shadow-2xl shadow-cyan-500/30 max-w-[200px] border border-white/20">
                        {/* Pulsing Glow */}
                        <div className="absolute inset-0 bg-cyan-400/20 rounded-xl animate-pulse" />

                        {/* Content */}
                        <div className="relative z-10 flex items-start gap-2">
                            <p className="text-[11px] font-medium leading-relaxed flex-1">{content}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                                className="p-0.5 hover:bg-white/20 rounded transition-colors shrink-0"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        {/* Arrow */}
                        <div className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`} />
                    </div>
                </div>
            )}
        </div>
    );
}

// Hook to reset all tooltips (for testing)
export function useResetTooltips() {
    return () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('nitro_feature_cards_seen');
        window.location.reload();
    };
}
