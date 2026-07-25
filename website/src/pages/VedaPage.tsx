import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { vedaCfg } from '@/data/vedaConfig'
import { getVedaBooks } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function VedaPage() {
  const { hi } = useLang()
  const { veda = 'atharvaveda' } = useParams()
  const cfg = vedaCfg(veda)
  const L = (o: { en: string; hi: string }) => (hi ? o.hi : o.en)
  const q = useQuery({
    queryKey: ['veda-books', veda],
    queryFn: () => getVedaBooks(veda),
    staleTime: 600_000,
  })

  return (
    <FeaturePageShell route="/library">
      <Link to="/vedas" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'वेद व पुराण' : 'Vedas & Puranas'}
      </Link>
      <div className="mb-6 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--sy-accent)]">{L(cfg.title)}</h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">{L(cfg.subtitle)}</p>
      </div>

      {veda === 'mahabharata' ? (
        <Link to="/audio/mahabharat_audio" className="sy-stat-tile mb-4 flex items-center gap-3 font-semibold text-[var(--sy-accent)]">
          🎧 {hi ? 'महाभारत ऑडियो कथा' : 'Mahabharat Audio Katha'}
          <span className="ml-auto">→</span>
        </Link>
      ) : null}

      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'लोड विफल' : 'Load failed'} onRetry={() => q.refetch()} /> : null}
      <ul className="space-y-2">
        {q.data?.books.map((b) => {
          const to =
            cfg.hasSections && b.sections > 1
              ? `/veda/${veda}/${b.book}`
              : `/veda/${veda}/${b.book}/1`
          return (
            <li key={b.book}>
              <Link to={to} className="sy-stat-tile flex items-center gap-3 hover:border-[var(--sy-accent)]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-[var(--sy-accent)]">
                  {b.book}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{b.bookName || `${L(cfg.bookLabel)} ${b.book}`}</p>
                  <p className="text-xs text-[var(--sy-text-muted)]">
                    {b.sections} {L(cfg.sectionLabel)} · {b.verses} {L(cfg.verseLabel)}
                  </p>
                </div>
                <span className="text-[var(--sy-accent)]">→</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </FeaturePageShell>
  )
}
