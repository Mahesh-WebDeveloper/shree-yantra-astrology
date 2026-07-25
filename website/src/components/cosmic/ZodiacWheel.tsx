import { useId } from 'react'

const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

export function ZodiacWheel({
  size,
  className = '',
  tone = 'gold',
  prominent = false,
}: {
  size?: number
  className?: string
  tone?: 'gold' | 'ink'
  /** Stronger strokes & glyphs â€” hero on pure black background */
  prominent?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const r = 100
  const stroke = tone === 'ink' ? 'currentColor' : `url(#${uid}-wheelGrad)`
  const ringW = prominent ? 2.6 : tone === 'ink' ? 2 : 1.4
  const midW = prominent ? 2.2 : tone === 'ink' ? 1.7 : 1.2
  const innerW = prominent ? 2 : tone === 'ink' ? 1.6 : 1.2
  const spokeW = prominent ? 2 : tone === 'ink' ? 1.6 : 1.2
  const glyphSize = prominent ? 14 : 11
  const glyphWeight = prominent ? 900 : 700

  const spokes = ZODIAC.map((_, i) => {
    const a = (i * Math.PI) / 6
    const x1 = 100 + Math.cos(a) * 54
    const y1 = 100 + Math.sin(a) * 54
    const x2 = 100 + Math.cos(a) * 96
    const y2 = 100 + Math.sin(a) * 96
    return <line key={`s${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={spokeW} />
  })
  const glyphs = ZODIAC.map((g, i) => {
    const a = (i * Math.PI) / 6 + Math.PI / 12
    const x = 100 + Math.cos(a) * 86
    const y = 100 + Math.sin(a) * 86
    return (
      <text
        key={`g${i}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={glyphSize}
        fontWeight={glyphWeight}
        fill="currentColor"
        stroke={prominent && tone === 'gold' ? 'rgba(0,0,0,0.35)' : 'none'}
        strokeWidth={prominent ? 0.35 : 0}
        paintOrder="stroke fill"
      >
        {g}
      </text>
    )
  })

  const gradTop = prominent ? '#fff8dc' : '#e9b850'
  const gradBottom = prominent ? '#c9922a' : '#6b4d10'

  return (
    <svg
      width={size ?? undefined}
      height={size ?? undefined}
      viewBox="0 0 200 200"
      className={`sy-spin-wheel ${tone === 'gold' ? 'text-[#f6d27a]' : ''} ${!size ? 'h-full w-full' : ''} ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-wheelGrad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradTop} />
          <stop offset="100%" stopColor={gradBottom} />
        </linearGradient>
      </defs>
      <circle cx={r} cy={r} r={96} fill="none" stroke={stroke} strokeWidth={ringW} />
      <circle cx={r} cy={r} r={74} fill="none" stroke={stroke} strokeWidth={midW} />
      <circle cx={r} cy={r} r={54} fill="none" stroke={stroke} strokeWidth={innerW} />
      {spokes}
      {glyphs}
    </svg>
  )
}

const STARS = [
  { top: '8%', left: '32%' },
  { top: '12%', left: '62%' },
  { top: '18%', left: '82%' },
  { top: '26%', left: '48%' },
  { top: '44%', left: '92%' },
  { top: '52%', left: '6%' },
  { top: '62%', left: '70%' },
  { top: '72%', left: '22%' },
]

export function TwinkleStars() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[#fce8a8]"
          style={{
            top: s.top,
            left: s.left,
            animation: `sy-twinkle ${2.8 + (i % 3) * 0.4}s ease-in-out ${(i % 4) * 0.35}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

