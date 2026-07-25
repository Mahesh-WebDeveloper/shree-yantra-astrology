import { memo, useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'

/**
 * The hero's figure — a स्वस्तिक चक्र, drawn in gold line.
 *
 * The swastika at the centre is the dakshinavarta (clockwise) form, the
 * auspicious one: each arm turns to its right, and the four traditional dots
 * sit in the quadrants. It is built from two continuous five-point strokes —
 * one for the vertical arm and its two bends, one for the horizontal — so the
 * whole mark draws itself in two clean gestures rather than eight fragments.
 * The swastika never spins; a turning swastika reads as a logo animation. The
 * wheel around it turns instead, which is what a chakra does.
 *
 * Two rules keep every line whole, both learned the hard way here:
 *
 *   1 · NO `vector-effect: non-scaling-stroke`. It makes the browser measure
 *       dash patterns in screen space while `pathLength` normalises them in
 *       user space, so a drawing stroke lands short and the shape reads as cut
 *       mid-line. Stroke widths are plain user units instead.
 *   2 · Nothing reaches the edge of the view box: the widest ink sits at 104
 *       in a 240 box, leaving 16 units of margin for stroke and glow.
 *
 * Every stroke is `currentColor`, so a masked `<use>` of the same DOM can
 * paint a brighter copy — that is the light travelling over the figure, and it
 * can never fall out of register with the lines it lights. Stroke widths carry
 * a `--syh-ink-boost` multiplier so the light theme can thicken every line at
 * once: gold on cream needs more weight than gold on black.
 *
 * With `still` (prefers-reduced-motion) the figure is simply there — whole,
 * silent, finished.
 */

const C = 120 // centre of the 240×240 view box
const RIM = 104 // widest ink; 16 units of margin remain

/* ── The swastika ─────────────────────────────────────────────────────────── */

const ARM = 42 // half-length of each arm
const BEND = 25 // how far each arm turns

/** Vertical arm: bends right at the top, left at the foot (clockwise). */
const SW_VERTICAL = `M ${BEND} ${-ARM} L 0 ${-ARM} L 0 ${ARM} L ${-BEND} ${ARM}`
/** Horizontal arm: bends up at the left, down at the right (clockwise). */
const SW_HORIZONTAL = `M ${-ARM} ${-BEND} L ${-ARM} 0 L ${ARM} 0 L ${ARM} ${BEND}`

/** The four traditional dots, one per quadrant. */
const DOTS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
].map(([sx, sy]) => ({ x: C + sx * 25, y: C + sy * 25 }))

/* ── The wheel ────────────────────────────────────────────────────────────── */

const SPOKES = 32
const RING_R = 88 // where the spokes live
const spokes = Array.from({ length: SPOKES }, (_, i) => {
  const a = ((360 / SPOKES) * i * Math.PI) / 180
  const inner = 74
  return {
    x1: C + Math.sin(a) * inner,
    y1: C - Math.cos(a) * inner,
    x2: C + Math.sin(a) * RING_R,
    y2: C - Math.cos(a) * RING_R,
    long: i % 4 === 0,
  }
})

/** A ring of points outside the wheel — the sky the chakra turns in. */
const POINTS = Array.from({ length: 48 }, (_, i) => {
  const a = ((360 / 48) * i * Math.PI) / 180
  return { x: C + Math.sin(a) * 98, y: C - Math.cos(a) * 98, big: i % 4 === 0 }
})

const DRAW: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.5, delay: 0.1 + i * 0.05, ease: 'easeInOut' as const },
      opacity: { duration: 0.4, delay: 0.1 + i * 0.05 },
    },
  }),
}

export const HeroMandala = memo(function HeroMandala({ still }: { still: boolean }) {
  const initial = still ? 'show' : 'hidden'
  const origin = { transformOrigin: `${C}px ${C}px` }
  const sw = (w: number) => ({ strokeWidth: `calc(${w} * var(--syh-ink-boost, 1))` })

  const rims = useMemo(
    () => [
      { r: RIM, w: 0.7, o: 0.42, i: 0 },
      { r: 98, w: 0.45, o: 0.3, i: 1 },
      { r: 74, w: 0.7, o: 0.5, i: 5 },
      { r: 62, w: 0.5, o: 0.4, i: 6 },
      { r: 54, w: 0.8, o: 0.55, i: 7 },
    ],
    [],
  )

  return (
    <svg
      className={`syh-bloom${still ? '' : ' is-live'}`}
      viewBox="0 0 240 240"
      fill="none"
      aria-hidden
      role="presentation"
    >
      <defs>
        {/* one light source in USER space, so every stroke is lit from the
            same point and the figure reads as one object */}
        <radialGradient id="syh-light" cx={C} cy={C - 26} r="132" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--syh-bloom-1)" />
          <stop offset="46%" stopColor="var(--syh-bloom-2)" />
          <stop offset="100%" stopColor="var(--syh-bloom-3)" />
        </radialGradient>
        <radialGradient id="syh-heart" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--syh-bloom-1)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--syh-bloom-2)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--syh-bloom-2)" stopOpacity="0" />
        </radialGradient>
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

      {/* the lit heart behind the swastika */}
      <motion.circle
        cx={C}
        cy={C}
        r="52"
        fill="url(#syh-heart)"
        className="syh-bloom__heart"
        initial={still ? { opacity: 0.85 } : { opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ duration: 1.2, delay: still ? 0 : 0.8 }}
        style={origin}
      />

      {/* THE INK — referenced again below for the travelling light */}
      <g id="syh-bloom-ink" stroke="url(#syh-light)" fill="none">
        {/* the wheel: spokes, drawn ring by ring */}
        <g className="syh-bloom__ring syh-bloom__ring--0" style={origin}>
          {spokes.map((s, i) => (
            <motion.line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              style={sw(s.long ? 1.1 : 0.6)}
              strokeLinecap="round"
              opacity={s.long ? 0.72 : 0.44}
              custom={2 + (i % 4)}
              variants={DRAW}
              initial={initial}
              animate="show"
            />
          ))}
        </g>

        {/* the rims */}
        {rims.map((r) => (
          <motion.circle
            key={r.r}
            cx={C}
            cy={C}
            r={r.r}
            style={sw(r.w)}
            opacity={r.o}
            custom={r.i}
            variants={DRAW}
            initial={initial}
            animate="show"
          />
        ))}

        {/* the swastika — two gestures, drawn last */}
        <g className="syh-bloom__swastik">
          <motion.path
            d={SW_VERTICAL}
            transform={`translate(${C} ${C})`}
            style={sw(2.1)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
            custom={9}
            variants={DRAW}
            initial={initial}
            animate="show"
          />
          <motion.path
            d={SW_HORIZONTAL}
            transform={`translate(${C} ${C})`}
            style={sw(2.1)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
            custom={10}
            variants={DRAW}
            initial={initial}
            animate="show"
          />
        </g>
      </g>

      {/* the four dots of the swastika */}
      <g fill="url(#syh-light)">
        {DOTS.map((d, i) => (
          <motion.circle
            key={i}
            cx={d.x}
            cy={d.y}
            r="2.2"
            initial={still ? { opacity: 0.8 } : { opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.5, delay: still ? 0 : 1.45 + i * 0.07 }}
          />
        ))}
      </g>

      {/* the ring of points, turning with the sky */}
      <g className="syh-bloom__points" fill="url(#syh-light)" style={origin}>
        {POINTS.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.big ? 1.2 : 0.6}
            initial={still ? { opacity: 0.5 } : { opacity: 0 }}
            animate={{ opacity: p.big ? 0.6 : 0.32 }}
            transition={{ duration: 0.6, delay: still ? 0 : 1.1 + (i % 8) * 0.04 }}
          />
        ))}
      </g>

      {/* the light travelling over the figure: the SAME ink, brighter, seen
          through a slowly circling mask */}
      {still ? null : (
        <g className="syh-bloom__hi" mask="url(#syh-sweepmask)" aria-hidden>
          <use href="#syh-bloom-ink" stroke="var(--syh-bloom-1)" />
        </g>
      )}
    </svg>
  )
})
