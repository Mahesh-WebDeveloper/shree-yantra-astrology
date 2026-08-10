import type { CSSProperties } from 'react'
import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { PLAY_STORE_URL } from '@/data/brandShowcase'
import { trackEvent } from '@/components/seo/GoogleAnalytics'
import { useLang } from '@/i18n/LangProvider'
import { useRevealChildren } from './hooks/useSiteMotion'
import './sections.css'

/** Deterministic rising motes — no Math.random, so renders stay stable. */
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 4.37 + 5) % 98}%`,
  delay: `${((i * 0.83) % 11).toFixed(2)}s`,
  dur: `${(12 + (i % 5) * 2.6).toFixed(1)}s`,
  dx: `${((i % 7) - 3) * 16}px`,
}))

const PETALS = Array.from({ length: 12 }, (_, i) => i * 30)

function Mandala({ still }: { still: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: false, amount: 0.2, margin: '0px 0px -8% 0px' })

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2.4, delay: i * 0.06, ease: 'easeInOut' as const },
        opacity: { duration: 0.5, delay: i * 0.06 },
      },
    }),
  }

  const common = still
    ? { initial: false as const }
    : {
        initial: 'hidden' as const,
        animate: inView ? ('show' as const) : ('hidden' as const),
        variants: draw,
      }

  return (
    <svg ref={ref} className="syj-cta__mandala" viewBox="0 0 200 200" fill="none" aria-hidden>
      {/* non-scaling-stroke breaks pathLength draw — see HeroMandala */}
      <g stroke="currentColor" strokeWidth="0.5">
        {PETALS.map((deg, i) => (
          <motion.ellipse
            key={deg}
            cx="100"
            cy="62"
            rx="10"
            ry="28"
            transform={`rotate(${deg} 100 100)`}
            custom={i}
            {...common}
          />
        ))}
        <motion.circle cx="100" cy="100" r="38" custom={13} {...common} />
        <motion.circle cx="100" cy="100" r="62" custom={14} {...common} />
        <motion.circle cx="100" cy="100" r="82" strokeDasharray="2 4" custom={15} {...common} />
        <motion.circle cx="100" cy="100" r="94" custom={16} {...common} />
        <motion.rect
          x="63"
          y="63"
          width="74"
          height="74"
          transform="rotate(45 100 100)"
          custom={17}
          {...common}
        />
        <motion.rect x="63" y="63" width="74" height="74" custom={18} {...common} />
      </g>
    </svg>
  )
}

export function DownloadCta() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const revealRef = useRevealChildren<HTMLElement>()
  const apkUrl = import.meta.env.VITE_APK_DOWNLOAD_URL?.trim()

  const chips = [
    { hi: 'जन्म विवरण के अनुसार व्यक्तिगत कुंडली', en: 'A birth chart based on your details' },
    { hi: 'शहर के अनुसार पंचांग और शुभ समय', en: 'Panchang and timings for your city' },
    { hi: 'हिंदी और English में सरल जानकारी', en: 'Easy-to-understand Hindi and English' },
  ]

  return (
    <section
      id="download"
      className="syj sy-section syj-cta"
      aria-labelledby="syj-cta-h"
      ref={revealRef}
    >
      <span className="syj-cta__aura" aria-hidden />
      <Mandala still={!!reduce} />
      {reduce ? null : (
        <span className="syj-particles" aria-hidden>
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              style={
                {
                  left: p.left,
                  '--delay': p.delay,
                  '--dur': p.dur,
                  '--dx': p.dx,
                } as CSSProperties
              }
            />
          ))}
        </span>
      )}

      <div className="sy-container syj-cta__inner">
        <p className="syj-kicker syj-kicker--center" data-sy-reveal="0">
          {hi ? 'कुंडली, पंचांग और आध्यात्मिक ज्ञान — एक ही ऐप में' : 'Kundli, Panchang and spiritual wisdom in one app'}
        </p>
        <h2
          id="syj-cta-h"
          className="syj-title"
          style={{ fontSize: 'clamp(2.2rem, 5.2vw, 4rem)' }}
          data-sy-reveal="60"
        >
          {hi ? (
            <>
              वैदिक ज्योतिष को <em>अपने दैनिक जीवन का हिस्सा बनाइए</em>
            </>
          ) : (
            <>
              Make Vedic astrology <em>part of your everyday life</em>
            </>
          )}
        </h2>
        <p className="syj-sub" style={{ marginInline: 'auto' }} data-sy-reveal="120">
          {hi
            ? 'जन्म विवरण एक बार जोड़ें और व्यक्तिगत कुंडली, शहर के अनुसार पंचांग, राशिफल, शुभ मुहूर्त, ज्योतिषीय जानकारी तथा धार्मिक पुस्तकालय का उपयोग हिंदी और English में करें।'
            : 'Add your birth details once to access personalised Kundli, location-based Panchang, Rashifal, Muhurat, astrological guidance and a spiritual library in Hindi and English.'}
        </p>

        <div className="syj-cta__actions" data-sy-reveal="180">
          <a
            className="sy-btn-gold"
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-sy-download="play-store"
            onClick={() => trackEvent('app_download_click', { source: 'home_cta', platform: 'play_store' })}
          >
            {hi ? 'Google Play से डाउनलोड करें' : 'Get it on Google Play'}
          </a>
          {apkUrl ? (
            <a
              className="syj-badge syj-badge--link"
              href={apkUrl}
              download
              data-sy-download="apk"
              onClick={() => trackEvent('app_download_click', { source: 'home_cta', platform: 'apk' })}
            >
              {hi ? 'या APK डाउनलोड' : 'Or download APK'}
            </a>
          ) : (
            <span className="syj-badge">
              <i aria-hidden />
              {hi ? 'Android · Hindi + English' : 'Android · Hindi + English'}
            </span>
          )}
        </div>

        <ul className="syj-cta__chips" data-sy-reveal="240">
          {chips.map((chip) => (
            <li className="syj-chip" key={chip.en}>
              <i aria-hidden />
              {hi ? chip.hi : chip.en}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
