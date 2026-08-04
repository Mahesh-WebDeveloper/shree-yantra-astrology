import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { birthFormToKundli, htmlDateToDob } from '@/lib/birthForm'
import { getBrihatKundli } from '@/lib/api'
import { BrihatKundliAppView } from '@/components/brihat-kundli/BrihatKundliAppView'
import { useLang } from '@/i18n/LangProvider'

export function BrihatKundliPage() {
  const { hi, lang } = useLang()
  const { form } = useBirthProfile()
  const input = useMemo(() => birthFormToKundli(form), [form])
  const person = useMemo(
    () =>
      form.dobHtml && form.place ?
        {
          name: form.name || undefined,
          dob: htmlDateToDob(form.dobHtml),
          tob: form.tob || '06:00',
          place: form.place,
        }
      : null,
    [form],
  )
  const q = useQuery({
    queryKey: ['brihat-kundli', input, lang],
    queryFn: () => getBrihatKundli(input),
    staleTime: 300_000,
  })

  return (
    <FeaturePageShell route="/brihat-kundli">
      <RequireAuth>
        <ProfileBirthHint />
        {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
        {q.isError ? <ErrorState message={hi ? 'रिपोर्ट विफल।' : 'Report failed.'} onRetry={() => q.refetch()} /> : null}
        {q.data ? <BrihatKundliAppView report={q.data} person={person} /> : null}
      </RequireAuth>
    </FeaturePageShell>
  )
}
