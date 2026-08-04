import type { SVGProps } from 'react'

export type VedicIconName =
  | 'kundli'
  | 'rashifal'
  | 'panchang'
  | 'choghadiya'
  | 'muhurat'
  | 'milan'
  | 'numerology'
  | 'vastu'
  | 'baby'
  | 'remedies'
  | 'report'
  | 'reading'
  | 'shloka'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/** Line-art Vedic/astrology iconography using currentColor. */
export function VedicIcon({
  name,
  size = 24,
  className,
}: {
  name: VedicIconName
  size?: number
  className?: string
}) {
  const common = { ...base, width: size, height: size, className, 'aria-hidden': true } as SVGProps<SVGSVGElement>

  switch (name) {
    case 'kundli': // North-Indian birth chart (square + diagonals + diamond)
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="1.5" />
          <path d="M3 3 21 21M21 3 3 21" />
          <path d="M12 3 21 12 12 21 3 12Z" />
        </svg>
      )
    case 'rashifal': // zodiac wheel + sun core
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.4" />
          <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
        </svg>
      )
    case 'panchang': // almanac — calendar with crescent + sun
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v3M16 3v3" />
          <circle cx="9" cy="14" r="1.6" />
          <path d="M17 12.4a2.8 2.8 0 1 0 0 4.2 3.4 3.4 0 0 1 0-4.2Z" />
        </svg>
      )
    case 'choghadiya': // time windows — clock
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.2 2" />
        </svg>
      )
    case 'muhurat': // auspicious moment — sparkle star
      return (
        <svg {...common}>
          <path d="M12 2.5c.6 4.8 2.7 6.9 7.5 7.5-4.8.6-6.9 2.7-7.5 7.5-.6-4.8-2.7-6.9-7.5-7.5 4.8-.6 6.9-2.7 7.5-7.5Z" />
          <path d="M19 15.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z" />
        </svg>
      )
    case 'milan': // compatibility — interlocked circles
      return (
        <svg {...common}>
          <circle cx="9" cy="12" r="6" />
          <circle cx="15" cy="12" r="6" />
        </svg>
      )
    case 'numerology': // Lo Shu grid
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
          <path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" />
        </svg>
      )
    case 'vastu': // home + directions compass
      return (
        <svg {...common}>
          <path d="M4 11 12 4l8 7" />
          <path d="M6 10v10h12V10" />
          <path d="M12 13.5 13.4 15 12 16.5 10.6 15Z" />
        </svg>
      )
    case 'baby': // naamkaran — lotus
      return (
        <svg {...common}>
          <path d="M12 20c-4.4 0-8-2.2-8-5 2 .6 3.6.4 4.9-.4C7.4 12.6 7 10.4 8 8c1.6 1.4 2.9 3 4 5 1.1-2 2.4-3.6 4-5 1 2.4.6 4.6-.9 6.6 1.3.8 2.9 1 4.9.4 0 2.8-3.6 5-8 5Z" />
        </svg>
      )
    case 'remedies': // upaay — diya lamp with flame
      return (
        <svg {...common}>
          <path d="M12 4c1.4 1.2 2 2.4 2 3.6A2 2 0 0 1 10 7.6c0-1.2.6-2.4 2-3.6Z" />
          <path d="M4 14h16l-1.6 3.2a3 3 0 0 1-2.7 1.8H8.3a3 3 0 0 1-2.7-1.8Z" />
          <path d="M9 14c0-1.6 1.3-2.5 3-2.5s3 .9 3 2.5" />
        </svg>
      )
    case 'report': // brihat kundli PDF report — document
      return (
        <svg {...common}>
          <path d="M6 2.5h8l4 4V21a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 21Z" />
          <path d="M14 2.5V6.5h4M9 12h6M9 15.5h6M9 8.5h2" />
        </svg>
      )
    case 'reading': // vedic reading — open book
      return (
        <svg {...common}>
          <path d="M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5 1.5-1.5 4-2 8-1.5V5c-4-.5-6.5 0-8 1.5Z" />
          <path d="M12 6.5v13" />
        </svg>
      )
    case 'shloka':
      return (
        <svg {...common}>
          <path d="M12 3l1.5 5 5 1.5-5 1.5L12 16l-1.5-5-5-1.5 5-1.5z" />
        </svg>
      )
    default:
      return null
  }
}
