/**
 * Dual music-source routing.
 *
 * The two backends are hosted separately in production:
 *   - JioSaavn  → Vercel (serverless)            NEXT_PUBLIC_API_URL
 *   - YouTube   → Hugging Face Space (persistent) NEXT_PUBLIC_YT_API_URL
 *
 * Locally both live on the same server (localhost:3000), so YT_BASE falls back
 * to SAAVN_BASE when NEXT_PUBLIC_YT_API_URL is unset.
 */

export type MusicSource = 'jiosaavn' | 'youtube'

export const SAAVN_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '')
export const YT_BASE = (process.env.NEXT_PUBLIC_YT_API_URL || SAAVN_BASE).replace(/\/$/, '')

/** Base URL for a given source. */
export function apiBaseFor(source: MusicSource): string {
  return source === 'youtube' ? YT_BASE : SAAVN_BASE
}

/**
 * Read the user's selected source outside React (lib code, fetch helpers).
 * Mirrors the SettingsContext localStorage key. Defaults to jiosaavn on the
 * server / before hydration.
 */
export function getMusicSource(): MusicSource {
  if (typeof window === 'undefined') return 'jiosaavn'
  try {
    return localStorage.getItem('nitro_setting_source') === 'youtube' ? 'youtube' : 'jiosaavn'
  } catch {
    return 'jiosaavn'
  }
}

/** Absolute audio-stream URL for a YouTube song id (always the YT host). */
export function ytStreamUrl(id: string): string {
  return `${YT_BASE}/api/youtube/stream?id=${encodeURIComponent(String(id))}`
}

/**
 * Build a backend URL for the CURRENT (or given) source. Pass a logical path
 * WITHOUT the /api prefix or the youtube namespace, e.g.
 *   sourceUrl('/search/songs?query=x')         -> picks source from settings
 *   sourceUrl('/modules', 'youtube')           -> YT_BASE/api/youtube/modules
 *   sourceUrl('/search/songs?...', 'jiosaavn') -> SAAVN_BASE/api/search/songs
 */
export function sourceUrl(path: string, source: MusicSource = getMusicSource()): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (source === 'youtube') return `${YT_BASE}/api/youtube${p}`
  return `${SAAVN_BASE}/api${p}`
}
