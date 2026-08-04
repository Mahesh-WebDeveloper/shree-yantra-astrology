import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRamayanSargas } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function RamayanKandaPage() {
  const { hi } = useLang()
  const { kanda = '1' } = useParams()
  const k = Number(kanda)
  const q = useQuery({
    queryKey: ['ramayan-sargas', k],
    queryFn: () => getRamayanSargas(k),
    enabled: k > 0,
    staleTime: 600_000,
  })

  return (
    <FeaturePageShell route="/library">
      <Link to="/ramayan" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'काण्ड' : 'Kandas'}
      </Link>
      <h2 className="font-display mb-4 text-xl font-semibold">{q.data?.kanda || `Kanda ${k}`}</h2>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
      <ul className="grid gap-2 sm:grid-cols-2">
        {q.data?.sargas.map((s) => (
          <li key={s.sarga}>
            <Link
              to={`/ramayan/${k}/${s.sarga}`}
              className="sy-stat-tile block text-sm font-semibold text-[var(--sy-accent)] hover:underline"
            >
              {hi ? 'सर्ग' : 'Sarga'} {s.sarga} · {s.shlokaCount} {hi ? 'श्लोक' : 'shlokas'}
            </Link>
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}
