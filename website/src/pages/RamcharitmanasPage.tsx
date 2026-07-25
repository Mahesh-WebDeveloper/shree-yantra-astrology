import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRcmKandas } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function RamcharitmanasPage() {
  const { hi } = useLang()
  const q = useQuery({ queryKey: ['rcm-kandas'], queryFn: () => getRcmKandas(), staleTime: 600_000 })

  return (
    <FeaturePageShell route="/library" titleEn="Ramcharitmanas" titleHi="श्रीरामचरितमानस">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <div className="mb-6 text-center">
        <p className="font-deva text-2xl">ॐ</p>
        <h2 className="font-display mt-2 text-xl font-semibold text-[var(--sy-accent)]">
          {hi ? 'श्रीरामचरितमानस' : 'Ramcharitmanas'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {hi ? 'गोस्वामी तुलसीदास · 7 काण्ड' : 'Goswami Tulsidas · 7 Kands'}
        </p>
      </div>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'लोड विफल' : 'Load failed'} onRetry={() => q.refetch()} /> : null}
      <ul className="space-y-2">
        {q.data?.kandas.map((k) => (
          <li key={k.kandaOrder}>
            <Link
              to={`/ramcharitmanas/${k.kandaOrder}`}
              className="sy-stat-tile flex items-center gap-4 hover:border-[var(--sy-accent)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-600 font-bold text-[#1a1200]">
                {k.kandaOrder}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-deva text-lg font-semibold">{k.kandaHindi}</p>
                <p className="text-xs text-[var(--sy-text-muted)]">
                  {k.verseCount} {hi ? 'चौपाई/दोहे' : 'verses'}
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
