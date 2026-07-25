import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { birthFormToKundli } from '@/lib/birthForm'
import { getTransitForecast } from '@/lib/api'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'
import { TransitForecastAppView } from '@/components/transit-forecast/TransitForecastAppView'

export function TransitForecastPage() {
  const { hi, lang } = useLang()
  const { form } = useBirthProfile()
  const input = useMemo(() => birthFormToKundli(form), [form])
  const q = useQuery({
    queryKey: ['transit-forecast', input, lang],
    queryFn: () => getTransitForecast(input),
    staleTime: 120_000,
  })

  return (
    <FeaturePageShell route="/transit-forecast" titleEn="Year Forecast" titleHi="वार्षिक गोचर">
      <RequireAuth>
        <ProfileBirthHint />
        {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
        {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
        {q.data ? <TransitForecastAppView data={q.data} /> : null}
      </RequireAuth>
    </FeaturePageShell>
  )
}
