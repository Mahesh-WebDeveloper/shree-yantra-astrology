import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { GocharAppView } from '@/components/gochar/GocharAppView'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { birthFormToKundli } from '@/lib/birthForm'
import { getGochar } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function GocharPage() {
  const { hi, lang } = useLang()
  const { form } = useBirthProfile()
  const input = useMemo(() => birthFormToKundli(form), [form])
  const profileReady = !!(input.dob && input.place?.trim())
  const q = useQuery({
    queryKey: ['gochar', input, lang],
    queryFn: () => getGochar(input),
    enabled: profileReady,
    staleTime: 60_000,
  })

  return (
    <FeaturePageShell route="/gochar" titleEn="Gochar · Transits" titleHi="गोचर">
      <RequireAuth>
        <ProfileBirthHint />
        {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
        {q.isError ? (
          <ErrorState message={hi ? 'गोचर लोड नहीं हुआ।' : 'Could not load gochar.'} onRetry={() => q.refetch()} />
        ) : null}
        {q.data ? <GocharAppView data={q.data} /> : null}
      </RequireAuth>
    </FeaturePageShell>
  )
}
