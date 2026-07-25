import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRigSuktas } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function RigvedaMandalaPage() {
  const { hi } = useLang()
  const { mandala = '1' } = useParams()
  const m = Number(mandala)
  const q = useQuery({
    queryKey: ['rig-suktas', m],
    queryFn: () => getRigSuktas(m),
    enabled: m > 0,
    staleTime: 600_000,
  })

  return (
    <FeaturePageShell route="/library">
      <Link to="/rigveda" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'मंडल' : 'Mandalas'}
      </Link>
      <h2 className="font-display mb-4 text-xl font-semibold">
        {hi ? 'मंडल' : 'Mandala'} {m}
      </h2>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
      <ul className="grid gap-2 sm:grid-cols-2">
        {q.data?.suktas.map((s) => (
          <li key={s.sukta}>
            <Link
              to={`/rigveda/${m}/${s.sukta}`}
              className="sy-stat-tile block text-sm font-semibold text-[var(--sy-accent)] hover:underline"
            >
              {hi ? 'सूक्त' : 'Sukta'} {s.sukta} · {s.mantraCount} {hi ? 'मंत्र' : 'mantras'}
            </Link>
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}
