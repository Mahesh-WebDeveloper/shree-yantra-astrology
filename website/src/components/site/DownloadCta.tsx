import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
        whileInView: 'show' as const,
        viewport: { once: true, amount: 0.25 },
        variants: draw,
      }

  return (
    <svg className="syj-cta__mandala" viewBox="0 0 200 200" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke">
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

function QrPlaceholder() {
  const cells = [
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 0, 1, 1, 0, 1],
    [1, 1, 1, 1, 0, 0, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 0, 1, 0, 0, 1, 1],
  ]
  return (
    <svg viewBox="0 0 9 9" aria-hidden>
      {cells.map((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x}-${y}`} x={x} y={y} width="0.86" height="0.86" fill="currentColor" rx="0.14" /> : null,
        ),
      )}
    </svg>
  )
}

export function DownloadCta() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const revealRef = useRevealChildren<HTMLElement>()

  const chips = [
    { hi: 'कोई नकली आँकड़ा नहीं', en: 'No fake data' },
    { hi: 'आपका विवरण आपका ही रहता है', en: 'Your data stays private' },
    { hi: 'हिंदी और English, दोनों में', en: 'Works in Hindi and English' },
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
          {hi ? 'शुरुआत यहीं से' : 'Start here'}
        </p>
        <h2
          id="syj-cta-h"
          className="syj-title"
          style={{ fontSize: 'clamp(2.2rem, 5.2vw, 4rem)' }}
          data-sy-reveal="60"
        >
          {hi ? (
            <>
              अपनी कुंडली <em>आज ही देखें</em>
            </>
          ) : (
            <>
              See your own kundli <em>today</em>
            </>
          )}
        </h2>
        <p className="syj-sub" style={{ marginInline: 'auto' }} data-sy-reveal="120">
          {hi
            ? 'जन्म तिथि, समय और स्थान — बस इतना चाहिए। बाकी गणना कर देती है, और पाठ आपकी अपनी कुंडली से बनता है।'
            : 'Your date, time and place of birth — that is all it needs. The rest is calculated, and every reading is built from your own chart.'}
        </p>

        <div className="syj-cta__actions" data-sy-reveal="180">
          <a className="sy-btn-gold" href="#" data-sy-download="apk">
            {hi ? 'APK डाउनलोड करें' : 'Download APK'}
          </a>
          <span className="syj-badge">
            <i aria-hidden />
            {hi ? 'Play Store पर जल्द' : 'Coming soon to Play Store'}
          </span>
        </div>

        <div className="syj-qr" data-sy-reveal="240">
          <span className="syj-qr__box" aria-hidden>
            <QrPlaceholder />
          </span>
          <small>{hi ? 'फ़ोन से स्कैन कीजिए — QR जल्द' : 'Scan from your phone — QR coming soon'}</small>
        </div>

        <ul className="syj-cta__chips" data-sy-reveal="300">
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
