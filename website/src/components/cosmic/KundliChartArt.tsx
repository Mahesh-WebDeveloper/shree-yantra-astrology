import { useId } from 'react'

/** Decorative North-Indian birth chart — hero / bento illustration. */
export function KundliChartArt({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const gid = compact ? `${uid}-c` : uid
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4cc" />
          <stop offset="45%" stopColor="#e9b850" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="rgba(233, 184, 80, 0.42)" />
          <stop offset="70%" stopColor="rgba(233, 184, 80, 0.08)" />
          <stop offset="100%" stopColor="rgba(233, 184, 80, 0)" />
        </radialGradient>
        <filter id={`${gid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="96" r="96" fill={`url(#${gid}-glow)`} />
      <rect
        x="14"
        y="14"
        width="172"
        height="172"
        rx="6"
        fill="rgba(8, 8, 12, 0.35)"
        stroke={`url(#${gid}-gold)`}
        strokeWidth="1.8"
      />
      <rect x="20" y="20" width="160" height="160" stroke={`url(#${gid}-gold)`} strokeWidth="0.75" opacity="0.4" strokeDasharray="2.5 5" rx="2" />
      <g filter={`url(#${gid}-soft)`}>
        <path d="M14 14 186 186M186 14 14 186" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" opacity="0.9" />
        <path
          d="M100 14 186 100 100 186 14 100Z"
          stroke={`url(#${gid}-gold)`}
          strokeWidth="1.65"
          fill="rgba(233, 184, 80, 0.07)"
        />
        <path
          d="M100 14 186 100M186 100 100 186M100 186 14 100M14 100 100 14"
          stroke={`url(#${gid}-gold)`}
          strokeWidth="0.95"
          opacity="0.5"
        />
      </g>
      <g stroke={`url(#${gid}-gold)`} strokeWidth="0.6" opacity="0.35">
        <path d="M100 52 L100 68 M148 100 L132 100 M100 148 L100 132 M52 100 L68 100" />
      </g>
      <circle cx="100" cy="100" r="16" fill="rgba(233, 184, 80, 0.15)" stroke={`url(#${gid}-gold)`} strokeWidth="1.3" />
      <circle cx="100" cy="100" r="5" fill="#f6d27a" />
      <circle cx="100" cy="100" r="2" fill="#fff8e8" opacity="0.9" />
      <g fontFamily="Cinzel, serif" fontWeight="600" fontSize="8.5" fill={`url(#${gid}-gold)`} textAnchor="middle" opacity="0.95">
        <text x="100" y="38">1</text>
        <text x="48" y="50">2</text>
        <text x="36" y="102">3</text>
        <text x="48" y="154">4</text>
        <text x="100" y="166">5</text>
        <text x="152" y="154">6</text>
        <text x="164" y="102">7</text>
        <text x="152" y="50">8</text>
        <text x="88" y="92">9</text>
        <text x="112" y="92">10</text>
        <text x="88" y="112">11</text>
        <text x="112" y="112">12</text>
      </g>
      {!compact ? (
        <g fontFamily="Inter, sans-serif" fontSize="7" fill="#ffe9a8" textAnchor="middle" fontWeight="700">
          <text x="100" y="54">Su</text>
          <text x="48" y="64">Mo</text>
          <text x="36" y="114">Ma</text>
          <text x="72" y="88">Me</text>
          <text x="164" y="114">Ve</text>
          <text x="152" y="64">Ju</text>
          <text x="128" y="88">Sa</text>
          <text x="72" y="118">Ra</text>
        </g>
      ) : null}
    </svg>
  )
}
