import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { PRIMARY_SERVICES, serviceTintStyle } from '@/data/welcomeServices'
import { BentoServiceArt, type BentoArtVariant } from '@/components/cosmic/BentoServiceArt'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useSpotlight } from '@/hooks/useSpotlight'
import { useLang } from '@/i18n/LangProvider'
import { useGsapReveal } from '@/hooks/useGsapReveal'

const BENTO_ART: Record<string, BentoArtVariant> = {
  kundli: 'kundli',
  rashifal: 'rashifal',
  panchang: 'panchang',
  milan: 'milan',
}

export function ServiceBento() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const ref = useGsapReveal<HTMLElement>()

  return (
    <section ref={ref}>
      <SectionHeading
        eyebrow={hi ? 'सेवाएं' : 'Start here'}
        title={hi ? 'सबसे ज़रूरी वैदिक टूल्स' : 'Your essential Vedic tools'}
        subtitle={
          hi
            ? 'जन्म कुंडली से विवाह मिलान तक - सब कुछ एक ही जगह।'
            : 'From birth chart to marriage matching - everything in one place.'
        }
        ornament
      />
      <div className="bento-grid">
        {PRIMARY_SERVICES.map((s, i) => (
          <motion.div
            key={s.key}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.07, duration: 0.55 }}
          >
            <BentoCard service={s} big={i === 0} artKey={BENTO_ART[s.key]} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function BentoCard({
  service,
  big,
  artKey,
}: {
  service: (typeof PRIMARY_SERVICES)[number]
  big: boolean
  artKey?: BentoArtVariant
}) {
  const { hi } = useLang()
  const { ref, onMouseMove } = useSpotlight<HTMLAnchorElement>()

  return (
    <Link
      ref={ref}
      to={service.route}
      onMouseMove={onMouseMove}
      className={`bento-card group bento-card--premium ${big ? 'bento-card-feature' : ''} ${service.key === 'milan' ? 'bento-card-milan' : ''} bento-card-split`}
      style={serviceTintStyle(service.key, service.accent)}
    >
      <span className="bento-card-shine" aria-hidden />
      <span className="feature-spotlight" aria-hidden />
      <span className="bento-card-accent-orb" aria-hidden />

      <div className="bento-card-body bento-card-body--split">
        <div className="bento-card-copy">
          <span className="bento-card-kicker">
            {big ? (hi ? 'सबसे पहले' : 'Most used') : hi ? 'सेवा' : 'Service'}
          </span>
          <h3
            className={`font-playfair font-bold tracking-tight text-[var(--sy-text)] ${big ? 'text-xl sm:text-2xl' : 'text-lg'}`}
          >
            {hi ? service.hi.title : service.en.title}
          </h3>
          <p className="text-[14px] leading-[1.62] text-[var(--sy-text-soft)]">
            {big ? (hi ? service.long.hi : service.long.en) : hi ? service.hi.sub : service.en.sub}
          </p>
        </div>
        <span className="bento-card-cta">
          {hi ? 'खोलें' : 'Open'}
          <span className="bento-card-cta-arrow" aria-hidden>
            →
          </span>
        </span>
      </div>

      {artKey ? (
        <div className={`bento-card-visual bento-card-art-frame bento-card-visual--${service.key}`}>
          <BentoServiceArt variant={artKey} className="bento-card-art-svg" />
        </div>
      ) : null}
    </Link>
  )
}
