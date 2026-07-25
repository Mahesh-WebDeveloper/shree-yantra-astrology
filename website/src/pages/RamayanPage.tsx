import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getMedia, getRamayanKandas } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function RamayanPage() {
  const { hi } = useLang()
  const kandasQ = useQuery({ queryKey: ['ramayan-kandas'], queryFn: () => getRamayanKandas(), staleTime: 600_000 })
  const audioQ = useQuery({
    queryKey: ['ramayan-audio'],
    queryFn: () => getMedia({ subCategory: 'ramayan_audio', limit: 120 }),
    staleTime: 600_000,
  })

  return (
    <FeaturePageShell route="/library" titleEn="Ramayana" titleHi="रामायण">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <div className="mb-6 text-center">
        <p className="font-deva text-2xl">ॐ</p>
        <h2 className="font-display mt-2 text-xl font-semibold text-[var(--sy-accent)]">
          {hi ? 'वाल्मीकि रामायण' : 'Valmiki Ramayana'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {hi ? '7 काण्ड · सर्ग · श्लोक (ऐप जैसा रीडर)' : '7 Kandas · sargas · shlokas (app-like reader)'}
        </p>
      </div>

      {audioQ.data?.items?.length ? (
        <div className="sy-stat-tile mb-6">
          <p className="font-semibold text-[var(--sy-accent)]">🎧 {hi ? 'रामायण ऑडियो कथा' : 'Ramayan audio katha'}</p>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {audioQ.data.items.slice(0, 8).map((m) => (
              <li key={m._id}>
                {m.audioUrl ? (
                  <audio controls preload="none" className="w-full" src={m.audioUrl}>
                    <track kind="captions" />
                  </audio>
                ) : null}
                <p className="text-xs text-[var(--sy-text-soft)]">{m.title}</p>
              </li>
            ))}
          </ul>
          {audioQ.data.items.length > 8 ? (
            <p className="mt-2 text-xs text-[var(--sy-text-muted)]">
              +{audioQ.data.items.length - 8} {hi ? 'और एपिसोड' : 'more episodes'}
            </p>
          ) : null}
        </div>
      ) : null}

      {kandasQ.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {kandasQ.isError ? (
        <ErrorState message={hi ? 'रामायण लोड नहीं हुआ।' : 'Could not load Ramayana.'} onRetry={() => kandasQ.refetch()} />
      ) : null}
      <ul className="space-y-2">
        {kandasQ.data?.kandas.map((k) => (
          <li key={k.kandaOrder}>
            <Link
              to={`/ramayan/${k.kandaOrder}`}
              className="sy-stat-tile flex items-center gap-4 hover:border-[var(--sy-accent)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-amber-600 font-bold text-[#1a1200]">
                {k.kandaOrder}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{k.kanda}</p>
                <p className="text-xs text-[var(--sy-text-muted)]">
                  {k.sargas} {hi ? 'सर्ग' : 'sargas'} · {k.shlokas} {hi ? 'श्लोक' : 'shlokas'}
                </p>
              </div>
              <span className="text-[var(--sy-accent)]">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}
