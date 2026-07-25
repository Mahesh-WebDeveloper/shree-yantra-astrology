import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ChoghadiyaAppView } from '@/components/choghadiya/ChoghadiyaAppView'
import { panchangDmyFromDate } from '@/components/panchang/PanchangAppView'
import { Skeleton } from '@/components/ui/Skeleton'
import { getSunTimes } from '@/lib/api'
import { stripChogDate, type SunTimes } from '@/lib/choghadiyaEngine'
import { usePanchangLocation } from '@/hooks/usePanchangLocation'
import { useLang } from '@/i18n/LangProvider'

export function ChoghadiyaPage() {
  const { hi } = useLang()
  const panchangLoc = usePanchangLocation()
  const [date, setDate] = useState(() => stripChogDate(new Date()))

  const where = panchangLoc.where
  const enabled = panchangLoc.ready && !!where

  const placeInput = useMemo(() => {
    if (!where) return null
    return { ...where, date: panchangDmyFromDate(date) }
  }, [where, date])

  const sunQ = useQuery({
    queryKey: ['choghadiya-sun', placeInput],
    queryFn: async () => {
      const tomorrow = new Date(date)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const [today, next] = await Promise.all([
        getSunTimes({ ...placeInput!, date: panchangDmyFromDate(date) }),
        getSunTimes({ ...placeInput!, date: panchangDmyFromDate(tomorrow) }),
      ])
      return {
        sun: { sunrise: today.sunrise, sunset: today.sunset } satisfies SunTimes,
        nextSunrise: next.sunrise,
      }
    },
    enabled: enabled && !!placeInput,
    staleTime: 30 * 60_000,
    retry: 1,
  })

  return (
    <FeaturePageShell route="/choghadiya">
      <p className="mb-3 text-sm text-[var(--sy-text-soft)]">
        {hi ?
          'ऐप जैसा — सूर्योदय/अस्त से 16 चौघड़िया, लाइव सक्रिय अवधि।'
        : 'Same as the app — 16 Choghadiya from sunrise/sunset with live active period.'}
      </p>

      {!panchangLoc.ready ?
        <Skeleton className="h-96 rounded-2xl" />
      : (
        <ChoghadiyaAppView
          selectedDate={date}
          onDateChange={setDate}
          sun={sunQ.data?.sun ?? null}
          nextSunrise={sunQ.data?.nextSunrise}
          placeLabel={panchangLoc.placeLabel}
          hi={hi}
        />
      )}
    </FeaturePageShell>
  )
}
