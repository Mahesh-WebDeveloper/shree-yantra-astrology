/** Choghadiya period builder — ported from mobile `data/choghadiya.ts` */

export type Nature = 'good' | 'neutral' | 'bad'
export type ColorKey = 'green' | 'blue' | 'orange' | 'red'

export interface ChogMeta {
  nature: Nature
  tag: string
  color: ColorKey
  desc: string
}

export interface ChogPeriod {
  name: string
  phase: 'day' | 'night'
  start: Date
  end: Date
  meta: ChogMeta
}

const SUNRISE = { h: 5, m: 28 }
const SUNSET = { h: 18, m: 54 }

const DAY_ORDER = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog']
const NIGHT_ORDER = ['Shubh', 'Amrit', 'Char', 'Rog', 'Kaal', 'Labh', 'Udveg']
const DAY_START = ['Udveg', 'Amrit', 'Rog', 'Labh', 'Shubh', 'Char', 'Kaal']
const NIGHT_START = ['Shubh', 'Char', 'Kaal', 'Udveg', 'Amrit', 'Rog', 'Labh']

export const CHOG_META: Record<string, ChogMeta> = {
  Amrit: { nature: 'good', tag: 'Auspicious', color: 'green', desc: 'The most auspicious time — ideal for any sacred or important work.' },
  Shubh: { nature: 'good', tag: 'Auspicious', color: 'green', desc: 'Excellent for ceremonies, new beginnings and auspicious tasks.' },
  Labh: { nature: 'good', tag: 'Auspicious', color: 'blue', desc: 'Good time for business, financial transactions, deals and purchases.' },
  Char: { nature: 'neutral', tag: 'Neutral', color: 'orange', desc: 'Movable time — favourable for travel, journeys and quick errands.' },
  Udveg: { nature: 'bad', tag: 'Inauspicious', color: 'red', desc: 'Best avoided for new work — suited only to routine tasks.' },
  Kaal: { nature: 'bad', tag: 'Inauspicious', color: 'red', desc: 'Inauspicious period — postpone important beginnings.' },
  Rog: { nature: 'bad', tag: 'Inauspicious', color: 'red', desc: 'Linked to conflict & illness — avoid key activities.' },
}

export const UPCOMING_BLURB: Record<string, string> = {
  Amrit: 'VERY AUSPICIOUS TIME',
  Shubh: 'GOOD FOR IMPORTANT TASKS',
  Labh: 'GOOD FOR MONEY RELATED WORK',
}

const at = (date: Date, t: { h: number; m: number }) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), t.h, t.m, 0, 0)
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const pad2 = (n: number) => (n < 10 ? '0' : '') + n

const WDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtChogDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${WDAYS[d.getDay()]}`
}

export function fmtChogTime(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const ap = h < 12 ? 'AM' : 'PM'
  let hh = h % 12
  if (hh === 0) hh = 12
  return `${pad2(hh)}:${pad2(m)} ${ap}`
}

export type SunTimes = { sunrise: { h: number; m: number }; sunset: { h: number; m: number } }

export function buildChoghadiyaPeriods(
  date: Date,
  sun?: SunTimes,
  nextSunrise?: { h: number; m: number },
): ChogPeriod[] {
  const dow = date.getDay()
  const SR = sun?.sunrise || SUNRISE
  const SS = sun?.sunset || SUNSET
  const sr = at(date, SR)
  const ss = at(date, SS)
  const nsr = at(addDays(date, 1), nextSunrise || SR)
  const dayLen = (ss.getTime() - sr.getTime()) / 8
  const nightLen = (nsr.getTime() - ss.getTime()) / 8
  const list: ChogPeriod[] = []
  const di = DAY_ORDER.indexOf(DAY_START[dow])
  for (let i = 0; i < 8; i++) {
    const name = DAY_ORDER[(di + i) % 7]
    list.push({
      name,
      phase: 'day',
      start: new Date(sr.getTime() + i * dayLen),
      end: new Date(sr.getTime() + (i + 1) * dayLen),
      meta: CHOG_META[name],
    })
  }
  const ni = NIGHT_ORDER.indexOf(NIGHT_START[dow])
  for (let j = 0; j < 8; j++) {
    const name = NIGHT_ORDER[(ni + j) % 7]
    list.push({
      name,
      phase: 'night',
      start: new Date(ss.getTime() + j * nightLen),
      end: new Date(ss.getTime() + (j + 1) * nightLen),
      meta: CHOG_META[name],
    })
  }
  return list
}

export const buildPeriods = buildChoghadiyaPeriods

export function findActiveChoghadiya(periods: ChogPeriod[], now: Date) {
  return periods.find((p) => now >= p.start && now < p.end)
}

export const findActive = findActiveChoghadiya

export function upcomingGood(periods: ChogPeriod[], now: Date): ChogPeriod[] {
  let pool = periods.filter((p) => p.meta.nature === 'good' && p.end > now)
  if (!pool.length) pool = periods.filter((p) => p.meta.nature === 'good')
  return pool.slice(0, 3)
}

export function accentForColor(c: ColorKey): string {
  switch (c) {
    case 'green':
      return '#16a34a'
    case 'blue':
      return '#2563eb'
    case 'orange':
      return '#ea580c'
    case 'red':
      return '#dc2626'
    default:
      return 'var(--sy-accent)'
  }
}

export function stripChogDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function sameChogDay(a: Date, b: Date) {
  return stripChogDate(a).getTime() === stripChogDate(b).getTime()
}
