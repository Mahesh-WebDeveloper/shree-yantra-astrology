import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/* ─────────────────────────────────────────────────────────────
   Drawn marks for the trust section. Everything here is authored
   SVG — no images, no emoji — so it inherits `currentColor` and
   stays crisp in both themes.
   ───────────────────────────────────────────────────────────── */

const RIM_TICKS = Array.from({ length: 24 }, (_, i) => i * 15)
const PETALS = Array.from({ length: 12 }, (_, i) => i * 30)

/**
 * The verification seal — an engraved rim, a twelve-petal rosette and a
 * check struck through the middle. It draws itself once, in order, the
 * way a seal is cut: outside in.
 */
export function TrustSeal({ still }: { still: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.35, margin: '0px 0px -10% 0px' })

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.5, delay: 0.08 + i * 0.05, ease: 'easeInOut' as const },
        opacity: { duration: 0.4, delay: 0.08 + i * 0.05 },
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
    <svg ref={ref} className="syj-seal" viewBox="0 0 120 120" fill="none" aria-hidden>
      {/* non-scaling-stroke breaks pathLength draw — see HeroMandala */}
      <g stroke="currentColor" strokeWidth="0.9">
        <motion.circle cx="60" cy="60" r="57.5" custom={0} {...common} />
        <motion.circle cx="60" cy="60" r="50" custom={1} {...common} />

        {RIM_TICKS.map((deg, i) => (
          <motion.line
            key={`t${deg}`}
            x1="60"
            y1="3"
            x2="60"
            y2="9.6"
            transform={`rotate(${deg} 60 60)`}
            custom={2 + i * 0.08}
            {...common}
          />
        ))}

        {PETALS.map((deg, i) => (
          <motion.ellipse
            key={`p${deg}`}
            cx="60"
            cy="34.5"
            rx="5.6"
            ry="11.5"
            transform={`rotate(${deg} 60 60)`}
            custom={5 + i * 0.09}
            {...common}
          />
        ))}

        {/* the centre is kept clear so the mark can be read */}
        <motion.circle cx="60" cy="60" r="13.4" custom={7} {...common} />
      </g>

      <motion.path
        d="M54.2 60.3l4.3 4.6 8.4-9.8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        custom={8.4}
        {...common}
      />
    </svg>
  )
}

/** The agreement mark: a check inside a hairline ring. */
export function TrustTick({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10.4" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path
        d="M7.5 12.3l3.1 3.2 6-7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type GlyphName = 'calendar' | 'dial' | 'sunrise' | 'chart'

/** Small hairline glyphs, one per proof. Drawn, never iconographic clip-art. */
export function TrustGlyph({ name }: { name: GlyphName }) {
  const s = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.25,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden {...s}>
        <rect x="3.2" y="5.2" width="17.6" height="15.6" rx="3.2" />
        <path d="M3.2 10h17.6M8.4 3.2v4M15.6 3.2v4" />
        <path d="M8.6 15.4l2.4 2.4 4.6-5.2" strokeWidth="1.5" />
      </svg>
    )
  }

  if (name === 'dial') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden {...s}>
        <circle cx="12" cy="12" r="8.6" />
        <path d="M3.4 12h17.2" opacity="0.6" />
        {[0, 45, 90, 135].map((deg) => (
          <path key={deg} d="M12 3.4v2.3" transform={`rotate(${deg} 12 12)`} />
        ))}
        {[180, 225, 270, 315].map((deg) => (
          <path key={deg} d="M12 3.4v2.3" transform={`rotate(${deg} 12 12)`} opacity="0.55" />
        ))}
      </svg>
    )
  }

  if (name === 'sunrise') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden {...s}>
        <path d="M2.8 17.6h18.4" />
        <path d="M7.4 17.6a4.6 4.6 0 019.2 0" />
        <path d="M12 4.4v2.6M4.9 8.1l1.8 1.8M19.1 8.1l-1.8 1.8" opacity="0.75" />
        <path d="M5.6 21h12.8" opacity="0.45" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden {...s}>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="1.6" />
      <path d="M12 3.4L20.6 12 12 20.6 3.4 12z" />
      <path d="M3.4 3.4l8.6 8.6M20.6 3.4L12 12M3.4 20.6L12 12M20.6 20.6L12 12" opacity="0.45" />
    </svg>
  )
}

/** A quiet arrow that points back up the page. */
export function TrustArrowUp() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden fill="none">
      <path
        d="M8 13.2V3.4M3.6 7.6L8 3.2l4.4 4.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
