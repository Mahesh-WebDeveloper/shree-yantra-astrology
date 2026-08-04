import type { DailyShloka } from '@/lib/api'

export type ShlokaCoverColor = 'gold' | 'purple' | 'green' | 'blue' | 'rose'

const COVER_ACCENT: Record<ShlokaCoverColor, string> = {
  gold: '#c9922e',
  purple: '#6d5bd0',
  green: '#2d8a5c',
  blue: '#3b6ea8',
  rose: '#b84a6a',
}

export function shlokaCoverAccent(cover: string | undefined): string {
  const key = (cover || 'gold') as ShlokaCoverColor
  return COVER_ACCENT[key] ?? COVER_ACCENT.gold
}

/** Web route for “Read full chapter” — mirrors mobile `shloka.nav`. */
export function dailyShlokaChapterHref(nav?: DailyShloka['nav']): string | null {
  if (!nav?.screen) return null
  const p = nav.params ?? {}
  switch (nav.screen) {
    case 'GitaChapter':
      if (p.chapter != null) return `/library/gita/${p.chapter}`
      break
    case 'RigvedaSukta':
      if (p.mandala != null && p.sukta != null) return `/library/rigveda/${p.mandala}/${p.sukta}`
      break
    case 'VedaVerse':
      if (p.veda != null && p.book != null && p.section != null) {
        return `/library/veda/${encodeURIComponent(String(p.book))}/${p.section}?veda=${encodeURIComponent(String(p.veda))}`
      }
      break
    default:
      break
  }
  return '/library'
}

export function formatShlokaCoverTitle(hindi: string): string {
  return hindi.trim()
}
