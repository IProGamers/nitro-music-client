"use client"

import { useEffect, useRef, useState } from 'react';

/**
 * MarqueeText — shows text normally, but if it's too wide for its container it
 * gently scrolls (à la Spotify / Apple Music now-playing) instead of just
 * clipping with an ellipsis. Falls back to a clean truncate when it fits.
 */
export default function MarqueeText({
    text,
    className = '',
    speed = 40, // pixels per second
}: {
    text: string;
    className?: string;
    speed?: number;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);
    const [overflow, setOverflow] = useState(false);
    const [duration, setDuration] = useState(10);

    useEffect(() => {
        const container = containerRef.current;
        const measure = measureRef.current;
        if (!container || !measure) return;

        const check = () => {
            const textW = measure.scrollWidth;
            const boxW = container.clientWidth;
            const over = textW > boxW + 4;
            setOverflow(over);
            if (over) setDuration(Math.max(6, (textW + 48) / speed));
        };

        check();
        const ro = new ResizeObserver(check);
        ro.observe(container);
        return () => ro.disconnect();
    }, [text, speed]);

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
            {/* Hidden measurer — always present so we can detect overflow */}
            <span ref={measureRef} className="invisible absolute whitespace-nowrap pointer-events-none" aria-hidden="true">
                {text}
            </span>

            {overflow ? (
                <div
                    className="inline-flex whitespace-nowrap will-change-transform animate-marquee"
                    style={{ animationDuration: `${duration}s` }}
                >
                    <span className="pr-12">{text}</span>
                    <span className="pr-12" aria-hidden="true">{text}</span>
                </div>
            ) : (
                <span className="block truncate whitespace-nowrap">{text}</span>
            )}
        </div>
    );
}
