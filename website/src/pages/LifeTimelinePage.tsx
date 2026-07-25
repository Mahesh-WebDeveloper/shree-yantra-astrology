import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { LifeTimelineAppView } from '@/components/life-timeline/LifeTimelineAppView'
import { birthFormToKundli } from '@/lib/birthForm'
import { getLifeTimeline } from '@/lib/api'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

export function LifeTimelinePage() {
  const { hi, lang } = useLang()
  const { form } = useBirthProfile()
  const input = useMemo(() => birthFormToKundli(form), [form])
  const q = useQuery({
    queryKey: ['life-timeline', input, lang],
    queryFn: () => getLifeTimeline(input),
    staleTime: 120_000,
  })

  return (
    <FeaturePageShell route="/life-timeline" titleEn="Life Timeline" titleHi="जीवन समयरेखा">
      <RequireAuth>
        <ProfileBirthHint />
        {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
        {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
        {q.data ? <LifeTimelineAppView data={q.data} /> : null}
      </RequireAuth>
    </FeaturePageShell>
  )
}
