import { useEffect, useRef, useState, type ComponentType, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion, useScroll, useTransform, type Variants } from 'framer-motion'
import { useLang } from '@/i18n/LangProvider'
import { scrollToHash, useReducedMotion } from './hooks/useSiteMotion'
import { HeroMandala } from './parts/HeroMandala'
import { PhoneTabBar, type DemoProps } from './parts/demos/chrome'
import { PanchangDemo } from './parts/demos/PanchangDemo'
import { ChoghadiyaDemo } from './parts/demos/ChoghadiyaDemo'
import { KundliDemo } from './parts/demos/KundliDemo'
import { AskJyotishiDemo } from './parts/demos/AskJyotishiDemo'
import { RashifalDemo } from './parts/demos/RashifalDemo'
import { Marquee } from './parts/motionBits'
import './appinaction.css'
import './hero.css'

/**
 * The hero.
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │            (the Shree Yantra draws itself, behind)       │
 *   │  eyebrow                                    ┌─────────┐  │
 *   │  headline, two lines                        │  phone  │  │ tabs
 *   │  one plain sentence                         │  screen │  │  ·
 *   │  [ get the app ] [ what's inside ]          │  cycles │  │  ·
 *   │  chip · chip · chip                         └─────────┘  │  ·
 *   │                                              caption      │
 *   └──────────────────────────────────────────────────────────┘
 *
 * The right-hand phone is not a screenshot: it runs the same five animated
 * screen recreations the "app in action" section uses, one after another,
 * and the list beside it is a real tablist you can click, tab to and steer
 * with the arrow keys. Hovering the phone or the list pauses the carousel.
 */

type Bi = { hi: string; en: string }

type Screen = {
  id: string
  label: Bi
  caption: Bi
  /** Which of the app's own bottom tabs is lit while this screen runs. */
  bottom: string
  ms: number
  Comp: ComponentType<DemoProps>
}

const SCREENS: Screen[] = [
  {
    id: 'panchang',
    label: { hi: 'आज का पंचांग', en: "Today's Panchang" },
    caption: {
      hi: 'अपने शहर के अनुसार आज की तिथि, नक्षत्र और महत्वपूर्ण समय देखें',
      en: "View today's tithi, nakshatra and key timings for your city",
    },
    bottom: 'home',
    ms: 6200,
    Comp: PanchangDemo,
  },
  {
    id: 'choghadiya',
    label: { hi: 'चौघड़िया', en: 'Choghadiya' },
    caption: {
      hi: 'वर्तमान चौघड़िया और अगला शुभ समय तुरंत जानें',
      en: 'Check the current Choghadiya and the next auspicious period',
    },
    bottom: 'choghadiya',
    ms: 6200,
    Comp: ChoghadiyaDemo,
  },
  {
    id: 'kundli',
    label: { hi: 'जन्म कुंडली', en: 'Janam Kundli' },
    caption: {
      hi: 'लग्न, ग्रह, भाव और दशा के माध्यम से अपनी जन्म कुंडली समझें',
      en: 'Understand your birth chart through lagna, planets, houses and dasha',
    },
    bottom: 'kundli',
    ms: 7000,
    Comp: KundliDemo,
  },
  {
    id: 'ask',
    label: { hi: 'ज्योतिषी से प्रश्न', en: 'Ask the Jyotishi' },
    caption: {
      hi: 'अपनी कुंडली, दशा और गोचर के आधार पर प्रश्नों के उत्तर जानें',
      en: 'Ask questions informed by your chart, dasha and current transits',
    },
    bottom: 'home',
    ms: 7000,
    Comp: AskJyotishiDemo,
  },
  {
    id: 'rashifal',
    label: { hi: 'राशिफल', en: 'Rashifal' },
    caption: {
      hi: 'प्रेम, करियर, धन और स्वास्थ्य से जुड़े दैनिक संकेत देखें',
      en: 'View daily insights for relationships, career, finances and health',
    },
    bottom: 'home',
    ms: 6200,
    Comp: RashifalDemo,
  },
]

const TRUST: Bi[] = [
  { hi: 'जन्म विवरण के अनुसार व्यक्तिगत कुंडली', en: 'A birth chart based on your details' },
  { hi: 'आपके शहर के अनुसार पंचांग और शुभ समय', en: 'Panchang and timings for your city' },
  { hi: 'हिंदी और English में सरल जानकारी', en: 'Easy-to-understand Hindi and English' },
]

const HEADLINE: Bi[] = [
  { hi: 'कुंडली समझें।', en: 'Understand your Kundli.' },
  { hi: 'शुभ समय जानें।', en: 'Find auspicious timings.' },
  { hi: 'वैदिक मार्गदर्शन लें।', en: 'Get Vedic guidance.' },
]

/* ── Motion ───────────────────────────────────────────────── */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const GROUP: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
}

const RISE: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(7px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: EASE },
  },
}

/** Deterministic drifting motes — no Math.random, so renders stay stable. */
const DUST = [
  { left: '9%', top: '74%', dur: 19, delay: 0 },
  { left: '21%', top: '88%', dur: 23, delay: 4 },
  { left: '34%', top: '66%', dur: 16, delay: 8 },
  { left: '58%', top: '92%', dur: 25, delay: 2 },
  { left: '71%', top: '72%', dur: 20, delay: 11 },
  { left: '86%', top: '84%', dur: 22, delay: 6 },
]

/* ── Hero ─────────────────────────────────────────────────── */

export function Hero() {
  const { hi, lang } = useLang()
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const [compactHero, setCompactHero] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const sync = () => setCompactHero(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  /* The demo board is authored at 300x630. CSS cannot divide a length by a
     length, so `scale(calc(width / 300))` was invalid and silently dropped —
     the board stayed 300px wide inside a narrower screen and spilled over its
     right edge. Measure the screen and hand the board a plain number. */
  useEffect(() => {
    const el = screenRef.current
    if (!el) return
    const apply = () => el.style.setProperty('--syh-board-scale', String(el.clientWidth / 300))
    apply()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const t = (h: string, e: string) => (hi ? h : e)

  /* The carousel ------------------------------------------------------- */
  const [index, setIndex] = useState(0)
  const [token, setToken] = useState(0) // bumped on every change → restarts the screen
  const [hovering, setHovering] = useState(false)
  const [awake, setAwake] = useState(true)

  // Pause when the tab is in the background or the hero has scrolled away.
  useEffect(() => {
    const onVis = () => setAwake(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const [onScreen, setOnScreen] = useState(true)
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((es) => setOnScreen(es.some((e) => e.isIntersecting)), {
      threshold: 0.05,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const play = awake && onScreen && !reduced
  const running = play && !hovering
  const handleStagePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(true)
  }
  const handleStagePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(false)
  }

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => {
      setIndex((p) => (p + 1) % SCREENS.length)
      setToken((n) => n + 1)
    }, SCREENS[index].ms)
    return () => window.clearTimeout(id)
  }, [running, index, token])

  /* The mandala sinks and dims as the page moves on; the copy and the phone
     lag it by a few pixels, so the whole opening has depth on the way out. */
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const mandalaY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const mandalaFade = useTransform(scrollYProgress, [0, 0.9], [1, 0.12])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 44])
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 26])

  const screen = SCREENS[index]
  const Live = screen.Comp
  const initial = reduced ? false : 'hidden'

  return (
    <section className="syh" id="top" ref={sectionRef} aria-labelledby="syh-title">
      <div className="syh__wash" aria-hidden />

      {compactHero ? null : (
        <motion.div
          className="syh__mandala"
          aria-hidden
          style={reduced ? undefined : { y: mandalaY, opacity: mandalaFade }}
        >
          <motion.div
            className="syh__mandala-pos"
            initial={reduced ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: EASE }}
          >
            <HeroMandala still={!!reduced} />
          </motion.div>
        </motion.div>
      )}

      <div className="syh__veil" aria-hidden />
      <div className="syh__vignette" aria-hidden />

      {reduced ? null : (
        <div className="syh__dust" aria-hidden>
          {DUST.map((p) => (
            <i
              key={p.left}
              style={{
                left: p.left,
                top: p.top,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="sy-container syh__grid">
        {/* ── Copy ───────────────────────────────────────────── */}
        <motion.div
          className="syh__copy"
          variants={GROUP}
          initial={initial}
          animate="show"
          style={reduced ? undefined : { y: copyY }}
        >
          <span className="syh__bleed" aria-hidden />
          <motion.p variants={RISE} className="sy-eyebrow syh__eyebrow" lang={hi ? 'hi' : 'en'}>
            {t(
              'दैनिक जीवन के लिए संपूर्ण वैदिक ज्योतिष ऐप',
              'A complete Vedic astrology app for everyday life',
            )}
          </motion.p>

          <motion.div className="syh__mobile-cosmos" variants={RISE} aria-hidden>
            <span className="syh__mobile-cosmos-glow" />
            <span className="syh__mobile-orbit syh__mobile-orbit--outer">
              <i />
              <i />
              <i />
            </span>
            <span className="syh__mobile-orbit syh__mobile-orbit--inner" />
            <svg viewBox="0 0 120 120" role="presentation">
              <circle cx="60" cy="60" r="51" />
              <circle cx="60" cy="60" r="31" />
              <path d="M60 21 91 78H29Z" />
              <path d="M60 99 29 42h62Z" />
              <path d="M60 35 80 72H40Z" />
              <path d="M60 85 40 48h40Z" />
              <circle className="syh__mobile-bindu" cx="60" cy="60" r="4.5" />
            </svg>
          </motion.div>

          <h1 id="syh-title" className="syh__title" lang={hi ? 'hi' : 'en'}>
            <span className="sr-only">
              {t(
                'कुंडली समझें। शुभ समय जानें। वैदिक मार्गदर्शन लें।',
                'Understand your Kundli. Find auspicious timings. Get Vedic guidance.',
              )}
            </span>
            <span aria-hidden>
              <motion.span className="syh__line syh__line--lead" variants={RISE}>
                <span className="sy-gold-text">{t(HEADLINE[0].hi, HEADLINE[0].en)}</span>
              </motion.span>
              <motion.span className="syh__line" variants={RISE}>
                {t(HEADLINE[1].hi, HEADLINE[1].en)}
              </motion.span>
              <motion.span className="syh__line" variants={RISE}>
                {t(HEADLINE[2].hi, HEADLINE[2].en)}
              </motion.span>
            </span>
          </h1>

          {/* The middle clause steps out on phones, where four lines of body
              copy push the device off the first screen. What is left is still
              a whole sentence — the tail carries the full stop. */}
          <motion.p className="syh__sub" variants={RISE}>
            {t(
              'श्री यंत्र में व्यक्तिगत जन्म कुंडली,',
              'Shree Yantra brings personalised birth charts,',
            )}
            <span className="syh__sub-more">
              {t(
                ' शहर के अनुसार पंचांग, शुभ मुहूर्त, राशिफल और ज्योतिषीय जानकारी',
                ' location-based Panchang, Muhurat, Rashifal and astrological guidance',
              )}
            </span>
            {t(
              ' के साथ धार्मिक ग्रंथ, आरती, मंत्र और कथाएँ एक ही ऐप में मिलती हैं।',
              ' together with scriptures, aarti, mantras and devotional stories in one app.',
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
              {t('Android ऐप डाउनलोड करें', 'Download the Android app')}
            </a>
            <a
              className="sy-btn-ghost"
              href="#features"
              onClick={(e) => {
                e.preventDefault()
                scrollToHash('#features')
              }}
            >
              {t('ऐप की विशेषताएँ देखें', 'Explore the app')}
            </a>
          </motion.div>

          {compactHero ? (
            <motion.div className="syh__trust-marquee" variants={RISE}>
              <Marquee
                key={`hero-trust-${lang}`}
                items={TRUST.map((chip) => ({ key: chip.en, label: t(chip.hi, chip.en) }))}
                seconds={34}
                ariaLabel={t('ऐप के बारे में', 'About the app')}
              />
            </motion.div>
          ) : (
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
          )}
        </motion.div>

        {/* ── The app, alive ─────────────────────────────────── */}
        <motion.div
          className="syh__stage"
          style={reduced ? undefined : { y: stageY }}
          onPointerEnter={handleStagePointerEnter}
          onPointerLeave={handleStagePointerLeave}
        >
          <motion.div
            className="syh__phonewrap"
            initial={reduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.28, ease: EASE }}
          >
            {compactHero ? (
              <div className="syh__mobile-mandala" aria-hidden>
                <HeroMandala still={!!reduced} />
              </div>
            ) : null}
            <span className="syh__bloom" aria-hidden />
            <div className={`syh-phone${reduced ? '' : ' is-float'}`}>
              <div className="syh-phone__fit">
                <div className="syh-phone__frame">
                  <span className="syh-phone__notch" aria-hidden />
                  <div
                    ref={screenRef}
                    className="syh-phone__screen"
                    id="syh-screen"
                    role="tabpanel"
                    aria-live="off"
                    aria-label={t(screen.label.hi, screen.label.en)}
                  >
                    {/* The demos are authored on a 300x630 board. This plain
                        wrapper scales that board down to the hero's smaller
                        screen — it must sit OUTSIDE the motion element, whose
                        inline transform would otherwise fight the scale. */}
                    <div className="syh-phone__zoom">
                      {/* one 300x630 board holds the screen AND the app's tab
                          bar, and the board alone is scaled — so the two can
                          never fall out of step with each other */}
                      <div className="syh-phone__board">
                      <AnimatePresence initial={false}>
                        <motion.div
                          key={`${screen.id}-${token}`}
                          className="syh-phone__slide"
                          initial={reduced ? false : { opacity: 0, y: 16, scale: 0.985 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -12, scale: 0.99 }}
                          transition={{ duration: reduced ? 0 : 0.55, ease: EASE }}
                        >
                          <Live hi={hi} play={play} />
                        </motion.div>
                      </AnimatePresence>
                      {/* the app's own tab bar belongs to the 300px board, so it
                          scales with it — outside the wrapper it stayed full
                          size and sat on top of the screen's last rows */}
                      <PhoneTabBar hi={hi} active={screen.bottom} />
                      </div>
                    </div>
                    {reduced ? null : <span className="syh-phone__glass" aria-hidden />}
                  </div>
                </div>
              </div>
            </div>

            <p className="syh__caption" key={`cap-${screen.id}`}>
              {t(screen.caption.hi, screen.caption.en)}
            </p>
          </motion.div>

          {/* The screen switcher is gone — the phone simply plays through the
              screens on its own. Anyone who wants to steer them has the full
              section right below. */}
        </motion.div>
      </div>

      {/* ── Scroll cue ─────────────────────────────────────────
          Desktop only. On phones the device rises out of the fold and
          dissolves into it, which says "there is more below" far better
          than a word can — and it buys the device that much more room. */}
      <div className="syh__foot">
        <button
          type="button"
          className="syh__cue"
          lang={hi ? 'hi' : 'en'}
          aria-label={t('नीचे आज का पंचांग देखें', "Scroll to today's Panchang")}
          onClick={() => scrollToHash('#live-proof')}
        >
          <span className="syh__cue-label">{t('आगे देखें', 'Scroll')}</span>
          <span className="syh__cue-icon" aria-hidden>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  )
}
