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
 * Mirrors the SettingsContext localStorage key. Defaults to youtube on the
 * server / before hydration (JioSaavn is the backup, only when explicitly chosen).
 */
export function getMusicSource(): MusicSource {
  // Default is YouTube Music; JioSaavn only when the user explicitly picked it.
  if (typeof window === 'undefined') return 'youtube'
  try {
    return localStorage.getItem('nitro_setting_source') === 'jiosaavn' ? 'jiosaavn' : 'youtube'
  } catch {
    return 'youtube'
  }
}

/** Absolute audio-stream URL for a YouTube song id (always the YT host). */
export function ytStreamUrl(id: string): string {
  return `${YT_BASE}/api/youtube/stream?id=${encodeURIComponent(String(id))}`
}

// Warm the server-side stream-URL cache so the next /stream request is instant
// (yt-dlp resolution takes ~2s cold). Fire-and-forget; de-duped per id.
const ytPrefetched = new Set<string>()
export function prefetchYtStream(song: any): void {
  if (typeof window === 'undefined' || !song || song.source !== 'youtube') return
  const id = String(song.id || song.songId || '')
  if (!id || ytPrefetched.has(id)) return
  ytPrefetched.add(id)
  // Drop from the set after a while so it can be re-warmed once the URL expires.
  setTimeout(() => ytPrefetched.delete(id), 30 * 60 * 1000)
  fetch(`${YT_BASE}/api/youtube/resolve?id=${encodeURIComponent(id)}`).catch(() => {
    ytPrefetched.delete(id)
  })
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
