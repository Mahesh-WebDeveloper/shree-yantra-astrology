import { memo, useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'

/**
 * The hero's flower — a rose-window lotus drawn in gold line.
 *
 * Five rings of petals open around a lit heart, ringed by a circle of small
 * points and held by two hairline circles. Round throughout: no square frame,
 * no triangles.
 *
 * Two rules keep the linework whole, and both were learned the hard way:
 *
 *   1 · NO `vector-effect: non-scaling-stroke`. It makes the browser measure
 *       dash patterns in screen space while `pathLength` normalises them in
 *       user space, so a drawing stroke lands short and the shape reads as cut
 *       mid-line. Stroke widths are plain user units instead.
 *   2 · Nothing reaches the edge of the view box. The widest radius is 104 in
 *       a 240 box, leaving 16 units of margin, so no stroke — and no glow —
 *       can ever be clipped by the frame.
 *
 * Every petal is one teardrop path rotated about the centre, so the geometry
 * is exact at any petal count and no two rings can drift. All strokes are
 * `currentColor`, which lets a masked `<use>` of the same DOM paint a brighter
 * copy of the flower — that is the light that travels over it. One radial
 * gradient in user space lights every petal from the same point, so the bloom
 * reads as a single object rather than sixty independently shaded pieces.
 *
 * With `still` (prefers-reduced-motion) the flower is simply there — whole,
 * silent, finished.
 */

const C = 120 // centre of the 240×240 view box
const EDGE = 104 // widest ink; the box is 120 from centre, so 16 units spare

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

/** Rings, outermost first — the order they draw in. */
const RINGS = [
  { count: 32, r1: 74, r2: EDGE, spread: 4.6, width: 0.55, opacity: 0.42 },
  { count: 20, r1: 54, r2: 88, spread: 7.6, width: 0.7, opacity: 0.62 },
  { count: 16, r1: 36, r2: 66, spread: 10, width: 0.85, opacity: 0.8 },
  { count: 10, r1: 19, r2: 44, spread: 14.5, width: 1, opacity: 0.95 },
  { count: 6, r1: 6, r2: 24, spread: 20, width: 1.1, opacity: 1 },
]

const DRAW: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.6, delay: 0.1 + i * 0.045, ease: 'easeInOut' as const },
      opacity: { duration: 0.45, delay: 0.1 + i * 0.045 },
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

  /** The ring of small points that sits between the outer petals and the rim. */
  const points = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const a = ((360 / 36) * i * Math.PI) / 180
        return { x: C + Math.sin(a) * 96, y: C - Math.cos(a) * 96, big: i % 3 === 0 }
      }),
    [],
  )

  const initial = still ? 'show' : 'hidden'
  const origin = { transformOrigin: `${C}px ${C}px` }

  return (
    <svg
      className={`syh-bloom${still ? '' : ' is-live'}`}
      viewBox="0 0 240 240"
      fill="none"
      aria-hidden
      role="presentation"
    >
      <defs>
        {/* one light source in USER space — every petal is lit from the same
            point, so the bloom reads as one object */}
        <radialGradient id="syh-light" cx={C} cy={C - 26} r="132" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--syh-bloom-1)" />
          <stop offset="46%" stopColor="var(--syh-bloom-2)" />
          <stop offset="100%" stopColor="var(--syh-bloom-3)" />
        </radialGradient>
        <radialGradient id="syh-heart" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--syh-bloom-1)" stopOpacity="0.9" />
          <stop offset="52%" stopColor="var(--syh-bloom-2)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--syh-bloom-2)" stopOpacity="0" />
        </radialGradient>
        {/* the travelling light: a soft blob that circles the bloom and reveals
            a brighter copy of the very same linework through this mask */}
        <radialGradient id="syh-sweep" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="syh-sweepmask">
          <g className="syh-bloom__sweep" style={origin}>
            <circle cx={C} cy={C - 74} r="62" fill="url(#syh-sweep)" />
          </g>
        </mask>
      </defs>

      {/* the lit heart */}
      <motion.circle
        cx={C}
        cy={C}
        r="30"
        fill="url(#syh-heart)"
        className="syh-bloom__heart"
        initial={still ? { opacity: 0.9 } : { opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 1.2, delay: still ? 0 : 0.85 }}
        style={origin}
      />

      {/* THE BLOOM — referenced again below for the light sweep */}
      <g id="syh-bloom-ink" stroke="url(#syh-light)" fill="none">
        {rings.map((ring, ri) => (
          <g key={ring.count} className={`syh-bloom__ring syh-bloom__ring--${ri}`} style={origin}>
            {ring.angles.map((a, i) => (
              <motion.path
                key={a}
                d={ring.d}
                transform={`translate(${C} ${C}) rotate(${a})`}
                strokeWidth={ring.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={ring.opacity}
                custom={ri * 4 + (i % 4)}
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
          r="110"
          strokeWidth="0.5"
          opacity="0.3"
          custom={1}
          variants={DRAW}
          initial={initial}
          animate="show"
        />
        <motion.circle
          cx={C}
          cy={C}
          r="50"
          strokeWidth="0.5"
          strokeDasharray="1.6 4.4"
          opacity="0.4"
          className="syh-bloom__dash"
          custom={6}
          variants={DRAW}
          initial={initial}
          animate="show"
          style={origin}
        />
      </g>

      {/* a quiet ring of points — the sky the flower sits in */}
      <g className="syh-bloom__points" fill="url(#syh-light)" style={origin}>
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.big ? 1.15 : 0.6}
            initial={still ? { opacity: 0.55 } : { opacity: 0 }}
            animate={{ opacity: p.big ? 0.62 : 0.34 }}
            transition={{ duration: 0.7, delay: still ? 0 : 1.1 + (i % 6) * 0.05 }}
          />
        ))}
      </g>

      {/* the light that travels over the flower: the SAME ink, brighter, seen
          through a slowly circling mask */}
      {still ? null : (
        <g className="syh-bloom__hi" mask="url(#syh-sweepmask)" aria-hidden>
          <use href="#syh-bloom-ink" stroke="var(--syh-bloom-1)" />
        </g>
      )}

      {/* bindu */}
      <motion.circle
        cx={C}
        cy={C}
        r="2.6"
        fill="var(--syh-bloom-1)"
        className="syh-bloom__bindu"
        initial={still ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: still ? 0 : 1.25, ease: 'easeOut' }}
        style={origin}
      />
    </svg>
  )
})
