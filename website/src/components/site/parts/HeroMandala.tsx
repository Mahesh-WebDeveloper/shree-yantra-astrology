import { memo, type CSSProperties } from 'react'
import { motion, type Variants } from 'framer-motion'

/**
 * The hero's Shree Yantra — hand-authored SVG. No canvas, no WebGL.
 *
 * It performs in three acts:
 *   1 · it DRAWS ITSELF, outward → inward: the bhupura and its four gates,
 *       the sixteen- and eight-petal lotuses, the nine interlocking
 *       triangles, the inner circles — and finally it lights the bindu.
 *   2 · it settles into a living state — the whole figure breathes, the two
 *       lotus rings turn against each other over minutes, a dashed ring
 *       drifts the other way, and the golden core pulses.
 *   3 · every eight seconds a thin band of light crosses the linework.
 *
 * All of it is transform / opacity / gradient work. The sweep is one
 * SMIL-driven gradient inside a mask, and the highlighted copy of the figure
 * is a `<use>` of the very same DOM — so nothing is drawn twice by hand and
 * the two layers can never drift apart.
 *
 * Colours arrive as CSS custom properties (--m1 … --mhi) so the light theme
 * gets its own, deeper gold without re-rendering a thing.
 *
 * With `still` (prefers-reduced-motion) the figure is simply *there* —
 * whole, silent, finished.
 */

const C = 200 // centre of the 400×400 view box
const U = 60 // one "unit"; every radius below is written in units

const pt = (r: number, a: number) => [
  (C + r * U * Math.cos(a)).toFixed(2),
  (C - r * U * Math.sin(a)).toFixed(2),
]

/** A lotus petal: two quadratic curves from the inner circle out to a tip. */
function petal(rIn: number, rOut: number, a: number, half: number) {
  const [x0, y0] = pt(rIn, a - half)
  const [x1, y1] = pt(rOut, a)
  const [x2, y2] = pt(rIn, a + half)
  const rMid = rIn + (rOut - rIn) * 0.58
  const [cx1, cy1] = pt(rMid, a - half * 1.18)
  const [cx2, cy2] = pt(rMid, a + half * 1.18)
  return `M${x0} ${y0}Q${cx1} ${cy1} ${x1} ${y1}Q${cx2} ${cy2} ${x2} ${y2}Z`
}

function lotus(count: number, rIn: number, rOut: number, spread: number, phase = 0) {
  const step = (Math.PI * 2) / count
  return Array.from({ length: count }, (_, i) =>
    petal(rIn, rOut, phase + i * step + Math.PI / 2, (step / 2) * spread),
  )
}

const LOTUS_16 = lotus(16, 2.02, 2.44, 0.92)
const LOTUS_8 = lotus(8, 1.62, 1.98, 0.88, Math.PI / 8)

/** One of the four gates (a T-shaped opening) on the bhupura. */
function gate(side: number, s: number, depth: number, half: number) {
  const o = s * U
  const dd = depth * U
  const h = half * U
  if (side === 0) return `M${C - h} ${C - o}V${C - o - dd}H${C + h}V${C - o}`
  if (side === 1) return `M${C + o} ${C - h}H${C + o + dd}V${C + h}H${C + o}`
  if (side === 2) return `M${C - h} ${C + o}V${C + o + dd}H${C + h}V${C + o}`
  return `M${C - o} ${C - h}H${C - o - dd}V${C + h}H${C - o}`
}

const S0 = 2.86
const GATES = [0, 1, 2, 3].map((s) => gate(s, S0, 0.24, 0.34))

/** Nine interlocking triangles — four rising (Shiva), five descending (Shakti). */
type Tri = { apex: number; base: number; half: number }
const TRIS: Tri[] = [
  { apex: 1.34, base: -0.42, half: 1.16 },
  { apex: -1.4, base: 0.4, half: 1.2 },
  { apex: 1.06, base: -0.72, half: 0.9 },
  { apex: -1.12, base: 0.7, half: 0.94 },
  { apex: 0.78, base: -0.98, half: 0.66 },
  { apex: -0.84, base: 0.98, half: 0.7 },
  { apex: 0.5, base: -1.2, half: 0.44 },
  { apex: -0.56, base: 1.22, half: 0.48 },
  { apex: -0.28, base: 1.4, half: 0.28 },
]
const TRIANGLES = TRIS.map(
  (t) =>
    `M${C} ${(C - t.apex * U).toFixed(2)}L${(C - t.half * U).toFixed(2)} ${(C - t.base * U).toFixed(2)}L${(C + t.half * U).toFixed(2)} ${(C - t.base * U).toFixed(2)}Z`,
)

/* ── Choreography ─────────────────────────────────────────── */

const STEP = 0.04
const COUNT = 3 + 4 + 1 + 16 + 1 + 8 + 2 + 9 + 1
const LAST = COUNT * STEP + 1.4 // ≈ 3.2s — the moment the figure is whole

const DRAW: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.4, delay: i * STEP, ease: [0.34, 0, 0.22, 1] },
      opacity: { duration: 0.4, delay: i * STEP },
    },
  }),
}

type LineProps = {
  vectorEffect: 'non-scaling-stroke'
  initial?: false | string
  animate?: string
  variants?: Variants
  custom?: number
}

type SpinProps = {
  animate?: { rotate: number }
  transition?: { duration: number; ease: 'linear'; repeat: number }
  style?: CSSProperties
}

const ORIGIN: CSSProperties = { transformOrigin: '200px 200px' }

export const HeroMandala = memo(function HeroMandala({ still }: { still: boolean }) {
  /** Props for one stroke that draws itself, in order. */
  const line = (i: number): LineProps =>
    still
      ? { vectorEffect: 'non-scaling-stroke', initial: false }
      : {
          vectorEffect: 'non-scaling-stroke',
          custom: i,
          variants: DRAW,
          initial: 'hidden',
          animate: 'show',
        }

  /** A ring that turns, very slowly, in one direction. */
  const spin = (seconds: number, dir: 1 | -1): SpinProps =>
    still
      ? {}
      : {
          animate: { rotate: dir * 360 },
          transition: { duration: seconds, ease: 'linear', repeat: Infinity },
          style: ORIGIN,
        }

  let k = 0

  return (
    <svg
      className="syh-mandala"
      viewBox="0 0 400 400"
      fill="none"
      role="presentation"
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* The gold every line is painted with. */}
        <linearGradient id="syh-gold" gradientUnits="userSpaceOnUse" x1="30" y1="10" x2="370" y2="390">
          <stop offset="0%" style={{ stopColor: 'var(--m3)' }} />
          <stop offset="32%" style={{ stopColor: 'var(--m2)' }} />
          <stop offset="60%" style={{ stopColor: 'var(--m1)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--m3)' }} />
        </linearGradient>

        {/* The warm core behind the triangles. */}
        <radialGradient id="syh-core">
          <stop offset="0%" style={{ stopColor: 'var(--m1)' }} stopOpacity="0.8" />
          <stop offset="24%" style={{ stopColor: 'var(--m2)' }} stopOpacity="0.26" />
          <stop offset="100%" style={{ stopColor: 'var(--m2)' }} stopOpacity="0" />
        </radialGradient>

        {/* A band of light that walks diagonally across the linework every 8s. */}
        {still ? null : (
          <>
            <linearGradient
              id="syh-sweep-grad"
              gradientUnits="userSpaceOnUse"
              x1="-20"
              y1="-20"
              x2="200"
              y2="200"
            >
              <stop offset="0%" stopColor="#000" />
              <stop offset="36%" stopColor="#000" />
              <stop offset="46%" stopColor="#5a5a5a" />
              <stop offset="50%" stopColor="#fff" />
              <stop offset="54%" stopColor="#5a5a5a" />
              <stop offset="64%" stopColor="#000" />
              <stop offset="100%" stopColor="#000" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-480 -480; -480 -480; 480 480"
                keyTimes="0; 0.6; 1"
                calcMode="spline"
                keySplines="0 0 1 1; 0.45 0 0.55 1"
                dur="8s"
                begin={`${LAST.toFixed(1)}s`}
                repeatCount="indefinite"
              />
            </linearGradient>
            <mask id="syh-sweep" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
              <rect x="0" y="0" width="400" height="400" fill="url(#syh-sweep-grad)" />
            </mask>
          </>
        )}
      </defs>

      {/* Core glow. */}
      <motion.g
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.2, delay: still ? 0 : 0.3 }}
      >
        <motion.circle
          className="syh-mandala__core"
          cx={C}
          cy={C}
          r={1.9 * U}
          fill="url(#syh-core)"
          animate={still ? undefined : { scale: [1, 1.07, 1], opacity: [0.72, 1, 0.72] }}
          transition={still ? undefined : { duration: 7.5, ease: 'easeInOut', repeat: Infinity }}
          style={ORIGIN}
        />
      </motion.g>

      {/* ── The figure. Painted gold here, cloned below for the sweep. ── */}
      <g className="syh-mandala__base" stroke="url(#syh-gold)" fill="none">
        <motion.g
          id="syh-figure"
          animate={still ? undefined : { scale: [1, 1.015, 1] }}
          transition={still ? undefined : { duration: 11, ease: 'easeInOut', repeat: Infinity }}
          style={ORIGIN}
        >
          {/* Bhupura — three squares and the four gates */}
          <g strokeWidth="1">
            {[S0, S0 - 0.12, S0 - 0.24].map((s, i) => (
              <motion.rect
                key={`sq${i}`}
                x={C - s * U}
                y={C - s * U}
                width={s * 2 * U}
                height={s * 2 * U}
                opacity={i === 1 ? 0.45 : 0.9}
                {...line(k++)}
              />
            ))}
            {GATES.map((dp, i) => (
              <motion.path key={`gt${i}`} d={dp} opacity="0.9" {...line(k++)} />
            ))}
          </g>

          {/* A dashed ring drifting inside the bhupura */}
          <motion.g {...spin(160, 1)}>
            <motion.circle
              cx={C}
              cy={C}
              r={2.64 * U}
              strokeWidth="0.75"
              strokeDasharray="1.6 10"
              opacity="0.8"
              {...line(k++)}
            />
          </motion.g>

          {/* Sixteen-petal lotus */}
          <motion.g {...spin(230, -1)} strokeWidth="0.7" opacity="0.72">
            {LOTUS_16.map((dp, i) => (
              <motion.path key={`p16-${i}`} d={dp} {...line(k++)} />
            ))}
          </motion.g>

          <motion.circle cx={C} cy={C} r={2.02 * U} strokeWidth="0.85" opacity="0.62" {...line(k++)} />

          {/* Eight-petal lotus */}
          <motion.g {...spin(150, 1)} strokeWidth="0.85" opacity="0.85">
            {LOTUS_8.map((dp, i) => (
              <motion.path key={`p8-${i}`} d={dp} {...line(k++)} />
            ))}
          </motion.g>

          <motion.circle cx={C} cy={C} r={1.62 * U} strokeWidth="0.85" opacity="0.62" {...line(k++)} />
          <motion.circle cx={C} cy={C} r={1.52 * U} strokeWidth="0.6" opacity="0.42" {...line(k++)} />

          {/* Nine interlocking triangles */}
          <g strokeWidth="1">
            {TRIANGLES.map((dp, i) => (
              <motion.path key={`tr${i}`} d={dp} opacity={i > 6 ? 0.8 : 1} {...line(k++)} />
            ))}
          </g>

          {/* Inner circle and the bindu */}
          <motion.circle cx={C} cy={C} r={0.26 * U} strokeWidth="0.9" {...line(k++)} />
          <motion.circle
            className="syh-mandala__bindu"
            cx={C}
            cy={C}
            r="3.2"
            stroke="none"
            initial={still ? false : { opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: still ? 0 : LAST - 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={ORIGIN}
          />
        </motion.g>
      </g>

      {/* The sweep: the very same geometry, brighter, seen only through the band. */}
      {still ? null : (
        <motion.g
          className="syh-mandala__sweep"
          fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: LAST }}
        >
          <use href="#syh-figure" mask="url(#syh-sweep)" />
        </motion.g>
      )}
    </svg>
  )
})
