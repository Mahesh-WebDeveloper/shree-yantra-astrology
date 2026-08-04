import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getMedia } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

const TITLES: Record<string, { en: string; hi: string }> = {
  ramayan_audio: { en: 'Ramayan Audio Katha', hi: 'रामायण ऑडियो कथा' },
  mahabharat_audio: { en: 'Mahabharat Audio Katha', hi: 'महाभारत ऑडियो कथा' },
  gita_audio: { en: 'Gita Audio', hi: 'गीता ऑडियो' },
}

export function AudioPlaylistPage() {
  const { hi } = useLang()
  const { subCategory = 'ramayan_audio' } = useParams()
  const title = TITLES[subCategory] || { en: 'Audio playlist', hi: 'ऑडियो प्लेलिस्ट' }
  const q = useQuery({
    queryKey: ['audio', subCategory],
    queryFn: () => getMedia({ subCategory, limit: 200 }),
    staleTime: 600_000,
  })

  return (
    <FeaturePageShell route="/library" titleEn={title.en} titleHi={title.hi}>
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <h2 className="font-display mb-4 text-xl font-semibold text-[var(--sy-accent)]">
        🎧 {hi ? title.hi : title.en}
      </h2>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'ऑडियो लोड नहीं हुआ' : 'Audio failed'} onRetry={() => q.refetch()} /> : null}
      <ul className="space-y-4">
        {q.data?.items.map((m, i) => (
          <li key={m._id} className="sy-stat-tile">
            <p className="mb-2 text-sm font-semibold">
              {i + 1}. {m.title}
            </p>
            {m.subtitle ? <p className="mb-2 text-xs text-[var(--sy-text-muted)]">{m.subtitle}</p> : null}
            {m.audioUrl ? (
              <audio controls preload="none" className="w-full" src={m.audioUrl}>
                <track kind="captions" />
              </audio>
            ) : (
              <p className="text-xs text-[var(--sy-text-muted)]">{hi ? 'ऑडियो उपलब्ध नहीं' : 'No audio URL'}</p>
            )}
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}
