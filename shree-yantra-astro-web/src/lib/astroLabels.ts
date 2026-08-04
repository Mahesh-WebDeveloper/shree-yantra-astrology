/** Hindi labels for kundli rows — same maps as mobile `i18n/astro.ts` (trimmed). */
export type AstroLang = 'en' | 'hi'

const normalizeTerm = (name: string) =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\d+[A-Z]?$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

const pick = (map: Record<string, string>, name: string | undefined, lang: AstroLang) => {
  if (!name) return name || ''
  if (lang !== 'hi') return name
  const clean = normalizeTerm(name)
  const foundKey = Object.keys(map).find((key) => key.toLowerCase() === clean.toLowerCase())
  return map[name] || map[name.trim()] || map[clean] || (foundKey ? map[foundKey] : name)
}

const TAG: Record<string, string> = {
  Auspicious: 'शुभ',
  Neutral: 'सामान्य',
  Inauspicious: 'अशुभ',
  Good: 'अच्छा',
  Bad: 'अशुभ',
  Active: 'सक्रिय',
  Upcoming: 'आगामी',
  Present: 'मौजूद',
  Clear: 'मुक्त',
  Strong: 'प्रबल',
  Forming: 'बन रहा है',
  Favourable: 'अनुकूल',
  Favorable: 'अनुकूल',
  Watch: 'ध्यान दें',
  Low: 'कम',
  Exalted: 'उच्च',
  Debilitated: 'नीच',
  'Own Sign': 'स्वराशि',
  Friendly: 'मित्र राशि',
  Running: 'चल रही है',
}

const PLANET: Record<string, string> = {
  Sun: 'सूर्य',
  Moon: 'चंद्र',
  Mars: 'मंगल',
  Mercury: 'बुध',
  Jupiter: 'गुरु',
  Venus: 'शुक्र',
  Saturn: 'शनि',
  Rahu: 'राहु',
  Ketu: 'केतु',
  Ascendant: 'लग्न',
  Lagna: 'लग्न',
}

const SIGN: Record<string, string> = {
  Aries: 'मेष',
  Taurus: 'वृषभ',
  Gemini: 'मिथुन',
  Cancer: 'कर्क',
  Leo: 'सिंह',
  Virgo: 'कन्या',
  Libra: 'तुला',
  Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु',
  Capricorn: 'मकर',
  Aquarius: 'कुंभ',
  Pisces: 'मीन',
}

const NAKSHATRA: Record<string, string> = {
  Ashwini: 'अश्विनी',
  Bharani: 'भरणी',
  Krittika: 'कृत्तिका',
  Rohini: 'रोहिणी',
  Mrigashira: 'मृगशीर्ष',
  Mrigashirsha: 'मृगशीर्ष',
  Ardra: 'आर्द्रा',
  Punarvasu: 'पुनर्वसु',
  Pushya: 'पुष्य',
  Ashlesha: 'आश्लेषा',
  Magha: 'मघा',
  'Purva Phalguni': 'पूर्वा फाल्गुनी',
  'Uttara Phalguni': 'उत्तरा फाल्गुनी',
  Hasta: 'हस्त',
  Chitra: 'चित्रा',
  Swati: 'स्वाती',
  Vishakha: 'विशाखा',
  Anuradha: 'अनुराधा',
  Jyeshtha: 'ज्येष्ठा',
  Mula: 'मूल',
  'Purva Ashadha': 'पूर्वाषाढ़ा',
  'Uttara Ashadha': 'उत्तराषाढ़ा',
  Shravana: 'श्रवण',
  Dhanishta: 'धनिष्ठा',
  Shatabhisha: 'शतभिषा',
  'Purva Bhadrapada': 'पूर्व भाद्रपद',
  'Uttara Bhadrapada': 'उत्तर भाद्रपद',
  Revati: 'रेवती',
  Aswini: 'अश्विनी',
  Mrigasira: 'मृगशीर्ष',
  Aridra: 'आर्द्रा',
  Pushyami: 'पुष्य',
  Aslesha: 'आश्लेषा',
  Makha: 'मघा',
  Pubba: 'पूर्वा फाल्गुनी',
  Uttara: 'उत्तरा फाल्गुनी',
  Chitta: 'चित्रा',
  Swathi: 'स्वाती',
  Vishhaka: 'विशाखा',
  Jyesta: 'ज्येष्ठा',
  Poorvashada: 'पूर्वाषाढ़ा',
  Uttarashada: 'उत्तराषाढ़ा',
  Sravana: 'श्रवण',
  Satabhisha: 'शतभिषा',
  Poorvabhadra: 'पूर्व भाद्रपद',
  Uttarabhadra: 'उत्तर भाद्रपद',
  Revathi: 'रेवती',
}

const DOSHA: Record<string, string> = {
  'Mangal Dosha': 'मंगल दोष',
  'Kaal Sarp Dosha': 'काल सर्प दोष',
  'Sade Sati': 'साढ़े साती',
}

const PHRASE: Record<string, string> = {
  'Mars not in dosha houses': 'मंगल दोष भावों में नहीं है',
  'Not formed in your chart': 'आपकी कुंडली में नहीं बना',
  'Present in your chart': 'आपकी कुंडली में मौजूद है',
  'Beneficial yoga present in your chart': 'आपकी कुंडली में शुभ योग मौजूद है',
}

const CHOG_PERIOD: Record<string, string> = {
  Amrit: 'अमृत',
  Shubh: 'शुभ',
  Labh: 'लाभ',
  Char: 'चर',
  Udveg: 'उद्वेग',
  Kaal: 'काल',
  Rog: 'रोग',
}

const CHOG_PERIOD_DESC: Record<string, string> = {
  Amrit: 'सबसे शुभ समय — किसी भी पवित्र या महत्वपूर्ण कार्य के लिए उत्तम।',
  Shubh: 'पूजा, नए कार्यों और शुभ कामों के लिए उत्कृष्ट।',
  Labh: 'व्यापार, लेन-देन, सौदे और खरीदारी के लिए अच्छा समय।',
  Char: 'चलायमान समय — यात्रा और जल्दी के कामों के लिए उपयुक्त।',
  Udveg: 'नए कार्यों से बचें — केवल सामान्य कामों के लिए ठीक।',
  Kaal: 'अशुभ समय — महत्वपूर्ण शुरुआत टाल दें।',
  Rog: 'विवाद और रोग से जुड़ा — मुख्य कार्यों से बचें।',
}

const CHOG_BLURB: Record<string, string> = {
  Amrit: 'अत्यंत शुभ समय',
  Shubh: 'महत्वपूर्ण कार्यों के लिए',
  Labh: 'धन-संबंधी कार्यों के लिए',
}

const CHOG_ACTIVITY: Record<string, string> = {
  business: 'व्यापार / सौदा',
  buying: 'नई वस्तुएँ खरीदना',
  gold: 'सोना / आभूषण खरीद',
  vehicle: 'वाहन खरीद',
  money: 'धन हस्तांतरण',
  travel: 'यात्रा',
  social: 'सोशल मीडिया पोस्ट',
  interview: 'इंटरव्यू / मीटिंग',
  worship: 'पूजा / प्रार्थना',
}

export const aTag = (n: string | undefined, lang: AstroLang) => pick(TAG, n, lang)
export const aPeriod = (n: string | undefined, lang: AstroLang) => pick(CHOG_PERIOD, n, lang)
export const aPeriodDesc = (n: string | undefined, lang: AstroLang) =>
  lang === 'hi' && n && CHOG_PERIOD_DESC[n] ? CHOG_PERIOD_DESC[n] : ''
export const aBlurb = (n: string | undefined, lang: AstroLang) => pick(CHOG_BLURB, n, lang)
export const aActivity = (id: string, lang: AstroLang, fallback: string) =>
  lang === 'hi' ? CHOG_ACTIVITY[id] || fallback : fallback
export const aPlanet = (n: string | undefined, lang: AstroLang) => pick(PLANET, n, lang)
export const aSign = (n: string | undefined, lang: AstroLang) => pick(SIGN, n, lang)
export const aNakshatra = (n: string | undefined, lang: AstroLang) => pick(NAKSHATRA, n, lang)
export const aDosha = (n: string | undefined, lang: AstroLang) => pick(DOSHA, n, lang)
export const aPhrase = (n: string | undefined, lang: AstroLang) => pick(PHRASE, n, lang)

export const aYoga = (n: string | undefined, lang: AstroLang) => {
  if (!n) return n || ''
  if (lang !== 'hi') return normalizeTerm(n)
  return normalizeTerm(n)
}

export const aYogaDetail = (n: string | undefined, lang: AstroLang) => {
  if (!n) return n || ''
  if (lang !== 'hi') return n
  const t = pick(PHRASE, n, lang)
  return t === n ? 'इस योग से कुंडली में शुभ प्रभाव के संकेत मिलते हैं।' : t
}

export const aAstroText = (text: string | undefined, lang: AstroLang) => {
  const clean = String(text || '').trim()
  if (lang !== 'hi' || !clean) return clean
  let out = clean
  const maps = [SIGN, PLANET, NAKSHATRA, TAG, DOSHA, PHRASE]
  for (const map of maps) {
    for (const key of Object.keys(map).sort((a, b) => b.length - a.length)) {
      out = out.replace(new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), map[key])
    }
  }
  return out
}
