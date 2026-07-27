import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLang } from '@/i18n/LangProvider'
import { PhoneTabBar, type DemoProps } from './parts/demos/chrome'
import { PanchangDemo } from './parts/demos/PanchangDemo'
import { ChoghadiyaDemo } from './parts/demos/ChoghadiyaDemo'
import { KundliDemo } from './parts/demos/KundliDemo'
import { AskJyotishiDemo } from './parts/demos/AskJyotishiDemo'
import { RashifalDemo } from './parts/demos/RashifalDemo'
import './appinaction.css'

/**
 * The app, alive — five of its signature screens rebuilt as real UI inside one
 * phone, each animating the behaviour that matters.
 *
 * LAYOUT — "the console". One screen, three parts, read left to right:
 *   · a numbered STEP RAIL that says which screen is playing and what is next
 *   · the PHONE, centre stage, sized from the viewport height so the whole
 *     device is visible without scrolling past it
 *   · a DETAIL panel whose words change with the screen
 * Below 1080px the rail lies down into a horizontal strip above the phone and
 * the detail panel moves under it; below 760px the facts fold away so the
 * section still reads on one comfortable screen.
 *
 * MOTION — GSAP ScrollTrigger, all of it inside a gsap.context() that is
 * reverted on unmount:
 *   · one trigger toggles play/pause as the section enters and leaves
 *   · one entrance timeline staggers the header, rail, phone and panel in once
 *   · one scrubbed tween lifts the phone a few pixels as the page moves
 * Nothing is pinned, so the page never traps a scroll — identical on touch.
 * prefers-reduced-motion: no auto-advance, no scrub, every screen final.
 */

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

type Bi = { hi: string; en: string }

type Demo = {
  id: string
  tab: Bi
  /** One line on the rail, under the name — what this screen is for. */
  rail: Bi
  title: Bi
  caption: Bi
  facts: Bi[]
  /** Which of the app's five bottom tabs this screen lives under. */
  bottom: string
  ms: number
  Comp: ComponentType<DemoProps>
}

const DEMOS: Demo[] = [
  {
    id: 'panchang',
    tab: { hi: 'पंचांग', en: 'Panchang' },
    rail: { hi: 'आज के पाँच अंग', en: "Today's five limbs" },
    title: { hi: 'आज का पंचांग', en: "Today's Panchang" },
    caption: {
      hi: 'पाँचों अंग, हर एक अपने समाप्ति समय के साथ — और साथ में सूर्योदय, सूर्यास्त तथा राहु काल।',
      en: 'All five limbs, each with the time it ends — plus sunrise, sunset and Rahu Kaal.',
    },
    facts: [
      { hi: 'तिथि, नक्षत्र, योग, करण, वार', en: 'Tithi, nakshatra, yoga, karana, vaara' },
      { hi: 'हर अंग का समाप्ति समय', en: 'End time for every limb' },
      { hi: 'आपके शहर के अनुसार', en: 'Calculated for your city' },
    ],
    bottom: 'home',
    ms: 7200,
    Comp: PanchangDemo,
  },
  {
    id: 'choghadiya',
    tab: { hi: 'चौघड़िया', en: 'Choghadiya' },
    rail: { hi: 'अभी शुभ है या नहीं', en: 'Is this hour auspicious' },
    title: { hi: 'चौघड़िया', en: 'Choghadiya' },
    caption: {
      hi: 'अभी कौन-सा चौघड़िया चल रहा है, कितना बचा है, और अगला शुभ समय कब खुलेगा।',
      en: 'Which window is running right now, how much of it is left, and when the next auspicious one opens.',
    },
    facts: [
      { hi: 'दिन और रात — पूरे 24 घंटे', en: 'Day and night — a full 24 hours' },
      { hi: 'चालू समय की जीवित प्रगति', en: 'Live progress of the running window' },
      { hi: 'अगला शुभ समय, सामने', en: 'Next auspicious window, up front' },
    ],
    bottom: 'choghadiya',
    ms: 7600,
    Comp: ChoghadiyaDemo,
  },
  {
    id: 'kundli',
    tab: { hi: 'कुंडली', en: 'Kundli' },
    rail: { hi: 'जन्म के समय का आकाश', en: 'The sky at your birth' },
    title: { hi: 'जन्म कुंडली', en: 'Janam Kundli' },
    caption: {
      hi: 'जन्म के समय आकाश जैसा था — हर ग्रह अपने भाव में, लग्न, राशि, नक्षत्र और चलती महादशा के साथ।',
      en: 'The sky as it stood at your birth — every planet in its house, with lagna, rashi, nakshatra and the mahadasha now running.',
    },
    facts: [
      { hi: 'उत्तर, दक्षिण और पूर्व शैली', en: 'North, South and East styles' },
      { hi: 'ग्रह, भाव, योग और दोष', en: 'Grahas, bhavas, yogas and doshas' },
      { hi: 'हर खाने पर टैप करके समझिए', en: 'Tap any house to understand it' },
    ],
    bottom: 'kundli',
    ms: 9600,
    Comp: KundliDemo,
  },
  {
    id: 'ask',
    tab: { hi: 'ज्योतिषी', en: 'Jyotishi' },
    rail: { hi: 'अपनी कुंडली से उत्तर', en: 'Answers from your chart' },
    title: { hi: 'ज्योतिषी से प्रश्न', en: 'Ask the Jyotishi' },
    caption: {
      hi: 'प्रश्न पूछिए — उत्तर आपकी अपनी कुंडली से बनता है, और जिस ग्रह पर आधारित है वह भी दिखता है।',
      en: 'Ask anything — the answer is built from your own chart, and it shows you the placement it rests on.',
    },
    facts: [
      { hi: 'आपकी कुंडली पर आधारित', en: 'Grounded in your kundli' },
      { hi: 'हाँ या ना, साफ़ शब्दों में', en: 'A clear yes or no, in plain words' },
      { hi: 'हिंदी और English', en: 'Hindi and English' },
    ],
    bottom: 'home',
    ms: 10400,
    Comp: AskJyotishiDemo,
  },
  {
    id: 'rashifal',
    tab: { hi: 'राशिफल', en: 'Rashifal' },
    rail: { hi: 'दिन का मिज़ाज', en: "The day's mood" },
    title: { hi: 'आपका राशिफल', en: 'Your Rashifal' },
    caption: {
      hi: 'दिन का मिज़ाज एक नज़र में, हर क्षेत्र का हाल और शुभ रंग, अंक तथा समय — आपकी अपनी कुंडली से।',
      en: "The day's mood at a glance, how each area stands, and the lucky colour, number and hour — read from your own chart.",
    },
    facts: [
      { hi: 'दैनिक, साप्ताहिक, मासिक, वार्षिक', en: 'Daily, weekly, monthly, yearly' },
      { hi: 'बारह राशियों का राशिफल भी', en: 'All twelve signs as well' },
      { hi: 'शुभ रंग, अंक और समय', en: 'Lucky colour, number and hour' },
    ],
    bottom: 'home',
    ms: 8400,
    Comp: RashifalDemo,
  },
]

export function AppInAction() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const screenRef = useRef<HTMLSpanElement>(null)
  const touchX = useRef<number | null>(null)

  const [onScreen, setOnScreen] = useState(false)
  const [awake, setAwake] = useState(true)
  const [index, setIndex] = useState(0)
  const [token, setToken] = useState(0)

  /* The demo board is authored at exactly 300x630 and the phone is sized from
     the viewport height, so the board is scaled by a measured factor. CSS
     cannot divide a length by a length — hand it a plain number. */
  useEffect(() => {
    const el = screenRef.current
    if (!el) return
    const apply = () => el.style.setProperty('--sya-board-scale', String(el.clientWidth / 300))
    apply()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* A background tab must not burn through the five screens unseen. */
  useEffect(() => {
    const onVis = () => setAwake(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useLayoutEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        end: 'bottom 12%',
        onToggle: (self) => setOnScreen(self.isActive),
      })

      if (reduce) return

      gsap.from('[data-sya-in]', {
        opacity: 0,
        y: 26,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
      })

      gsap.from('[data-sya-phone]', {
        opacity: 0,
        y: 44,
        scale: 0.955,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      })

      /* A few pixels of lift as the page moves through — transform only, and
         never enough to be a "scroll effect" people have to wait out. */
      gsap.fromTo(
        '[data-sya-float]',
        { yPercent: 2.6 },
        {
          yPercent: -2.6,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [reduce])

  const play = onScreen && awake && !reduce

  useEffect(() => {
    if (!play) return
    const t = window.setTimeout(() => {
      setIndex((p) => (p + 1) % DEMOS.length)
      setToken((n) => n + 1)
    }, DEMOS[index].ms)
    return () => window.clearTimeout(t)
  }, [play, index, token])

  const go = (next: number) => {
    setIndex((next + DEMOS.length) % DEMOS.length)
    setToken((t) => t + 1)
  }

  const demo = DEMOS[index]
  const Screen = demo.Comp

  return (
    <section id="features" ref={sectionRef} className="sya" aria-labelledby="sya-h">
      <span className="sya__bg" aria-hidden />

      <div className="sy-container sya__inner">
        <header className="sya__head">
          <div className="sya__head-l" data-sya-in>
            <p className="sy-eyebrow">{hi ? 'ऐप के अंदर' : 'Inside the app'}</p>
            <h2 id="sya-h" className="sy-h2 sya__h2">
              {hi ? (
                <>
                  देखिए ऐप <span className="sy-gold-text">चलते हुए</span>
                </>
              ) : (
                <>
                  Watch the app <span className="sy-gold-text">in motion</span>
                </>
              )}
            </h2>
          </div>
          <p className="sya__lead" data-sya-in>
            {hi
              ? 'पाँच स्क्रीन, वैसी ही जैसी फ़ोन में चलती हैं — अपने आप बदलती हुईं। किसी भी नाम पर टैप कीजिए।'
              : 'Five screens, running the way they run on a phone — and moving on by themselves. Tap any name to jump.'}
          </p>
        </header>

        <div className="sya__stage">
          <div className="sya__railwrap" data-sya-in>
            <p className="sya__rail-k">{hi ? 'पाँच स्क्रीन' : 'Five screens'}</p>
            <ol className="sya__rail" role="tablist" aria-label={hi ? 'ऐप की स्क्रीन' : 'App screens'}>
              {DEMOS.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="tab"
                    data-sya-step
                    aria-selected={i === index}
                    aria-controls="sya-screen"
                    className={`sya-step${i === index ? ' is-on' : ''}`}
                    onClick={() => go(i)}
                  >
                    <span className="sya-step__n sy-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="sya-step__body">
                      <b className="sya-step__name">{hi ? item.tab.hi : item.tab.en}</b>
                      <em className="sya-step__sub">{hi ? item.rail.hi : item.rail.en}</em>
                    </span>
                    <span className="sya-step__bar" aria-hidden>
                      {i === index ? (
                        <i
                          key={token}
                          style={{
                            animationDuration: `${item.ms}ms`,
                            animationPlayState: play ? 'running' : 'paused',
                          }}
                        />
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="sya__rail-hint">
              {hi
                ? 'अपने आप बदलती रहती हैं — या किसी पर टैप कीजिए'
                : 'They move on by themselves — or tap any one'}
            </p>
          </div>

          <div
            className="sya__phonewrap"
            data-sya-float
            onTouchStart={(e) => {
              touchX.current = e.touches[0]?.clientX ?? null
            }}
            onTouchEnd={(e) => {
              const start = touchX.current
              const end = e.changedTouches[0]?.clientX
              touchX.current = null
              if (start == null || end == null) return
              const dx = end - start
              if (Math.abs(dx) > 44) go(index + (dx < 0 ? 1 : -1))
            }}
          >
            <span className="sya__glow" aria-hidden />
            <div className="sya-phone" data-sya-phone>
              <span className="sya__rec">
                <i className="sy-live-dot" />
                {hi ? 'चल रहा है' : 'Running'}
              </span>
              <span className="sya-phone__frame">
                <span className="sya-phone__notch" aria-hidden />
                <span className="sya-phone__screen" id="sya-screen" role="tabpanel" ref={screenRef}>
                  <span className="sya-phone__board">
                    <Screen key={`${demo.id}-${token}`} hi={hi} play={play} />
                    <PhoneTabBar hi={hi} active={demo.bottom} />
                  </span>
                  {play ? <span className="sya-phone__sweep" aria-hidden /> : null}
                </span>
              </span>
            </div>
          </div>

          <aside className="sya__detail" data-sya-in>
            <p className="sya__detail-k">{hi ? 'यह स्क्रीन' : 'On screen now'}</p>
            <h3 className="sya__detail-h" key={`t-${demo.id}`}>
              {hi ? demo.title.hi : demo.title.en}
            </h3>
            <p className="sya__detail-p" key={`c-${demo.id}`}>
              {hi ? demo.caption.hi : demo.caption.en}
            </p>
            <ul className="sya__facts" key={`f-${demo.id}`}>
              {demo.facts.map((f) => (
                <li className="sya-fact" key={f.en}>
                  <i aria-hidden />
                  {hi ? f.hi : f.en}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
