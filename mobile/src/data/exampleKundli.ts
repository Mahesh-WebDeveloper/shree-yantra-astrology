// ── Example Kundli: box-by-box teaching engine ───────────────────────────────
// We take ONE fixed example birth chart (D1) and DERIVE all 16 Shodashavarga
// divisional charts (D1→D60) using the EXACT same deterministic BPHS formulas as
// the backend (backend/src/services/varga.service.js). Nothing is hand-placed or
// AI-guessed — every divisional sign is computed, so it is internally 100% correct.
// Each box's plain-Hindi/English explanation is then generated from the computed
// placement (sign + house-area + planet meaning + dignity).

import type { ApiPlanet } from '../lib/api';

export type Lang = 'en' | 'hi';

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGNS_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];
const SIGN_LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const SIGN_LORD_HI = ['मंगल', 'शुक्र', 'बुध', 'चंद्र', 'सूर्य', 'बुध', 'शुक्र', 'मंगल', 'गुरु', 'शनि', 'शनि', 'गुरु'];

const SIGN_IDX: Record<string, number> = SIGNS.reduce((a, s, i) => { a[s] = i; return a; }, {} as Record<string, number>);

// planet → en/hi name + one-line meaning
const GRAHA: Record<string, { en: string; hi: string; meanEn: string; meanHi: string }> = {
  Sun: { en: 'Sun', hi: 'सूर्य', meanEn: 'soul, confidence, father, authority', meanHi: 'आत्मा, आत्मविश्वास, पिता, पद' },
  Moon: { en: 'Moon', hi: 'चंद्र', meanEn: 'mind, emotions, mother, comfort', meanHi: 'मन, भावनाएँ, माता, सुकून' },
  Mars: { en: 'Mars', hi: 'मंगल', meanEn: 'energy, courage, drive', meanHi: 'ऊर्जा, साहस, जोश' },
  Mercury: { en: 'Mercury', hi: 'बुध', meanEn: 'intelligence, speech, business', meanHi: 'बुद्धि, वाणी, व्यापार' },
  Jupiter: { en: 'Jupiter', hi: 'गुरु', meanEn: 'wisdom, luck, growth', meanHi: 'ज्ञान, भाग्य, वृद्धि' },
  Venus: { en: 'Venus', hi: 'शुक्र', meanEn: 'love, comfort, beauty, marriage', meanHi: 'प्रेम, सुख, सुंदरता, विवाह' },
  Saturn: { en: 'Saturn', hi: 'शनि', meanEn: 'discipline, patience, hard work', meanHi: 'अनुशासन, धैर्य, कड़ी मेहनत' },
  Rahu: { en: 'Rahu', hi: 'राहु', meanEn: 'desire, ambition, the unusual', meanHi: 'इच्छा, महत्वाकांक्षा, असामान्य' },
  Ketu: { en: 'Ketu', hi: 'केतु', meanEn: 'detachment, spirituality, the past', meanHi: 'वैराग्य, अध्यात्म, अतीत' },
};

// 12 bhava (house) short area
const BHAVA: { en: string; hi: string }[] = [
  { en: 'self, body, personality', hi: 'स्वयं, शरीर, व्यक्तित्व' },
  { en: 'money, family, speech', hi: 'धन, परिवार, वाणी' },
  { en: 'courage, siblings, effort', hi: 'साहस, भाई-बहन, मेहनत' },
  { en: 'home, mother, comfort, property', hi: 'घर, माता, सुख, संपत्ति' },
  { en: 'children, education, creativity', hi: 'संतान, शिक्षा, रचनात्मकता' },
  { en: 'health, enemies, daily work', hi: 'स्वास्थ्य, शत्रु, रोज़ का काम' },
  { en: 'marriage, partner, partnership', hi: 'विवाह, जीवनसाथी, साझेदारी' },
  { en: 'longevity, sudden events, secrets', hi: 'आयु, अचानक घटनाएँ, रहस्य' },
  { en: 'luck, dharma, father, higher study', hi: 'भाग्य, धर्म, पिता, उच्च शिक्षा' },
  { en: 'career, status, public image', hi: 'करियर, पद, समाज में पहचान' },
  { en: 'income, gains, friends, wishes', hi: 'आय, लाभ, मित्र, इच्छाएँ' },
  { en: 'expenses, loss, foreign, moksha', hi: 'व्यय, हानि, विदेश, मोक्ष' },
];

// exaltation / debilitation / own — deterministic, fixed astrology facts (sign-based only)
const EXALT: Record<string, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBIL: Record<string, number> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const OWN: Record<string, number[]> = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };

type Dignity = 'exalt' | 'debil' | 'own' | '';
function dignityOf(planet: string, signIdx: number): Dignity {
  if (EXALT[planet] === signIdx) return 'exalt';
  if (DEBIL[planet] === signIdx) return 'debil';
  if ((OWN[planet] || []).includes(signIdx)) return 'own';
  return '';
}
export function dignityLabel(d: Dignity, lang: Lang): string {
  if (!d) return '';
  if (lang === 'hi') return d === 'exalt' ? 'उच्च' : d === 'debil' ? 'नीच' : 'स्वराशि';
  return d === 'exalt' ? 'Exalted' : d === 'debil' ? 'Debilitated' : 'Own sign';
}

// ── ported divisional-sign engine (verbatim logic from varga.service.js) ──────
const mod12 = (n: number) => ((n % 12) + 12) % 12;
const signName = (i: number) => SIGNS[mod12(i)];
const degreeInSign = (lon: number) => ((lon % 30) + 30) % 30;
const partIndex = (deg: number, division: number) => Math.min(division - 1, Math.floor((deg / 30) * division));
const isOddSign = (idx: number) => idx % 2 === 0;
const signMode = (idx: number) => idx % 3;
const elementGroup = (idx: number) => idx % 4;

function d30Sign(idx: number, deg: number): number {
  if (isOddSign(idx)) {
    if (deg < 5) return 0;
    if (deg < 10) return 10;
    if (deg < 18) return 8;
    if (deg < 25) return 2;
    return 6;
  }
  if (deg < 5) return 1;
  if (deg < 12) return 5;
  if (deg < 20) return 11;
  if (deg < 25) return 9;
  return 7;
}

function divisionalSign(code: string, sign: string, lon: number): string | null {
  if (code === 'D1') return sign;
  const idx = SIGN_IDX[sign];
  const deg = degreeInSign(lon);
  if (idx == null) return null;
  switch (code) {
    case 'D2': { const first = deg < 15; return signName(isOddSign(idx) ? (first ? 4 : 3) : (first ? 3 : 4)); }
    case 'D3': return signName(idx + [0, 4, 8][partIndex(deg, 3)]);
    case 'D4': return signName(idx + [0, 3, 6, 9][partIndex(deg, 4)]);
    case 'D7': return signName((isOddSign(idx) ? idx : idx + 6) + partIndex(deg, 7));
    case 'D9': return signName(idx + (signMode(idx) === 0 ? 0 : signMode(idx) === 1 ? 8 : 4) + partIndex(deg, 9));
    case 'D10': return signName((isOddSign(idx) ? idx : idx + 8) + partIndex(deg, 10));
    case 'D12': return signName(idx + partIndex(deg, 12));
    case 'D16': return signName((signMode(idx) === 0 ? 0 : signMode(idx) === 1 ? 4 : 8) + partIndex(deg, 16));
    case 'D20': return signName((signMode(idx) === 0 ? 0 : signMode(idx) === 1 ? 8 : 4) + partIndex(deg, 20));
    case 'D24': return signName((isOddSign(idx) ? 4 : 3) + partIndex(deg, 24));
    case 'D27': return signName([0, 3, 6, 9][elementGroup(idx)] + partIndex(deg, 27));
    case 'D30': return signName(d30Sign(idx, deg));
    case 'D40': return signName((isOddSign(idx) ? 0 : 6) + partIndex(deg, 40));
    case 'D45': return signName((signMode(idx) === 0 ? 0 : signMode(idx) === 1 ? 4 : 8) + partIndex(deg, 45));
    case 'D60': return signName(isOddSign(idx) ? idx + partIndex(deg, 60) : idx - partIndex(deg, 60));
    default: return null;
  }
}

// ── the fixed EXAMPLE birth chart (D1) ───────────────────────────────────────
// A clean teaching chart: Leo Lagna, with own / exalted / debilitated planets so
// every dignity concept is visible. (An illustrative example, not a real person.)
export const EXAMPLE_PROFILE = {
  nameEn: 'Aarav (example)', nameHi: 'आरव (उदाहरण)',
  dobEn: '14 March 1995', dobHi: '14 मार्च 1995',
  timeEn: '7:30 AM', timeHi: 'सुबह 7:30',
  placeEn: 'Jaipur, India', placeHi: 'जयपुर, भारत',
  lagnaEn: 'Leo Ascendant', lagnaHi: 'सिंह लग्न',
};

// nirayana (sidereal) longitude per planet → drives ALL divisional charts
const EX_PLANETS: { planet: string; lon: number }[] = [
  { planet: 'Sun', lon: 135 },     // Leo 15°  — own sign
  { planet: 'Moon', lon: 110 },    // Cancer 20° — own sign
  { planet: 'Mars', lon: 22 },     // Aries 22° — own sign
  { planet: 'Mercury', lon: 155 }, // Virgo 5° — exalted
  { planet: 'Jupiter', lon: 288 }, // Capricorn 18° — debilitated
  { planet: 'Venus', lon: 192 },   // Libra 12° — own sign
  { planet: 'Saturn', lon: 69 },   // Gemini 9°
  { planet: 'Rahu', lon: 44 },     // Taurus 14°
  { planet: 'Ketu', lon: 224 },    // Scorpio 14° (opposite Rahu)
];
const EX_ASC_LON = 130; // Leo 10°

// the 16 Shodashavarga charts (D1..D60) with bilingual name + focus
const CHART_META: { code: string; nameEn: string; nameHi: string; sanskrit: string; focusEn: string; focusHi: string; noteEn?: string; noteHi?: string }[] = [
  { code: 'D1', nameEn: 'Lagna / Rashi', nameHi: 'लग्न / राशि', sanskrit: 'Rashi', focusEn: 'whole life, body, identity', focusHi: 'पूरा जीवन, शरीर, पहचान' },
  { code: 'D2', nameEn: 'Hora', nameHi: 'होरा', sanskrit: 'Hora', focusEn: 'wealth & money flow', focusHi: 'धन और पैसे का प्रवाह', noteEn: 'Special rule: in the Hora chart every planet falls into only 2 signs — Leo (Sun’s hora) and Cancer (Moon’s hora). So most boxes stay empty here; that is normal.', noteHi: 'खास नियम: होरा चार्ट में हर ग्रह सिर्फ़ 2 राशियों में आता है — सिंह (सूर्य की होरा) और कर्क (चंद्र की होरा)। इसलिए ज़्यादातर खाने खाली रहते हैं; यह सामान्य है।' },
  { code: 'D3', nameEn: 'Drekkana', nameHi: 'द्रेष्काण', sanskrit: 'Drekkana', focusEn: 'siblings, courage, effort', focusHi: 'भाई-बहन, साहस, मेहनत' },
  { code: 'D4', nameEn: 'Chaturthamsha', nameHi: 'चतुर्थांश', sanskrit: 'Chaturthamsa', focusEn: 'home, property, comforts', focusHi: 'घर, संपत्ति, सुख-सुविधा' },
  { code: 'D7', nameEn: 'Saptamsha', nameHi: 'सप्तांश', sanskrit: 'Saptamsha', focusEn: 'children & creativity', focusHi: 'संतान और रचनात्मकता' },
  { code: 'D9', nameEn: 'Navamsha', nameHi: 'नवांश', sanskrit: 'Navamsha', focusEn: 'marriage, dharma, real planet strength', focusHi: 'विवाह, धर्म, ग्रहों का असली बल' },
  { code: 'D10', nameEn: 'Dashamsha', nameHi: 'दशमांश', sanskrit: 'Dashamsha', focusEn: 'career & profession', focusHi: 'करियर और व्यवसाय' },
  { code: 'D12', nameEn: 'Dwadashamsha', nameHi: 'द्वादशांश', sanskrit: 'Dwadashamsha', focusEn: 'parents & ancestry', focusHi: 'माता-पिता और वंश' },
  { code: 'D16', nameEn: 'Shodashamsha', nameHi: 'षोडशांश', sanskrit: 'Shodashamsha', focusEn: 'vehicles, comforts, luxuries', focusHi: 'वाहन, सुख-सुविधा, विलासिता' },
  { code: 'D20', nameEn: 'Vimshamsha', nameHi: 'विंशांश', sanskrit: 'Vimshamsha', focusEn: 'spiritual path & worship', focusHi: 'आध्यात्मिक मार्ग और उपासना' },
  { code: 'D24', nameEn: 'Chaturvimshamsha', nameHi: 'चतुर्विंशांश', sanskrit: 'Siddhamsha', focusEn: 'education & learning', focusHi: 'शिक्षा और ज्ञान' },
  { code: 'D27', nameEn: 'Bhamsha', nameHi: 'भांश', sanskrit: 'Bhamsa', focusEn: 'inner strength & weakness', focusHi: 'भीतरी शक्ति और कमज़ोरी' },
  { code: 'D30', nameEn: 'Trimsamsha', nameHi: 'त्रिंशांश', sanskrit: 'Trimsamsha', focusEn: 'troubles & hidden issues', focusHi: 'बाधाएँ और छिपी समस्याएँ' },
  { code: 'D40', nameEn: 'Khavedamsha', nameHi: 'खवेदांश', sanskrit: 'Khavedamsha', focusEn: 'maternal lineage & blessings', focusHi: 'मातृ वंश और आशीर्वाद' },
  { code: 'D45', nameEn: 'Akshavedamsha', nameHi: 'अक्षवेदांश', sanskrit: 'Akshavedamsha', focusEn: 'paternal lineage & character', focusHi: 'पितृ वंश और चरित्र' },
  { code: 'D60', nameEn: 'Shashtiamsha', nameHi: 'षष्ट्यांश', sanskrit: 'Shashtiamsha', focusEn: 'deep karma & subtle patterns', focusHi: 'गहरे कर्म और सूक्ष्म पैटर्न' },
];

export interface BoxPlanet { planet: string; dignity: Dignity }
export interface ChartBox { house: number; signIdx: number; planets: BoxPlanet[] }
export interface ExampleChart {
  code: string; nameEn: string; nameHi: string; sanskrit: string; focusEn: string; focusHi: string;
  noteEn?: string; noteHi?: string;
  ascIdx: number;
  apiPlanets: ApiPlanet[];   // shape for <VedicChart/>
  boxes: ChartBox[];          // 12 houses, in house order 1..12
}

function buildChart(meta: typeof CHART_META[number]): ExampleChart {
  const ascSign = divisionalSign(meta.code, 'Leo', EX_ASC_LON) || 'Leo';
  const ascIdx = SIGN_IDX[ascSign];

  const placed = EX_PLANETS.map((p) => {
    const dSign = divisionalSign(meta.code, SIGNS[Math.floor(p.lon / 30) % 12], p.lon) || SIGNS[Math.floor(p.lon / 30) % 12];
    const sIdx = SIGN_IDX[dSign];
    const house = mod12(sIdx - ascIdx) + 1;
    return { planet: p.planet, sIdx, house, dignity: dignityOf(p.planet, sIdx) };
  });

  // boxes by house 1..12
  const boxes: ChartBox[] = [];
  for (let h = 1; h <= 12; h++) {
    const signIdx = mod12(ascIdx + h - 1);
    const planets = placed.filter((p) => p.house === h).map((p) => ({ planet: p.planet, dignity: p.dignity }));
    boxes.push({ house: h, signIdx, planets });
  }

  const apiPlanets: ApiPlanet[] = placed.map((p) => ({ planet: p.planet, sign: SIGNS[p.sIdx], house: String(p.house) }));
  return { ...meta, ascIdx, apiPlanets, boxes };
}

export const EXAMPLE_CHARTS: ExampleChart[] = CHART_META.map(buildChart);

// ── plain-language box explanation (generated from computed placement) ────────
export function signLabel(idx: number, lang: Lang) { return lang === 'hi' ? SIGNS_HI[idx] : SIGNS[idx]; }
export function lordLabel(idx: number, lang: Lang) { return lang === 'hi' ? SIGN_LORD_HI[idx] : SIGN_LORD[idx]; }
export function grahaLabel(planet: string, lang: Lang) { return lang === 'hi' ? GRAHA[planet].hi : GRAHA[planet].en; }
export function grahaMeaning(planet: string, lang: Lang) { return lang === 'hi' ? GRAHA[planet].meanHi : GRAHA[planet].meanEn; }

export function boxExplanation(chart: ExampleChart, box: ChartBox, lang: Lang): string {
  const sign = signLabel(box.signIdx, lang);
  const area = lang === 'hi' ? BHAVA[box.house - 1].hi : BHAVA[box.house - 1].en;
  const lord = lordLabel(box.signIdx, lang);

  if (box.planets.length === 0) {
    if (lang === 'hi') {
      return `इस खाने में ${sign} राशि है और कोई ग्रह नहीं बैठा। यह खाना ${area} दिखाता है। जब खाना खाली हो, तो इसका हाल इसके स्वामी ${lord} की स्थिति से देखा जाता है।`;
    }
    return `This box has ${sign} and no planet sitting in it. It covers ${area}. When a box is empty, you judge it from its lord ${lord}'s position.`;
  }

  const parts = box.planets.map((bp) => {
    const g = grahaLabel(bp.planet, lang);
    const mean = grahaMeaning(bp.planet, lang);
    const dig = dignityLabel(bp.dignity, lang);
    if (lang === 'hi') {
      const digTxt = dig ? ` (${dig} — ${bp.dignity === 'debil' ? 'थोड़ा कमज़ोर' : 'मज़बूत'})` : '';
      return `${g}${digTxt} — मतलब ${mean}`;
    }
    const digTxt = dig ? ` (${dig} — ${bp.dignity === 'debil' ? 'a bit weak' : 'strong'})` : '';
    return `${g}${digTxt} — meaning ${mean}`;
  });

  if (lang === 'hi') {
    return `इस खाने में ${sign} राशि है। यहाँ ${box.planets.length > 1 ? 'ये ग्रह बैठे हैं' : 'यह ग्रह बैठा है'}: ${parts.join('; ')}। चूँकि यह ${area} का खाना है, इन ग्रहों का असर सीधे इसी हिस्से पर पड़ता है।`;
  }
  return `This box has ${sign}. Sitting here: ${parts.join('; ')}. Since this box is about ${area}, these planets directly colour that part of life.`;
}

// short house title e.g. "House 1 · Self"
export function houseTitle(house: number, lang: Lang): string {
  const area = lang === 'hi' ? BHAVA[house - 1].hi : BHAVA[house - 1].en;
  const head = area.split(',')[0];
  return lang === 'hi' ? `भाव ${house} · ${head}` : `House ${house} · ${head}`;
}
