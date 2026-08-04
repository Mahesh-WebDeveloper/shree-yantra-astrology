import type { PanchangAnga, PanchangResponse } from '@/lib/api'

const TITHI_EN = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Purnima',
]
const TITHI_HI = [
  'प्रतिपदा',
  'द्वितीया',
  'तृतीया',
  'चतुर्थी',
  'पंचमी',
  'षष्ठी',
  'सप्तमी',
  'अष्टमी',
  'नवमी',
  'दशमी',
  'एकादशी',
  'द्वादशी',
  'त्रयोदशी',
  'चतुर्दशी',
  'पूर्णिमा',
]

const pad2 = (n: number) => (n < 10 ? '0' : '') + n

const parseTzOffset = (tz?: string) => {
  const m = String(tz || '+05:30').match(/([+-])(\d{1,2}):?(\d{2})/)
  if (!m) return 330
  const sign = m[1] === '-' ? -1 : 1
  return sign * (Number(m[2]) * 60 + Number(m[3]))
}

const localNowForTz = (tz?: string) => {
  const shifted = new Date(Date.now() + parseTzOffset(tz) * 60000)
  return {
    dmy: `${pad2(shifted.getUTCDate())}/${pad2(shifted.getUTCMonth() + 1)}/${shifted.getUTCFullYear()}`,
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() + shifted.getUTCSeconds() / 60,
  }
}

const hmToMinutes = (hm?: string) => {
  const m = String(hm || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const ap = (m[3] || '').toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h * 60 + min
}

const tithiFromNum = (num: number): PanchangResponse['tithi'] => {
  const n = ((((Math.round(num) - 1) % 30) + 30) % 30) + 1
  const paksha = n <= 15 ? 'Shukla' : 'Krishna'
  if (n === 30) return { num: n, name: 'Amavasya', hi: 'अमावस्या', paksha, pakshaHi: 'कृष्ण पक्ष' }
  const idx = (n - 1) % 15
  return {
    num: n,
    name: TITHI_EN[idx],
    hi: TITHI_HI[idx],
    paksha,
    pakshaHi: paksha === 'Shukla' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष',
  }
}

/** Same client correction as mobile app — active tithi after end-time on “today”. */
export function normalizeActivePanchang(
  p: PanchangResponse,
  input: { date?: string; tz?: string },
): PanchangResponse {
  if (!p?.tithi?.endsAt || p.isCurrent) return p
  const now = localNowForTz(input.tz)
  const requestedDate = input.date || p.date || now.dmy
  if (requestedDate !== now.dmy || p.tithi.endsAt.nextDay) return p
  const endMin = hmToMinutes(p.tithi.endsAt.hm)
  if (endMin == null || now.minutes < endMin) return p
  const sunriseTithi = (p.sunriseTithi || { ...p.tithi }) as PanchangAnga & {
    num: number
    paksha: string
    pakshaHi?: string
  }
  return {
    ...p,
    tithi: tithiFromNum((p.tithi.num || 0) + 1),
    sunriseTithi,
    currentTime: {
      hm12: '',
      hm24: `${pad2(Math.floor(now.minutes / 60))}:${pad2(Math.floor(now.minutes % 60))}`,
      minutesFromMidnight: now.minutes,
    },
    isCurrent: true,
    calculation: {
      ...(p.calculation || {}),
      fiveLimbs: 'Client-corrected active tithi from backend sunrise tithi end-time',
      observanceRule: 'sunrise tithi preserved separately; active tithi adjusted after end-time',
    },
  }
}
