import type { PanchangObservance, PanchangPeriod, PanchangResponse } from '@/lib/api'
import { angaEndLabel } from '@/lib/location'

export const PERIOD_GUIDE: Record<string, { en: string; hi: string; bad?: boolean }> = {
  'Rahu Kaal': { bad: true, en: 'Avoid new beginnings, travel, marriage, housewarming & important work.', hi: 'नया कार्य, यात्रा, विवाह, गृह-प्रवेश व महत्वपूर्ण काम न करें।' },
  Yamaganda: { bad: true, en: 'Avoid auspicious work — ventures begun now tend to fail.', hi: 'शुभ कार्य न करें — इस समय शुरू किए काम असफल होते हैं।' },
  'Gulika Kaal': { bad: true, en: 'Avoid loans & funerals; buying property is considered favourable.', hi: 'ऋण व अंत्येष्टि से बचें; संपत्ति/घर खरीदना शुभ माना जाता है।' },
  'Abhijit Muhurat': { en: 'Most auspicious window — good for ANY work (except on Wednesday).', hi: 'सबसे शुभ समय — किसी भी कार्य के लिए श्रेष्ठ (बुधवार को छोड़कर)।' },
  'Brahma Muhurat': { en: 'Best for meditation, yoga, prayer, study & spiritual practice.', hi: 'ध्यान, योग, पूजा, अध्ययन व साधना के लिए उत्तम।' },
}

export const PANCHAK_AVOID_EN = [
  'Do not begin travel toward the South.',
  'Do not cast the roof slab of a house.',
  'Do not make a new cot/bed.',
  'Do not stock large amounts of wood/fuel.',
  'If a death occurs, cremate 5 dough/kusha effigies along with the body (classical remedy).',
]
export const PANCHAK_AVOID_HI = [
  'दक्षिण दिशा की यात्रा आरंभ न करें।',
  'घर की छत/स्लैब न डलवाएँ।',
  'नई चारपाई/पलंग न बनवाएँ।',
  'लकड़ी/ईंधन का बड़ा भंडारण न करें।',
  'परिवार में मृत्यु हो तो शव के साथ आटे/कुश के 5 पुतले बनाकर विधिपूर्वक दाह करें।',
]

export function toEng(v: unknown): string {
  return String(v ?? '').replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
}

const norm = (s?: string) => String(s || '').toLowerCase().replace(/[^a-z0-9ऀ-ॿ]/gi, '')
export const isBhadra = (s?: string) => /bhadra|vishti/.test(norm(s)) || /भद्रा|विष्टि/.test(String(s || ''))

export function bilingual(o: { en: string; hi: string } | null | undefined, hi: boolean) {
  return o ? (hi ? o.hi : o.en) : ''
}

export function angaName(o: { name?: string; hi?: string } | null | undefined, hi: boolean) {
  if (!o) return ''
  return hi && o.hi ? o.hi : o.name || ''
}

export function nowNote(
  disp: { num?: number; name?: string } | null | undefined,
  cur: { num?: number; name?: string; hi?: string } | null | undefined,
  hi: boolean,
) {
  if (!disp || !cur || (disp.num ?? disp.name) === (cur.num ?? cur.name)) return ''
  return `${hi ? 'अभी' : 'Now'} ${angaName(cur, hi)}`
}

export function displayLimbs(data: PanchangResponse) {
  const dispTithi = data.isCurrent && data.sunriseTithi ? data.sunriseTithi : data.tithi
  const dispNak = data.isCurrent && data.sunriseNakshatra ? data.sunriseNakshatra : data.nakshatra
  const dispYoga = data.isCurrent && data.sunriseYoga ? data.sunriseYoga : data.yoga
  const dispKarana = data.isCurrent && data.sunriseKarana ? data.sunriseKarana : data.karana
  return { dispTithi, dispNak, dispYoga, dispKarana }
}

export function tmTime(
  p: { hm12?: string; hm24?: string } | null | undefined,
  fallback: string | null | undefined,
  hi: boolean,
) {
  return toEng(p ? (hi ? p.hm24 : p.hm12) : fallback || '—')
}

export function durText(d: { text?: string; hi?: string } | null | undefined, hi: boolean) {
  return toEng(d ? (hi ? d.hi : d.text) : '—')
}

export function endLabel(e: { hm: string; nextDay: boolean } | undefined, hi: boolean) {
  return angaEndLabel(e, hi)
}

export function cleanObservances(data: PanchangResponse | null): PanchangObservance[] {
  const seen = new Set<string>()
  return (data?.observances || []).filter((o) => {
    if (data?.bhadra && isBhadra(o.name?.en || o.name?.hi)) return false
    const k = o.key || norm(o.name?.en || o.name?.hi)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function toDmy(d: Date) {
  const pad = (n: number) => (n < 10 ? '0' : '') + n
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function htmlToDmy(html: string) {
  const [y, m, d] = html.split('-')
  return `${d}/${m}/${y}`
}

export function dmyToHtml(dmy: string) {
  const [d, m, y] = dmy.split('/')
  if (!y || y.length !== 4) return dmy
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export function periodRowGuide(p: PanchangPeriod, hi: boolean) {
  const g = PERIOD_GUIDE[p.name]
  if (!g) return null
  return { text: hi ? g.hi : g.en, bad: g.bad }
}
