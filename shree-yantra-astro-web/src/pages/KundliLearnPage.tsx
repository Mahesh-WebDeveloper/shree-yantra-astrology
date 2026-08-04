import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { KUNDLI_CHAPTERS, type LearnBlock, type LearnChapter } from '@/data/kundliLearn'
import { useLang } from '@/i18n/LangProvider'

function BlockView({ block, hi }: { block: LearnBlock; hi: boolean }) {
  const l = hi ? 'hi' : 'en'
  return (
    <div className="learn-block">
      {block.heading ? (
        <div className="learn-heading-row">
          <span className="learn-heading-tick" />
          <h4 className="font-semibold text-[var(--sy-accent)]">{block.heading[l]}</h4>
        </div>
      ) : null}
      <p className="text-sm leading-relaxed text-[var(--sy-text-soft)]">{block.text[l]}</p>
      {block.bullets?.length ? (
        <ul className="learn-bullets">
          {block.bullets.map((bu, i) => (
            <li key={i}>
              <span className="learn-bullet-dot" />
              {bu[l]}
            </li>
          ))}
        </ul>
      ) : null}
      {block.example ? (
        <div className="learn-example">
          <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'जैसे' : 'Like'}</p>
          <p className="mt-1 text-sm">{block.example[l]}</p>
        </div>
      ) : null}
    </div>
  )
}

function ChapterRow({ chapter, index, hi, onOpen }: { chapter: LearnChapter; index: number; hi: boolean; onOpen: () => void }) {
  const l = hi ? 'hi' : 'en'
  return (
    <button type="button" className="learn-chapter-row" onClick={onOpen}>
      <div className="learn-chapter-art">
        <span className="text-3xl">{chapter.emoji}</span>
        <span className="learn-chapter-num">{index + 1}</span>
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="learn-level-chip">{chapter.level[l]}</span>
          <span className="text-xs text-[var(--sy-text-muted)]">
            {chapter.readMin} {hi ? 'मिनट' : 'min'}
          </span>
        </div>
        <p className="mt-1 font-semibold">{chapter.title[l]}</p>
        <p className="mt-1 text-sm text-[var(--sy-text-muted)] line-clamp-2">{chapter.intro[l]}</p>
      </div>
    </button>
  )
}

export function KundliLearnPage() {
  const { hi } = useLang()
  const l = hi ? 'hi' : 'en'
  const [selected, setSelected] = useState<number | null>(null)

  const chapter = selected != null ? KUNDLI_CHAPTERS[selected] : null

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selected])

  const prevNext = useMemo(() => {
    if (selected == null) return { prev: null, next: null }
    return {
      prev: selected > 0 ? KUNDLI_CHAPTERS[selected - 1] : null,
      next: selected < KUNDLI_CHAPTERS.length - 1 ? KUNDLI_CHAPTERS[selected + 1] : null,
    }
  }, [selected])

  return (
    <FeaturePageShell route="/kundli-learn" titleEn="Learn Kundli" titleHi="कुंडली सीखें">
      <p className="mb-4 text-sm text-[var(--sy-text-soft)]">
        {hi
          ? 'ऐप की «कुंडली सीखें» स्क्रीन — offline कहानी-शैली में chapters (कोई AI नहीं)।'
          : 'Same offline story-style chapters as the app «Learn Kundli» screen (no AI).'}
      </p>
      <Link to="/kundli" className="mb-6 inline-block text-sm font-semibold text-[var(--sy-accent)] hover:underline">
        {hi ? '← मेरी कुंडली' : '← My Kundli'}
      </Link>

      {chapter == null ? (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-center text-[var(--sy-accent)]">
            {hi ? 'अध्याय' : 'Chapters'}
          </h2>
          {KUNDLI_CHAPTERS.map((c, i) => (
            <ChapterRow key={c.id} chapter={c} index={i} hi={hi} onOpen={() => setSelected(i)} />
          ))}
        </div>
      ) : (
        <article className="space-y-4">
          <button type="button" className="kundli-tab-pill" onClick={() => setSelected(null)}>
            {hi ? '← सूची' : '← All chapters'}
          </button>
          <header className="text-center">
            <p className="text-sm text-[var(--sy-text-muted)]">{chapter.kicker[l]}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold">
              {chapter.emoji} {chapter.title[l]}
            </h1>
            <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{chapter.intro[l]}</p>
          </header>
          {chapter.blocks.map((b, i) => (
            <BlockView key={i} block={b} hi={hi} />
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            {prevNext.prev ? (
              <button type="button" className="learn-nav-btn text-left" onClick={() => setSelected((selected ?? 1) - 1)}>
                <span className="text-xs text-[var(--sy-accent)]">← {hi ? 'पिछला' : 'Previous'}</span>
                <span className="mt-1 block font-medium line-clamp-1">{prevNext.prev.title[l]}</span>
              </button>
            ) : (
              <span />
            )}
            {prevNext.next ? (
              <button type="button" className="learn-nav-btn text-right" onClick={() => setSelected((selected ?? 0) + 1)}>
                <span className="text-xs text-[var(--sy-accent)]">{hi ? 'अगला' : 'Next'} →</span>
                <span className="mt-1 block font-medium line-clamp-1">{prevNext.next.title[l]}</span>
              </button>
            ) : null}
          </div>
        </article>
      )}
    </FeaturePageShell>
  )
}
