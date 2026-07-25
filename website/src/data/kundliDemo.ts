/** Fallback demo rows when API is offline — same as mobile `data/kundli.ts`. */
export type KundliRowStrength = 'plain' | 'solid' | 'soft'

export interface KundliRow {
  glyph: string
  name: string
  detail: string
  tag: string
  strength: KundliRowStrength
  signGlyph?: string
  highlight?: boolean
}

export const KEY_INSIGHT =
  'With Sun rising in your 1st house, you radiate natural leadership. Jupiter in the 8th brings deep wisdom but warns against speculation. Saturn’s aspect on your 10th house suggests slow but solid career growth — especially after 28.'

export const PLANETS: KundliRow[] = [
  { glyph: '☉', name: 'SUN', detail: '1st House · Leo · 12°', tag: 'Exalted', strength: 'plain' },
  { glyph: '☽', name: 'MOON', detail: '12th House · Cancer · 04°', tag: 'Own Sign', strength: 'plain' },
  { glyph: '♂', name: 'MARS', detail: '3rd House · Libra · 22°', tag: 'Debilitated', strength: 'plain' },
  { glyph: '♃', name: 'JUPITER', detail: '8th House · Pisces · 18°', tag: 'Own Sign', strength: 'plain' },
  { glyph: '♄', name: 'SATURN', detail: '10th House · Taurus · 09°', tag: 'Friendly', strength: 'plain' },
]

export const CURRENT_DASHA = {
  title: 'Jupiter Mahadasha',
  range: 'Mar 2024 – Feb 2040 · 16 yr cycle',
  tag: 'Favourable',
}

export const DASHA_TIMELINE: KundliRow[] = [
  { glyph: '♃', name: 'JUPITER', detail: 'Mar 2024 – Feb 2040 · running now', tag: 'Active', strength: 'solid', highlight: true },
  { glyph: '♄', name: 'SATURN', detail: 'Feb 2040 – Feb 2059', tag: 'Upcoming', strength: 'plain' },
  { glyph: '☿', name: 'MERCURY', detail: 'Feb 2059 – Feb 2076', tag: 'Upcoming', strength: 'plain' },
  { glyph: '☵', name: 'KETU', detail: 'Feb 2076 – Feb 2083', tag: 'Upcoming', strength: 'plain' },
]

export const YOGAS: KundliRow[] = [
  { glyph: '✦', name: 'Gajakesari Yoga', detail: 'Jupiter–Moon angle · wisdom & respect', tag: 'Strong', strength: 'solid' },
  { glyph: '☀', name: 'Budhaditya Yoga', detail: 'Sun–Mercury · sharp intellect', tag: 'Present', strength: 'plain' },
  { glyph: '♚', name: 'Raja Yoga', detail: '5th–9th lords · rise in status', tag: 'Forming', strength: 'plain' },
]

export const DOSHAS: KundliRow[] = [
  { glyph: '♂', name: 'Mangal Dosha', detail: 'Mars in 3rd · mild effect', tag: 'Low', strength: 'plain' },
  { glyph: '☊', name: 'Kaal Sarp Dosha', detail: 'Not formed in your chart', tag: 'Clear', strength: 'solid' },
  { glyph: '♄', name: 'Sade Sati', detail: 'Begins ~2027 · prepare remedies', tag: 'Watch', strength: 'plain' },
]
