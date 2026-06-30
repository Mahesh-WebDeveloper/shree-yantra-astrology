// Naam-akshar → Rashi (name-based moon sign, the traditional "rashi by name" method
// used by Dainik Bhaskar / AstroSage). The first syllable of a person's name maps to a
// rashi. Returns an English sign name ("Aries".."Pisces") so it slots straight into the
// existing ZodiacIcon / rashiImage / horoscope sign lookups, or null if it can't be mapped.
//
// Table (per the client's Dainik Bhaskar reference):
//  मेष/Aries        अ, ल, इ
//  वृष/Taurus       ब, व, उ, ए
//  मिथुन/Gemini     क, छ, घ, ह
//  कर्क/Cancer      ड, ह(े)
//  सिंह/Leo         म, ट
//  कन्या/Virgo      प, ठ, ण
//  तुला/Libra       र, त
//  वृश्चिक/Scorpio  न, य
//  धनु/Sagittarius  य(े), ध, फ, भ
//  मकर/Capricorn    भ(ो), ज, ख, ग
//  कुंभ/Aquarius    ग(ु), स, श, ष, द
//  मीन/Pisces       द(ि), च, झ, थ

export type RashiName =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

// Devanagari first-letter (base consonant / vowel) → rashi.
// Where a letter is shared across two rashis in the folk table (ह, ट, भ, ग, द, य) we keep
// the PRIMARY/base assignment; the matra-specific exceptions (हे, टो, भो, गु, दि, ये) are
// handled by the two-character check below.
const DEVA: Record<string, RashiName> = {
  अ: 'Aries', आ: 'Aries', इ: 'Aries', ई: 'Aries', ल: 'Aries',
  ब: 'Taurus', भ: 'Sagittarius', व: 'Taurus', उ: 'Taurus', ऊ: 'Taurus', ए: 'Taurus', ऐ: 'Taurus', ओ: 'Taurus', औ: 'Taurus',
  क: 'Gemini', ख: 'Capricorn', ग: 'Capricorn', घ: 'Gemini', च: 'Pisces', छ: 'Gemini',
  ज: 'Capricorn', झ: 'Pisces', ट: 'Leo', ठ: 'Virgo', ड: 'Cancer', ढ: 'Cancer', ण: 'Virgo',
  त: 'Libra', थ: 'Pisces', द: 'Aquarius', ध: 'Sagittarius', न: 'Scorpio',
  प: 'Virgo', फ: 'Sagittarius', म: 'Leo', य: 'Scorpio', र: 'Libra',
  स: 'Aquarius', श: 'Aquarius', ष: 'Aquarius', ह: 'Gemini',
};

// First TWO Devanagari chars (consonant + matra) for the folk-table exceptions.
const DEVA2: Record<string, RashiName> = {
  'हे': 'Cancer', 'टो': 'Virgo', 'भो': 'Capricorn', 'गु': 'Aquarius', 'दि': 'Pisces', 'ये': 'Sagittarius',
};

// Latin first-letter → rashi (best-effort; Latin can't distinguish ड/द, ट/त etc., so we
// pick the most common transliteration). The unambiguous, frequently-asked ones (M→Leo,
// A→Aries, R→Libra, S→Aquarius, P→Virgo, B→Taurus) are correct.
const LATIN: Record<string, RashiName> = {
  a: 'Aries', l: 'Aries', i: 'Aries',
  b: 'Taurus', v: 'Taurus', u: 'Taurus', e: 'Taurus', w: 'Taurus', o: 'Taurus',
  c: 'Gemini', k: 'Gemini', g: 'Capricorn', h: 'Gemini',
  d: 'Cancer', m: 'Leo', t: 'Libra', p: 'Virgo', n: 'Scorpio',
  f: 'Sagittarius', j: 'Capricorn', x: 'Capricorn', z: 'Capricorn',
  s: 'Aquarius', q: 'Gemini', r: 'Libra', y: 'Scorpio',
};

/** Map a person's name to their naam-rashi (English sign name), or null if unknown. */
export function naamRashi(name?: string | null): RashiName | null {
  const raw = String(name || '').trim();
  if (!raw) return null;
  // strip common leading punctuation/digits/whitespace (Hermes-safe, no \p{L})
  const word = raw.replace(/^[\s\d'".,@#()_\-]+/, '') || raw;
  if (!word) return null;

  // Devanagari: try a two-char (consonant+matra) exception first, then the base letter
  const two = word.slice(0, 2);
  if (DEVA2[two]) return DEVA2[two];
  const first = word[0];
  if (DEVA[first]) return DEVA[first];

  // Latin
  const lc = first.toLowerCase();
  if (LATIN[lc]) return LATIN[lc];

  return null;
}
