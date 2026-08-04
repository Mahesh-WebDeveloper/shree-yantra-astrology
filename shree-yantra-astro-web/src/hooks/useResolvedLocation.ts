import { useQuery } from '@tanstack/react-query'
import { resolveUserLocation } from '@/lib/location'

export function useResolvedLocation() {
  return useQuery({
    queryKey: ['user-location'],
    queryFn: resolveUserLocation,
    staleTime: 600_000,
  })
}
