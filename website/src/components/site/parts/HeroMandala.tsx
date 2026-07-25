import { memo, useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'

/**
 * The hero's flower — a rose-window bloom drawn in gold line.
 *
 * Deliberately round: no square frame, no triangles (both read as stray
 * geometry sitting behind the copy). Four rings of petals open around a lit
 * heart, held by two hairline circles. Every petal is one teardrop path
 * rotated about the centre, so the geometry is exact at any petal count.
 *
 * It draws itself once — outermost ring first, the heart last — then lives:
 * the bloom breathes, alternate rings turn against each other over minutes,
 * and the centre pulses. Transform and opacity only; no canvas, no WebGL.
 *
 * Colours arrive as CSS custom properties, so the light theme gets its own
 * deeper gold without re-rendering anything. With `still`
 * (prefers-reduced-motion) the flower is simply there — whole and silent.
 */

const C = 100 // centre of the 200×200 view box

/** One petal, pointing up from `r1` to `r2`, `spread` degrees wide at the waist. */
function petal(r1: number, r2: number, spread: number) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const waistR = r1 + (r2 - r1) * 0.52
  const wx = Math.sin(rad(spread)) * waistR
  const wy = -Math.cos(rad(spread)) * waistR
  const span = r2 - r1
  return [
    `M 0 ${-r1}`,
    `C ${wx * 0.55} ${-r1 - span * 0.12} ${wx} ${wy + span * 0.1} ${wx * 0.32} ${-r2 + span * 0.16}`,
    `C ${wx * 0.14} ${-r2} ${-wx * 0.14} ${-r2} ${-wx * 0.32} ${-r2 + span * 0.16}`,
    `C ${-wx} ${wy + span * 0.1} ${-wx * 0.55} ${-r1 - span * 0.12} 0 ${-r1}`,
    'Z',
  ].join(' ')
}

const RINGS = [
  { count: 24, r1: 62, r2: 95, spread: 6.4, order: 0, width: 0.5, opacity: 0.5 },
  { count: 16, r1: 42, r2: 74, spread: 9.5, order: 1, width: 0.6, opacity: 0.72 },
  { count: 12, r1: 24, r2: 52, spread: 12.5, order: 2, width: 0.7, opacity: 0.88 },
  { count: 8, r1: 9, r2: 32, spread: 17, order: 3, width: 0.8, opacity: 1 },
]

const DRAW: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.5, delay: 0.15 + i * 0.05, ease: 'easeInOut' as const },
      opacity: { duration: 0.5, delay: 0.15 + i * 0.05 },
    },
  }),
}

export const HeroMandala = memo(function HeroMandala({ still }: { still: boolean }) {
  const rings = useMemo(
    () =>
      RINGS.map((ring) => ({
        ...ring,
        d: petal(ring.r1, ring.r2, ring.spread),
        angles: Array.from({ length: ring.count }, (_, i) => (360 / ring.count) * i),
      })),
    [],
  )

  const initial = still ? 'show' : 'hidden'
  const origin = { transformOrigin: `${C}px ${C}px` }

  return (
    <svg
      className={`syh-bloom${still ? '' : ' is-live'}`}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden
      role="presentation"
    >
      <defs>
        <linearGradient id="syh-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--syh-bloom-1)" />
          <stop offset="55%" stopColor="var(--syh-bloom-2)" />
          <stop offset="100%" stopColor="var(--syh-bloom-3)" />
        </linearGradient>
        <radialGradient id="syh-heart" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--syh-bloom-1)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--syh-bloom-2)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="var(--syh-bloom-2)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the lit heart of the flower */}
      <motion.circle
        cx={C}
        cy={C}
        r="34"
        fill="url(#syh-heart)"
        className="syh-bloom__heart"
        initial={still ? { opacity: 0.85 } : { opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ duration: 1.2, delay: still ? 0 : 0.9 }}
        style={origin}
      />

      {rings.map((ring, ri) => (
        <g key={ring.count} className={`syh-bloom__ring syh-bloom__ring--${ri}`} style={origin}>
          {ring.angles.map((a, i) => (
            <motion.path
              key={a}
              d={ring.d}
              transform={`translate(${C} ${C}) rotate(${a})`}
              stroke="url(#syh-petal)"
              strokeWidth={ring.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={ring.opacity}
              custom={ring.order * 5 + (i % 5)}
              variants={DRAW}
              initial={initial}
              animate="show"
            />
          ))}
        </g>
      ))}

      {/* two hairline circles hold the bloom, rose-window fashion */}
      <motion.circle
        cx={C}
        cy={C}
        r="97"
        stroke="url(#syh-petal)"
        strokeWidth="0.4"
        vectorEffect="non-scaling-stroke"
        opacity="0.38"
        custom={2}
        variants={DRAW}
        initial={initial}
        animate="show"
      />
      <motion.circle
        cx={C}
        cy={C}
        r="58"
        stroke="url(#syh-petal)"
        strokeWidth="0.4"
        strokeDasharray="1.5 4"
        vectorEffect="non-scaling-stroke"
        opacity="0.45"
        className="syh-bloom__dash"
        custom={7}
        variants={DRAW}
        initial={initial}
        animate="show"
        style={origin}
      />

      {/* bindu */}
      <motion.circle
        cx={C}
        cy={C}
        r="2.4"
        fill="var(--syh-bloom-1)"
        className="syh-bloom__bindu"
        initial={still ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: still ? 0 : 1.3, ease: 'easeOut' }}
        style={origin}
      />
    </svg>
  )
})
