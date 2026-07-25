import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { VerseExplainBlock } from '@/components/content/VerseExplainBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getVedaExplanation, getVedaSection } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

const VEDA = 'hanuman-chalisa'

function verseLabel(n: number, hi: boolean) {
  if (n <= 2) return hi ? `॥ दोहा ${n} ॥` : `Doha ${n}`
  if (n === 43) return hi ? '॥ दोहा ॥' : 'Closing Doha'
  return hi ? `चौपाई ${n - 2}` : `Chaupai ${n - 2}`
}

export function HanumanChalisaPage() {
  const { hi } = useLang()
  const q = useQuery({
    queryKey: ['hanuman-chalisa'],
    queryFn: () => getVedaSection(VEDA, 1, 1),
    staleTime: 600_000,
  })
  const verses = q.data?.section?.verses || []

  const intro = hi
    ? [
        { k: 'क्या है', v: 'हनुमान चालीसा 40 चौपाइयों का भजन है — गोस्वामी तुलसीदास द्वारा रचित।' },
        { k: 'क्यों पढ़ें', v: 'साहस, भय-निवारण व हनुमान कृपा हेतु।' },
      ]
    : [
        { k: 'What it is', v: 'A 40-verse hymn by Goswami Tulsidas praising Lord Hanuman.' },
        { k: 'Why recite', v: 'For courage, protection and Hanuman’s blessings.' },
      ]

  return (
    <FeaturePageShell route="/library" titleEn="Hanuman Chalisa" titleHi="हनुमान चालीसा">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <div className="sy-stat-tile mb-4 text-center">
        <p className="text-3xl">🚩</p>
        <h2 className="font-deva mt-2 text-xl font-semibold">श्री हनुमान चालीसा</h2>
        <p className="mt-1 text-sm text-[var(--sy-accent)]">
          {hi ? 'रचयिता — गोस्वामी तुलसीदास' : 'by Goswami Tulsidas'}
        </p>
      </div>
      <div className="sy-stat-tile mb-4 space-y-3">
        {intro.map((b) => (
          <div key={b.k}>
            <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{b.k}</p>
            <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{b.v}</p>
          </div>
        ))}
      </div>
      {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'लोड विफल' : 'Load failed'} onRetry={() => q.refetch()} /> : null}
      <div className="space-y-4">
        {verses.map((v) => (
          <article key={v.verse} className="sy-stat-tile">
            <p className="text-xs font-bold text-[var(--sy-accent)]">{verseLabel(v.verse, hi)}</p>
            <p className="font-deva mt-2 text-center text-lg leading-loose">{v.sanskrit}</p>
            {v.transliteration ? <p className="mt-2 text-center text-sm italic text-[var(--sy-text-soft)]">{v.transliteration}</p> : null}
            <p className="mt-2 text-sm leading-relaxed">{hi ? v.hindi || v.english : v.english || v.hindi}</p>
            <VerseExplainBlock fetcher={() => getVedaExplanation(VEDA, 1, 1, v.verse)} />
          </article>
        ))}
      </div>
    </FeaturePageShell>
  )
}
