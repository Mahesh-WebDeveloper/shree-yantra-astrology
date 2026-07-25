import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { VerseExplainBlock } from '@/components/content/VerseExplainBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRigSukta, getRigvedaExplanation } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function RigvedaSuktaPage() {
  const { hi } = useLang()
  const { mandala = '1', sukta = '1' } = useParams()
  const m = Number(mandala)
  const s = Number(sukta)
  const q = useQuery({
    queryKey: ['rig-sukta', m, s],
    queryFn: () => getRigSukta(m, s),
    enabled: m > 0 && s > 0,
    staleTime: 600_000,
  })

  return (
    <FeaturePageShell route="/library">
      <Link to={`/rigveda/${m}`} className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'सूक्त सूची' : 'Suktas'}
      </Link>
      <h2 className="font-display mb-4 text-center text-lg font-semibold">
        {hi ? 'सूक्त' : 'Sukta'} {m}.{s}
      </h2>
      {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
      <div className="space-y-4">
        {q.data?.sukta.mantras.map((v) => (
          <article key={v.verse} className="sy-stat-tile">
            <p className="text-xs font-bold text-[var(--sy-accent)]">
              {hi ? 'मंत्र' : 'Mantra'} {m}.{s}.{v.verse}
            </p>
            <p className="font-deva mt-2 text-lg leading-relaxed">{v.sanskrit}</p>
            {v.transliteration ? <p className="mt-2 text-sm italic text-[var(--sy-text-soft)]">{v.transliteration}</p> : null}
            {v.hindi ? <p className="mt-2 text-sm leading-relaxed">{v.hindi}</p> : null}
            {v.english ? <p className="mt-2 text-sm leading-relaxed text-[var(--sy-text-soft)]">{v.english}</p> : null}
            <VerseExplainBlock fetcher={() => getRigvedaExplanation(m, s, v.verse)} />
          </article>
        ))}
      </div>
    </FeaturePageShell>
  )
}
