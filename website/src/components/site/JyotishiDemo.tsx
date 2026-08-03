import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useLang } from '@/i18n/LangProvider'
import { useRevealChildren } from './hooks/useSiteMotion'
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
  hi: 'किसी ने कहा कि मेरी कुंडली में कालसर्प दोष और मंगल दोष दोनों हैं। क्या यह सही है?',
  en: 'I was told that my chart has both Kaal Sarp dosha and Mangal dosha. Is that correct?',
}

const ANSWER = {
  hi: 'इस उदाहरण कुंडली में मंगल तीसरे भाव में स्थित है, इसलिए प्रचलित मंगल दोष नियमों के अनुसार मंगल दोष नहीं बनता। कालसर्प दोष के लिए भी सभी ग्रह राहु-केतु के बीच नहीं हैं। इसलिए इस कुंडली में दोनों दोष नहीं बनते।',
  en: 'In this example chart, Mars is placed in the third house, so Mangal dosha does not form under the commonly used rules. All planets are also not placed between Rahu and Ketu, so Kaal Sarp dosha does not form either.',
}

const TIMELINE = [
  {
    id: 'past',
    now: false,
    when: { hi: 'पिछली अवधि', en: 'Previous period' },
    period: { hi: 'शुक्र महादशा · उदाहरण', en: 'Venus mahadasha · example' },
    note: {
      hi: 'पिछली दशा और उसके प्रमुख विषय समयरेखा में देखें।',
      en: 'Review the previous dasha and its key themes on a timeline.',
    },
  },
  {
    id: 'now',
    now: true,
    when: { hi: 'वर्तमान अवधि', en: 'Current period' },
    period: { hi: 'शनि की ढैय्या · उदाहरण', en: 'Shani dhaiya · example' },
    note: {
      hi: 'वर्तमान अवधि से जुड़े मुख्य संकेत और ध्यान देने योग्य विषय समझें।',
      en: 'Understand the main indications and areas of attention for the current period.',
    },
  },
  {
    id: 'ahead',
    now: false,
    when: { hi: 'आने वाली अवधि', en: 'Upcoming period' },
    period: { hi: 'सूर्य महादशा · उदाहरण', en: 'Sun mahadasha · example' },
    note: {
      hi: 'अगली दशा की शुरुआत और उससे जुड़े सामान्य विषय पहले से जानें।',
      en: 'See when the next dasha begins and understand its broad themes.',
    },
  },
]

/** Plain sentence first; the traditional term sits under it, small. */
const POINTS: { hi: string; en: string; noteHi?: string; noteEn?: string }[] = [
  {
    hi: 'वर्तमान दशा कौन-सी है और अगला परिवर्तन कब होगा',
    en: 'The current dasha and when the next change begins',
    noteHi: 'विंशोत्तरी महादशा और अंतर्दशा',
    noteEn: 'Vimshottari mahadasha and antardasha',
  },
  {
    hi: 'वर्तमान समय में नौ ग्रहों की गोचर स्थिति',
    en: 'Current transit positions of the nine grahas',
    noteHi: 'वर्तमान गोचर',
    noteEn: 'Current transits',
  },
  {
    hi: 'साढ़ेसाती और ढैय्या कब से कब तक — तारीखों के साथ',
    en: 'When Sade Sati and dhaiya begin and end — with the dates',
  },
  {
    hi: 'जहाँ ज्योतिषीय संकेत स्पष्ट न हों, वहाँ उत्तर की सीमाएँ भी बताई जाती हैं',
    en: 'Where indications are unclear, the response also explains its limitations',
  },
]

export function JyotishiDemo() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const revealRef = useRevealChildren<HTMLElement>()
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
    <section className="syj sy-section syj-demo" aria-labelledby="syj-demo-h" ref={revealRef}>
      <div className="sy-container">
        <div className="syj-intro" data-sy-reveal="0">
          <p className="syj-kicker">{hi ? 'कुंडली पर आधारित प्रश्नोत्तर' : 'Answers informed by your birth chart'}</p>
          <h2 id="syj-demo-h" className="syj-title">
            {hi ? (
              <>
                अपना प्रश्न पूछें और <em>उत्तर का ज्योतिषीय आधार समझें</em>
              </>
            ) : (
              <>
                Ask a question and <em>understand the astrological basis of the answer</em>
              </>
            )}
          </h2>
        </div>

        <div className="syj-demo__layout" ref={ref}>
          <div className="syj-chatwrap" data-sy-reveal="80">
            <div className="syj-chat">
              <div className="syj-chat__bar">
                <span className="syj-chat__avatar" aria-hidden>
                  ॐ
                </span>
                <span>
                  <b>{hi ? 'श्री यंत्र ज्योतिषी' : 'Shree Yantra Jyotishi'}</b>
                  <small>{hi ? 'उदाहरण के लिए बातचीत' : 'An illustrative conversation'}</small>
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
                      {hi ? 'दशा की उदाहरण समयरेखा' : 'Example dasha timeline'}
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
                  ? 'यह केवल उदाहरण है; वास्तविक उत्तर आपकी अपनी जन्म कुंडली पर निर्भर करेगा।'
                  : 'This is an example; an actual response depends on the user’s own birth chart.'}
              </p>
            </div>
          </div>

          <div className="syj-demo__aside" data-sy-reveal="160">
            <p className="syj-sub" style={{ marginTop: 0 }}>
              {hi
                ? 'ज्योतिषी सुविधा आपकी सहेजी हुई जन्म जानकारी, कुंडली, दशा और वर्तमान गोचर के आधार पर उत्तर तैयार करती है। इसका उद्देश्य तकनीकी ज्योतिषीय जानकारी को सामान्य भाषा में समझाना है, न कि किसी परिणाम की गारंटी देना।'
                : 'The Jyotishi feature uses saved birth details, the birth chart, dasha and current transits to prepare a response. It is designed to explain technical astrology clearly, not to guarantee an outcome.'}
            </p>
            <h3>{hi ? 'उत्तर तैयार करते समय क्या देखा जाता है' : 'What is considered when preparing an answer'}</h3>
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
