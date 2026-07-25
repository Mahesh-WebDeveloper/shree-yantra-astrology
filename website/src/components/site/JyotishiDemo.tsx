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
    <motion.span className="syj-msg__run" variants={CONTAINER} initial="hidden" animate="show">
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
  hi: 'आपकी जन्म कुंडली के अनुसार आपको न तो मंगल दोष है और न ही कालसर्प दोष। किसी ने जो बताया है, वह आपकी कुंडली से मेल नहीं खाता — मंगल तीसरे भाव में है, इसलिए मंगल दोष बनता ही नहीं।',
  en: 'According to your birth chart you have neither Mangal dosha nor Kaal Sarp dosha. What you were told does not match your chart — Mars sits in the third house, so Mangal dosha does not form.',
}

const TIMELINE = [
  {
    id: 'past',
    now: false,
    when: { hi: 'जो बीत गया', en: 'What has passed' },
    period: { hi: 'शुक्र की दशा · 2007–2027', en: 'The Venus period · 2007–2027' },
    note: {
      hi: 'इस समय का बड़ा हिस्सा निकल चुका है — जो बना, वह इसी दौर में बना।',
      en: 'Most of this stretch is already behind you — what took shape, took shape here.',
    },
  },
  {
    id: 'now',
    now: true,
    when: { hi: 'अभी क्या चल रहा है', en: 'What is running now' },
    period: { hi: 'शनि की ढैय्या', en: 'The Shani dhaiya' },
    note: {
      hi: 'धीमा लेकिन बनाने वाला समय — जल्दबाज़ी मत कीजिए, नींव मज़बूत कीजिए।',
      en: 'Slow, but a time that builds — do not rush it, strengthen the foundation.',
    },
  },
  {
    id: 'ahead',
    now: false,
    when: { hi: 'आगे क्या आ रहा है', en: 'What comes next' },
    period: { hi: 'सूर्य की दशा · 2027 से', en: 'The Sun period · from 2027' },
    note: {
      hi: 'नई शुरुआत और पहचान का समय — तैयारी अभी से रखिए।',
      en: 'A time of fresh starts and recognition — the preparation belongs to now.',
    },
  },
]

/** Plain sentence first; the traditional term sits under it, small. */
const POINTS: { hi: string; en: string; noteHi?: string; noteEn?: string }[] = [
  {
    hi: 'कौन-सा समय अभी चल रहा है, और कब बदलेगा — पूरी समयरेखा',
    en: 'Which period is running now, and when it turns — the full timeline',
    noteHi: 'विंशोत्तरी महादशा और अंतर्दशा',
    noteEn: 'Vimshottari mahadasha and antardasha',
  },
  {
    hi: 'नौ ग्रह इस समय कहाँ चल रहे हैं',
    en: 'Where the nine planets are moving right now',
    noteHi: 'चालू गोचर',
    noteEn: 'Live gochar',
  },
  {
    hi: 'साढ़ेसाती और ढैय्या कब से कब तक — तारीखों के साथ',
    en: 'When Sade Sati and dhaiya begin and end — with the dates',
  },
  {
    hi: 'जो आपकी कुंडली में नहीं है, उसके लिए साफ़ "नहीं" — हाँ में हाँ नहीं मिलाई जाती',
    en: 'If it is not in your chart, the answer is a plain no — it will not agree just to please you',
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
          <p className="syj-kicker">{hi ? 'ज्योतिषी से पूछिए' : 'Ask the astrologer'}</p>
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
                  <small>{hi ? 'एक उदाहरण बातचीत' : 'An example conversation'}</small>
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
                  ? 'यह जवाब आपकी अपनी जन्म कुंडली देखकर बना है'
                  : 'This answer was worked out from your own birth chart'}
              </p>
            </div>
          </div>

          <div className="syj-demo__aside">
            <p className="syj-sub" style={{ marginTop: 0 }}>
              {hi
                ? 'यह जवाब किसी लेख से उठाया हुआ नहीं है। हर बात आपकी अपनी कुंडली देखकर कही जाती है — और अगर कोई बात आपकी कुंडली में है ही नहीं, तो ज्योतिषी विनम्रता से मना कर देता है।'
                : 'This answer is not lifted from an article. Every line is said after looking at your own chart — and when something simply is not in your chart, the astrologer politely says no.'}
            </p>
            <h3>{hi ? 'हर जवाब किस पर टिका है' : 'What every answer rests on'}</h3>
            <ul className="syj-demo__points">
              {POINTS.map((point) => (
                <li key={point.en}>
                  <span className="syj-demo__pt">
                    <b>{hi ? point.hi : point.en}</b>
                    {point.noteEn ? <small>{hi ? point.noteHi : point.noteEn}</small> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
