// colorExtract.ts
// Spotify-style dynamic theming: derive a dominant accent colour from a cover
// image so featured cards / headers can tint themselves to match the artwork.
//
// Cover images come from third-party CDNs (jiosaavn etc.) that usually DON'T send
// CORS headers, so reading pixels off a <canvas> throws a SecurityError. We try the
// real extraction first and gracefully fall back to a deterministic hash-based hue
// keyed off the image URL — stable per song, always pleasant, never blocks render.

export interface AccentColor {
  r: number;
  g: number;
  b: number;
}

const cache = new Map<string, AccentColor>();

// Nitro brand-leaning fallback palette (cyan / teal / purple / pink family) so the
// hash fallback still feels on-brand rather than random rainbow.
const FALLBACK_PALETTE: AccentColor[] = [
  { r: 14, g: 75, b: 86 },   // deep teal
  { r: 30, g: 58, b: 138 },  // indigo
  { r: 88, g: 28, b: 135 },  // purple
  { r: 131, g: 24, b: 67 },  // wine/pink
  { r: 15, g: 76, b: 60 },   // emerald-dark
  { r: 67, g: 56, b: 23 },   // amber-dark
  { r: 30, g: 41, b: 59 },   // slate
  { r: 76, g: 29, b: 49 },   // mauve
];

const hashString = (str: string): number => {
  const s = String(str ?? ''); // guard: callers may pass a non-string (e.g. a number id)
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const fallbackFor = (key: string): AccentColor =>
  FALLBACK_PALETTE[hashString(key) % FALLBACK_PALETTE.length];

// Clamp a colour into a "card background" range: keep its hue but darken/desaturate
// so white text always stays readable on top (Spotify does the same).
export const toCardTint = (c: AccentColor): AccentColor => {
  // Pull toward a darker version while preserving relative channel balance.
  const max = Math.max(c.r, c.g, c.b) || 1;
  const scale = Math.min(1, 120 / max); // cap brightest channel ~120
  return {
    r: Math.round(c.r * scale),
    g: Math.round(c.g * scale),
    b: Math.round(c.b * scale),
  };
};

export const tintGradient = (c: AccentColor): string => {
  const t = toCardTint(c);
  const darker = `rgb(${Math.round(t.r * 0.45)}, ${Math.round(t.g * 0.45)}, ${Math.round(t.b * 0.45)})`;
  return `linear-gradient(160deg, rgb(${t.r}, ${t.g}, ${t.b}) 0%, ${darker} 100%)`;
};

export const rgbString = (c: AccentColor, alpha = 1): string =>
  alpha >= 1 ? `rgb(${c.r}, ${c.g}, ${c.b})` : `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;

/**
 * Extract a dominant accent colour from an image URL.
 * Resolves fast: returns a deterministic fallback immediately on any failure
 * (CORS-tainted canvas, load error, SSR) and caches the result by URL.
 */
export const extractAccent = (url: string): Promise<AccentColor> => {
  if (!url) return Promise.resolve(fallbackFor('empty'));
  if (cache.has(url)) return Promise.resolve(cache.get(url)!);
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(fallbackFor(url));
  }

  return new Promise((resolve) => {
    const finish = (c: AccentColor) => {
      cache.set(url, c);
      resolve(c);
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    let settled = false;

    // Don't let a slow/blocked image hold up the UI.
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        finish(fallbackFor(url));
      }
    }, 2500);

    img.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        const size = 16;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return finish(fallbackFor(url));
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 125) continue;
          // Skip near-white / near-black pixels so the accent comes from the
          // saturated body of the artwork, not borders or letterboxing.
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (lum > 235 || lum < 18) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        if (count === 0) return finish(fallbackFor(url));
        finish({
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        });
      } catch {
        // Tainted canvas (no CORS headers) — fall back gracefully.
        finish(fallbackFor(url));
      }
    };

    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      finish(fallbackFor(url));
    };

    img.src = url;
  });
};
