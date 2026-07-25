import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { VerseExplainBlock } from '@/components/content/VerseExplainBlock'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRcmExplanation, getRcmKanda } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

const PAGE = 50

export function RamcharitmanasKandaPage() {
  const { hi } = useLang()
  const { kanda = '1' } = useParams()
  const k = Number(kanda)
  const [limit, setLimit] = useState(PAGE)
  const q = useQuery({
    queryKey: ['rcm-kanda', k],
    queryFn: () => getRcmKanda(k),
    enabled: k > 0,
    staleTime: 600_000,
  })

  const shown = useMemo(() => q.data?.kanda.verses.slice(0, limit) ?? [], [q.data, limit])
  const hasMore = q.data ? limit < q.data.kanda.verses.length : false

  return (
    <FeaturePageShell route="/library">
      <Link to="/ramcharitmanas" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'काण्ड' : 'Kands'}
      </Link>
      <h2 className="font-deva mb-4 text-center text-xl font-semibold">{q.data?.kanda.kandaHindi}</h2>
      {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
      <div className="space-y-4">
        {shown.map((v, i) => (
          <article key={i} className="sy-stat-tile">
            <p className="text-xs font-bold text-[var(--sy-accent)]">
              {v.type ? `${v.type} · ` : ''}
              {v.number}
            </p>
            <p className="font-deva mt-3 text-center text-lg leading-loose">{v.text}</p>
            <VerseExplainBlock fetcher={() => getRcmExplanation(k, v.number)} />
          </article>
        ))}
      </div>
      {hasMore ? (
        <GoldButton type="button" className="mt-6 w-full" onClick={() => setLimit((n) => n + PAGE)}>
          {hi ? 'और देखें' : 'Load more'}
        </GoldButton>
      ) : null}
    </FeaturePageShell>
  )
}
