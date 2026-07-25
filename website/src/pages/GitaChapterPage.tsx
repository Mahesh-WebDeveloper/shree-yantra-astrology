import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { VerseExplainBlock } from '@/components/content/VerseExplainBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getGitaChapter, getGitaExplanation } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function GitaChapterPage() {
  const { hi } = useLang()
  const { n } = useParams()
  const num = Number(n)
  const q = useQuery({ queryKey: ['gita-ch', num], queryFn: () => getGitaChapter(num), enabled: num > 0 })

  return (
    <FeaturePageShell route="/gita">
      <Link to="/gita" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        {hi ? '← अध्याय' : '← Chapters'}
      </Link>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}
      <h2 className="font-display mb-4 text-xl font-semibold">{q.data?.chapter.name}</h2>
      <div className="space-y-4">
        {q.data?.chapter.verses?.map((v) => (
          <article key={v.number} className="sy-stat-tile">
            <p className="text-xs font-bold text-[var(--sy-accent)]">
              {hi ? 'श्लोक' : 'Verse'} {v.number}
            </p>
            <p className="font-deva mt-2 text-lg leading-relaxed">{v.sanskrit}</p>
            {v.transliteration ? <p className="mt-2 text-sm italic text-[var(--sy-text-soft)]">{v.transliteration}</p> : null}
            <p className="mt-2 text-[15px] leading-relaxed">{hi ? v.hindi || v.english : v.english || v.hindi}</p>
            <VerseExplainBlock fetcher={() => getGitaExplanation(num, v.number)} />
          </article>
        ))}
      </div>
    </FeaturePageShell>
  )
}
