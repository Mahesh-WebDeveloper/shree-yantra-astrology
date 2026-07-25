import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useReducedMotion } from 'framer-motion'
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
 * phone, each animating the behaviour that matters. It plays like a short
 * silent film: a screen runs, then hands over to the next.
 *
 * Rules that keep it calm:
 *  · animation only runs while the section is on screen (IntersectionObserver)
 *  · prefers-reduced-motion shows every screen in its finished state
 *  · nothing is pinned — no scroll hijack, identical behaviour on a phone
 */

type Bi = { hi: string; en: string }

type Demo = {
  id: string
  tab: Bi
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
    ms: 7200,
    Comp: ChoghadiyaDemo,
  },
  {
    id: 'kundli',
    tab: { hi: 'कुंडली', en: 'Kundli' },
    title: { hi: 'जन्म कुंडली', en: 'Janam Kundli' },
    caption: {
      hi: 'जन्म के समय आकाश जैसा था — हर ग्रह अपने भाव में, लग्न, राशि और नक्षत्र के साथ।',
      en: 'The sky as it stood at your birth — every planet in its house, with lagna, rashi and nakshatra.',
    },
    facts: [
      { hi: 'उत्तर, दक्षिण और पूर्व शैली', en: 'North, South and East styles' },
      { hi: 'ग्रह, भाव, योग और दोष', en: 'Grahas, bhavas, yogas and doshas' },
      { hi: 'हर खाने पर टैप करके समझिए', en: 'Tap any house to understand it' },
    ],
    bottom: 'kundli',
    ms: 9000,
    Comp: KundliDemo,
  },
  {
    id: 'ask',
    tab: { hi: 'ज्योतिषी', en: 'Jyotishi' },
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
    ms: 9600,
    Comp: AskJyotishiDemo,
  },
  {
    id: 'rashifal',
    tab: { hi: 'राशिफल', en: 'Rashifal' },
    title: { hi: 'आपका राशिफल', en: 'Your Rashifal' },
    caption: {
      hi: 'दिन का मिज़ाज एक नज़र में, और हर क्षेत्र का हाल — आपकी अपनी कुंडली से।',
      en: "The day's mood at a glance and how each area stands — read from your own chart.",
    },
    facts: [
      { hi: 'दैनिक, साप्ताहिक, मासिक, वार्षिक', en: 'Daily, weekly, monthly, yearly' },
      { hi: 'बारह राशियों का राशिफल भी', en: 'All twelve signs as well' },
      { hi: 'पढ़ने का आकार अपने हिसाब से', en: 'Reading size to suit your eyes' },
    ],
    bottom: 'home',
    ms: 7600,
    Comp: RashifalDemo,
  },
]

export function AppInAction() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const touchX = useRef<number | null>(null)

  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(0)
  const [token, setToken] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.22 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const play = visible && !reduce

  useEffect(() => {
    if (!play) return
    const t = window.setTimeout(() => {
      setIndex((p) => (p + 1) % DEMOS.length)
      setToken((t2) => t2 + 1)
    }, DEMOS[index].ms)
    return () => window.clearTimeout(t)
  }, [play, index, token])

  const go = (next: number) => {
    const n = (next + DEMOS.length) % DEMOS.length
    setIndex(n)
    setToken((t) => t + 1)
  }

  const demo = DEMOS[index]
  const Screen = demo.Comp

  return (
    <section
      id="features"
      ref={sectionRef}
      className="sy-section sya"
      aria-labelledby="sya-h"
    >
      <span className="sya__bg" aria-hidden />

      <div className="sy-container">
        <header className="sya__head">
          <p className="sy-eyebrow sy-eyebrow--center">{hi ? 'ऐप के अंदर' : 'Inside the app'}</p>
          <h2 id="sya-h" className="sy-h2">
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
          <p className="sy-lead sya__lead">
            {hi
              ? 'पाँच स्क्रीन, वैसी ही जैसी फ़ोन में चलती हैं — अपने आप बदलती हुईं। किसी भी नाम पर टैप कीजिए।'
              : 'Five screens, running the way they run on a phone — and moving on by themselves. Tap any name to jump.'}
          </p>
        </header>

        <div className="sya__tabs" role="tablist" aria-label={hi ? 'ऐप की स्क्रीन' : 'App screens'}>
          {DEMOS.map((demoItem, i) => (
            <button
              key={demoItem.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`sya-tab${i === index ? ' is-on' : ''}`}
              onClick={() => go(i)}
            >
              <span className="sya-tab__num sy-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="sya-tab__label">{hi ? demoItem.tab.hi : demoItem.tab.en}</span>
              {i === index ? (
                <span
                  key={token}
                  className="sya-tab__fill"
                  style={{ animationDuration: `${demoItem.ms}ms`, animationPlayState: play ? 'running' : 'paused' }}
                  aria-hidden
                />
              ) : null}
            </button>
          ))}
        </div>

        <div
          className="sya__stage"
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
          <aside className="sya__note sya__side">
            <p className="sya__note-k">{hi ? 'यह स्क्रीन' : 'This screen'}</p>
            <h3 className="sya__note-h" key={`t-${demo.id}`}>
              {hi ? demo.title.hi : demo.title.en}
            </h3>
            <p className="sya__note-p" key={`c-${demo.id}`}>
              {hi ? demo.caption.hi : demo.caption.en}
            </p>
          </aside>

          <div className="sya__phonewrap">
            <span className="sya__glow" aria-hidden />
            <span className="sya__rec">
              <i className="sy-live-dot" />
              {hi ? 'चल रहा है' : 'Running'}
            </span>
            <div className="sya-phone">
              <span className="sya-phone__frame">
                <span className="sya-phone__notch" aria-hidden />
                <span className="sya-phone__screen">
                  <Screen key={`${demo.id}-${token}`} hi={hi} play={play} />
                  <PhoneTabBar hi={hi} active={demo.bottom} />
                  {play ? <span className="sya-phone__sweep" aria-hidden /> : null}
                </span>
              </span>
            </div>
            <div className="sya__dots" role="tablist" aria-label={hi ? 'स्क्रीन चुनिए' : 'Choose a screen'}>
              {DEMOS.map((demoItem, i) => (
                <button
                  key={demoItem.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={hi ? demoItem.tab.hi : demoItem.tab.en}
                  className={`sya-dot${i === index ? ' is-on' : ''}`}
                  onClick={() => go(i)}
                />
              ))}
            </div>
          </div>

          <aside className="sya__facts sya__side">
            <p className="sya__note-k">{hi ? 'इसमें क्या है' : 'What it gives you'}</p>
            <ul key={`f-${demo.id}`}>
              {demo.facts.map((f) => (
                <li className="sya-fact" key={f.en}>
                  <i aria-hidden />
                  {hi ? f.hi : f.en}
                </li>
              ))}
            </ul>
          </aside>

        <p className="sya__caption" key={`cap-${demo.id}`}>
          <b>{hi ? demo.title.hi : demo.title.en}</b>
          <span>{hi ? demo.caption.hi : demo.caption.en}</span>
        </p>
        </div>
      </div>
    </section>
  )
}
