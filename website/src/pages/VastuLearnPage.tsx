import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { VASTU_CHAPTERS, type VLearnBlock, type VLearnChapter } from '@/data/vastuLearn'
import { useLang } from '@/i18n/LangProvider'

function BlockView({ block, hi }: { block: VLearnBlock; hi: boolean }) {
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

export function VastuLearnPage() {
  const { hi } = useLang()
  const l = hi ? 'hi' : 'en'
  const [selected, setSelected] = useState<number | null>(null)
  const chapter: VLearnChapter | null = selected != null ? VASTU_CHAPTERS[selected] : null

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selected])

  const prevNext = useMemo(() => {
    if (selected == null) return { prev: null, next: null }
    return {
      prev: selected > 0 ? VASTU_CHAPTERS[selected - 1] : null,
      next: selected < VASTU_CHAPTERS.length - 1 ? VASTU_CHAPTERS[selected + 1] : null,
    }
  }, [selected])

  return (
    <FeaturePageShell route="/vastu" titleEn="Learn Vastu" titleHi="वास्तु सीखें">
      <Link to="/vastu" className="mb-6 inline-block text-sm font-semibold text-[var(--sy-accent)] hover:underline">
        {hi ? '← वास्तु विश्लेषण' : '← Vastu analysis'}
      </Link>
      {chapter == null ? (
        <div className="space-y-3">
          {VASTU_CHAPTERS.map((c, i) => (
            <button key={c.id} type="button" className="learn-chapter-row w-full" onClick={() => setSelected(i)}>
              <div className="learn-chapter-art">
                <span className="text-3xl">{c.emoji}</span>
                <span className="learn-chapter-num">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-semibold">{c.title[l]}</p>
                <p className="mt-1 text-sm text-[var(--sy-text-muted)] line-clamp-2">{c.intro[l]}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <article className="space-y-4">
          <button type="button" className="kundli-tab-pill" onClick={() => setSelected(null)}>
            {hi ? '← सूची' : '← All chapters'}
          </button>
          <header className="text-center">
            <h1 className="font-display text-2xl font-semibold">
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
