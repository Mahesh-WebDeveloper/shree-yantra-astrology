import type { ApiPlanet } from '@/lib/api'

export interface ChartPlanet {
  abbr: string
  x: number
  y: number
}

export interface HouseLabel {
  n: number
  x: number
  y: number
}

export const HOUSES: HouseLabel[] = [
  { n: 1, x: 100, y: 40 },
  { n: 2, x: 52, y: 28 },
  { n: 3, x: 28, y: 54 },
  { n: 4, x: 52, y: 92 },
  { n: 5, x: 28, y: 142 },
  { n: 6, x: 52, y: 168 },
  { n: 7, x: 100, y: 128 },
  { n: 8, x: 148, y: 168 },
  { n: 9, x: 172, y: 142 },
  { n: 10, x: 148, y: 92 },
  { n: 11, x: 172, y: 54 },
  { n: 12, x: 148, y: 28 },
]

export type ChartStyle = 'north' | 'south' | 'east'

export const KUNDLI_TABS = [
  { key: 'charts', en: 'Charts', hi: 'चार्ट' },
  { key: 'overview', en: 'Overview', hi: 'सारांश' },
  { key: 'planets', en: 'Planets', hi: 'ग्रह' },
  { key: 'dasha', en: 'Dasha', hi: 'दशा' },
  { key: 'yoga', en: 'Yoga', hi: 'योग' },
  { key: 'dosha', en: 'Dosha', hi: 'दोष' },
] as const

export type KundliTabKey = (typeof KUNDLI_TABS)[number]['key']

const SIGN_IDX: Record<string, number> = {
  Aries: 0,
  Taurus: 1,
  Gemini: 2,
  Cancer: 3,
  Leo: 4,
  Virgo: 5,
  Libra: 6,
  Scorpio: 7,
  Sagittarius: 8,
  Capricorn: 9,
  Aquarius: 10,
  Pisces: 11,
}

const ABBR: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
}

const ABBR_HI: Record<string, string> = {
  Sun: 'सू',
  Moon: 'चं',
  Mars: 'मं',
  Mercury: 'बु',
  Jupiter: 'गु',
  Venus: 'शु',
  Saturn: 'श',
  Rahu: 'रा',
  Ketu: 'के',
}

export const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']
export const SIGN_ABBR_HI = ['मे', 'वृ', 'मि', 'क', 'सिं', 'कन्', 'तु', 'वृश्', 'ध', 'मक', 'कुं', 'मी']

const SOUTH_CELL: Record<number, [number, number]> = {
  11: [0, 0],
  0: [0, 1],
  1: [0, 2],
  2: [0, 3],
  3: [1, 3],
  4: [2, 3],
  5: [3, 3],
  6: [3, 2],
  7: [3, 1],
  8: [3, 0],
  9: [2, 0],
  10: [1, 0],
}

const HOUSE_OFF = [0, -13, 13, -25, 25, -36, 36]

export function planetAbbr(planet: string, hi: boolean) {
  const map = hi ? ABBR_HI : ABBR
  return map[planet] || ABBR[planet] || planet.slice(0, 2)
}

export function signAbbr(i: number, hi: boolean) {
  return hi ? SIGN_ABBR_HI[i] : SIGN_ABBR[i]
}

function houseNum(h?: string) {
  const m = (h || '').match(/\d+/)
  return m ? Number(m[0]) : null
}

export function planetsBySign(planets: ApiPlanet[], hi: boolean): Record<number, string[]> {
  const map: Record<number, string[]> = {}
  planets.forEach((p) => {
    if (!p.sign) return
    const i = SIGN_IDX[p.sign]
    if (i == null) return
    ;(map[i] = map[i] || []).push(planetAbbr(p.planet, hi))
  })
  return map
}

/** North-Indian chart planet positions from live API (same logic as mobile KundliScreen). */
export function toChartPlanetsBySign(planets: ApiPlanet[], ascendantSign: string | null | undefined, hi: boolean): ChartPlanet[] {
  const lagnaIdx = ascendantSign ? SIGN_IDX[ascendantSign] : null
  if (lagnaIdx == null) return []
  const byHouse: Record<number, string[]> = {}
  planets.forEach((p) => {
    if (!p.sign) return
    const idx = SIGN_IDX[p.sign]
    if (idx == null) return
    const house = ((idx - lagnaIdx + 12) % 12) + 1
    ;(byHouse[house] = byHouse[house] || []).push(planetAbbr(p.planet, hi))
  })
  const out: ChartPlanet[] = []
  Object.keys(byHouse).forEach((hk) => {
    const house = Number(hk)
    const h = HOUSES.find((x) => x.n === house)
    if (!h) return
    const list = byHouse[house]
    const perRow = list.length > 1 ? 2 : 1
    list.forEach((abbr, i) => {
      const row = Math.floor(i / perRow)
      const rowItems = Math.min(perRow, list.length - row * perRow)
      const col = i % perRow
      out.push({ abbr, x: h.x + (col - (rowItems - 1) / 2) * 17, y: h.y + 13 + row * 9.5 })
    })
  })
  return out
}

export function toChartPlanetsByHouse(planets: ApiPlanet[], hi: boolean): ChartPlanet[] {
  const counts: Record<number, number> = {}
  const out: ChartPlanet[] = []
  planets.forEach((p) => {
    if (!p.sign) return
    const n = houseNum(p.house)
    if (!n) return
    const h = HOUSES.find((x) => x.n === n)
    if (!h) return
    const idx = counts[n] || 0
    counts[n] = idx + 1
    out.push({ abbr: planetAbbr(p.planet, hi), x: h.x + (HOUSE_OFF[idx] || 0), y: h.y + 14 })
  })
  return out
}

export function rashiOfHouse(houseN: number, ascendant: string | null | undefined) {
  const lagnaIdx = ascendant ? SIGN_IDX[ascendant] : -1
  return lagnaIdx >= 0 ? ((lagnaIdx + houseN - 1) % 12) + 1 : houseN
}

export function houseOfSignIdx(signIdx: number, ascendant: string | null | undefined) {
  const lagnaIdx = ascendant ? SIGN_IDX[ascendant] : -1
  return lagnaIdx >= 0 ? ((signIdx - lagnaIdx + 12) % 12) + 1 : signIdx + 1
}

export { SIGN_IDX, SOUTH_CELL }
