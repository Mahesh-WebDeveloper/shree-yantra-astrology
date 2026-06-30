/**
 * Astrology terms — English ↔ Hindi (Devanagari).
 * VedAstro/constants se English naam aate hain; Hindi mode me ye Devanagari me dikhte hain.
 * Har function (name, lang) leta hai; map me na ho to original return karta hai.
 */
import { Lang } from './strings';

const normalizeTerm = (name: string) => name
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\d+[A-Z]?$/i, '')
  .replace(/\s+/g, ' ')
  .trim();

const pick = (map: Record<string, string>, name: string | undefined, lang: Lang) => {
  if (!name) return name || '';
  if (lang !== 'hi') return name;
  const clean = normalizeTerm(name);
  const foundKey = Object.keys(map).find((key) => key.toLowerCase() === clean.toLowerCase());
  return map[name] || map[name.trim()] || map[clean] || (foundKey ? map[foundKey] : name);
};

const YOGA_WORD_HI: Record<string, string> = {
  Gaja: 'गज', Gaj: 'गज', Kesari: 'केसरी', Gajakesari: 'गज केसरी',
  Budhaditya: 'बुधादित्य', Budha: 'बुध', Aditya: 'आदित्य',
  Raj: 'राज', Raja: 'राज', Dhana: 'धन', Sunapha: 'सुनफा',
  Anapha: 'अनफा', Durudhara: 'दुरुधरा', Chandra: 'चंद्र',
  Mangal: 'मंगल', Vipreet: 'विपरीत', Viparita: 'विपरीत',
  Neecha: 'नीच', Bhanga: 'भंग', Ruchaka: 'रुचक',
  Bhadra: 'भद्र', Hamsa: 'हंस', Malavya: 'मालव्य',
  Sasa: 'शश', Sasha: 'शश', Kemadruma: 'केमद्रुम',
  Kendra: 'केंद्र', Trikona: 'त्रिकोण', Panch: 'पंच',
  Mahapurush: 'महापुरुष', Mahapurusha: 'महापुरुष',
  Lakshmi: 'लक्ष्मी', Yoga: 'योग',
};

const yogaFallbackHi = (name: string | undefined) => {
  const clean = normalizeTerm(name || '').replace(/\bYoga\b/i, '').trim();
  if (!clean) return 'योग';
  const translated = clean
    .split(/\s+/)
    .map((word) => YOGA_WORD_HI[word] || YOGA_WORD_HI[word.replace(/[^A-Za-z]/g, '')] || word)
    .join(' ')
    .trim();
  return translated.endsWith('योग') ? translated : translated + ' योग';
};

const yogaDetailFallbackHi = 'इस योग से कुंडली में शुभ प्रभाव, क्षमता और सकारात्मक परिणाम के संकेत मिलते हैं।';

// Choghadiya periods
const PERIOD: Record<string, string> = {
  Amrit: 'अमृत', Shubh: 'शुभ', Labh: 'लाभ', Char: 'चर', Udveg: 'उद्वेग', Kaal: 'काल', Rog: 'रोग',
};
// Quality / tag
const TAG: Record<string, string> = {
  Auspicious: 'शुभ', Neutral: 'सामान्य', Inauspicious: 'अशुभ',
  Good: 'अच्छा', Bad: 'अशुभ', Active: 'सक्रिय', Upcoming: 'आगामी', Present: 'मौजूद', Clear: 'मुक्त',
  Strong: 'प्रबल', Forming: 'बन रहा है', Favourable: 'अनुकूल', Favorable: 'अनुकूल', Watch: 'ध्यान दें', Low: 'कम',
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

// Kundli doshas
const DOSHA: Record<string, string> = {
  'Mangal Dosha': 'मंगल दोष', 'Manglik Dosha': 'मांगलिक दोष', 'Kaal Sarp Dosha': 'काल सर्प दोष',
  'Kaal Sarpa Dosha': 'काल सर्प दोष', 'Sade Sati': 'साढ़े साती', 'Shani Dhaiya': 'शनि ढैय्या',
  'Pitra Dosha': 'पितृ दोष', 'Pitru Dosha': 'पितृ दोष', 'Guru Chandal Dosha': 'गुरु चांडाल दोष',
  'Grahan Dosha': 'ग्रहण दोष', 'Kemadruma Dosha': 'केमद्रुम दोष', 'Angarak Dosha': 'अंगारक दोष',
  'Shrapit Dosha': 'श्रापित दोष', 'Nadi Dosha': 'नाड़ी दोष',
};
// Kundli yogas (raja/dhana/mahapurusha etc.)
const YOGA: Record<string, string> = {
  'Gaj Kesari Yoga': 'गज केसरी योग', 'Gajakesari Yoga': 'गज केसरी योग', 'Budhaditya Yoga': 'बुधादित्य योग',
  'Raj Yoga': 'राज योग', 'Raja Yoga': 'राज योग', 'Dhana Yoga': 'धन योग', 'Sunapha Yoga': 'सुनफा योग',
  'Anapha Yoga': 'अनफा योग', 'Durudhara Yoga': 'दुरुधरा योग', 'Chandra Mangal Yoga': 'चंद्र-मंगल योग',
  'Vipreet Raj Yoga': 'विपरीत राज योग', 'Viparita Raja Yoga': 'विपरीत राज योग',
  'Neecha Bhanga Raja Yoga': 'नीच भंग राज योग', 'Ruchaka Yoga': 'रुचक योग', 'Bhadra Yoga': 'भद्र योग',
  'Hamsa Yoga': 'हंस योग', 'Malavya Yoga': 'मालव्य योग', 'Sasa Yoga': 'शश योग', 'Sasha Yoga': 'शश योग',
  'Kemadruma Yoga': 'केमद्रुम योग', 'Kendra Trikona Raja Yoga': 'केंद्र त्रिकोण राज योग',
  'Panch Mahapurush Yoga': 'पंच महापुरुष योग', 'Lakshmi Yoga': 'लक्ष्मी योग',
};
// short standard phrases used in dosha/yoga detail + sources
const PHRASE: Record<string, string> = {
  'Mars not in dosha houses': 'मंगल दोष भावों में नहीं है', 'Not formed in your chart': 'आपकी कुंडली में नहीं बना',
  'Present in your chart': 'आपकी कुंडली में मौजूद है', 'Planetary positions': 'ग्रह स्थिति',
  'running now': 'अभी चल रही है', 'Beneficial yoga present in your chart': 'आपकी कुंडली में शुभ योग मौजूद है',
};

export const aDosha = (n: string | undefined, lang: Lang) => pick(DOSHA, n, lang);
export const aYoga = (n: string | undefined, lang: Lang) => {
  if (!n) return n || '';
  if (lang !== 'hi') return normalizeTerm(n);
  const translated = pick(YOGA, n, lang);
  return translated === n ? yogaFallbackHi(n) : translated;
};
export const aYogaDetail = (n: string | undefined, lang: Lang) => {
  if (!n) return n || '';
  if (lang !== 'hi') return n;
  const translated = pick(PHRASE, n, lang);
  return translated === n ? yogaDetailFallbackHi : translated;
};
export const aPhrase = (n: string | undefined, lang: Lang) => pick(PHRASE, n, lang);

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
