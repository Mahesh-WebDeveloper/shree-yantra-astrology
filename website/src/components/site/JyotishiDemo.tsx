import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useLang } from '@/i18n/LangProvider'
import './sections.css'

/**
 * A scripted, honest exchange: the astrologer contradicts a wrong claim
 * because the chart says so. Typing is a one-mount staggered opacity reveal —
 * no per-character state, no re-render storms.
 */

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.026 } },
}
const WORD = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.28 } },
}

function Words({ text, animate }: { text: string; animate: boolean }) {
  if (!animate) return <>{text}</>
  return (
    <motion.span variants={CONTAINER} initial="hidden" animate="show">
      {text.split(' ').map((word, i) => (
        <motion.span className="syj-msg__word" variants={WORD} key={`${i}-${word}`}>
          {word}{' '}
        </motion.span>
      ))}
    </motion.span>
  )
}

const QUESTION = {
  hi: 'क्या मुझे कालसर्प दोष और मांगलिक दोष है? किसी ने बताया कि दोनों हैं।',
  en: 'Do I have Kaal Sarp dosha and Mangal dosha? Someone told me I have both.',
}

const ANSWER = {
  hi: 'आपकी जन्म कुंडली के अनुसार आपको न तो मंगल दोष है और न ही कालसर्प दोष। किसी ने जो बताया है, वह आपकी कुंडली के अनुसार सही नहीं है — मंगल तीसरे भाव में है, इसलिए मंगल दोष नहीं बनता।',
  en: 'According to your birth chart you have neither Mangal dosha nor Kaal Sarp dosha. What you were told does not match your chart — Mars sits in the third house, so Mangal dosha does not form.',
}

const TIMELINE = [
  {
    id: 'past',
    now: false,
    when: { hi: 'पिछला समय', en: 'The past' },
    period: { hi: 'शुक्र महादशा · 2007–2027', en: 'Venus mahadasha · 2007–2027' },
    note: {
      hi: 'इस दशा का बड़ा हिस्सा बीत चुका है — जो बना, वह इसी समय में बना।',
      en: 'Most of this period is already behind you — what took shape, took shape here.',
    },
  },
  {
    id: 'now',
    now: true,
    when: { hi: 'अभी का समय', en: 'Right now' },
    period: { hi: 'शनि ढैय्या', en: 'Shani dhaiya' },
    note: {
      hi: 'धीमा लेकिन बनाने वाला समय — जल्दबाज़ी से बचिए, नींव मज़बूत कीजिए।',
      en: 'Slow, but a period that builds — do not rush it, strengthen the foundation.',
    },
  },
  {
    id: 'ahead',
    now: false,
    when: { hi: 'आने वाला समय', en: 'What comes next' },
    period: { hi: 'सूर्य महादशा · 2027 से', en: 'Sun mahadasha · from 2027' },
    note: {
      hi: 'नई शुरुआत और पहचान का समय — तैयारी अभी से रखिए।',
      en: 'A period of fresh starts and visibility — the preparation belongs to now.',
    },
  },
]

const POINTS = [
  {
    hi: 'विंशोत्तरी महादशा और अंतर्दशा की पूरी समयरेखा',
    en: 'The full Vimshottari mahadasha and antardasha timeline',
  },
  {
    hi: 'नौ ग्रहों का चालू गोचर',
    en: 'The running transits of all nine planets',
  },
  {
    hi: 'साढ़े साती और ढैय्या की अवधि, तारीखों के साथ',
    en: 'Sade Sati and dhaiya windows, with their dates',
  },
  {
    hi: 'जो कुंडली में नहीं है, उसे साफ़ "नहीं" कहा जाता है — हाँ में हाँ नहीं मिलाई जाती',
    en: 'If it is not in the chart, the answer is a plain no — it will not agree just to please you',
  },
]

export function JyotishiDemo() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -18% 0px' })
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setStep(5)
      return
    }
    const timers = [
      window.setTimeout(() => setStep(1), 120),
      window.setTimeout(() => setStep(2), 900),
      window.setTimeout(() => setStep(3), 2000),
      window.setTimeout(() => setStep(4), 5400),
      window.setTimeout(() => setStep(5), 6300),
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [inView, reduce])

  const animate = !reduce

  return (
    <section className="syj sy-section syj-demo" aria-labelledby="syj-demo-h">
      <div className="sy-container">
        <div className="syj-intro">
          <p className="syj-kicker">{hi ? 'ज्योतिषी से प्रश्न' : 'Ask the Jyotishi'}</p>
          <h2 id="syj-demo-h" className="syj-title">
            {hi ? (
              <>
                जो कुंडली में नहीं है, <em>वह नहीं कहा जाएगा</em>
              </>
            ) : (
              <>
                If it is not in your chart, <em>you will be told so</em>
              </>
            )}
          </h2>
        </div>

        <div className="syj-demo__layout" ref={ref}>
          <div className="syj-chatwrap">
            <div className="syj-chat">
              <div className="syj-chat__bar">
                <span className="syj-chat__avatar" aria-hidden>
                  ॐ
                </span>
                <span>
                  <b>{hi ? 'श्री यंत्र ज्योतिषी' : 'Shree Yantra Jyotishi'}</b>
                  <small>{hi ? 'उदाहरण बातचीत' : 'Example conversation'}</small>
                </span>
              </div>

              <div className="syj-chat__body">
                {step >= 1 ? (
                  <motion.div
                    className="syj-msg syj-msg--user"
                    initial={animate ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32 }}
                  >
                    <span className="syj-msg__meta">{hi ? 'आप' : 'You'}</span>
                    <p className="syj-msg__bubble">{hi ? QUESTION.hi : QUESTION.en}</p>
                  </motion.div>
                ) : null}

                {step === 2 || step === 4 ? (
                  <span className="syj-typing" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null}

                {step >= 3 ? (
                  <motion.div
                    className="syj-msg syj-msg--bot"
                    initial={animate ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32 }}
                  >
                    <span className="syj-msg__meta">{hi ? 'ज्योतिषी' : 'Jyotishi'}</span>
                    <p className="syj-msg__bubble">
                      <Words text={hi ? ANSWER.hi : ANSWER.en} animate={animate} />
                    </p>
                  </motion.div>
                ) : null}

                {step >= 5 ? (
                  <motion.div
                    className="syj-msg syj-msg--bot"
                    initial={animate ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.36 }}
                  >
                    <span className="syj-msg__meta">
                      {hi ? 'आपका समय' : 'Your timeline'}
                    </span>
                    <div className="syj-msg__bubble">
                      <ul className="syj-timeline">
                        {TIMELINE.map((row) => (
                          <li key={row.id} className={row.now ? 'is-now' : undefined}>
                            <em>{hi ? row.when.hi : row.when.en}</em>
                            <b>{hi ? row.period.hi : row.period.en}</b>
                            <span>{hi ? row.note.hi : row.note.en}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : null}
              </div>

              <p className="syj-chat__source">
                <i aria-hidden />
                {hi
                  ? 'यह उत्तर आपकी अपनी जन्म कुंडली से बना है'
                  : 'This answer was assembled from your own birth chart'}
              </p>
            </div>
          </div>

          <div className="syj-demo__aside">
            <p className="syj-sub" style={{ marginTop: 0 }}>
              {hi
                ? 'यह पाठ किसी सामान्य लेख से नहीं आता। हर उत्तर आपकी अपनी कुंडली के आँकड़ों पर बनता है — और अगर कोई बात आपकी कुंडली में नहीं है, तो ज्योतिषी विनम्रता से मना कर देता है।'
                : 'This reading does not come from a generic article. Every answer is built on data from your own chart — and when a claim does not hold in your chart, the astrologer politely says so instead of agreeing.'}
            </p>
            <h3>{hi ? 'हर उत्तर के पीछे' : 'Behind every answer'}</h3>
            <ul className="syj-demo__points">
              {POINTS.map((point) => (
                <li key={point.en}>
                  <span aria-hidden />
                  <span>{hi ? point.hi : point.en}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
