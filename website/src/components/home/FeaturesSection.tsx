import { motion } from 'framer-motion'
import { useLang } from '@/i18n/LangProvider'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useGsapReveal } from '@/hooks/useGsapReveal'
import { FeatureTile } from '@/components/home/FeatureTile'

const FEATURES = [
  {
    key: 'pred',
    route: '/rashifal',
    accent: 'linear-gradient(90deg, #a78bfa, #6366f1)',
    en: { t: 'Rashifal', d: 'Daily to yearly insights' },
    hi: { t: 'राशिफल', d: 'दैनिक से वार्षिक फल' },
    glyph: '☀',
  },
  {
    key: 'kundli',
    route: '/kundli',
    accent: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
    en: { t: 'Kundli', d: 'Birth chart & vargas' },
    hi: { t: 'कुंडली', d: 'जन्म चार्ट और वर्ग' },
    glyph: '◎',
  },
  {
    key: 'ai',
    route: '/astrologer',
    accent: 'linear-gradient(90deg, #e9b850, #c9962e)',
    en: { t: 'Astrologer', d: 'Ask your chart' },
    hi: { t: 'ज्योतिषी', d: 'प्रश्न पूछें' },
    glyph: '✦',
  },
  {
    key: 'patri',
    route: '/janam-patri',
    accent: 'linear-gradient(90deg, #f472b6, #e11d48)',
    en: { t: 'Naamkaran', d: 'Baby names & patri' },
    hi: { t: 'नामकरण', d: 'शुभ नाम और पत्रिका' },
    glyph: '🪷',
  },
]

export function FeaturesSection() {
  const { hi } = useLang()
  const ref = useGsapReveal<HTMLElement>()

  return (
    <section ref={ref}>
      <SectionHeading
        eyebrow={hi ? 'ऐप' : 'App'}
        title={hi ? 'मुख्य सुविधाएँ' : 'Everything in one place'}
        subtitle={hi ? 'Shree Yantra ऐप की तरह — वही गणना, वही भरोसा' : 'Same trusted engine as the Shree Yantra app'}
      />
      <div className="features-bento">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <FeatureTile
              to={f.route}
              accent={f.accent}
              glyph={f.glyph}
              title={hi ? f.hi.t : f.en.t}
              desc={hi ? f.hi.d : f.en.d}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
