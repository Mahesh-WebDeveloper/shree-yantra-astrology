import { useQuery } from '@tanstack/react-query'
import {
  getDailyShloka,
  getHoroscope,
  getPanchang,
} from '@/lib/api'
import { usePanchangInput } from '@/hooks/usePanchangInput'
import { useLang } from '@/i18n/LangProvider'

export function useHomeData() {
  const { lang } = useLang()
  const { loc, locationQuery, panchangInput } = usePanchangInput()

  const panchang = useQuery({
    queryKey: ['panchang', panchangInput, lang],
    queryFn: () => getPanchang(panchangInput!),
    enabled: !!panchangInput,
    staleTime: 5 * 60_000,
  })

  const shloka = useQuery({
    queryKey: ['daily-shloka'],
    queryFn: async () => (await getDailyShloka()).shloka,
    staleTime: 60 * 60_000,
  })

  const horoscope = useQuery({
    queryKey: ['horoscope', 'daily', panchangInput, lang],
    queryFn: () =>
      getHoroscope({
        period: 'daily',
        ...(loc?.fromGps && loc.lat != null && loc.lng != null
          ? { lat: loc.lat, lng: loc.lng }
          : { place: loc?.place || 'Jaipur' }),
      }),
    enabled: !!panchangInput,
    staleTime: 15 * 60_000,
  })

  return {
    loc,
    locationQuery,
    panchang,
    shloka,
    horoscope,
  }
}
