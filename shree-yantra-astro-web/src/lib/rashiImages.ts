import aries from '@/assets/rashi/aries.png'
import taurus from '@/assets/rashi/taurus.png'
import gemini from '@/assets/rashi/gemini.png'
import cancer from '@/assets/rashi/cancer.png'
import leo from '@/assets/rashi/leo.png'
import virgo from '@/assets/rashi/virgo.png'
import libra from '@/assets/rashi/libra.png'
import scorpio from '@/assets/rashi/scorpio.png'
import sagittarius from '@/assets/rashi/sagittarius.png'
import capricorn from '@/assets/rashi/capricorn.png'
import aquarius from '@/assets/rashi/aquarius.png'
import pisces from '@/assets/rashi/pisces.png'

export type RashiKey =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

const RASHI_IMAGES: Record<RashiKey, string> = {
  aries,
  taurus,
  gemini,
  cancer,
  leo,
  virgo,
  libra,
  scorpio,
  sagittarius,
  capricorn,
  aquarius,
  pisces,
}

const ALIASES: Record<RashiKey, string[]> = {
  aries: ['aries', 'mesha', 'mesh'],
  taurus: ['taurus', 'vrishabha', 'vrishabh', 'vrushabh', 'vrisabha'],
  gemini: ['gemini', 'mithuna', 'mithun'],
  cancer: ['cancer', 'karka', 'kark'],
  leo: ['leo', 'simha', 'singh'],
  virgo: ['virgo', 'kanya'],
  libra: ['libra', 'tula'],
  scorpio: ['scorpio', 'vrischika', 'vrishchika', 'vrishchik', 'vrushchik'],
  sagittarius: ['sagittarius', 'dhanu', 'dhanus'],
  capricorn: ['capricorn', 'makara', 'makar'],
  aquarius: ['aquarius', 'kumbha', 'kumbh'],
  pisces: ['pisces', 'meena', 'meen'],
}

export function rashiKeyFrom(sign?: string | null): RashiKey | null {
  const compact = String(sign || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  if (!compact) return null
  for (const key of Object.keys(ALIASES) as RashiKey[]) {
    if (ALIASES[key].some((a) => compact.includes(a))) return key
  }
  return null
}

/** App-parity illustrated rashi icon URL, or null if unknown. */
export function rashiImageUrl(sign?: string | null): string | null {
  const key = rashiKeyFrom(sign)
  return key ? RASHI_IMAGES[key] : null
}
