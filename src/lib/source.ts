/**
 * Music-source routing (JioSaavn Official & Ultra-Fast Direct CDN).
 */

export type MusicSource = 'jiosaavn'

export const SAAVN_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '')
export const YT_BASE = SAAVN_BASE

/** Base URL for API. */
export function apiBaseFor(_source?: string): string {
  return SAAVN_BASE
}

/**
 * Returns 'jiosaavn' as the primary high-speed music source.
 */
export function getMusicSource(): MusicSource {
  return 'jiosaavn'
}

/** Placeholder for legacy YouTube stream url, safely returns empty or Saavn */
export function ytStreamUrl(_id: string): string {
  return ''
}

export function prefetchYtStream(_song: any): void {
  // No-op: JioSaavn uses direct high-speed CDN audio URLs
}

/**
 * Build a backend URL for API requests.
 */
export function sourceUrl(path: string, _source?: any): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SAAVN_BASE}/api${p}`
}
