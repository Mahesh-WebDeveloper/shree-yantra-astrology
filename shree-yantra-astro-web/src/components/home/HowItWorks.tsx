import { motion, useReducedMotion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useLang } from '@/i18n/LangProvider'
import { serviceTintStyle } from '@/data/welcomeServices'
import { useGsapReveal } from '@/hooks/useGsapReveal'

const STEP_KEYS = ['step1', 'step2', 'step3'] as const
const STEP_ACCENTS = ['#8fb4ff', '#f3cd7e', '#84e8b4'] as const

const STEPS = [
  {
    n: '01',
    en: { t: 'Enter birth details', d: 'Add date, exact time and place of birth — private and secure.' },
    hi: { t: 'जन्म विवरण भरें', d: 'जन्म तिथि, सटीक समय और स्थान जोड़ें — पूरी तरह निजी।' },
  },
  {
    n: '02',
    en: { t: 'We calculate the Vedic way', d: 'Real planetary positions and classical rules build your chart.' },
    hi: { t: 'वैदिक गणना होती है', d: 'वास्तविक ग्रह-स्थिति और शास्त्रीय नियमों से कुंडली बनती है।' },
  },
  {
    n: '03',
    en: { t: 'Get simple guidance', d: 'Clear, easy-to-read answers in Hindi or English.' },
    hi: { t: 'सरल मार्गदर्शन पाएं', d: 'हिंदी या अंग्रेज़ी में स्पष्ट, आसान भाषा में उत्तर।' },
  },
]

export function HowItWorks() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const ref = useGsapReveal<HTMLElement>()

  return (
    <section ref={ref}>
      <SectionHeading
        eyebrow={hi ? 'तरीका' : 'How it works'}
        title={hi ? 'तीन आसान चरण' : 'Three simple steps'}
        subtitle={hi ? 'कोई जटिलता नहीं — बस भरें और समझें।' : 'No complexity — just enter, and understand.'}
        ornament
      />
      <div className="steps-grid">
        {STEPS.map((s, i) => {
          const c = hi ? s.hi : s.en
          return (
            <motion.div
              key={s.n}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              className="step-card home-color-card"
              style={serviceTintStyle(STEP_KEYS[i], STEP_ACCENTS[i])}
            >
              <span className="bento-card-shine" aria-hidden />
              <span className="step-num" aria-hidden>
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-[var(--sy-text)]">{c.t}</h3>
              <p className="mt-2.5 text-[15px] leading-[1.65] text-[var(--sy-text-soft)]">{c.d}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
