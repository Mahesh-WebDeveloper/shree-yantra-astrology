import { useMemo } from 'react'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useResolvedLocation } from '@/hooks/useResolvedLocation'
import { DEFAULT_PANCHANG } from '@/lib/location'

export type PanchangWhere = { place?: string; lat?: number; lng?: number; tz: string }

/** Same as mobile `locationForPanchang`: GPS coords when available, else profile place (not birth form UI). */
export function usePanchangLocation() {
  const locQ = useResolvedLocation()
  const { form } = useBirthProfile()

  return useMemo(() => {
    const tz = form.tz?.trim() || DEFAULT_PANCHANG.tz
    if (!locQ.isFetched) {
      return { ready: false as const, tz, placeLabel: '', where: null as PanchangWhere | null }
    }

    const gps = locQ.data
    if (gps?.fromGps && gps.lat != null && gps.lng != null) {
      return {
        ready: true as const,
        tz,
        placeLabel: gps.city || (gps.fromGps ? 'Your location' : DEFAULT_PANCHANG.place),
        where: { lat: gps.lat, lng: gps.lng, tz } satisfies PanchangWhere,
      }
    }

    const place = form.place?.trim() || DEFAULT_PANCHANG.place
    return {
      ready: true as const,
      tz,
      placeLabel: place,
      where: { place, tz } satisfies PanchangWhere,
    }
  }, [locQ.isFetched, locQ.data, form.place, form.tz])
}
