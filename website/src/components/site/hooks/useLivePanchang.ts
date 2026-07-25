import { useCallback, useEffect, useRef, useState } from 'react'
import { getPanchang, type PanchangResponse } from '@/lib/api'

const STALE_MS = 5 * 60 * 1000

type CacheEntry = { at: number; data: PanchangResponse }
/** Module-level cache so switching cities back and forth is instant. */
const cache = new Map<string, CacheEntry>()

/** Today in the app's DD/MM/YYYY convention (visitor's local calendar day). */
export function todayDmy(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export type LiveState = {
  data: PanchangResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Live panchang for a city, straight from the production engine.
 * Never falls back to placeholder values — an error stays an error.
 */
export function useLivePanchang(place: string, date: string): LiveState {
  const key = `${place}|${date}`
  const cached = cache.get(key)
  const fresh = cached && Date.now() - cached.at < STALE_MS

  const [data, setData] = useState<PanchangResponse | null>(cached?.data ?? null)
  const [loading, setLoading] = useState(!fresh)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const reqId = useRef(0)

  useEffect(() => {
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < STALE_MS) {
      setData(hit.data)
      setLoading(false)
      setError(null)
      return
    }

    const id = ++reqId.current
    setLoading(true)
    setError(null)
    if (!hit) setData(null)

    getPanchang({ place, date })
      .then((res) => {
        if (reqId.current !== id) return
        cache.set(key, { at: Date.now(), data: res })
        setData(res)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (reqId.current !== id) return
        setData(null)
        setError(e instanceof Error ? e.message : 'request-failed')
        setLoading(false)
      })
  }, [key, place, date, nonce])

  const refetch = useCallback(() => {
    cache.delete(key)
    setNonce((n) => n + 1)
  }, [key])

  return { data, loading, error, refetch }
}
