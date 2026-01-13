"use client"

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-cyan-400 gap-4">
            <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-cyan-500/20 animate-ping" />
                {/* Spinner */}
                <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
            <p className="text-[var(--foreground-muted)] text-sm font-medium animate-pulse">
                Loading...
            </p>
        </div>
    );
}
