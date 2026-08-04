import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { VedicReadingAppView } from '@/components/vedic-reading/VedicReadingAppView'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { birthFormToKundli } from '@/lib/birthForm'
import { getVedicReading } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function VedicReadingPage() {
  const { hi, lang } = useLang()
  const { form } = useBirthProfile()
  const input = useMemo(() => birthFormToKundli(form), [form])
  const profileReady = !!(input.dob && input.place?.trim())
  const q = useQuery({
    queryKey: ['vedic-reading', input, lang],
    queryFn: () => getVedicReading(input),
    enabled: profileReady,
    staleTime: 300_000,
  })

  return (
    <FeaturePageShell route="/vedic-reading">
      <RequireAuth>
        <ProfileBirthHint />
        {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
        {q.isError ? (
          <ErrorState message={hi ? 'फलादेश लोड नहीं हुआ।' : 'Reading failed.'} onRetry={() => q.refetch()} />
        ) : null}
        {q.data ? <VedicReadingAppView data={q.data} /> : null}
      </RequireAuth>
    </FeaturePageShell>
  )
}
