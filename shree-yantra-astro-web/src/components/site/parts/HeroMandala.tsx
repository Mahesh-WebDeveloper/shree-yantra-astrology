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
 * A fine echo line runs beside each gesture, offset a consistent chisel-side
 * of the stroke, so the mark reads as engraved rather than drawn. The
 * swastika never spins; a turning swastika reads as a logo animation. The
 * wheel around it turns instead, which is what a chakra does.
 *
 * The wheel itself is layered like a struck coin: a toothed outer bezel, the
 * ring of long and short spokes with small diamonds set between the long
 * ones, a second finer spoke ring further in, and three slow orbiting sparks
 * riding the outer rim. Everything is hairline except the swastika.
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
 * Every stroke is `currentColor`-free and painted by one user-space gradient,
 * so a masked `<use>` of the same DOM can paint a brighter copy — that is the
 * light travelling over the figure, and it can never fall out of register
 * with the lines it lights. Stroke widths carry a `--syh-ink-boost`
 * multiplier so the light theme can thicken every line at once: gold on cream
 * needs more weight than gold on black.
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

/**
 * The engraved echo: each gesture again, offset ECHO units to the same side
 * of the direction of travel. Because the two gestures map onto each other
 * under 90° rotation, the echo falls on the same relative side of every arm —
 * the consistent "light edge" a chisel leaves.
 */
const ECHO = 2.6
const SW_VERTICAL_ECHO = `M ${BEND} ${-ARM - ECHO} L ${-ECHO} ${-ARM - ECHO} L ${-ECHO} ${
  ARM - ECHO
} L ${-BEND} ${ARM - ECHO}`
const SW_HORIZONTAL_ECHO = `M ${ARM + ECHO} ${BEND} L ${ARM + ECHO} ${-ECHO} L ${
  -ARM + ECHO
} ${-ECHO} L ${-ARM + ECHO} ${-BEND}`

/** Where each gesture ends — a tiny finial dot finishes the terminal. */
const TIPS = [
  { x: C + BEND, y: C - ARM },
  { x: C - BEND, y: C + ARM },
  { x: C - ARM, y: C - BEND },
  { x: C + ARM, y: C + BEND },
]

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

/** Small diamonds set midway between the long spokes, riding with the wheel. */
const DIAMONDS = Array.from({ length: 8 }, (_, i) => {
  const deg = 22.5 + i * 45
  const a = (deg * Math.PI) / 180
  return { x: C + Math.sin(a) * 81, y: C - Math.cos(a) * 81, deg }
})
const DIAMOND_PATH = 'M 0 -3.1 L 2.1 0 L 0 3.1 L -2.1 0 Z'

/** A second, finer spoke ring between the two inner rims. */
const FINE_SPOKES = Array.from({ length: 16 }, (_, i) => {
  const a = ((360 / 16) * (i + 0.5) * Math.PI) / 180
  return {
    x1: C + Math.sin(a) * 55.5,
    y1: C - Math.cos(a) * 55.5,
    x2: C + Math.sin(a) * 61,
    y2: C - Math.cos(a) * 61,
  }
})

/** The toothed outer bezel: hairline ticks between the two outer rims. */
const TICKS = Array.from({ length: 64 }, (_, i) => {
  const a = ((360 / 64) * i * Math.PI) / 180
  const big = i % 2 === 0
  const r1 = big ? 99.8 : 100.7
  const r2 = big ? 102.6 : 101.9
  return {
    x1: C + Math.sin(a) * r1,
    y1: C - Math.cos(a) * r1,
    x2: C + Math.sin(a) * r2,
    y2: C - Math.cos(a) * r2,
    big,
  }
})

/** A ring of points outside the wheel — the sky the chakra turns in. */
const POINTS = Array.from({ length: 48 }, (_, i) => {
  const a = ((360 / 48) * i * Math.PI) / 180
  return { x: C + Math.sin(a) * 98, y: C - Math.cos(a) * 98, big: i % 4 === 0 }
})

/** Three sparks that ride the outer rim, each on its own slow orbit. */
const ORBITS = [
  { deg: 40, cls: 'a' },
  { deg: 165, cls: 'b' },
  { deg: 285, cls: 'c' },
].map((o) => {
  const a = (o.deg * Math.PI) / 180
  return { ...o, x: C + Math.sin(a) * 98, y: C - Math.cos(a) * 98 }
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
        {/* the outer halo — a soft ring of air just inside the bezel */}
        <radialGradient id="syh-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--syh-bloom-2)" stopOpacity="0" />
          <stop offset="62%" stopColor="var(--syh-bloom-2)" stopOpacity="0" />
          <stop offset="82%" stopColor="var(--syh-bloom-2)" stopOpacity="0.14" />
          <stop offset="93%" stopColor="var(--syh-bloom-2)" stopOpacity="0.05" />
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

      {/* the halo breathing around the rim — out of phase with the heart */}
      <motion.circle
        cx={C}
        cy={C}
        r={RIM}
        fill="url(#syh-halo)"
        className="syh-bloom__halo"
        initial={still ? { opacity: 0.7 } : { opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 1.4, delay: still ? 0 : 0.5 }}
        style={origin}
      />

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
        {/* the toothed bezel between the two outer rims, turning against the
            spokes like the escapement of a watch */}
        <g className="syh-bloom__ring syh-bloom__ring--1" style={origin}>
          {TICKS.map((k, i) => (
            <motion.line
              key={i}
              x1={k.x1}
              y1={k.y1}
              x2={k.x2}
              y2={k.y2}
              style={sw(k.big ? 0.42 : 0.32)}
              strokeLinecap="round"
              opacity={k.big ? 0.34 : 0.24}
              custom={2 + (i % 8) * 0.5}
              variants={DRAW}
              initial={initial}
              animate="show"
            />
          ))}
        </g>

        {/* the wheel: spokes and the diamonds set between the long ones,
            drawn ring by ring and turning together */}
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
          {DIAMONDS.map((d, i) => (
            <motion.path
              key={`d${i}`}
              d={DIAMOND_PATH}
              transform={`translate(${d.x} ${d.y}) rotate(${d.deg})`}
              style={sw(0.5)}
              strokeLinejoin="round"
              opacity="0.5"
              custom={6 + (i % 4)}
              variants={DRAW}
              initial={initial}
              animate="show"
            />
          ))}
        </g>

        {/* the second, finer spoke ring — a watch movement inside the wheel */}
        <g className="syh-bloom__ring syh-bloom__ring--3" style={origin}>
          {FINE_SPOKES.map((s, i) => (
            <motion.line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              style={sw(0.4)}
              strokeLinecap="round"
              opacity="0.34"
              custom={7 + (i % 4)}
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

        {/* the swastika — two gestures with their engraved echo, drawn last */}
        <g className="syh-bloom__swastik">
          <motion.path
            d={SW_VERTICAL_ECHO}
            transform={`translate(${C} ${C})`}
            style={sw(0.5)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.38"
            custom={11.5}
            variants={DRAW}
            initial={initial}
            animate="show"
          />
          <motion.path
            d={SW_HORIZONTAL_ECHO}
            transform={`translate(${C} ${C})`}
            style={sw(0.5)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.38"
            custom={12.5}
            variants={DRAW}
            initial={initial}
            animate="show"
          />
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

      {/* finials on the four arm terminals + the four quadrant dots */}
      <g fill="url(#syh-light)">
        {TIPS.map((p, i) => (
          <motion.circle
            key={`t${i}`}
            cx={p.x}
            cy={p.y}
            r="1.7"
            initial={still ? { opacity: 0.75 } : { opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ duration: 0.5, delay: still ? 0 : 1.65 + i * 0.06 }}
          />
        ))}
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

      {/* three sparks riding the outer rim, each on its own slow orbit */}
      {ORBITS.map((o) => (
        <motion.g
          key={o.cls}
          className={`syh-bloom__orbit syh-bloom__orbit--${o.cls}`}
          style={origin}
          initial={still ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: still ? 0 : 1.9 }}
        >
          <circle cx={o.x} cy={o.y} r="3.4" fill="var(--syh-bloom-2)" opacity="0.22" />
          <circle cx={o.x} cy={o.y} r="1.4" fill="var(--syh-bloom-1)" opacity="0.9" />
        </motion.g>
      ))}

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
