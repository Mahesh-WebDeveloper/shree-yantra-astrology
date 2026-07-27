import { useEffect, useRef, useState, type ComponentType } from 'react'
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
      hi: 'आज की तिथि, नक्षत्र और शुभ-अशुभ समय',
      en: "Today's tithi, nakshatra and the day's timings",
    },
    bottom: 'home',
    ms: 6200,
    Comp: PanchangDemo,
  },
  {
    id: 'choghadiya',
    label: { hi: 'चौघड़िया', en: 'Choghadiya' },
    caption: {
      hi: 'अभी कौन-सा चौघड़िया चल रहा है, और अगला शुभ समय कब',
      en: 'Which window is running now, and when the next good one opens',
    },
    bottom: 'choghadiya',
    ms: 6200,
    Comp: ChoghadiyaDemo,
  },
  {
    id: 'kundli',
    label: { hi: 'जन्म कुंडली', en: 'Janam Kundli' },
    caption: {
      hi: 'जन्म के समय का आकाश — हर ग्रह अपने भाव में',
      en: 'The sky at the hour you were born — every planet in its house',
    },
    bottom: 'kundli',
    ms: 7000,
    Comp: KundliDemo,
  },
  {
    id: 'ask',
    label: { hi: 'ज्योतिषी से प्रश्न', en: 'Ask the Jyotishi' },
    caption: {
      hi: 'प्रश्न पूछिए — उत्तर आपकी अपनी कुंडली से बनता है',
      en: 'Ask a question — the answer is built from your own chart',
    },
    bottom: 'home',
    ms: 7000,
    Comp: AskJyotishiDemo,
  },
  {
    id: 'rashifal',
    label: { hi: 'राशिफल', en: 'Rashifal' },
    caption: {
      hi: 'दिन का हाल एक नज़र में, हर क्षेत्र के साथ',
      en: 'The day at a glance, area by area',
    },
    bottom: 'home',
    ms: 6200,
    Comp: RashifalDemo,
  },
]

const TRUST: Bi[] = [
  { hi: 'तारीखें पंचांग से मिलाकर जाँची हुई', en: 'Dates checked against the panchang' },
  { hi: '18 पुराण · 4 वेद · गीता · रामायण', en: '18 Puranas · 4 Vedas · Gita · Ramayana' },
  { hi: 'हिंदी और English', en: 'Hindi and English' },
]

/* ── The headline's turning word ──────────────────────────────
   One slot of the headline rotates through what the app actually
   computes. The Hindi slot carries its own possessive because the
   words disagree in gender (आपका पंचांग / आपकी कुंडली); the comma
   travels inside the slot so the reserved width ends the line and
   nothing ever reflows. */

const SWAP_WORDS: Bi[] = [
  { hi: 'आपका पंचांग,', en: 'panchang,' },
  { hi: 'आपकी कुंडली,', en: 'kundli,' },
  { hi: 'आपका मुहूर्त,', en: 'muhurat,' },
  { hi: 'आपका राशिफल,', en: 'rashifal,' },
  { hi: 'आपका चौघड़िया,', en: 'choghadiya,' },
]

const SWAP_MS = 2800

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

/**
 * The rotating headline word. All candidate words are laid out invisibly in
 * the same grid cell, so the slot is always exactly as wide as its widest
 * word — the swap can never reflow the headline. With reduced motion the
 * first word simply stands.
 */
function WordSwap({ words, active, reduced }: { words: string[]; active: boolean; reduced: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!active || reduced) return
    const id = window.setInterval(() => setI((p) => (p + 1) % words.length), SWAP_MS)
    return () => window.clearInterval(id)
  }, [active, reduced, words.length])

  const word = words[reduced ? 0 : i % words.length]

  return (
    <span className="syh__swap">
      {words.map((w) => (
        <span key={w} className="syh__swap-size" aria-hidden>
          {w}
        </span>
      ))}
      {reduced ? (
        <span className="syh__swap-word">
          <span className="sy-gold-text">{word}</span>
        </span>
      ) : (
        <AnimatePresence initial={false}>
          {/* sync mode: the old word is still sliding out of the top of the
              clip while the new one rises in — the slot is never empty.
              The gradient lives on an inner span: painting `background-clip:
              text` on the element the transform composites breaks the clip in
              Chromium and the gradient floods the whole box. */}
          <motion.span
            key={word}
            className="syh__swap-word"
            initial={{ y: '1.1em', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-1.1em', opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <span className="sy-gold-text">{word}</span>
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  )
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
  const { hi } = useLang()
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)

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
  const [titleHover, setTitleHover] = useState(false) // pauses the word swap
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
            {t('पंडित जी की सटीक गणना', 'The pandit’s own calculations')}
          </motion.p>

          <h1
            id="syh-title"
            className="syh__title"
            lang={hi ? 'hi' : 'en'}
            onPointerEnter={() => setTitleHover(true)}
            onPointerLeave={() => setTitleHover(false)}
          >
            {/* screen readers get the whole sentence once, not a slot machine */}
            <span className="sr-only">
              {t(
                'आपका पंचांग, कुंडली, मुहूर्त और राशिफल — बिल्कुल सटीक, अब आपके फ़ोन में',
                'Your panchang, kundli, muhurat and rashifal — exactly right, now on your phone',
              )}
            </span>
            <span aria-hidden>
              <motion.span className="syh__line" variants={RISE}>
                {hi ? null : <>Your&nbsp;</>}
                <WordSwap
                  words={SWAP_WORDS.map((w) => (hi ? w.hi : w.en))}
                  active={play && !titleHover}
                  reduced={!!reduced}
                />
              </motion.span>
              <motion.span className="syh__line" variants={RISE}>
                {t('बिल्कुल सटीक — अब आपके फ़ोन में', 'exactly right — now on your phone')}
              </motion.span>
            </span>
          </h1>

          <motion.p className="syh__sub" variants={RISE}>
            {t(
              'आज की तिथि, शुभ मुहूर्त, अपनी जन्म कुंडली, राशिफल और आरती-पुराण का पूरा संग्रह — सब कुछ हिंदी में, एक ही ऐप में।',
              "Today's tithi, auspicious timings, your own birth chart, horoscope and a complete library of aartis and scriptures — all in Hindi and English, in one app.",
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

        {/* ── The app, alive ─────────────────────────────────── */}
        <motion.div
          className="syh__stage"
          style={reduced ? undefined : { y: stageY }}
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
          onFocusCapture={() => setHovering(true)}
          onBlurCapture={() => setHovering(false)}
        >
          <motion.div
            className="syh__phonewrap"
            initial={reduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.28, ease: EASE }}
          >
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
          Fills the hero's foot (the phone is hidden on small screens, so the
          composition there is copy + chakra + this quiet invitation). */}
      <div className="syh__foot">
        <button
          type="button"
          className="syh__cue"
          lang={hi ? 'hi' : 'en'}
          onClick={() => scrollToHash('#features')}
        >
          <span>{t('और देखिए', 'Scroll')}</span>
          <span className="syh__cue-rail" aria-hidden />
        </button>
      </div>
    </section>
  )
}
