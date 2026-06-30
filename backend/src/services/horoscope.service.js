const AiCache = require('../models/AiCache');
const { getPanchang } = require('./vedastro.service');
const ai = require('./ai.service');

const SIGNS = [
  { key: 'aries', name: 'Aries', hi: 'मेष', element: 'Fire', lord: 'Mars', dates: 'Mar 21 - Apr 19' },
  { key: 'taurus', name: 'Taurus', hi: 'वृषभ', element: 'Earth', lord: 'Venus', dates: 'Apr 20 - May 20' },
  { key: 'gemini', name: 'Gemini', hi: 'मिथुन', element: 'Air', lord: 'Mercury', dates: 'May 21 - Jun 20' },
  { key: 'cancer', name: 'Cancer', hi: 'कर्क', element: 'Water', lord: 'Moon', dates: 'Jun 21 - Jul 22' },
  { key: 'leo', name: 'Leo', hi: 'सिंह', element: 'Fire', lord: 'Sun', dates: 'Jul 23 - Aug 22' },
  { key: 'virgo', name: 'Virgo', hi: 'कन्या', element: 'Earth', lord: 'Mercury', dates: 'Aug 23 - Sep 22' },
  { key: 'libra', name: 'Libra', hi: 'तुला', element: 'Air', lord: 'Venus', dates: 'Sep 23 - Oct 22' },
  { key: 'scorpio', name: 'Scorpio', hi: 'वृश्चिक', element: 'Water', lord: 'Mars', dates: 'Oct 23 - Nov 21' },
  { key: 'sagittarius', name: 'Sagittarius', hi: 'धनु', element: 'Fire', lord: 'Jupiter', dates: 'Nov 22 - Dec 21' },
  { key: 'capricorn', name: 'Capricorn', hi: 'मकर', element: 'Earth', lord: 'Saturn', dates: 'Dec 22 - Jan 19' },
  { key: 'aquarius', name: 'Aquarius', hi: 'कुंभ', element: 'Air', lord: 'Saturn', dates: 'Jan 20 - Feb 18' },
  { key: 'pisces', name: 'Pisces', hi: 'मीन', element: 'Water', lord: 'Jupiter', dates: 'Feb 19 - Mar 20' },
];

const SIGN_INDEX = SIGNS.reduce((acc, s, i) => { acc[s.name] = i; return acc; }, {});
const DEFAULT_PLACE = { place: 'Ujjain', lat: 23.1765, lng: 75.7885, tz: '+05:30' };
const PERIODS = new Set(['daily', 'weekly', 'monthly', 'yearly']);

const pad2 = (n) => (n < 10 ? '0' : '') + n;
const todayDmy = () => {
  const n = new Date();
  return `${pad2(n.getDate())}/${pad2(n.getMonth() + 1)}/${n.getFullYear()}`;
};
const normPeriod = (p) => (PERIODS.has(String(p || '').toLowerCase()) ? String(p).toLowerCase() : 'daily');
const langOf = (v) => (v === 'hi' ? 'hi' : 'en');
const houseFrom = (transitSign, natalSign) => {
  const t = SIGN_INDEX[transitSign];
  const n = SIGN_INDEX[natalSign];
  if (t == null || n == null) return null;
  return ((t - n + 12) % 12) + 1;
};
const clamp = (n, min = 42, max = 95) => Math.max(min, Math.min(max, Math.round(n)));

async function cached(cacheKey, producer) {
  const hit = await AiCache.findOne({ cacheKey });
  if (hit) return hit.data;
  const data = await producer();
  try { await AiCache.findOneAndUpdate({ cacheKey }, { cacheKey, type: 'horoscope', data }, { upsert: true }); } catch (_) {}
  return data;
}

function moonImpact(h) {
  if ([3, 6, 10, 11].includes(h)) return { score: 13, quality: 'strong', en: 'supportive for action and progress', hi: 'काम और प्रगति के लिए सहायक' };
  if ([1, 5, 9].includes(h)) return { score: 8, quality: 'good', en: 'good for confidence and clarity', hi: 'आत्मविश्वास और स्पष्टता के लिए अच्छा' };
  if ([2, 7].includes(h)) return { score: 4, quality: 'balanced', en: 'balanced but asks for careful speech', hi: 'संतुलित, पर वाणी में सावधानी चाहिए' };
  if ([4, 8, 12].includes(h)) return { score: -8, quality: 'caution', en: 'sensitive, so move slowly', hi: 'संवेदनशील, इसलिए धीरे और सोचकर चलें' };
  return { score: 0, quality: 'neutral', en: 'moderate and practical', hi: 'मध्यम और व्यावहारिक' };
}

function sunImpact(h) {
  if ([3, 6, 10, 11].includes(h)) return 7;
  if ([1, 5, 9].includes(h)) return 4;
  if ([4, 8, 12].includes(h)) return -5;
  return 1;
}

function periodLead(period, lang) {
  const en = {
    daily: 'Today',
    weekly: 'This week',
    monthly: 'This month',
    yearly: 'This year',
  };
  const hi = {
    daily: 'आज',
    weekly: 'इस सप्ताह',
    monthly: 'इस महीने',
    yearly: 'इस वर्ष',
  };
  return (lang === 'hi' ? hi : en)[period] || en.daily;
}

function elementAdvice(element, lang) {
  const en = {
    Fire: 'Use energy with direction, not impatience.',
    Earth: 'Choose practical steps and avoid overthinking.',
    Air: 'Communicate clearly and verify details.',
    Water: 'Keep emotions steady before deciding.',
  };
  const hi = {
    Fire: 'ऊर्जा को दिशा दें, जल्दबाजी में न लगाएं।',
    Earth: 'व्यावहारिक कदम लें और अधिक सोचने से बचें।',
    Air: 'बात साफ रखें और विवरण जांच लें।',
    Water: 'निर्णय से पहले मन को स्थिर रखें।',
  };
  return (lang === 'hi' ? hi : en)[element];
}

function lordMantra(lord, lang) {
  const en = {
    Sun: { text: 'Om Suryaya Namah', count: '11 times' },
    Moon: { text: 'Om Somaya Namah', count: '11 times' },
    Mars: { text: 'Om Mangalaya Namah', count: '11 times' },
    Mercury: { text: 'Om Budhaya Namah', count: '11 times' },
    Jupiter: { text: 'Om Gurave Namah', count: '11 times' },
    Venus: { text: 'Om Shukraya Namah', count: '11 times' },
    Saturn: { text: 'Om Sham Shanicharaya Namah', count: '11 times' },
  };
  const hi = {
    Sun: { text: 'ॐ सूर्याय नमः', count: '११ बार' },
    Moon: { text: 'ॐ सोमाय नमः', count: '११ बार' },
    Mars: { text: 'ॐ मंगलाय नमः', count: '११ बार' },
    Mercury: { text: 'ॐ बुधाय नमः', count: '११ बार' },
    Jupiter: { text: 'ॐ गुरवे नमः', count: '११ बार' },
    Venus: { text: 'ॐ शुक्राय नमः', count: '११ बार' },
    Saturn: { text: 'ॐ शं शनैश्चराय नमः', count: '११ बार' },
  };
  return (lang === 'hi' ? hi : en)[lord] || en.Sun;
}

function luckyColor(sign) {
  const byLord = {
    Sun: 'Gold',
    Moon: 'White',
    Mars: 'Red',
    Mercury: 'Green',
    Jupiter: 'Yellow',
    Venus: 'Pink',
    Saturn: 'Blue',
  };
  return byLord[sign.lord] || 'Gold';
}

// Period-specific content so weekly/monthly/yearly are genuinely RICHER and DIFFERENT
// from the daily card (earlier only the lead word changed). Plain, beginner-friendly.
function periodPack(period, lang) {
  const HI = {
    daily: { span: 'आज', plain: 'आज की सरल बात: काम सोच-समझकर करें, जल्दबाज़ी न करें, और शुभ समय देखकर शुरुआत करें।', outlook: '', areaTail: '', doExtra: [], avoidExtra: [], remedyWhen: 'आज' },
    weekly: { span: 'इस सप्ताह', plain: 'इस सप्ताह (यानी आने वाले 7 दिन) की सरल सलाह: शुरुआती दिन योजना बनाने के लिए अच्छे हैं, बीच के दिन मेहनत और बातचीत के लिए, और अंत के दिन ज़रूरी काम पूरे करने के लिए। सब एक साथ करने की बजाय काम बाँटकर करें।', outlook: 'पूरे सप्ताह ग्रहों की चाल रोज़ थोड़ी-थोड़ी बदलती है, इसलिए हर दिन एक जैसा नहीं रहेगा — कुछ दिन तेज़ी के और कुछ दिन आराम व सोच-विचार के रहेंगे।', areaTail: ' इस पूरे सप्ताह इसी दिशा में छोटे-छोटे कदम उठाते रहें।', doExtra: ['सप्ताह की शुरुआत में पूरे हफ्ते की एक छोटी योजना बना लें'], avoidExtra: ['पूरे हफ्ते का काम किसी एक ही दिन में निपटाने की कोशिश'], remedyWhen: 'इस सप्ताह रोज़' },
    monthly: { span: 'इस महीने', plain: 'इस महीने की सरल सलाह: महीने को तीन हिस्सों में बाँटकर देखें — शुरुआत (नई शुरुआत व योजना), मध्य (मेहनत व प्रगति), और अंत (परिणाम व समेटना)। बड़े बदलाव एक ही दिन में नहीं, धीरे-धीरे आएँगे, इसलिए धैर्य रखें।', outlook: 'महीने भर में सूर्य और दूसरे ग्रह राशि बदलते हैं, जिससे अलग-अलग समय पर जीवन के अलग हिस्से (जैसे काम, धन, रिश्ते) ज़्यादा सक्रिय रहेंगे — हर सप्ताह का अपना रंग होगा।', areaTail: ' इस महीने इस क्षेत्र पर लगातार ध्यान देने से अच्छा परिणाम बन सकता है।', doExtra: ['महीने की शुरुआत में 2-3 मुख्य लक्ष्य तय करें', 'महीने के बीच में अपनी प्रगति की एक बार समीक्षा करें'], avoidExtra: ['पूरा महीना टालमटोल करके अंत में जल्दबाज़ी करना'], remedyWhen: 'इस महीने नियमित' },
    yearly: { span: 'इस वर्ष', plain: 'इस वर्ष की सरल सलाह: यह पूरे साल की बड़ी तस्वीर है। साल को चार तिमाहियों/मौसमों में बाँटकर देखें — हर तिमाही में जीवन का कोई एक हिस्सा (करियर, रिश्ते, सेहत, धन) ज़्यादा महत्वपूर्ण रहेगा। बड़े फैसले सोच-समझकर और सही समय देखकर लें।', outlook: 'साल भर में बड़े ग्रह (जैसे गुरु/बृहस्पति और शनि) राशि बदलते हैं और लंबे समय तक असर डालते हैं — यही आपके साल के मुख्य मोड़ (अवसर और सीख) तय करते हैं।', areaTail: ' इस वर्ष इस क्षेत्र में धीरे पर पक्की प्रगति की उम्मीद रखें।', doExtra: ['साल की शुरुआत में एक बड़ा लक्ष्य और कुछ छोटे कदम तय करें', 'हर 2-3 महीने में अपनी दिशा जाँचते रहें'], avoidExtra: ['पूरे साल का फैसला किसी एक बुरे दिन के मूड में लेना'], remedyWhen: 'इस वर्ष नियमित रूप से' },
  };
  const EN = {
    daily: { span: 'today', plain: 'In simple words for today: act thoughtfully, don’t rush, and start important things at a calm, auspicious time.', outlook: '', areaTail: '', doExtra: [], avoidExtra: [], remedyWhen: 'today' },
    weekly: { span: 'this week', plain: 'Simple guidance for the week (the next 7 days): the first days suit planning, the middle days suit effort and conversations, and the last days suit finishing pending work. Spread tasks out instead of doing everything at once.', outlook: 'Across the week the planets shift a little each day, so not every day will feel the same — some days bring speed, others are better for rest and reflection.', areaTail: ' Keep taking small steps in this direction through the week.', doExtra: ['Make a small week-long plan at the start of the week'], avoidExtra: ['Trying to clear the whole week’s load in a single day'], remedyWhen: 'daily this week' },
    monthly: { span: 'this month', plain: 'Simple guidance for the month: split it into three parts — start (fresh starts & planning), middle (effort & progress), and end (results & wrapping up). Big changes come gradually, not in a day, so stay patient.', outlook: 'Through the month the Sun and other planets change signs, so different areas (work, money, relationships) become more active at different times — each week will have its own flavour.', areaTail: ' Steady focus on this area through the month can bring a good result.', doExtra: ['Set 2-3 main goals at the start of the month', 'Review your progress once mid-month'], avoidExtra: ['Procrastinating all month and rushing at the end'], remedyWhen: 'regularly this month' },
    yearly: { span: 'this year', plain: 'Simple guidance for the year: this is the big-picture view. Split the year into four quarters/seasons — in each, one part of life (career, relationships, health, money) matters most. Take big decisions calmly and at the right time.', outlook: 'Through the year the big planets (like Jupiter and Saturn) change signs and act over long periods — these set the main turning points (opportunities and lessons) of your year.', areaTail: ' Expect slow but solid progress in this area this year.', doExtra: ['Set one big goal and a few small steps at the start of the year', 'Check your direction every 2-3 months'], avoidExtra: ['Deciding the whole year based on one bad day’s mood'], remedyWhen: 'regularly this year' },
  };
  const key = period === 'weekly' ? 'weekly' : period === 'monthly' ? 'monthly' : period === 'yearly' ? 'yearly' : 'daily';
  return (lang === 'hi' ? HI : EN)[key];
}

function buildSign(sign, panchang, period, lang) {
  const pk = periodPack(period, lang);
  const moonHouse = houseFrom(panchang.moon && panchang.moon.sign, sign.name);
  const sunHouse = houseFrom(panchang.sun && panchang.sun.sign, sign.name);
  const mi = moonImpact(moonHouse);
  const base = 66 + mi.score + sunImpact(sunHouse);
  const score = clamp(base);
  const love = clamp(score + ([2, 5, 7, 11].includes(moonHouse) ? 6 : -2));
  const career = clamp(score + ([3, 6, 10, 11].includes(moonHouse) ? 8 : 0));
  const finance = clamp(score + ([2, 6, 10, 11].includes(sunHouse) ? 6 : -1));
  const health = clamp(score + ([4, 8, 12].includes(moonHouse) ? -8 : 3));
  const lead = periodLead(period, lang);
  const displayName = lang === 'hi' ? sign.hi : sign.name;
  const tithi = panchang.tithi && `${panchang.tithi.paksha || ''} ${panchang.tithi.name || ''}`.trim();
  const nak = panchang.nakshatra && panchang.nakshatra.name;
  const mantra = lordMantra(sign.lord, lang);

  if (lang === 'hi') {
    return {
      ...sign,
      displayName,
      score,
      headline: `${displayName} के लिए ${mi.quality === 'caution' ? 'सावधानी और संतुलन' : 'अच्छा संकेत'}`,
      summary: `${lead} चंद्र गोचर आपकी राशि से ${moonHouse || '-'}वें भाव में है, जो ${mi.hi} है। ${tithi ? `${tithi} तिथि` : 'आज का पंचांग'} और ${nak ? `${nak} नक्षत्र` : 'चंद्र स्थिति'} को ध्यान में रखकर जरूरी काम शांत मन से करें। ${elementAdvice(sign.element, lang)}${pk.outlook ? ' ' + pk.outlook : ''}`,
      plainSummary: `${displayName} राशि के लिए — ${pk.plain}`,
      areas: [
        { key: 'love', title: 'रिश्ते', score: love, text: love >= 72 ? 'बातचीत मधुर रहेगी, पुराने मतभेद हल हो सकते हैं।' : 'रिश्तों में बात संभालकर रखें और प्रतिक्रिया देने से पहले सोचें।' },
        { key: 'career', title: 'काम', score: career, text: career >= 72 ? 'काम आगे बढ़ाने और निर्णय लेने के लिए समय उपयोगी है।' : 'काम में धैर्य रखें और अधूरे कार्य पहले पूरे करें।' },
        { key: 'finance', title: 'धन', score: finance, text: finance >= 72 ? 'योजना बनाकर लिया गया आर्थिक निर्णय लाभ दे सकता है।' : 'बड़े खर्च या जोखिम भरे निर्णय फिलहाल सोचकर लें।' },
        { key: 'health', title: 'स्वास्थ्य', score: health, text: health >= 72 ? 'ऊर्जा ठीक रहेगी, दिनचर्या बनाए रखें।' : 'आराम, पानी और भोजन पर ध्यान दें।' },
      ],
      doList: ['महत्वपूर्ण काम सुबह या शांत समय में करें', 'वाणी को मधुर रखें', 'छोटा दान या सेवा करें', ...pk.doExtra],
      avoidList: ['जल्दबाजी में निर्णय', 'बहस और कटु शब्द', 'अशुभ समय में नई शुरुआत', ...pk.avoidExtra],
      remedy: `अपने राशि स्वामी ${sign.lord} के लिए ${pk.remedyWhen} ${mantra.text} ${mantra.count} जप करें।`,
      mantra,
      luckyColor: luckyColor(sign),
      luckyNumber: ((SIGN_INDEX[sign.name] + moonHouse + 3) % 9) + 1,
      confidence: Math.min(0.92, Math.max(0.58, score / 100)),
      basisBullets: [
        `चंद्र गोचर: ${panchang.moon && panchang.moon.sign || '-'} (${moonHouse || '-'}वां भाव)`,
        `सूर्य गोचर: ${panchang.sun && panchang.sun.sign || '-'} (${sunHouse || '-'}वां भाव)`,
        `तिथि: ${tithi || '-'}`,
        `नक्षत्र: ${nak || '-'}`,
      ],
    };
  }

  return {
    ...sign,
    displayName,
    score,
    headline: mi.quality === 'caution' ? `${displayName}: move with patience` : `${displayName}: useful momentum`,
    summary: `${lead}, the Moon transit is ${moonHouse || '-'} houses from ${displayName}, which is ${mi.en}. ${tithi ? `${tithi} tithi` : 'Today’s panchang'} and ${nak ? `${nak} nakshatra` : 'the lunar transit'} suggest using timing wisely. ${elementAdvice(sign.element, lang)}${pk.outlook ? ' ' + pk.outlook : ''}`,
    plainSummary: `For ${displayName} — ${pk.plain}`,
    areas: [
      { key: 'love', title: 'Love', score: love, text: love >= 72 ? 'Warm communication can improve closeness and clear old tension.' : 'Keep your tone soft and avoid reacting quickly.' },
      { key: 'career', title: 'Career', score: career, text: career >= 72 ? 'Good time to move priority work forward with confidence.' : 'Stay patient and complete pending work first.' },
      { key: 'finance', title: 'Finance', score: finance, text: finance >= 72 ? 'Planned financial steps can work better than impulse spending.' : 'Avoid risky commitments and review expenses.' },
      { key: 'health', title: 'Health', score: health, text: health >= 72 ? 'Energy is steady; keep your routine clean.' : 'Support your body with rest, hydration, and simple food.' },
    ],
    doList: ['Start important work in a calm window', 'Speak clearly and kindly', 'Do a small act of service', ...pk.doExtra],
    avoidList: ['Rushed decisions', 'Arguments and harsh words', 'New beginnings during inauspicious windows', ...pk.avoidExtra],
    remedy: `Chant ${mantra.text} ${mantra.count} ${pk.remedyWhen} for your sign lord ${sign.lord}.`,
    mantra,
    luckyColor: luckyColor(sign),
    luckyNumber: ((SIGN_INDEX[sign.name] + moonHouse + 3) % 9) + 1,
    confidence: Math.min(0.92, Math.max(0.58, score / 100)),
    basisBullets: [
      `Moon transit: ${panchang.moon && panchang.moon.sign || '-'} (${moonHouse || '-'} house)`,
      `Sun transit: ${panchang.sun && panchang.sun.sign || '-'} (${sunHouse || '-'} house)`,
      `Tithi: ${tithi || '-'}`,
      `Nakshatra: ${nak || '-'}`,
    ],
  };
}

async function publicHoroscope(input = {}) {
  const lang = langOf(input.lang);
  const period = normPeriod(input.period);
  const date = input.date || todayDmy();
  const lat = input.lat != null ? Number(input.lat) : DEFAULT_PLACE.lat;
  const lng = input.lng != null ? Number(input.lng) : DEFAULT_PLACE.lng;
  const place = input.place || DEFAULT_PLACE.place;
  const tz = input.tz || DEFAULT_PLACE.tz;
  const cacheKey = `horoscope|v2|${period}|${date}|${lat},${lng}|${lang}`;

  return cached(cacheKey, async () => {
    const panchang = await getPanchang({ lat, lng, place, date, tz });
    const signs = SIGNS.map((s) => buildSign(s, panchang, period, lang));
    return {
      period,
      date: panchang.date,
      location: panchang.location,
      signs,
      basis: {
        moon: panchang.moon,
        sun: panchang.sun,
        tithi: panchang.tithi,
        nakshatra: panchang.nakshatra,
        yoga: panchang.yoga,
        karana: panchang.karana,
        sunrise: panchang.sunrise,
        sunset: panchang.sunset,
        inauspicious: panchang.inauspicious,
        source: 'Precise planetary positions + classical panchang rules',
      },
      sourceNote: lang === 'hi'
        ? 'यह राशिफल आज के पंचांग, सूर्य-चंद्र गोचर और राशि से भाव संबंध के आधार पर बनाया गया है।'
        : 'This horoscope is derived from today’s panchang, Sun/Moon transits, and house relationship from each sign.',
    };
  });
}

async function personalizedHoroscope(input) {
  const result = await ai.generateDailyPrediction(input);
  return {
    type: 'personalized',
    horoscope: result,
    sourceNote: result.sourceNote || 'Based on your precise birth-chart and panchang data.',
  };
}

module.exports = { publicHoroscope, personalizedHoroscope };
