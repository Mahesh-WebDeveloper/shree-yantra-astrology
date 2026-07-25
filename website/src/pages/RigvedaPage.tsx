import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRigMandalas } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function RigvedaPage() {
  const { hi } = useLang()
  const q = useQuery({ queryKey: ['rig-mandalas'], queryFn: getRigMandalas, staleTime: 600_000 })

  return (
    <FeaturePageShell route="/library" titleEn="Rigveda" titleHi="ऋग्वेद">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <div className="mb-6 text-center">
        <p className="font-deva text-2xl">ॐ</p>
        <h2 className="font-display mt-2 text-xl font-semibold text-[var(--sy-accent)]">
          {hi ? 'ऋग्वेद' : 'Rigveda'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {hi ? 'संस्कृत व अंग्रेज़ी · 10 मंडल' : 'Sanskrit & English · 10 Mandala'}
        </p>
      </div>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'लोड विफल' : 'Load failed'} onRetry={() => q.refetch()} /> : null}
      <ul className="space-y-2">
        {q.data?.mandalas.map((m) => (
          <li key={m.mandala}>
            <Link
              to={`/rigveda/${m.mandala}`}
              className="sy-stat-tile flex items-center gap-4 hover:border-[var(--sy-accent)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-600 font-bold text-[#1a1200]">
                {m.mandala}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {hi ? 'मंडल' : 'Mandala'} {m.mandala}
                </p>
                <p className="text-xs text-[var(--sy-text-muted)]">
                  {m.suktas} {hi ? 'सूक्त' : 'suktas'} · {m.mantras} {hi ? 'मंत्र' : 'mantras'}
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
