import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRamayanExplanation, getRamayanSarga } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function RamayanSargaPage() {
  const { hi } = useLang()
  const { kanda = '1', sarga = '1' } = useParams()
  const k = Number(kanda)
  const s = Number(sarga)
  const q = useQuery({
    queryKey: ['ramayan-sarga', k, s],
    queryFn: () => getRamayanSarga(k, s),
    enabled: k > 0 && s > 0,
    staleTime: 600_000,
  })
  const [explainKey, setExplainKey] = useState<string | null>(null)
  const explain = useMutation({
    mutationFn: (shloka: string) => getRamayanExplanation(k, s, shloka),
  })

  return (
    <FeaturePageShell route="/library">
      <Link to={`/ramayan/${k}`} className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'सर्ग सूची' : 'Sargas'}
      </Link>
      <h2 className="font-display mb-4 text-lg font-semibold">
        {q.data?.sarga.kanda} · {hi ? 'सर्ग' : 'Sarga'} {s}
      </h2>
      {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
      <div className="space-y-4">
        {q.data?.sarga.shlokas.map((v) => (
          <article key={v.shloka} className="sy-stat-tile">
            <p className="text-xs font-bold text-[var(--sy-accent)]">
              {hi ? 'श्लोक' : 'Shloka'} {v.shloka}
            </p>
            <p className="font-deva mt-2 text-lg leading-relaxed">{v.sanskrit}</p>
            {v.transliteration ? <p className="mt-2 text-sm italic text-[var(--sy-text-soft)]">{v.transliteration}</p> : null}
            <p className="mt-2 text-[15px] leading-relaxed">{hi ? v.hindi || v.english : v.english || v.hindi}</p>
            <GoldButton
              type="button"
              className="mt-3 !px-3 !py-1.5 text-xs"
              disabled={explain.isPending}
              onClick={() => {
                setExplainKey(v.shloka)
                explain.mutate(v.shloka)
              }}
            >
              {hi ? 'AI व्याख्या' : 'AI explain'}
            </GoldButton>
            {explainKey === v.shloka && explain.data ? (
              <div className="mt-2 space-y-2 text-sm text-[var(--sy-text-soft)]">
                {explain.data.anuvad ? <p>{explain.data.anuvad}</p> : null}
                {explain.data.katha ? <p>{explain.data.katha}</p> : null}
                {explain.data.seekh ? <p>{explain.data.seekh}</p> : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </FeaturePageShell>
  )
}
