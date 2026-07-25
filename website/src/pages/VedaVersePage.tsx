import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { VerseExplainBlock } from '@/components/content/VerseExplainBlock'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { vedaCfg } from '@/data/vedaConfig'
import { getVedaExplanation, getVedaSection } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

const PAGE = 40

export function VedaVersePage() {
  const { hi } = useLang()
  const { veda = 'atharvaveda', book = '1', section = '1' } = useParams()
  const b = Number(book)
  const s = Number(section)
  const cfg = vedaCfg(veda)
  const L = (o: { en: string; hi: string }) => (hi ? o.hi : o.en)
  const [limit, setLimit] = useState(PAGE)

  const q = useQuery({
    queryKey: ['veda-section', veda, b, s],
    queryFn: () => getVedaSection(veda, b, s),
    enabled: b > 0 && s > 0,
    staleTime: 600_000,
  })

  const shown = useMemo(() => q.data?.section.verses.slice(0, limit) ?? [], [q.data, limit])
  const hasMore = q.data ? limit < q.data.section.verses.length : false
  const story = q.data?.section.story

  return (
    <FeaturePageShell route="/library">
      <Link
        to={cfg.hasSections ? `/veda/${veda}/${b}` : `/veda/${veda}`}
        className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline"
      >
        ← {hi ? 'वापस' : 'Back'}
      </Link>
      <h2 className="font-display mb-2 text-center text-lg font-semibold">
        {q.data?.section.sectionName ||
          q.data?.section.bookName ||
          `${L(cfg.sectionLabel)} ${s}`}
      </h2>
      {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'विफल' : 'Failed'} onRetry={() => q.refetch()} /> : null}

      {story && (hi ? story.hi : story.en) ? (
        <div className="sy-stat-tile mb-4 border border-amber-500/30 bg-amber-500/10">
          <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'कथा' : 'Story'}</p>
          <p className="mt-2 text-sm leading-relaxed">{hi ? story.hi : story.en}</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {shown.map((v) => (
          <article key={v.verse} className="sy-stat-tile">
            <p className="text-xs font-bold text-[var(--sy-accent)]">
              {L(cfg.verseLabel)} {v.verse}
            </p>
            <p className="font-deva mt-2 text-lg leading-relaxed">{v.sanskrit}</p>
            {v.transliteration ? <p className="mt-2 text-sm italic text-[var(--sy-text-soft)]">{v.transliteration}</p> : null}
            <p className="mt-2 text-sm leading-relaxed">{hi ? v.hindi || v.english : v.english || v.hindi}</p>
            <VerseExplainBlock fetcher={() => getVedaExplanation(veda, b, s, v.verse)} />
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
