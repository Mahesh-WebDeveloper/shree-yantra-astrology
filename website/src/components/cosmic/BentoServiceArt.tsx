import { useId } from 'react'

/** Rolled janam patri + chart — bento card art. */
export function BentoKundliArt({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const g = `url(#${id}-g)`
  return (
    <svg viewBox="0 0 160 180" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8e0" />
          <stop offset="50%" stopColor="#e9b850" />
          <stop offset="100%" stopColor="#9a6b12" />
        </linearGradient>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef9ef" />
          <stop offset="100%" stopColor="#e8dcc8" />
        </linearGradient>
        <radialGradient id={`${id}-gl`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="rgba(233,184,80,0.08)" />
          <stop offset="100%" stopColor="rgba(233,184,80,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="88" rx="72" ry="78" fill={`url(#${id}-gl)`} />
      <path
        d="M28 24h88c6 0 10 4 10 10v118c0 6-4 10-10 10H38c-6 0-10-4-10-10V34c0-6 4-10 10-10Z"
        fill={`url(#${id}-paper)`}
        stroke={g}
        strokeWidth="2"
      />
      <path d="M38 34h78v8H38z" fill="rgba(233,184,80,0.2)" />
      <rect x="48" y="52" width="64" height="64" rx="3" stroke={g} strokeWidth="2" fill="rgba(12,10,8,0.12)" />
      <path d="M48 52 112 116M112 52 48 116" stroke={g} strokeWidth="1.65" opacity="0.95" />
      <path d="M80 52 112 84 80 116 48 84Z" stroke={g} strokeWidth="1.75" fill="rgba(233,184,80,0.1)" />
      <circle cx="80" cy="84" r="4" fill="#e9b850" />
      <path
        d="M118 38c14 8 22 22 22 38s-8 30-22 38"
        stroke={g}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M132 52v76" stroke={g} strokeWidth="1.5" opacity="0.5" />
      <path d="M124 118l12-8 8 14" stroke={g} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="128" cy="124" r="3" fill="#c9922a" />
    </svg>
  )
}

/** Zodiac wheel + sun — rashifal bento art. */
export function BentoRashifalArt({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const g = `url(#${id}-g)`
  const signs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5e6ff" />
          <stop offset="45%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <radialGradient id={`${id}-gl`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(192,132,252,0.06)" />
          <stop offset="100%" stopColor="rgba(192,132,252,0)" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="76" fill={`url(#${id}-gl)`} />
      <circle cx="80" cy="80" r="68" stroke={g} strokeWidth="2.4" />
      <circle cx="80" cy="80" r="48" stroke={g} strokeWidth="2" opacity="0.85" />
      {signs.map((s, i) => {
        const a = (i * Math.PI) / 6 - Math.PI / 2
        const x = 80 + Math.cos(a) * 58
        const y = 80 + Math.sin(a) * 58
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="900" fill="#e9d5ff">
            {s}
          </text>
        )
      })}
      <circle cx="80" cy="80" r="22" fill="rgba(126,34,206,0.15)" stroke={g} strokeWidth="1.8" />
      <circle cx="80" cy="80" r="10" stroke={g} strokeWidth="1.5" />
      {[0, 45, 90, 135].map((deg) => {
        const a = (deg * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={80 + Math.cos(a) * 12}
            y1={80 + Math.sin(a) * 12}
            x2={80 + Math.cos(a) * 20}
            y2={80 + Math.sin(a) * 20}
            stroke={g}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

/** Calendar + choghadiya ring — panchang bento art. */
export function BentoPanchangArt({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const g = `url(#${id}-g)`
  const a = `url(#${id}-a)`
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4cc" />
          <stop offset="50%" stopColor="#f3cd7e" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <radialGradient id={`${id}-gl`} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="rgba(243,205,126,0.07)" />
          <stop offset="100%" stopColor="rgba(243,205,126,0)" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="82" r="72" fill={`url(#${id}-gl)`} />
      <rect x="36" y="32" width="88" height="96" rx="10" fill="rgba(255,255,255,0.04)" stroke={g} strokeWidth="2.2" />
      <rect x="36" y="32" width="88" height="22" rx="10" fill="rgba(243,205,126,0.25)" />
      <rect x="36" y="44" width="88" height="10" fill="rgba(243,205,126,0.15)" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={46 + col * 26}
            y={58 + row * 22}
            width="18"
            height="14"
            rx="3"
            stroke={g}
            strokeWidth="1.35"
            opacity="0.9"
          />
        )),
      )}
      <circle cx="118" cy="118" r="28" stroke={a} strokeWidth="2" fill="rgba(234,88,12,0.08)" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const ang = (i * Math.PI) / 4 - Math.PI / 2
        return (
          <line
            key={i}
            x1={118 + Math.cos(ang) * 8}
            y1={118 + Math.sin(ang) * 8}
            x2={118 + Math.cos(ang) * 26}
            y2={118 + Math.sin(ang) * 26}
            stroke={g}
            strokeWidth={i % 2 === 0 ? 1.6 : 1}
            opacity={i % 2 === 0 ? 0.9 : 0.45}
          />
        )
      })}
      <circle cx="118" cy="118" r="4" fill="#f3cd7e" />
    </svg>
  )
}

export type BentoArtVariant = 'kundli' | 'rashifal' | 'panchang' | 'milan'

export function BentoServiceArt({ variant, className = '' }: { variant: BentoArtVariant; className?: string }) {
  switch (variant) {
    case 'kundli':
      return <BentoKundliArt className={className} />
    case 'rashifal':
      return <BentoRashifalArt className={className} />
    case 'panchang':
      return <BentoPanchangArt className={className} />
    case 'milan':
      return <BentoMilanArt className={className} />
    default:
      return null
  }
}

function BentoMilanArt({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const gold = `url(#${id}-gold)`
  const rose = `url(#${id}-rose)`
  return (
    <svg viewBox="0 0 200 150" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4cc" />
          <stop offset="100%" stopColor="#e9b850" />
        </linearGradient>
        <linearGradient id={`${id}-rose`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <radialGradient id={`${id}-gl`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(236,72,153,0.06)" />
          <stop offset="100%" stopColor="rgba(236,72,153,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="75" rx="92" ry="68" fill={`url(#${id}-gl)`} />
      <Mini x={8} y={22} s={72} stroke={gold} label="A" />
      <Mini x={120} y={22} s={72} stroke={rose} label="B" />
      <path
        d="M92 68 C92 58 100 52 100 62 C100 52 108 58 108 68 C108 78 100 86 100 96 C100 86 92 78 92 68Z"
        fill={rose}
        opacity="0.9"
      />
      <circle cx="100" cy="68" r="22" fill="rgba(8,6,12,0.5)" stroke={gold} strokeWidth="1.6" />
      <text x="100" y="65" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="12" fontWeight="700" fill={gold}>
        36
      </text>
      <text x="100" y="76" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fce7f3" letterSpacing="0.12em">
        GUNA
      </text>
    </svg>
  )
}

function Mini({ x, y, s, stroke, label }: { x: number; y: number; s: number; stroke: string; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={s} height={s} stroke={stroke} strokeWidth="2.2" rx="4" fill="rgba(255,255,255,0.05)" />
      <path d={`M0 0 ${s} ${s}M${s} 0 0 ${s}`} stroke={stroke} strokeWidth="1.65" />
      <path d={`M${s / 2} 0 L${s} ${s / 2} ${s / 2} ${s} 0 ${s / 2}Z`} stroke={stroke} strokeWidth="1.65" fill="rgba(255,255,255,0.05)" />
      <text x={s / 2} y={s + 12} textAnchor="middle" fontSize="8" fontWeight="800" fill={label === 'A' ? '#e9b850' : '#f9a8d4'}>
        {label}
      </text>
    </g>
  )
}
