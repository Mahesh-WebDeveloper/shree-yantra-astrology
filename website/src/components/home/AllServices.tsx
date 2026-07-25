import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ALL_SERVICES, serviceTintStyle } from '@/data/welcomeServices'
import { VedicIcon } from '@/components/cosmic/VedicIcon'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useLang } from '@/i18n/LangProvider'
import { useGsapReveal } from '@/hooks/useGsapReveal'

export function AllServices() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const ref = useGsapReveal<HTMLElement>()

  return (
    <section ref={ref}>
      <SectionHeading
        eyebrow={hi ? 'सभी सेवाएँ' : 'All services'}
        title={hi ? 'पंचांग से वास्तु तक' : 'From Panchang to Vastu'}
        subtitle={
          hi
            ? 'हर सेवा — साफ़ आइकन, छोटा शीर्षक और एक पंक्ति में समझाइश।'
            : 'Every service with a clear icon, short title and one-line explanation.'
        }
        ornament
      />
      <div className="services-grid">
        {ALL_SERVICES.map((s, i) => (
          <motion.div
            key={s.key}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: (i % 4) * 0.05, duration: 0.45 }}
          >
            <Link
              to={s.route}
              className="service-card group"
              style={serviceTintStyle(s.key, s.accent)}
            >
              <span className="service-card-shine" aria-hidden />
              <span className="service-icon" aria-hidden>
                <VedicIcon name={s.icon} size={24} />
              </span>
              <div className="min-w-0">
                <h3 className="service-title text-[15px] font-semibold tracking-tight text-[var(--sy-text)]">
                  {hi ? s.hi.title : s.en.title}
                </h3>
                <p className="service-subtitle mt-1 text-[14px] leading-[1.5] text-[var(--sy-text-soft)]">
                  {hi ? s.hi.sub : s.en.sub}
                </p>
              </div>
              <span
                className="ml-auto shrink-0 text-[var(--sy-text-muted)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden
              >
                →
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
