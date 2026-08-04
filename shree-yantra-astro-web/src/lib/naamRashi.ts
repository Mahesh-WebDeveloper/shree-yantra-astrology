export type RashiName =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces'

const DEVA: Record<string, RashiName> = {
  अ: 'Aries',
  आ: 'Aries',
  इ: 'Aries',
  ई: 'Aries',
  ल: 'Aries',
  ब: 'Taurus',
  भ: 'Sagittarius',
  व: 'Taurus',
  उ: 'Taurus',
  ऊ: 'Taurus',
  ए: 'Taurus',
  ऐ: 'Taurus',
  ओ: 'Taurus',
  औ: 'Taurus',
  क: 'Gemini',
  ख: 'Capricorn',
  ग: 'Capricorn',
  घ: 'Gemini',
  च: 'Pisces',
  छ: 'Gemini',
  ज: 'Capricorn',
  झ: 'Pisces',
  ट: 'Leo',
  ठ: 'Virgo',
  ड: 'Cancer',
  ढ: 'Cancer',
  ण: 'Virgo',
  त: 'Libra',
  थ: 'Pisces',
  द: 'Aquarius',
  ध: 'Sagittarius',
  न: 'Scorpio',
  प: 'Virgo',
  फ: 'Sagittarius',
  म: 'Leo',
  य: 'Scorpio',
  र: 'Libra',
  स: 'Aquarius',
  श: 'Aquarius',
  ष: 'Aquarius',
  ह: 'Gemini',
}

const DEVA2: Record<string, RashiName> = {
  हे: 'Cancer',
  टो: 'Virgo',
  भो: 'Capricorn',
  गु: 'Aquarius',
  दि: 'Pisces',
  ये: 'Sagittarius',
}

const LATIN: Record<string, RashiName> = {
  a: 'Aries',
  l: 'Aries',
  i: 'Aries',
  b: 'Taurus',
  v: 'Taurus',
  u: 'Taurus',
  e: 'Taurus',
  w: 'Taurus',
  o: 'Taurus',
  c: 'Gemini',
  k: 'Gemini',
  g: 'Capricorn',
  h: 'Gemini',
  d: 'Cancer',
  m: 'Leo',
  t: 'Libra',
  p: 'Virgo',
  n: 'Scorpio',
  f: 'Sagittarius',
  j: 'Capricorn',
  x: 'Capricorn',
  z: 'Capricorn',
  s: 'Aquarius',
  q: 'Gemini',
  r: 'Libra',
  y: 'Scorpio',
}

export const RASHI_TO_SIGN_KEY: Record<RashiName, string> = {
  Aries: 'aries',
  Taurus: 'taurus',
  Gemini: 'gemini',
  Cancer: 'cancer',
  Leo: 'leo',
  Virgo: 'virgo',
  Libra: 'libra',
  Scorpio: 'scorpio',
  Sagittarius: 'sagittarius',
  Capricorn: 'capricorn',
  Aquarius: 'aquarius',
  Pisces: 'pisces',
}

/** Name-based rashi (same logic as mobile app). */
export function naamRashi(name?: string | null): RashiName | null {
  const raw = String(name || '').trim()
  if (!raw) return null
  const word = raw.replace(/^[\s\d'".,@#()_\-]+/, '') || raw
  if (!word) return null
  const two = word.slice(0, 2)
  if (DEVA2[two]) return DEVA2[two]
  const first = word[0]
  if (DEVA[first]) return DEVA[first]
  const lc = first.toLowerCase()
  if (LATIN[lc]) return LATIN[lc]
  return null
}
