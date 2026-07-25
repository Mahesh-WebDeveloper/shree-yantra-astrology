import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { DailyShloka } from '@/lib/api'
import { dailyShlokaChapterHref, formatShlokaCoverTitle, shlokaCoverAccent } from '@/lib/dailyShloka'
import { useLang } from '@/i18n/LangProvider'
import { Panel } from '@/components/ui/Panel'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { serviceTintStyle } from '@/data/welcomeServices'


function ShlokaCoverArt({ shloka }: { shloka: DailyShloka }) {
  const accent = shlokaCoverAccent(shloka.cover)
  const title = formatShlokaCoverTitle(shloka.hindi)

  return (
    <div
      className="shloka-cover-tile"
      style={{
        ['--shloka-accent' as string]: accent,
      }}
      aria-hidden
    >
      <span className="font-deva text-2xl leading-none text-[#fff7d6]">ॐ</span>
      <span className="font-deva mt-2 line-clamp-4 whitespace-pre-line text-center text-xs leading-snug text-[#fff7d6]/95">
        {title}
      </span>
    </div>
  )
}

export function ShlokaCard({
  shloka,
  loading,
  isError,
  onRetry,
}: {
  shloka?: DailyShloka
  loading: boolean
  isError?: boolean
  onRetry?: () => void
}) {
  const { hi } = useLang()
  const chapterHref = shloka ? dailyShlokaChapterHref(shloka.nav) : null
  const detailHref = shloka ? `/daily-shloka?id=${encodeURIComponent(shloka.id)}` : '/library'

  const meaning = shloka
    ? hi
      ? shloka.transliteration || shloka.english
      : shloka.english || shloka.transliteration
    : ''

  return (
    <motion.section 
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col"
    >
      <SectionHeading
        eyebrow={hi ? 'प्रेरणा' : 'Inspiration'}
        title={hi ? 'आज का श्लोक' : 'Daily shloka'}
        subtitle={shloka?.refLabel}
      />
      <Panel
        className="home-color-card sy-panel-hover flex min-h-[280px] flex-1 flex-col"
        style={serviceTintStyle('shloka', '#cbb1f2')}
      >
        <span className="bento-card-shine" aria-hidden />
        {isError && !shloka ? (
          <ErrorState
            message={hi ? 'श्लोक लोड नहीं हो पाया।' : 'Unable to load the daily shloka.'}
            onRetry={onRetry}
          />
        ) : loading && !shloka ? (
          <div className="flex flex-1 flex-col gap-5">
            <div className="flex gap-4">
              <Skeleton className="h-[7.5rem] w-[5.5rem] shrink-0 rounded-2xl" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
        ) : shloka ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col gap-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <ShlokaCoverArt shloka={shloka} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sy-accent)]">
                  {hi ? 'आज का श्लोक' : "Today's shloka"}
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-[var(--sy-text)]">{shloka.book}</p>
                <p className="mt-1 text-[14px] text-[var(--sy-text-soft)]">{shloka.refLabel}</p>
              </div>
            </div>

            <blockquote className="shloka-quote font-deva text-[1.35rem] leading-[1.75] text-[var(--sy-text)] sm:text-[1.5rem]">
              {shloka.sanskrit}
            </blockquote>

            {meaning ? (
              <p className="text-[16px] leading-[1.65] text-[var(--sy-text-soft)] sm:text-[17px]">{meaning}</p>
            ) : null}

            <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
              {chapterHref ? (
                <Link
                  to={chapterHref}
                  className="sy-btn-primary inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:brightness-105"
                >
                  {hi ? 'पूरा अध्याय पढ़ें' : 'Read full chapter'}
                </Link>
              ) : null}
              <Link
                to={detailHref}
                className="inline-flex text-sm font-medium text-[var(--sy-accent)] transition hover:underline"
              >
                {hi ? 'विस्तार से जानें →' : 'Learn more →'}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </Panel>
    </motion.section>
  )
}
