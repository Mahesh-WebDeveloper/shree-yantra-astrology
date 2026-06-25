/**
 * Astrology terms — English ↔ Hindi (Devanagari).
 * VedAstro/constants se English naam aate hain; Hindi mode me ye Devanagari me dikhte hain.
 * Har function (name, lang) leta hai; map me na ho to original return karta hai.
 */
import { Lang } from './strings';

const pick = (map: Record<string, string>, name: string | undefined, lang: Lang) => {
  if (!name) return name || '';
  if (lang !== 'hi') return name;
  return map[name] || map[name.trim()] || name;
};

// Choghadiya periods
const PERIOD: Record<string, string> = {
  Amrit: 'अमृत', Shubh: 'शुभ', Labh: 'लाभ', Char: 'चर', Udveg: 'उद्वेग', Kaal: 'काल', Rog: 'रोग',
};
// Quality / tag
const TAG: Record<string, string> = {
  Auspicious: 'शुभ', Neutral: 'सामान्य', Inauspicious: 'अशुभ',
  Good: 'अच्छा', Bad: 'अशुभ', Active: 'सक्रिय', Upcoming: 'आगामी', Present: 'मौजूद', Clear: 'मुक्त',
};
// Planets
const PLANET: Record<string, string> = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु',
  Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु', Ascendant: 'लग्न', Lagna: 'लग्न',
};
// Rashi (signs)
const SIGN: Record<string, string> = {
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह', Virgo: 'कन्या',
  Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};
// Choghadiya period descriptions
const PERIOD_DESC: Record<string, string> = {
  Amrit: 'सबसे शुभ समय — किसी भी पवित्र या महत्वपूर्ण कार्य के लिए उत्तम।',
  Shubh: 'पूजा, नए कार्यों और शुभ कामों के लिए उत्कृष्ट।',
  Labh: 'व्यापार, लेन-देन, सौदे और खरीदारी के लिए अच्छा समय।',
  Char: 'चलायमान समय — यात्रा और जल्दी के कामों के लिए उपयुक्त।',
  Udveg: 'नए कार्यों से बचें — केवल सामान्य कामों के लिए ठीक।',
  Kaal: 'अशुभ समय — महत्वपूर्ण शुरुआत टाल दें।',
  Rog: 'विवाद और रोग से जुड़ा — मुख्य कार्यों से बचें।',
};
const BLURB: Record<string, string> = {
  Amrit: 'अत्यंत शुभ समय', Shubh: 'महत्वपूर्ण कार्यों के लिए', Labh: 'धन-संबंधी कार्यों के लिए',
};
// Activity card titles (id → hi)
const ACTIVITY: Record<string, string> = {
  business: 'व्यापार / सौदा', buying: 'नई वस्तुएँ खरीदना', gold: 'सोना / आभूषण खरीद',
  vehicle: 'वाहन खरीद', money: 'धन हस्तांतरण', travel: 'यात्रा', social: 'सोशल मीडिया पोस्ट',
  interview: 'इंटरव्यू / मीटिंग', worship: 'पूजा / प्रार्थना',
};

export const aPeriod = (n: string | undefined, lang: Lang) => pick(PERIOD, n, lang);
export const aTag = (n: string | undefined, lang: Lang) => pick(TAG, n, lang);
export const aPlanet = (n: string | undefined, lang: Lang) => pick(PLANET, n, lang);
export const aSign = (n: string | undefined, lang: Lang) => pick(SIGN, n, lang);
export const aPeriodDesc = (n: string | undefined, lang: Lang) => (lang === 'hi' && n && PERIOD_DESC[n] ? PERIOD_DESC[n] : '');
export const aBlurb = (n: string | undefined, lang: Lang) => pick(BLURB, n, lang);
export const aActivity = (id: string, lang: Lang, fallback: string) => (lang === 'hi' && ACTIVITY[id] ? ACTIVITY[id] : fallback);

// Ramayana kanda names
const KANDA: Record<string, string> = {
  'Bala Kanda': 'बालकांड', 'Ayodhya Kanda': 'अयोध्याकांड', 'Aranya Kanda': 'अरण्यकांड',
  'Kishkindha Kanda': 'किष्किंधाकांड', 'Sundara Kanda': 'सुंदरकांड', 'Yuddha Kanda': 'युद्धकांड',
  'Uttara Kanda': 'उत्तरकांड',
};
export const aKanda = (n: string | undefined, lang: Lang) => pick(KANDA, n, lang);

// Hindi date format: "18 जून 2026, गुरुवार"
const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'];
const WDAY_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
export const aDateHi = (d: Date) => `${d.getDate()} ${MON_HI[d.getMonth()]} ${d.getFullYear()}, ${WDAY_HI[d.getDay()]}`;
