import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLang } from '@/i18n/LangProvider'
import type { AppScreenId } from '@/data/appScreens'
import { PhoneStack } from './parts/PhoneStack'
import './sections.css'

gsap.registerPlugin(ScrollTrigger)

type Bi = { hi: string; en: string }

type Beat = {
  id: string
  rail: Bi
  eyebrow: Bi
  titleHi: string
  titleEn: string
  desc: Bi
  chips: Bi[]
  screen: AppScreenId
  back: AppScreenId | null
}

const BEATS: Beat[] = [
  {
    id: 'kundli',
    rail: { hi: 'कुंडली', en: 'Kundli' },
    eyebrow: { hi: 'आपकी अपनी कुंडली', en: 'Your own birth chart' },
    titleHi: 'जन्म कुंडली',
    titleEn: 'Janam Kundli',
    desc: {
      hi: 'जन्म के समय आकाश जैसा था, ठीक वैसा चार्ट — D1 के साथ विभागीय कुंडलियाँ, और हर ग्रह अपने भाव, राशि तथा नक्षत्र के साथ।',
      en: 'The sky exactly as it stood at your birth — the D1 chart plus divisional charts, with every planet shown in its house, sign and nakshatra.',
    },
    chips: [
      { hi: 'D1 और विभागीय चार्ट', en: 'D1 + divisional charts' },
      { hi: 'योग और दोष', en: 'Yogas and doshas' },
      { hi: 'विंशोत्तरी दशा समयरेखा', en: 'Vimshottari dasha timeline' },
    ],
    screen: 'kundli',
    back: 'kundli_hub',
  },
  {
    id: 'panchang',
    rail: { hi: 'पंचांग', en: 'Panchang' },
    eyebrow: { hi: 'हर दिन नापा हुआ', en: 'Every day, measured' },
    titleHi: 'पंचांग',
    titleEn: 'Panchang',
    desc: {
      hi: 'तिथि, नक्षत्र, योग, करण और वार — हर अंग अपने समाप्ति समय के साथ, उदया तिथि परंपरा से। साथ में सूर्योदय, सूर्यास्त और राहु काल।',
      en: 'Tithi, nakshatra, yoga, karana and vaara — each with its end time, following the udaya tithi convention. Sunrise, sunset and Rahu Kaal alongside.',
    },
    chips: [
      { hi: 'पाँचों अंग, समाप्ति समय के साथ', en: 'Five limbs with end times' },
      { hi: 'सूर्योदय, सूर्यास्त, राहु काल', en: 'Sunrise, sunset, Rahu Kaal' },
      { hi: '230 व्रत और त्योहार, खोज के साथ', en: '230 vrat and festivals, searchable' },
    ],
    screen: 'panchang',
    back: null,
  },
  {
    id: 'choghadiya',
    rail: { hi: 'चौघड़िया', en: 'Choghadiya' },
    eyebrow: { hi: 'सही समय, सही काम', en: 'The right hour for the work' },
    titleHi: 'चौघड़िया',
    titleEn: 'Choghadiya',
    desc: {
      hi: 'दिन और रात का पूरा 24 घंटे का मुहूर्त — अभी कौन सा चौघड़िया चल रहा है, कितना बचा है, और अगला शुभ समय कब खुलेगा।',
      en: 'The complete 24-hour day and night muhurat — which choghadiya is running right now, how much of it is left, and when the next auspicious window opens.',
    },
    chips: [
      { hi: 'दिन और रात, दोनों', en: 'Day and night, both' },
      { hi: 'चालू समय की लाइव प्रगति', en: 'Live progress of the current window' },
      { hi: 'अगला शुभ समय', en: 'Next auspicious time' },
    ],
    screen: 'choghadiya',
    back: null,
  },
  {
    id: 'rashifal',
    rail: { hi: 'राशिफल', en: 'Rashifal' },
    eyebrow: { hi: 'सामान्य नहीं, आपका', en: 'Not generic — yours' },
    titleHi: 'राशिफल',
    titleEn: 'Rashifal',
    desc: {
      hi: 'आपकी अपनी कुंडली पर आधारित दैनिक पाठ, और साथ में बारह राशियों का राशिफल। पढ़ने का आकार अपनी सुविधा से बदलिए।',
      en: 'A daily reading grounded on your own chart, plus the twelve-sign horoscope. Set the reading size to whatever is comfortable.',
    },
    chips: [
      { hi: 'आपकी कुंडली से बना', en: 'Built from your chart' },
      { hi: 'बारह राशियों का राशिफल', en: 'All twelve signs' },
      { hi: 'पढ़ने का आकार अपने हिसाब से', en: 'Reading-size controls' },
    ],
    screen: 'rashifal',
    back: 'vedic_reading',
  },
  {
    id: 'jyotishi',
    rail: { hi: 'ज्योतिषी', en: 'Jyotishi' },
    eyebrow: { hi: 'पूछिए, अपनी कुंडली से', en: 'Ask, from your own chart' },
    titleHi: 'ज्योतिषी से प्रश्न',
    titleEn: 'Ask the Jyotishi',
    desc: {
      hi: 'प्रश्न पूछिए — उत्तर आपकी अपनी कुंडली से बनता है, किसी सामान्य लेख से नहीं। हर पुरानी बातचीत खोज कर दोबारा पढ़ी जा सकती है।',
      en: 'Ask anything — the answer is assembled from your own kundli, not from generic text. Every past conversation stays searchable.',
    },
    chips: [
      { hi: 'आपकी कुंडली पर आधारित', en: 'Grounded on your kundli' },
      { hi: 'खोजने योग्य इतिहास', en: 'Searchable history' },
      { hi: 'हिंदी और English', en: 'Hindi and English' },
    ],
    screen: 'ai',
    back: null,
  },
]

const MAIN_SCREENS = BEATS.map((b) => b.screen)
const BACK_SCREENS = BEATS.map((b) => b.back)

const MORE = [
  {
    id: 'muhurat',
    tag: { hi: 'मुहूर्त', en: 'Muhurat' },
    title: { hi: 'शुभ मुहूर्त', en: 'Shubh Muhurat' },
    desc: {
      hi: 'विवाह, गृह प्रवेश, वाहन या नए काम के लिए समय — हर खिड़की स्कोर के साथ।',
      en: 'Timing for marriage, griha pravesh, a vehicle or a new venture — every window scored.',
    },
  },
  {
    id: 'milan',
    tag: { hi: 'मिलान', en: 'Matching' },
    title: { hi: 'कुंडली मिलान', en: 'Kundli Milan' },
    desc: {
      hi: '36 गुण मिलान, दोष की जाँच के साथ।',
      en: '36-guna matching, with dosha checks.',
    },
  },
  {
    id: 'namkaran',
    tag: { hi: 'नामकरण', en: 'Naming' },
    title: { hi: 'बच्चे का नाम', en: 'Baby Names' },
    desc: {
      hi: 'नक्षत्र के अक्षर से नाम, अर्थ के साथ।',
      en: 'Names from the nakshatra syllable, each with its meaning.',
    },
  },
  {
    id: 'vastu',
    tag: { hi: 'वास्तु', en: 'Vastu' },
    title: { hi: 'वास्तु मार्गदर्शन', en: 'Vastu Guidance' },
    desc: {
      hi: 'घर की दिशा और हर कोने के लिए सरल मार्गदर्शन।',
      en: 'Plain-language guidance for the direction of a home and each of its corners.',
    },
  },
  {
    id: 'ank',
    tag: { hi: 'अंक', en: 'Numbers' },
    title: { hi: 'अंक ज्योतिष', en: 'Numerology' },
    desc: {
      hi: 'मूलांक, भाग्यांक और नाम अंक, अर्थ के साथ।',
      en: 'Mulank, bhagyank and name number, explained.',
    },
  },
]

function num(i: number) {
  return String(i + 1).padStart(2, '0')
}

export function FeatureJourneys() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const [active, setActive] = useState(0)
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const pinned = wide && !reduce

  useEffect(() => {
    if (!pinned) {
      setActive(0)
      return
    }
    const wrap = wrapRef.current
    const stage = stageRef.current
    if (!wrap || !stage) return

    const ctx = gsap.context(() => {
      triggerRef.current = ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: 'bottom bottom',
        pin: stage,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const next = Math.max(
            0,
            Math.min(BEATS.length - 1, Math.floor(self.progress * BEATS.length)),
          )
          setActive((prev) => (prev === next ? prev : next))
        },
      })
    }, wrap)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      triggerRef.current = null
      ctx.revert()
    }
  }, [pinned])

  const goToBeat = (index: number) => {
    const st = triggerRef.current
    if (!st) return
    const span = st.end - st.start
    const target = st.start + ((index + 0.35) / BEATS.length) * span
    window.scrollTo({ top: Math.round(target), behavior: 'auto' })
  }

  const beat = BEATS[active]

  return (
    <section id="features" className="syj sy-section syj-features" aria-labelledby="syj-features-h">
      <span className="syj-features__bg" aria-hidden />

      <div className="sy-container">
        <div className="syj-intro">
          <p className="syj-kicker">{hi ? 'ऐप के अंदर' : 'Inside the app'}</p>
          <h2 id="syj-features-h" className="syj-title">
            {hi ? (
              <>
                हर दिन का ज्योतिष, <em>आपकी अपनी कुंडली</em> से
              </>
            ) : (
              <>
                Everyday jyotish, built from <em>your own chart</em>
              </>
            )}
          </h2>
          <p className="syj-sub">
            {hi
              ? 'नीचे जो दिख रहा है वह ऐप की असली स्क्रीन हैं — कोई सजावटी चित्र नहीं, कोई नकली आँकड़ा नहीं।'
              : 'Everything below is a real screen from the app — no decorative mock-ups, no placeholder data.'}
          </p>
        </div>
      </div>

      {pinned ? (
        <div
          ref={wrapRef}
          className="syj-pinwrap"
          style={{ height: `${BEATS.length * 100}svh` }}
        >
          <div ref={stageRef} className="sy-container syj-stage">
            <div className="syj-stage__copy">
              <ul className="syj-rail">
                {BEATS.map((b, i) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      className={`syj-rail__btn${i === active ? ' is-active' : ''}`}
                      aria-current={i === active ? 'true' : undefined}
                      onClick={() => goToBeat(i)}
                    >
                      <span aria-hidden />
                      <span>{hi ? b.rail.hi : b.rail.en}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={beat.id}
                  className="syj-beat"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="syj-beat__num" aria-hidden>
                    {num(active)}
                  </span>
                  <p className="syj-kicker">{hi ? beat.eyebrow.hi : beat.eyebrow.en}</p>
                  <h3>
                    {hi ? beat.titleHi : beat.titleEn}
                    <small>{hi ? beat.titleEn : beat.titleHi}</small>
                  </h3>
                  <p>{hi ? beat.desc.hi : beat.desc.en}</p>
                  <ul className="syj-beat__chips">
                    {beat.chips.map((chip) => (
                      <li className="syj-chip" key={chip.en}>
                        <i aria-hidden />
                        {hi ? chip.hi : chip.en}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="syj-stage__visual">
              <span className="syj-stage__halo" aria-hidden />
              <div className="syj-stage__phones">
                <PhoneStack
                  screens={BACK_SCREENS}
                  active={active}
                  hi={hi}
                  className="syj-stage__phone-back"
                  fadeWhenEmpty
                />
                <PhoneStack
                  screens={MAIN_SCREENS}
                  active={active}
                  hi={hi}
                  className="syj-stage__phone-main"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="sy-container">
          <ol className="syj-stack">
            {BEATS.map((b, i) => (
              <li className="syj-stack__item" key={b.id}>
                <div className="syj-beat">
                  <span className="syj-beat__num">{num(i)}</span>
                  <p className="syj-kicker">{hi ? b.eyebrow.hi : b.eyebrow.en}</p>
                  <h3>
                    {hi ? b.titleHi : b.titleEn}
                    <small>{hi ? b.titleEn : b.titleHi}</small>
                  </h3>
                  <p>{hi ? b.desc.hi : b.desc.en}</p>
                  <ul className="syj-beat__chips">
                    {b.chips.map((chip) => (
                      <li className="syj-chip" key={chip.en}>
                        <i aria-hidden />
                        {hi ? chip.hi : chip.en}
                      </li>
                    ))}
                  </ul>
                </div>
                <PhoneStack screens={[b.screen]} active={0} hi={hi} priority={i === 0} />
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="sy-container">
        <div className="syj-more">
          <p className="syj-kicker">{num(BEATS.length)}</p>
          <h3 className="syj-title" style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)' }}>
            {hi ? 'और भी, उसी गहराई के साथ' : 'And more, at the same depth'}
          </h3>
          <ul className="syj-more__grid">
            {MORE.map((item) => (
              <li key={item.id}>
                <em>{hi ? item.tag.hi : item.tag.en}</em>
                <b>{hi ? item.title.hi : item.title.en}</b>
                <span>{hi ? item.desc.hi : item.desc.en}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
