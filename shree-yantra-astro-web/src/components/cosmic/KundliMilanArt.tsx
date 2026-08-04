import { useId } from 'react'

/** Two birth charts + bond motif — Kundli Milan / 36 guna matching. */
export function KundliMilanArt({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 240 188" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4cc" />
          <stop offset="50%" stopColor="#e9b850" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id={`${uid}-rose`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde4f0" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="55%" r="48%">
          <stop offset="0%" stopColor="rgba(244, 114, 182, 0.28)" />
          <stop offset="100%" stopColor="rgba(244, 114, 182, 0)" />
        </radialGradient>
        <filter id={`${uid}-glow-f`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="120" cy="94" rx="108" ry="82" fill={`url(#${uid}-glow)`} />
      <MiniChart x={6} y={18} gid={uid} variant="gold" label="A" />
      <MiniChart x={144} y={18} gid={uid} variant="rose" label="B" />
      <path
        d="M78 92 Q120 72 162 92"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.45"
        fill="none"
      />
      <path
        d="M78 96 Q120 116 162 96"
        stroke={`url(#${uid}-rose)`}
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.35"
        fill="none"
      />
      <g filter={`url(#${uid}-glow-f)`}>
        <path
          d="M108 88 C108 76 120 70 120 80 C120 70 132 76 132 88 C132 100 120 110 120 122 C120 110 108 100 108 88Z"
          fill={`url(#${uid}-rose)`}
          opacity="0.92"
        />
      </g>
      <circle cx="120" cy="88" r="26" fill="rgba(12, 8, 16, 0.55)" stroke={`url(#${uid}-gold)`} strokeWidth="1.4" />
      <text x="120" y="84" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="13" fontWeight="700" fill={`url(#${uid}-gold)`}>
        36
      </text>
      <text
        x="120"
        y="98"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="7.5"
        fontWeight="800"
        fill="#fce7f3"
        letterSpacing="0.14em"
      >
        GUNA
      </text>
    </svg>
  )
}

function MiniChart({
  x,
  y,
  gid,
  variant,
  label,
}: {
  x: number
  y: number
  gid: string
  variant: 'gold' | 'rose'
  label: string
}) {
  const s = 88
  const stroke = variant === 'gold' ? `url(#${gid}-gold)` : `url(#${gid}-rose)`
  const labelFill = variant === 'gold' ? '#f6d27a' : '#fbcfe8'
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={s}
        height={s}
        x="0"
        y="0"
        stroke={stroke}
        strokeWidth="1.7"
        fill="rgba(255,255,255,0.05)"
        rx="4"
      />
      <path d={`M0 0 ${s} ${s}M${s} 0 0 ${s}`} stroke={stroke} strokeWidth="1.05" opacity="0.75" />
      <path
        d={`M${s / 2} 0 L${s} ${s / 2} ${s / 2} ${s} 0 ${s / 2}Z`}
        stroke={stroke}
        strokeWidth="1.15"
        fill="rgba(255,255,255,0.04)"
      />
      <circle cx={s / 2} cy={s / 2} r="4" fill={labelFill} opacity="0.85" />
      <text x={s / 2} y={s + 13} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="800" fill={labelFill}>
        {label}
      </text>
    </g>
  )
}
