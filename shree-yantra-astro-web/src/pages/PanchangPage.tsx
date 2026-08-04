import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PanchangAppView, PanchangDateNav, panchangDmyFromDate } from '@/components/panchang/PanchangAppView'
import { getObservanceCatalog, getPanchang, getPanchangFestivals } from '@/lib/api'
import { usePanchangLocation } from '@/hooks/usePanchangLocation'
import { useLang } from '@/i18n/LangProvider'

const OBS_CATALOG_KEY = 'sy.obs.catalog'

export function PanchangPage() {
  const { hi, lang } = useLang()
  const panchangLoc = usePanchangLocation()
  const [viewDate, setViewDate] = useState(() => new Date())

  const request = useMemo(() => {
    if (!panchangLoc.ready || !panchangLoc.where) return null
    return {
      ...panchangLoc.where,
      date: panchangDmyFromDate(viewDate),
    }
  }, [panchangLoc, viewDate])

  const enabled = !!request
  const isToday = panchangDmyFromDate(viewDate) === panchangDmyFromDate(new Date())

  const panchangQ = useQuery({
    queryKey: ['panchang-page', request],
    queryFn: () => getPanchang(request!),
    enabled,
    staleTime: 5 * 60_000,
    refetchInterval: isToday ? 60_000 : false,
  })

  const festivalsQ = useQuery({
    queryKey: ['panchang-festivals', request],
    queryFn: () => getPanchangFestivals({ ...request!, days: 8 }),
    enabled: enabled && panchangQ.isSuccess,
    staleTime: 30 * 60_000,
  })

  const catalogQ = useQuery({
    queryKey: ['obs-catalog'],
    queryFn: async () => {
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem(OBS_CATALOG_KEY)
          if (raw) {
            const parsed = JSON.parse(raw) as { items?: unknown[] }
            if (parsed?.items?.length) return { items: parsed.items as Awaited<ReturnType<typeof getObservanceCatalog>>['items'] }
          }
        } catch {
          /* ignore */
        }
      }
      const r = await getObservanceCatalog()
      if (typeof localStorage !== 'undefined' && r.items?.length) {
        try {
          localStorage.setItem(OBS_CATALOG_KEY, JSON.stringify(r))
        } catch {
          /* ignore */
        }
      }
      return r
    },
    staleTime: 24 * 60 * 60_000,
  })

  const placeLabel = panchangLoc.placeLabel
  const where = panchangLoc.where

  return (
    <FeaturePageShell route="/panchang">
      <p className="mb-3 text-sm text-[var(--sy-text-soft)]">
        {hi ?
          'ऐप जैसा — आपकी वर्तमान स्थिति से लाइव पंचांग, पाँच अंग, मुहूर्त, त्योहार खोज।'
        : 'Same as the app — live panchang for your location, five limbs, muhurat & festival search.'}
      </p>
      {panchangLoc.ready && placeLabel ?
        <p className="mb-3 text-xs font-semibold text-[var(--sy-accent)]">📍 {placeLabel}</p>
      : null}

      <PanchangDateNav
        date={viewDate}
        onDateChange={setViewDate}
        weekday={panchangQ.data ? (hi ? panchangQ.data.weekdayHi || panchangQ.data.weekday : panchangQ.data.weekday) : undefined}
        hi={hi}
      />

      <div className="mt-6">
        {!panchangLoc.ready ? <Skeleton className="h-64 rounded-2xl" /> : null}
        {panchangLoc.ready && panchangQ.isLoading && !panchangQ.data ? <Skeleton className="h-64 rounded-2xl" /> : null}
        {panchangQ.isError ?
          <ErrorState message={hi ? 'पंचांग लोड नहीं हो पाया।' : 'Could not load panchang.'} onRetry={() => panchangQ.refetch()} />
        : panchangQ.data && where ?
          <PanchangAppView
            data={panchangQ.data}
            hi={hi}
            placeLabel={placeLabel}
            festivals={festivalsQ.data?.items || []}
            obsCatalog={catalogQ.data?.items || []}
            where={where}
            lang={lang}
          />
        : null}
      </div>
    </FeaturePageShell>
  )
}
