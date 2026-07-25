import { useTheme } from '@/theme/ThemeProvider'

export function ShreeYantraLogo({ size = 88, className = '', pulse = true }: { size?: number; className?: string; pulse?: boolean }) {
  const { theme } = useTheme()
  const dark = theme.isDark
  const gid = 'syg-web'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={`${pulse ? 'shree-yantra-logo' : ''} ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={dark ? '#fce8a8' : '#111827'} />
          <stop offset="60%" stopColor={dark ? '#e9b850' : '#1f2937'} />
          <stop offset="100%" stopColor={dark ? '#a17613' : '#7c2d12'} />
        </linearGradient>
      </defs>
      {!dark && <circle cx="100" cy="100" r="94" fill="#ffffff" opacity="0.78" />}
      <rect x="14" y="14" width="172" height="172" stroke={`url(#${gid})`} strokeWidth={dark ? 2.8 : 3} fill="none" />
      <rect x="20" y="20" width="160" height="160" stroke={`url(#${gid})`} strokeWidth={dark ? 1.8 : 1.8} fill="none" opacity={dark ? 0.92 : 0.95} />
      <g stroke={`url(#${gid})`} strokeWidth={dark ? 2.2 : 2.2}>
        <line x1="14" y1="20" x2="26" y2="20" />
        <line x1="20" y1="14" x2="20" y2="26" />
        <line x1="174" y1="20" x2="186" y2="20" />
        <line x1="180" y1="14" x2="180" y2="26" />
        <line x1="14" y1="180" x2="26" y2="180" />
        <line x1="20" y1="174" x2="20" y2="186" />
        <line x1="174" y1="180" x2="186" y2="180" />
        <line x1="180" y1="174" x2="180" y2="186" />
      </g>
      <path d="M85 14 L100 2 L115 14" stroke={`url(#${gid})`} strokeWidth={dark ? 2.6 : 3} fill="none" />
      <path d="M85 186 L100 198 L115 186" stroke={`url(#${gid})`} strokeWidth={dark ? 2.6 : 3} fill="none" />
      <path d="M14 85 L2 100 L14 115" stroke={`url(#${gid})`} strokeWidth={dark ? 2.6 : 3} fill="none" />
      <path d="M186 85 L198 100 L186 115" stroke={`url(#${gid})`} strokeWidth={dark ? 2.6 : 3} fill="none" />
      <circle cx="100" cy="100" r="74" stroke={`url(#${gid})`} strokeWidth={dark ? 2 : 2} fill="none" />
      <circle cx="100" cy="100" r="60" stroke={`url(#${gid})`} strokeWidth={dark ? 2 : 2} fill="none" />
      <g stroke={`url(#${gid})`} strokeWidth={dark ? 2.2 : 2.2} fill="none">
        <polygon points="100,42 144,128 56,128" />
        <polygon points="100,40 148,124 52,124" opacity="0.5" />
        <polygon points="100,158 56,72 144,72" />
        <polygon points="100,160 52,76 148,76" opacity="0.5" />
        <polygon points="100,58 134,116 66,116" />
        <polygon points="100,142 66,84 134,84" />
        <polygon points="100,72 124,108 76,108" />
        <polygon points="100,128 76,92 124,92" />
      </g>
      <circle cx="100" cy="100" r={dark ? 4.5 : 3} fill={dark ? '#fce8a8' : `url(#${gid})`} />
    </svg>
  )
}
