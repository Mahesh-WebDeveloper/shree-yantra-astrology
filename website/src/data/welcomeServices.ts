import type { VedicIconName } from '@/components/cosmic/VedicIcon'

/** Web routes + copy aligned with the Shree Yantra app. */

export type LightTint = readonly [string, string, string]

/** Light-mode card fills — parity with mobile WelcomeScreen `lightTint`. */
export const SERVICE_LIGHT_TINTS: Record<string, LightTint> = {
  kundli: ['#c7daf8', '#dce9fc', '#eef5ff'],
  rashifal: ['#e8cffc', '#f2e0ff', '#faf0ff'],
  horoscope: ['#e8cffc', '#f2e0ff', '#faf0ff'],
  panchang: ['#f5d998', '#fcecc4', '#fff8e8'],
  choghadiya: ['#a8e6c4', '#ccf3dc', '#e8faf0'],
  chog: ['#a8e6c4', '#ccf3dc', '#e8faf0'],
  muhurat: ['#f5cc7a', '#fde8a8', '#fff8dc'],
  milan: ['#f5b8cc', '#fddae8', '#fff0f6'],
  numerology: ['#d4c0f8', '#e8dcfc', '#f6f0ff'],
  vastu: ['#f0cc78', '#fce8b0', '#fff8e0'],
  baby: ['#9ddede', '#c8efef', '#e8fafa'],
  remedies: ['#ffc896', '#ffe0c0', '#fff4e8'],
  report: ['#f0cc78', '#fce8b0', '#fff8e8'],
  reading: ['#d8c4fc', '#eadcfc', '#f8f2ff'],
  shloka: ['#e0c8fc', '#f0e0ff', '#faf5ff'],
  step1: ['#b8d4fc', '#d8e8fc', '#eef5ff'],
  step2: ['#f0cc78', '#fce8b0', '#fff8e8'],
  step3: ['#98dcc0', '#c8eedc', '#e8faf2'],
}

export function serviceTintStyle(key: string, accent: string): Record<string, string> {
  const t = SERVICE_LIGHT_TINTS[key] ?? (['#ffffff', '#fafafa', '#ffffff'] as LightTint)
  return {
    '--svc-accent': accent,
    '--svc-tint-1': t[0],
    '--svc-tint-2': t[1],
    '--svc-tint-3': t[2],
  }
}

export interface ServiceItem {
  key: string
  route: string
  icon: VedicIconName
  accent: string // icon tint (works on dark + light)
  en: { title: string; sub: string }
  hi: { title: string; sub: string }
}

/** Four hero services for the primary bento. */
export const PRIMARY_SERVICES: (ServiceItem & { long: { en: string; hi: string } })[] = [
  {
    key: 'kundli',
    route: '/kundli',
    icon: 'kundli',
    accent: '#f6d27a',
    en: { title: 'Janam Kundli', sub: 'Birth chart & planetary positions' },
    hi: { title: 'जन्म कुंडली', sub: 'जन्म चार्ट और ग्रह-स्थिति' },
    long: {
      en: 'Your full birth chart with real graha positions, houses and divisional charts.',
      hi: 'सटीक ग्रह-स्थिति, भाव और वर्ग-चार्ट के साथ पूरी जन्म कुंडली।',
    },
  },
  {
    key: 'rashifal',
    route: '/my-rashifal',
    icon: 'rashifal',
    accent: '#e3b6f7',
    en: { title: 'My Rashifal', sub: 'Daily, weekly, monthly & yearly' },
    hi: { title: 'मेरा राशिफल', sub: 'दैनिक, साप्ताहिक, मासिक व वार्षिक' },
    long: {
      en: 'Personalised horoscope from your moon sign and current transits.',
      hi: 'आपकी राशि और वर्तमान गोचर से व्यक्तिगत राशिफल।',
    },
  },
  {
    key: 'panchang',
    route: '/panchang',
    icon: 'panchang',
    accent: '#f3cd7e',
    en: { title: 'Panchang & Choghadiya', sub: 'Tithi, nakshatra & shubh time' },
    hi: { title: 'पंचांग व चौघड़िया', sub: 'तिथि, नक्षत्र व शुभ समय' },
    long: {
      en: 'Daily panchang with tithi, nakshatra, sunrise/sunset and auspicious windows.',
      hi: 'तिथि, नक्षत्र, सूर्योदय/सूर्यास्त और शुभ मुहूर्त के साथ दैनिक पंचांग।',
    },
  },
  {
    key: 'milan',
    route: '/kundli-match',
    icon: 'milan',
    accent: '#f5a3ba',
    en: { title: 'Kundli Milan', sub: '36 guna marriage matching' },
    hi: { title: 'कुंडली मिलान', sub: 'विवाह हेतु 36 गुण मिलान' },
    long: {
      en: 'Ashtakoot 36-guna compatibility with mangal dosha and clear verdict.',
      hi: 'अष्टकूट 36 गुण मिलान, मंगल दोष सहित स्पष्ट परिणाम।',
    },
  },
]

/** Full services grid — clear icon, short title, one-line explanation. */
export const ALL_SERVICES: ServiceItem[] = [
  { key: 'rashifal', route: '/rashifal', icon: 'rashifal', accent: '#e3b6f7', en: { title: 'Daily Rashifal', sub: "Today's horoscope for your sign" }, hi: { title: 'दैनिक राशिफल', sub: 'आपकी राशि का आज का फल' } },
  { key: 'kundli', route: '/kundli', icon: 'kundli', accent: '#8fb4ff', en: { title: 'Kundli / Birth Chart', sub: 'Planets, houses & vargas' }, hi: { title: 'कुंडली', sub: 'ग्रह, भाव व वर्ग चार्ट' } },
  { key: 'panchang', route: '/panchang', icon: 'panchang', accent: '#f3cd7e', en: { title: 'Panchang', sub: 'Tithi, nakshatra & yoga' }, hi: { title: 'पंचांग', sub: 'तिथि, नक्षत्र व योग' } },
  { key: 'choghadiya', route: '/choghadiya', icon: 'choghadiya', accent: '#84e8b4', en: { title: 'Choghadiya', sub: 'Good time for any work' }, hi: { title: 'चौघड़िया', sub: 'किसी भी काम का शुभ समय' } },
  { key: 'muhurat', route: '/muhurat', icon: 'muhurat', accent: '#f6d27a', en: { title: 'Shubh Muhurat', sub: 'Best day & time for ceremonies' }, hi: { title: 'शुभ मुहूर्त', sub: 'शुभ कार्यों का दिन व समय' } },
  { key: 'milan', route: '/kundli-match', icon: 'milan', accent: '#f5a3ba', en: { title: 'Kundli Milan', sub: '36 guna matching' }, hi: { title: 'कुंडली मिलान', sub: '36 गुण मिलान' } },
  { key: 'numerology', route: '/numerology', icon: 'numerology', accent: '#cbb1f2', en: { title: 'Numerology', sub: 'Mulank, Bhagyank & Lo Shu' }, hi: { title: 'अंकशास्त्र', sub: 'मूलांक, भाग्यांक व लो-शु' } },
  { key: 'vastu', route: '/vastu', icon: 'vastu', accent: '#f0c65e', en: { title: 'Vastu Shastra', sub: 'Home audit & corrections' }, hi: { title: 'वास्तु शास्त्र', sub: 'घर का ऑडिट व सुधार' } },
  { key: 'baby', route: '/baby-names', icon: 'baby', accent: '#8ce0e0', en: { title: 'Baby Names', sub: 'Lucky names by nakshatra' }, hi: { title: 'नामकरण', sub: 'नक्षत्र अनुसार शुभ नाम' } },
  { key: 'remedies', route: '/remedies', icon: 'remedies', accent: '#f7b267', en: { title: 'Remedies', sub: 'Simple upaay for your chart' }, hi: { title: 'उपाय', sub: 'कुंडली अनुसार सरल उपाय' } },
  { key: 'report', route: '/brihat-kundli', icon: 'report', accent: '#e9b850', en: { title: 'Brihat Kundli PDF', sub: 'Detailed report to download' }, hi: { title: 'बृहत कुंडली PDF', sub: 'विस्तृत रिपोर्ट डाउनलोड' } },
  { key: 'reading', route: '/vedic-reading', icon: 'reading', accent: '#c9b8ff', en: { title: 'Vedic Reading', sub: 'Classical chart interpretation' }, hi: { title: 'वैदिक फलादेश', sub: 'शास्त्रीय कुंडली व्याख्या' } },
  { key: 'ai', route: '/ai-astrologer', icon: 'reading', accent: '#c9b8ff', en: { title: 'AI Astrologer', sub: 'Ask anything from your chart' }, hi: { title: 'AI ज्योतिषी', sub: 'कुंडली से प्रश्न पूछें' } },
  { key: 'library', route: '/library', icon: 'shloka', accent: '#e0c8fc', en: { title: 'Library', sub: 'Books & scriptures' }, hi: { title: 'पुस्तकालय', sub: 'पुस्तकें व ग्रंथ' } },
  { key: 'gita', route: '/gita', icon: 'shloka', accent: '#e0c8fc', en: { title: 'Bhagavad Gita', sub: '18 chapters with AI explain' }, hi: { title: 'भगवद् गीता', sub: '18 अध्याय' } },
  { key: 'janam', route: '/janam-patri', icon: 'kundli', accent: '#8fb4ff', en: { title: 'Janam Patri', sub: 'Report + naamkaran' }, hi: { title: 'जन्म पत्री', sub: 'रिपोर्ट + नामकरण' } },
  { key: 'shloka', route: '/daily-shloka', icon: 'shloka', accent: '#e0c8fc', en: { title: 'Daily Shloka', sub: 'Today’s verse + AI' }, hi: { title: 'दैनिक श्लोक', sub: 'आज का श्लोक' } },
]

export const SIGN_GLYPH: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
}

export const SIGN_LABEL: Record<string, { en: string; hi: string }> = {
  aries: { en: 'Aries', hi: 'मेष' },
  taurus: { en: 'Taurus', hi: 'वृषभ' },
  gemini: { en: 'Gemini', hi: 'मिथुन' },
  cancer: { en: 'Cancer', hi: 'कर्क' },
  leo: { en: 'Leo', hi: 'सिंह' },
  virgo: { en: 'Virgo', hi: 'कन्या' },
  libra: { en: 'Libra', hi: 'तुला' },
  scorpio: { en: 'Scorpio', hi: 'वृश्चिक' },
  sagittarius: { en: 'Sagittarius', hi: 'धनु' },
  capricorn: { en: 'Capricorn', hi: 'मकर' },
  aquarius: { en: 'Aquarius', hi: 'कुम्भ' },
  pisces: { en: 'Pisces', hi: 'मीन' },
}
