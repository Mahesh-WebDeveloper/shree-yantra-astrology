import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { RemediesAppView } from '@/components/remedies/RemediesAppView'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { birthFormToKundli } from '@/lib/birthForm'
import { getRemedies } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function RemediesPage() {
  const { hi, lang } = useLang()
  const { form } = useBirthProfile()
  const input = useMemo(() => birthFormToKundli(form), [form])
  const q = useQuery({
    queryKey: ['remedies', input, lang],
    queryFn: () => getRemedies(input),
    staleTime: 120_000,
  })

  return (
    <FeaturePageShell route="/remedies" titleEn="Remedies · Upaay" titleHi="उपाय">
      <RequireAuth>
        <ProfileBirthHint />
        {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
        {q.isError ? (
          <ErrorState message={hi ? 'उपाय लोड नहीं हुए।' : 'Could not load remedies.'} onRetry={() => q.refetch()} />
        ) : null}
        {q.data ? <RemediesAppView data={q.data} /> : null}
      </RequireAuth>
    </FeaturePageShell>
  )
}
