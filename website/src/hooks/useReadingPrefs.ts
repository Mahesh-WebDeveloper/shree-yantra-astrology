import { useCallback, useEffect, useRef, useState } from 'react'

const KEY = 'sy.rashifal.reading'

export type ReadingScale = 0.9 | 1 | 1.15
export const READING_SCALES: readonly ReadingScale[] = [0.9, 1, 1.15] as const
export type ReadingWeight = 0 | 1 | 2

export interface ReadingPrefs {
  scale: ReadingScale
  weight: ReadingWeight
}

const DEFAULTS: ReadingPrefs = { scale: 1, weight: 0 }
let cached: ReadingPrefs | null = null

export function useReadingPrefs() {
  const [prefs, setPrefs] = useState<ReadingPrefs>(cached ?? DEFAULTS)
  const ref = useRef(prefs)
  ref.current = prefs

  useEffect(() => {
    if (cached) return
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const p = JSON.parse(raw) as Partial<ReadingPrefs & { bold?: boolean }>
      const scale = (READING_SCALES as readonly number[]).includes(p?.scale as number) ? (p.scale as ReadingScale) : DEFAULTS.scale
      const weight =
        p?.weight != null && [0, 1, 2].includes(p.weight) ?
          (p.weight as ReadingWeight)
        : p?.bold ?
          1
        : DEFAULTS.weight
      const next = { scale, weight }
      cached = next
      setPrefs(next)
    } catch {
      /* ignore */
    }
  }, [])

  const persist = useCallback((next: ReadingPrefs) => {
    cached = next
    setPrefs(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const stepScale = useCallback(
    (dir: 1 | -1) => {
      const i = READING_SCALES.indexOf(ref.current.scale)
      const nx = READING_SCALES[Math.min(READING_SCALES.length - 1, Math.max(0, i + dir))]
      if (nx !== ref.current.scale) persist({ ...ref.current, scale: nx })
    },
    [persist],
  )

  const stepWeight = useCallback(
    (dir: 1 | -1) => {
      const nx = Math.min(2, Math.max(0, ref.current.weight + dir)) as ReadingWeight
      if (nx !== ref.current.weight) persist({ ...ref.current, weight: nx })
    },
    [persist],
  )

  return { scale: prefs.scale, weight: prefs.weight, stepScale, stepWeight }
}

export function readingClass(scale: number, weight: ReadingWeight): string {
  const size =
    weight === 2 ? 'font-semibold'
    : weight === 1 ? 'font-medium'
    : 'font-normal'
  return `${size} rashifal-reading rashifal-reading--scale-${String(scale).replace('.', '-')}`
}
