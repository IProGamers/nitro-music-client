import { useEffect, useState } from 'react';

/**
 * Bottom-sheet open/close animation helper.
 *
 * Mirrors the slide that was perfected on the Audio FX panel:
 *  - `render`  — keep the element mounted during the closing animation
 *  - `show`    — drives the transform/opacity (translate-y-full ⇄ translate-y-0)
 *  - `requestClose` — plays the slide-down first, THEN calls onClose
 *
 * The double requestAnimationFrame on open is essential: a freshly-mounted
 * element that changes class in the same frame skips its transition, so we let
 * the browser paint the off-screen state first, then flip `show`.
 */
export function useSheet(isOpen: boolean, onClose: () => void, duration = 300) {
    const [render, setRender] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
        } else {
            setShow(false);
            const t = setTimeout(() => setRender(false), duration + 20);
            return () => clearTimeout(t);
        }
    }, [isOpen, duration]);

    useEffect(() => {
        if (!render) return;
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShow(true)); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, [render]);

    const requestClose = () => { setShow(false); setTimeout(onClose, duration); };

    return { render, show, requestClose };
}
