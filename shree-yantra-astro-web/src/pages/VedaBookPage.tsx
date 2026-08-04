import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { vedaCfg } from '@/data/vedaConfig'
import { getVedaSections } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function VedaBookPage() {
  const { hi } = useLang()
  const { veda = 'atharvaveda', book = '1' } = useParams()
  const b = Number(book)
  const cfg = vedaCfg(veda)
  const L = (o: { en: string; hi: string }) => (hi ? o.hi : o.en)
  const q = useQuery({
    queryKey: ['veda-sections', veda, b],
    queryFn: () => getVedaSections(veda, b),
    enabled: b > 0,
    staleTime: 600_000,
  })

  return (
    <FeaturePageShell route="/library">
      <Link to={`/veda/${veda}`} className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {L(cfg.title)}
      </Link>
      <h2 className="font-display mb-4 text-lg font-semibold">
        {L(cfg.bookLabel)} {b}
      </h2>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
      <ul className="grid gap-2 sm:grid-cols-2">
        {q.data?.sections.map((s) => (
          <li key={s.section}>
            <Link
              to={`/veda/${veda}/${b}/${s.section}`}
              className="sy-stat-tile block text-sm font-semibold text-[var(--sy-accent)] hover:underline"
            >
              {s.sectionName || `${L(cfg.sectionLabel)} ${s.section}`} · {s.verseCount} {L(cfg.verseLabel)}
            </Link>
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}
