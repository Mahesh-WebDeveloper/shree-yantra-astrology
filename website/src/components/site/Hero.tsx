import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform, type Variants } from 'framer-motion'
import { useLang } from '@/i18n/LangProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { SitePhone } from './SitePhone'
import { scrollToHash, useReducedMotion } from './hooks/useSiteMotion'
import './hero.css'

const YantraScene = lazy(() => import('./cosmic/YantraScene'))

/* ── Copy ──────────────────────────────────────────────────
   Plain language: what a first-time visitor actually gets.
   Bilingual everywhere, English numerals only.              */

const TRUST = [
  { hi: 'पंचांग से मिलाकर जाँची हुई तारीखें', en: 'Dates checked against the panchang' },
  { hi: '18 पुराण · 4 वेद · गीता · रामायण', en: '18 Puranas · 4 Vedas · Gita · Ramayana' },
  { hi: 'हिंदी और English दोनों में', en: 'In Hindi and English' },
]

/* ── Motion ───────────────────────────────────────────────── */

const GROUP: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.085, delayChildren: 0.1 } },
}

const RISE: Variants = {
  hidden: { opacity: 0, y: 26, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
}

/* ── Static yantra (reduced motion / before the canvas wakes) ──
   Same figure as the 3D scene: bhupura + gates, two lotus rings,
   the nine triangles and a glowing bindu.                     */

const U = 62
const CENTER = 200
const sx = (x: number) => (CENTER + x * U).toFixed(1)
const sy = (y: number) => (CENTER - y * U).toFixed(1)

const SVG_UP = [
  { apex: 1.3, base: -0.3, half: 1.14 },
  { apex: 1.02, base: -0.62, half: 0.88 },
  { apex: 0.74, base: -0.9, half: 0.64 },
  { apex: 0.46, base: -1.14, half: 0.42 },
]
const SVG_DOWN = [
  { apex: -1.36, base: 0.34, half: 1.18 },
  { apex: -1.08, base: 0.66, half: 0.92 },
  { apex: -0.8, base: 0.94, half: 0.68 },
  { apex: -0.52, base: 1.18, half: 0.46 },
  { apex: -0.26, base: 1.36, half: 0.26 },
]

function lotusPath(r0: number, amp: number, lobes: number, phase = 0) {
  const seg = lobes * 16
  let d = ''
  for (let i = 0; i <= seg; i += 1) {
    const a = (i / seg) * Math.PI * 2 + phase
    const r = r0 + amp * Math.pow(Math.abs(Math.sin((lobes * (a - phase)) / 2)), 0.62)
    d += `${i ? 'L' : 'M'}${sx(Math.cos(a) * r)} ${sy(Math.sin(a) * r)} `
  }
  return `${d}Z`
}

function triPath(t: { apex: number; base: number; half: number }) {
  return `M${sx(0)} ${sy(t.apex)} L${sx(-t.half)} ${sy(t.base)} L${sx(t.half)} ${sy(t.base)} Z`
}

function StaticYantra({ dark }: { dark: boolean }) {
  const paths = useMemo(
    () => ({ lotus8: lotusPath(1.5, 0.34, 8), lotus16: lotusPath(1.94, 0.28, 16, Math.PI / 16) }),
    [],
  )
  const gold = dark ? '#f0c469' : '#a9740f'
  const soft = dark ? '#fdeec2' : '#8a5a10'
  const r = 2.86 * U
  const g = 0.26 * U

  return (
    <svg className="syh__stage-svg" viewBox="0 0 400 400" fill="none" aria-hidden>
      <defs>
        <radialGradient id="syh-core">
          <stop offset="0%" stopColor={soft} stopOpacity={dark ? 0.85 : 0.4} />
          <stop offset="35%" stopColor={gold} stopOpacity={dark ? 0.28 : 0.16} />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={CENTER} cy={CENTER} r={190} fill="url(#syh-core)" />

      <g stroke={gold} strokeWidth="1.1" opacity="0.5">
        <rect x={CENTER - r} y={CENTER - r} width={r * 2} height={r * 2} />
        <rect x={CENTER - r + 9} y={CENTER - r + 9} width={r * 2 - 18} height={r * 2 - 18} opacity="0.6" />
        <path d={`M${CENTER - g} ${CENTER - r} L${CENTER} ${CENTER - r - g} L${CENTER + g} ${CENTER - r}`} />
        <path d={`M${CENTER - g} ${CENTER + r} L${CENTER} ${CENTER + r + g} L${CENTER + g} ${CENTER + r}`} />
        <path d={`M${CENTER - r} ${CENTER - g} L${CENTER - r - g} ${CENTER} L${CENTER - r} ${CENTER + g}`} />
        <path d={`M${CENTER + r} ${CENTER - g} L${CENTER + r + g} ${CENTER} L${CENTER + r} ${CENTER + g}`} />
      </g>

      <path d={paths.lotus16} stroke={gold} strokeWidth="0.9" opacity="0.4" />
      <path d={paths.lotus8} stroke={gold} strokeWidth="1" opacity="0.5" />
      <circle cx={CENTER} cy={CENTER} r={2.26 * U} stroke={gold} strokeWidth="1" opacity="0.44" />
      <circle cx={CENTER} cy={CENTER} r={1.9 * U} stroke={gold} strokeWidth="0.9" opacity="0.4" />
      <circle cx={CENTER} cy={CENTER} r={1.44 * U} stroke={soft} strokeWidth="1.1" opacity="0.6" />

      <g strokeWidth="1.15">
        {SVG_UP.map((t, i) => (
          <path key={`u${i}`} d={triPath(t)} stroke={i % 2 ? gold : soft} opacity={0.9 - i * 0.08} />
        ))}
        {SVG_DOWN.map((t, i) => (
          <path key={`d${i}`} d={triPath(t)} stroke={i % 2 ? soft : gold} opacity={0.88 - i * 0.08} />
        ))}
      </g>

      <circle cx={CENTER} cy={CENTER} r="3" fill={soft} />
    </svg>
  )
}

/* ── Hooks ────────────────────────────────────────────────── */

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

/** Mounts the 3D canvas only after first paint, and only when motion is welcome. */
function useCanvasReady(enabled: boolean) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const w = window as IdleWindow
    let idleId: number | undefined
    let timerId: number | undefined
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => setReady(true), { timeout: 900 })
    else timerId = window.setTimeout(() => setReady(true), 260)
    return () => {
      if (idleId != null) w.cancelIdleCallback?.(idleId)
      if (timerId != null) window.clearTimeout(timerId)
    }
  }, [enabled])

  return ready && enabled
}

/** Live media-query match — used to keep the phone off small screens entirely. */
function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(query)
    const onChange = () => setMatch(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return match
}

const DUST = [
  { left: '12%', top: '72%', duration: 17, delay: 0 },
  { left: '24%', top: '86%', duration: 21, delay: 3.5 },
  { left: '38%', top: '64%', duration: 15, delay: 7 },
  { left: '52%', top: '90%', duration: 24, delay: 1.5 },
  { left: '67%', top: '70%', duration: 18, delay: 9 },
  { left: '78%', top: '84%', duration: 22, delay: 5 },
  { left: '88%', top: '60%', duration: 19, delay: 12 },
]

/* ── Hero ─────────────────────────────────────────────────── */

export function Hero() {
  const { hi } = useLang()
  const { theme } = useTheme()
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  const [tabVisible, setTabVisible] = useState(true)
  const [inView, setInView] = useState(true)
  const wide = useMediaQuery('(min-width: 901px)')

  // Stop the render loop when the tab is hidden or the hero has scrolled away.
  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => setInView(entries.some((e) => e.isIntersecting)), {
      threshold: 0.01,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const canvasOn = useCanvasReady(!reduced)

  // Pointer parallax — a slow spring so it never feels twitchy.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 55, damping: 22, mass: 0.7 }
  const sxv = useSpring(px, spring)
  const syv = useSpring(py, spring)
  const stageX = useTransform(sxv, (v) => v * 26)
  const stageY = useTransform(syv, (v) => v * 20)
  const phoneX = useTransform(sxv, (v) => v * -12)
  const phoneY = useTransform(syv, (v) => v * -9)

  useEffect(() => {
    if (reduced) return
    const el = sectionRef.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      px.set((e.clientX - r.left) / r.width - 0.5)
      py.set((e.clientY - r.top) / r.height - 0.5)
    }
    const onLeave = () => {
      px.set(0)
      py.set(0)
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [px, py, reduced])

  // Scroll parallax — the yantra sinks and dims as the page moves on.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const stageScroll = useTransform(scrollYProgress, [0, 1], [0, 110])
  const stageFade = useTransform(scrollYProgress, [0, 0.85], [1, 0.15])
  const copyScroll = useTransform(scrollYProgress, [0, 1], [0, 60])

  const t = (h: string, e: string) => (hi ? h : e)
  const initial = reduced ? false : 'hidden'
  const paused = !tabVisible || !inView

  return (
    <section className="syh" id="top" ref={sectionRef} aria-labelledby="sy-hero-title">
      <div className="syh__bg" aria-hidden />
      <div className="syh__aurora" aria-hidden>
        <i />
        <i />
      </div>

      {/* The light source of the whole composition. */}
      <motion.div
        className="syh__stage"
        aria-hidden
        style={reduced ? undefined : { y: stageScroll, opacity: stageFade }}
      >
        <motion.div
          className="syh__stage-pos"
          style={reduced ? undefined : { x: stageX, y: stageY }}
          initial={reduced ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {canvasOn ? (
            <Suspense fallback={<StaticYantra dark={theme.isDark} />}>
              <YantraScene dark={theme.isDark} paused={paused} />
            </Suspense>
          ) : (
            <StaticYantra dark={theme.isDark} />
          )}
        </motion.div>
      </motion.div>

      {!reduced && (
        <div className="syh__dust" aria-hidden>
          {DUST.map((d) => (
            <i
              key={d.left}
              style={{
                left: d.left,
                top: d.top,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="syh__veil" aria-hidden />
      <div className="syh__vignette" aria-hidden />
      <div className="syh__fade" aria-hidden />

      <div className="syh__body">
        <div className="sy-container syh__grid">
          <motion.div
            className="syh__copy"
            variants={GROUP}
            initial={initial}
            animate="show"
            style={reduced ? undefined : { y: copyScroll }}
          >
            <motion.p variants={RISE} className="sy-eyebrow syh__eyebrow" lang={hi ? 'hi' : 'en'}>
              {t('पंचांग · कुंडली · मुहूर्त — एक ही ऐप में', 'Panchang · Kundli · Muhurat — all in one app')}
            </motion.p>

            <h1 id="sy-hero-title" className="syh__title" lang={hi ? 'hi' : 'en'}>
              {hi ? (
                <>
                  <motion.span className="syh__title-line" variants={RISE}>
                    आपका अपना <span className="sy-gold-text">ज्योतिषी</span>,
                  </motion.span>
                  <motion.span className="syh__title-line" variants={RISE}>
                    हमेशा साथ
                  </motion.span>
                </>
              ) : (
                <>
                  <motion.span className="syh__title-line" variants={RISE}>
                    Your own <span className="sy-gold-text">astrologer</span>,
                  </motion.span>
                  <motion.span className="syh__title-line" variants={RISE}>
                    always with you
                  </motion.span>
                </>
              )}
            </h1>

            <motion.p className="syh__sub" variants={RISE}>
              {t(
                'जन्म कुंडली, आज का पंचांग, शुभ मुहूर्त, राशिफल, आरती और पूरा धार्मिक पुस्तकालय — सब कुछ एक जगह, आपकी अपनी भाषा में।',
                "Your birth chart, today's panchang, auspicious timings, horoscope, aartis and a complete sacred library — all in one place, in your own language.",
              )}
            </motion.p>

            <motion.div className="syh__cta" variants={RISE}>
              <a
                className="sy-btn-gold"
                href="#download"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToHash('#download')
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
                </svg>
                {t('ऐप डाउनलोड करें', 'Get the app')}
              </a>
              <a
                className="sy-btn-ghost"
                href="#features"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToHash('#features')
                }}
              >
                {t('क्या-क्या मिलेगा', "See what's inside")}
              </a>
            </motion.div>

            <motion.ul
              className="syh__trust"
              variants={RISE}
              aria-label={t('ऐप के बारे में', 'About the app')}
            >
              {TRUST.map((chip) => (
                <li key={chip.en}>
                  <span className="syh__chip sy-num">{t(chip.hi, chip.en)}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {wide && (
            <div className="syh__device">
              <motion.div
                className="syh__phone"
                initial={reduced ? false : { opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1.1, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                style={reduced ? undefined : { x: phoneX, y: phoneY }}
              >
                <motion.div
                  animate={reduced ? undefined : { y: [0, -12, 0] }}
                  transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <SitePhone id="home" priority width={288} />
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <div className="syh__foot">
        <button
          type="button"
          className="syh__cue"
          onClick={() => scrollToHash('#live-proof')}
          aria-label={t('आगे स्क्रॉल करें', 'Scroll down')}
          lang={hi ? 'hi' : 'en'}
        >
          <span className="syh__cue-rail" aria-hidden />
          <span>{t('नीचे देखें', 'Scroll')}</span>
        </button>
      </div>
    </section>
  )
}
