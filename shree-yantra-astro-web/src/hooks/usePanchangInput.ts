import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { resolveUserLocation } from '@/lib/location'

export function useLocationQuery() {
  return useQuery({
    queryKey: ['location'],
    queryFn: resolveUserLocation,
    staleTime: 30 * 60_000,
  })
}

export function panchangInputFromLocation(
  loc: Awaited<ReturnType<typeof resolveUserLocation>> | undefined,
) {
  if (!loc) return null
  if (loc.fromGps && loc.lat != null && loc.lng != null) {
    return { lat: loc.lat, lng: loc.lng, tz: '+05:30' as const }
  }
  return { place: loc.place || 'Jaipur', tz: '+05:30' as const }
}

export function usePanchangInput() {
  const locationQuery = useLocationQuery()
  const panchangInput = useMemo(
    () => panchangInputFromLocation(locationQuery.data),
    [locationQuery.data],
  )
  return { loc: locationQuery.data, locationQuery, panchangInput }
}
