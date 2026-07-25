import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { HoroscopeSign } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Panel } from '@/components/ui/Panel'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { SIGN_GLYPH, SIGN_LABEL } from '@/data/welcomeServices'
import { rashiImageUrl } from '@/lib/rashiImages'
import { useGsapReveal } from '@/hooks/useGsapReveal'

const COLOR_MAP: Record<string, string> = {
  red: '#dc2626', लाल: '#dc2626',
  green: '#16a34a', हरा: '#16a34a',
  blue: '#2563eb', नीला: '#2563eb',
  yellow: '#eab308', पीला: '#eab308',
  gold: '#d4a017', golden: '#d4a017', सुनहरा: '#d4a017', सुनहला: '#d4a017',
  white: '#e5e7eb', सफेद: '#e5e7eb', 'सफ़ेद': '#e5e7eb',
  black: '#374151', काला: '#374151',
  orange: '#ea580c', नारंगी: '#ea580c',
  pink: '#ec4899', गुलाबी: '#ec4899',
  purple: '#7c3aed', बैंगनी: '#7c3aed',
  saffron: '#f4a300', केसरिया: '#f4a300',
  silver: '#cbd5e1', चांदी: '#cbd5e1', 'चाँदी': '#cbd5e1',
  brown: '#92400e', भूरा: '#92400e',
  cream: '#eaddc7', क्रीम: '#eaddc7',
  maroon: '#7f1d1d', मैरून: '#7f1d1d',
}

function colorSwatch(name?: string): string | null {
  if (!name) return null
  return COLOR_MAP[name.trim().toLowerCase()] || COLOR_MAP[name.trim()] || null
}

function signName(sign: HoroscopeSign, hi: boolean): string {
  return hi ? sign.hi || SIGN_LABEL[sign.key]?.hi || sign.displayName : sign.displayName
}

// Full Rashifal options — these open on the dedicated Rashifal page (with the chosen sign + period).
const PERIODS = [
  { key: 'daily', en: 'Daily', hi: 'दैनिक' },
  { key: 'weekly', en: 'Weekly', hi: 'साप्ताहिक' },
  { key: 'monthly', en: 'Monthly', hi: 'मासिक' },
  { key: 'yearly', en: 'Yearly', hi: 'वार्षिक' },
] as const

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HoroscopeStrip({
  signs,
  loading,
  isError,
  onRetry,
}: {
  signs?: HoroscopeSign[]
  loading: boolean
  isError?: boolean
  onRetry?: () => void
}) {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const ref = useGsapReveal<HTMLElement>()
  const railRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const dragRef = useRef({ pointerId: -1, startX: 0, scrollLeft: 0, moved: false })
  const [dragging, setDragging] = useState(false)
  const list = useMemo(() => signs ?? [], [signs])
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const active = useMemo(() => {
    if (!list.length) return null
    if (activeKey) return list.find((s) => s.key === activeKey) ?? list[0]
    return list[0]
  }, [list, activeKey])

  const selectSign = (key: string) => {
    setActiveKey(key)
    requestAnimationFrame(() => {
      chipRefs.current[key]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    })
  }

  const selectRelative = (delta: number) => {
    if (!list.length) return
    const currentIndex = active ? Math.max(0, list.findIndex((s) => s.key === active.key)) : 0
    const nextIndex = (currentIndex + delta + list.length) % list.length
    selectSign(list[nextIndex].key)
  }

  const onRailPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current
    // Touch/pen use native scrolling (keeps taps working); only mouse gets drag-to-scroll.
    if (!rail || e.pointerType !== 'mouse' || e.button !== 0) return
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, scrollLeft: rail.scrollLeft, moved: false }
  }

  const onRailPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current
    if (!rail || dragRef.current.pointerId !== e.pointerId) return
    const dx = e.clientX - dragRef.current.startX
    // Only start dragging (and capture the pointer) once past a threshold — so a plain
    // click never gets captured, and chip selection keeps working.
    if (!dragRef.current.moved && Math.abs(dx) > 6) {
      dragRef.current.moved = true
      setDragging(true)
      rail.setPointerCapture?.(e.pointerId)
    }
    if (dragRef.current.moved) {
      rail.scrollLeft = dragRef.current.scrollLeft - dx
      e.preventDefault()
    }
  }

  const stopDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current
    if (!rail || dragRef.current.pointerId !== e.pointerId) return
    if (rail.hasPointerCapture?.(e.pointerId)) rail.releasePointerCapture(e.pointerId)
    setDragging(false)
    const moved = dragRef.current.moved
    dragRef.current.pointerId = -1
    if (moved) window.setTimeout(() => { dragRef.current.moved = false }, 0)
  }

  const viewAll = (
    <Link
      to="/rashifal"
      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--sy-accent)] transition hover:gap-1.5"
    >
      {hi ? 'पूरा राशिफल देखें' : 'Open full Rashifal'}
      <span aria-hidden>→</span>
    </Link>
  )

  return (
    <section ref={ref}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        <SectionHeading
          className="mb-0"
          eyebrow={hi ? 'राशिफल' : 'Rashifal'}
          title={hi ? 'आज का राशिफल' : 'Today’s horoscope'}
          subtitle={hi ? 'अपनी राशि चुनें और आज की सरल, साफ दिशा पढ़ें।' : 'Choose your sign and read a clear daily direction.'}
          ornament
        />
        <div className="hidden items-center gap-2 sm:flex">
          {viewAll}
          {!isError && list.length > 0 ? (
            <div className="ml-1 flex items-center gap-1.5">
              <button type="button" onClick={() => selectRelative(-1)} className="carousel-arrow" aria-label={hi ? 'पिछली राशि' : 'Previous sign'}>
                <Chevron dir="left" />
              </button>
              <button type="button" onClick={() => selectRelative(1)} className="carousel-arrow" aria-label={hi ? 'अगली राशि' : 'Next sign'}>
                <Chevron dir="right" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {loading && !list.length ? (
        <div className="space-y-4">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-28 shrink-0 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      ) : isError && !list.length ? (
        <Panel>
          <ErrorState message={hi ? 'राशिफल लोड नहीं हो पाया।' : 'Unable to load rashifal right now.'} onRetry={onRetry} />
        </Panel>
      ) : !active ? (
        <Panel>
          <p className="py-8 text-center text-sm text-[var(--sy-text-muted)]">
            {hi ? 'राशिफल फिलहाल उपलब्ध नहीं है।' : 'Rashifal is not available right now.'}
          </p>
        </Panel>
      ) : (
        <div className="rashifal-shell">
          <div className="rashifal-shell-top">
            <span>{hi ? '12 राशियों में से चुनें - ड्रैग करके देखें' : 'Choose from all 12 signs - drag to browse'}</span>
            <div className="flex items-center gap-1.5 sm:hidden">
              <button type="button" onClick={() => selectRelative(-1)} className="carousel-arrow" aria-label={hi ? 'पिछली राशि' : 'Previous sign'}>
                <Chevron dir="left" />
              </button>
              <button type="button" onClick={() => selectRelative(1)} className="carousel-arrow" aria-label={hi ? 'अगली राशि' : 'Next sign'}>
                <Chevron dir="right" />
              </button>
            </div>
          </div>

          <div
            ref={railRef}
            className={`horoscope-scroll rashifal-drag-rail mb-5 flex snap-x gap-3 overflow-x-auto pb-1 ${dragging ? 'is-dragging' : ''}`}
            role="tablist"
            aria-label={hi ? 'राशि चुनें' : 'Choose a zodiac sign'}
            onPointerDown={onRailPointerDown}
            onPointerMove={onRailPointerMove}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            onPointerLeave={(e) => {
              if (dragRef.current.pointerId === e.pointerId) stopDrag(e)
            }}
          >
            {list.map((sign) => {
              const on = sign.key === active.key
              return (
                <button
                  key={sign.key}
                  ref={(node) => {
                    chipRefs.current[sign.key] = node
                  }}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    if (dragRef.current.moved) return
                    selectSign(sign.key)
                  }}
                  className={`sign-chip snap-center ${on ? 'sign-chip-active' : ''}`}
                >
                  <span className="sign-chip-glyph">
                    <SignArt signKey={sign.key} />
                  </span>
                  <span className="text-[13px] font-semibold leading-none">{signName(sign, hi)}</span>
                  <span className="text-[11px] font-medium tabular-nums opacity-70">{sign.score}%</span>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.key}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Panel className="reading-card rashifal-reading overflow-hidden">
                <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
                  <div className="flex shrink-0 items-center gap-5 lg:flex-col lg:gap-3">
                    <div
                      className="score-ring flex h-[112px] w-[112px] items-center justify-center rounded-full p-[5px]"
                      style={{ ['--score' as string]: active.score }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[var(--sy-card-inner)]">
                        <SignArt signKey={active.key} size="hero" />
                        <span className="mt-1 text-[11px] font-bold tabular-nums text-[var(--sy-accent)]">
                          {active.score}%
                        </span>
                      </div>
                    </div>
                    <div className="lg:text-center">
                      <p className="text-lg font-bold tracking-tight text-[var(--sy-text)]">{signName(active, hi)}</p>
                      <p className="text-[13px] font-medium text-[var(--sy-text-soft)]">{active.displayName}</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-playfair text-xl font-bold leading-snug tracking-tight text-[var(--sy-text)] sm:text-2xl">
                      {active.headline}
                    </h3>
                    <p className="mt-3 text-[16px] leading-[1.65] text-[var(--sy-text-soft)]">
                      {active.plainSummary || active.summary}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      <ReadingChip label={hi ? 'शुभ अंक' : 'Lucky no.'} value={String(active.luckyNumber)} />
                      <ReadingChip
                        label={hi ? 'शुभ रंग' : 'Lucky color'}
                        value={active.luckyColor}
                        swatch={colorSwatch(active.luckyColor)}
                      />
                      <ReadingChip label={hi ? 'स्कोर' : 'Score'} value={`${active.score}%`} />
                    </div>

                    <div className="mt-6">
                      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--sy-text-muted)]">
                        {hi ? 'पूरा राशिफल' : 'Full Rashifal'}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {PERIODS.map((p) => (
                          <Link
                            key={p.key}
                            to={`/rashifal?sign=${active.key}&period=${p.key}`}
                            className="rashifal-period"
                          >
                            {hi ? p.hi : p.en}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link
                        to={`/rashifal?sign=${active.key}`}
                        className="sy-btn-primary inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold"
                      >
                        {hi ? `${signName(active, hi)} का पूरा राशिफल` : `Open ${signName(active, hi)} Rashifal`}
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </Panel>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 sm:hidden">{viewAll}</div>
        </div>
      )}
    </section>
  )
}

function ReadingChip({ label, value, swatch }: { label: string; value: string; swatch?: string | null }) {
  return (
    <span className="reading-chip">
      {swatch ? (
        <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: swatch }} aria-hidden />
      ) : null}
      <span className="text-[var(--sy-text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--sy-text)]">{value}</span>
    </span>
  )
}

function SignArt({ signKey, size = 'chip' }: { signKey: string; size?: 'chip' | 'hero' }) {
  const src = rashiImageUrl(signKey)
  if (src) {
    return (
      <span className={`sign-art-wrap sign-art-wrap--${size}`}>
        <img src={src} alt="" className="sign-art-img" draggable={false} />
      </span>
    )
  }
  return <span className={size === 'hero' ? 'text-[34px] leading-none text-[var(--sy-gold-strong)]' : ''}>{SIGN_GLYPH[signKey] ?? '★'}</span>
}
