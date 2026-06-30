// ── Shared Jyotish glossary + tap-to-explain engine ──────────────────────────
// Powers the "tap any box / number / planet in a chart → easy explanation with an
// example" feature. Works on ANY chart (D1 or any varga) because every explanation
// is computed from the REAL planet list + ascendant that the chart was drawn from —
// nothing hand-written per chart, so it can never drift from what is shown.

import type { ApiPlanet } from '../lib/api';

export type Lang = 'en' | 'hi';
export type Dignity = 'exalt' | 'debil' | 'own' | '';

export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGNS_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];
const SIGN_LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const SIGN_LORD_HI = ['मंगल', 'शुक्र', 'बुध', 'चंद्र', 'सूर्य', 'बुध', 'शुक्र', 'मंगल', 'गुरु', 'शनि', 'शनि', 'गुरु'];
export const SIGN_IDX: Record<string, number> = SIGNS.reduce((a, s, i) => { a[s] = i; return a; }, {} as Record<string, number>);

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

// every abbreviation (English + Hindi, as drawn in the charts) → canonical planet
const PLANET_BY_ABBR: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  'सू': 'Sun', 'चं': 'Moon', 'मं': 'Mars', 'बु': 'Mercury', 'गु': 'Jupiter', 'शु': 'Venus', 'श': 'Saturn', 'रा': 'Rahu', 'के': 'Ketu',
};
export function planetFromAbbr(ab: string): string | null { return PLANET_BY_ABBR[ab] || null; }

// 12 bhava: short area + a concrete teaching example
const BHAVA: { en: string; hi: string; exEn: string; exHi: string }[] = [
  { en: 'self, body, personality', hi: 'स्वयं, शरीर, व्यक्तित्व', exEn: 'e.g., a strong planet here makes a confident, healthy, leader-type personality.', exHi: 'जैसे: यहाँ मज़बूत ग्रह हो तो व्यक्ति आत्मविश्वासी, सेहतमंद और नेतृत्व करने वाला बनता है।' },
  { en: 'money, family, speech', hi: 'धन, परिवार, वाणी', exEn: 'e.g., a benefic here supports savings and family backing.', exHi: 'जैसे: यहाँ शुभ ग्रह हो तो बचत अच्छी और परिवार का सहयोग मिलता है।' },
  { en: 'courage, siblings, effort', hi: 'साहस, भाई-बहन, मेहनत', exEn: 'e.g., Mars here can boost courage and self-effort.', exHi: 'जैसे: यहाँ मंगल हो तो हिम्मत और अपनी मेहनत बढ़ती है।' },
  { en: 'home, mother, comfort, property', hi: 'घर, माता, सुख, संपत्ति', exEn: 'e.g., Moon here gives closeness to mother and peace of mind.', exHi: 'जैसे: यहाँ चंद्र हो तो माँ से नज़दीकी और मन की शांति मिलती है।' },
  { en: 'children, education, creativity', hi: 'संतान, शिक्षा, रचनात्मकता', exEn: 'e.g., Jupiter here is good for studies and children.', exHi: 'जैसे: यहाँ गुरु हो तो पढ़ाई और संतान-सुख के लिए शुभ है।' },
  { en: 'health, enemies, daily work', hi: 'स्वास्थ्य, शत्रु, रोज़ का काम', exEn: 'e.g., a strong planet here helps win over illness and rivals.', exHi: 'जैसे: यहाँ मज़बूत ग्रह हो तो बीमारी और विरोधियों पर जीत मिलती है।' },
  { en: 'marriage, partner, partnership', hi: 'विवाह, जीवनसाथी, साझेदारी', exEn: 'e.g., Venus here points to a caring life-partner.', exHi: 'जैसे: यहाँ शुक्र हो तो प्यार करने वाले जीवनसाथी का संकेत है।' },
  { en: 'longevity, sudden events, secrets', hi: 'आयु, अचानक घटनाएँ, रहस्य', exEn: 'e.g., planets here bring deep, sudden changes in life.', exHi: 'जैसे: यहाँ के ग्रह जीवन में गहरे और अचानक बदलाव लाते हैं।' },
  { en: 'luck, dharma, father, higher study', hi: 'भाग्य, धर्म, पिता, उच्च शिक्षा', exEn: 'e.g., Jupiter here raises luck and interest in dharma.', exHi: 'जैसे: यहाँ गुरु हो तो भाग्य और धर्म में रुचि बढ़ती है।' },
  { en: 'career, status, public image', hi: 'करियर, पद, समाज में पहचान', exEn: 'e.g., Sun or Saturn here points to growth in career and status.', exHi: 'जैसे: यहाँ सूर्य या शनि हो तो करियर और पद में तरक्की का संकेत है।' },
  { en: 'income, gains, friends, wishes', hi: 'आय, लाभ, मित्र, इच्छाएँ', exEn: 'e.g., a benefic here increases income and fulfilled wishes.', exHi: 'जैसे: यहाँ शुभ ग्रह हो तो आमदनी और लाभ बढ़ते हैं।' },
  { en: 'expenses, loss, foreign, moksha', hi: 'व्यय, हानि, विदेश, मोक्ष', exEn: 'e.g., Ketu here can show spirituality or a foreign connection.', exHi: 'जैसे: यहाँ केतु हो तो अध्यात्म या विदेश-योग दिख सकता है।' },
];

const EXALT: Record<string, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBIL: Record<string, number> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const OWN: Record<string, number[]> = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };

export function dignityOf(planet: string, signIdx: number): Dignity {
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
function dignityNote(d: Dignity, lang: Lang): string {
  if (!d) return '';
  if (lang === 'hi') return d === 'exalt' ? 'उच्च — बहुत मज़बूत, अच्छे नतीजे' : d === 'debil' ? 'नीच — थोड़ा कमज़ोर, मेहनत से सुधरता है' : 'स्वराशि — मज़बूत और सहज';
  return d === 'exalt' ? 'Exalted — very strong, good results' : d === 'debil' ? 'Debilitated — a bit weak, improves with effort' : 'Own sign — strong and natural';
}

export const signLabel = (idx: number, lang: Lang) => (lang === 'hi' ? SIGNS_HI[idx] : SIGNS[idx]);
export const lordLabel = (idx: number, lang: Lang) => (lang === 'hi' ? SIGN_LORD_HI[idx] : SIGN_LORD[idx]);
export const grahaLabel = (planet: string, lang: Lang) => (lang === 'hi' ? GRAHA[planet]?.hi : GRAHA[planet]?.en) || planet;
const grahaMean = (planet: string, lang: Lang) => (lang === 'hi' ? GRAHA[planet]?.meanHi : GRAHA[planet]?.meanEn) || '';

// what the modal renders — fully lang-resolved, so the modal stays "dumb"
export interface ExplainView {
  heading: string;
  sub: string;
  chips: { label: string; dignity: Dignity }[];
  body: string;
  example: string;
  speak: string[];
}

const lagnaIndexOf = (asc?: string | null) => (asc && SIGN_IDX[asc] != null ? SIGN_IDX[asc] : -1);
const houseOfSign = (signIdx: number, lagnaIdx: number) => ((signIdx - lagnaIdx + 12) % 12) + 1;

// planets sitting in a given sign (works for D1 + any varga — both carry p.sign)
function planetsInSign(planets: ApiPlanet[] | null | undefined, signIdx: number) {
  return (planets || [])
    .filter((p) => p.sign && SIGN_IDX[p.sign] === signIdx)
    .map((p) => ({ planet: p.planet, dignity: dignityOf(p.planet, signIdx) }));
}

// ── tap a BOX / house number / sign label ────────────────────────────────────
export function explainHouse(planets: ApiPlanet[] | null, ascendant: string | null | undefined, houseNum: number, lang: Lang): ExplainView {
  const lagnaIdx = lagnaIndexOf(ascendant);
  const signIdx = lagnaIdx >= 0 ? (lagnaIdx + houseNum - 1) % 12 : -1;
  const bh = BHAVA[houseNum - 1];
  const area = lang === 'hi' ? bh.hi : bh.en;
  const sign = signIdx >= 0 ? signLabel(signIdx, lang) : null;
  const occupants = signIdx >= 0 ? planetsInSign(planets, signIdx) : [];

  const heading = lang === 'hi' ? `भाव ${houseNum} · ${area.split(',')[0]}` : `House ${houseNum} · ${bh.en.split(',')[0]}`;
  const sub = sign
    ? (lang === 'hi' ? `राशि: ${sign}  ·  स्वामी: ${lordLabel(signIdx, lang)}` : `Sign: ${sign}  ·  Lord: ${lordLabel(signIdx, lang)}`)
    : (lang === 'hi' ? 'जीवन का एक क्षेत्र' : 'one area of life');

  const chips = [
    ...(sign ? [{ label: sign, dignity: '' as Dignity }] : []),
    ...occupants.map((o) => ({ label: grahaLabel(o.planet, lang), dignity: o.dignity })),
  ];

  let body: string;
  if (occupants.length) {
    const parts = occupants.map((o) => {
      const dg = dignityLabel(o.dignity, lang);
      return lang === 'hi'
        ? `${grahaLabel(o.planet, lang)}${dg ? ` (${dg})` : ''} — ${grahaMean(o.planet, lang)}`
        : `${grahaLabel(o.planet, lang)}${dg ? ` (${dg})` : ''} — ${grahaMean(o.planet, lang)}`;
    });
    body = lang === 'hi'
      ? `यह खाना ${area} दिखाता है। इसमें ${sign} राशि है। यहाँ बैठे ग्रह: ${parts.join('; ')}। इन ग्रहों का असर सीधे इसी क्षेत्र पर पड़ता है।`
      : `This box shows ${area}. It holds ${sign}. Planets here: ${parts.join('; ')}. Their effect falls directly on this area of life.`;
  } else {
    body = sign
      ? (lang === 'hi'
          ? `यह खाना ${area} दिखाता है। इसमें ${sign} राशि है और कोई ग्रह नहीं। जब खाना खाली हो, तो इसका हाल इसके स्वामी ${lordLabel(signIdx, lang)} की स्थिति से देखा जाता है।`
          : `This box shows ${area}. It holds ${sign} with no planet. When a box is empty, judge it from its lord ${lordLabel(signIdx, lang)}'s position.`)
      : (lang === 'hi' ? `यह खाना ${area} दिखाता है।` : `This box shows ${area}.`);
  }

  const example = lang === 'hi' ? bh.exHi : bh.exEn;
  return { heading, sub, chips, body, example, speak: [heading, sub, body, example] };
}

// ── tap a PLANET letter ──────────────────────────────────────────────────────
export function explainPlanet(planets: ApiPlanet[] | null, ascendant: string | null | undefined, planet: string, lang: Lang): ExplainView {
  const lagnaIdx = lagnaIndexOf(ascendant);
  const p = (planets || []).find((x) => x.planet === planet);
  const signIdx = p && p.sign ? SIGN_IDX[p.sign] : -1;
  const houseNum = signIdx >= 0 && lagnaIdx >= 0 ? houseOfSign(signIdx, lagnaIdx) : -1;
  const dignity = signIdx >= 0 ? dignityOf(planet, signIdx) : '';

  const heading = lang === 'hi' ? `${grahaLabel(planet, lang)} · ग्रह` : `${grahaLabel(planet, lang)} · planet`;
  const meaning = grahaMean(planet, lang);
  const placeParts: string[] = [];
  if (signIdx >= 0) placeParts.push(lang === 'hi' ? `${signLabel(signIdx, lang)} राशि` : `${signLabel(signIdx, lang)}`);
  if (houseNum >= 0) placeParts.push(lang === 'hi' ? `भाव ${houseNum}` : `House ${houseNum}`);
  const sub = placeParts.length ? placeParts.join(' · ') : (lang === 'hi' ? 'ग्रह का मतलब' : 'what this planet means');

  const chips = [
    { label: grahaLabel(planet, lang), dignity },
    ...(signIdx >= 0 ? [{ label: signLabel(signIdx, lang), dignity: '' as Dignity }] : []),
  ];

  const area = houseNum >= 0 ? (lang === 'hi' ? BHAVA[houseNum - 1].hi : BHAVA[houseNum - 1].en) : '';
  const dgNote = dignityNote(dignity, lang);
  // extra state from the real chart (only present on live data)
  const states: string[] = [];
  if (p?.isRetrograde === 'True') states.push(lang === 'hi' ? 'वक्री — उल्टी चाल, असर थोड़ा अलग ढंग से' : 'retrograde — moving backward, works a little differently');
  if (p?.isCombust === 'True') states.push(lang === 'hi' ? 'अस्त — सूर्य के बहुत पास, थोड़ा दबा हुआ' : 'combust — very close to the Sun, a bit suppressed');
  const stateNote = states.length ? (lang === 'hi' ? ` यह ग्रह ${states.join(' और ')} है।` : ` This planet is ${states.join(' and ')}.`) : '';

  let body: string;
  if (houseNum >= 0) {
    body = lang === 'hi'
      ? `${grahaLabel(planet, lang)} का मतलब है ${meaning}। अभी यह ${signLabel(signIdx, lang)} राशि में, भाव ${houseNum} (${area}) में बैठा है${dgNote ? ` — ${dgNote}` : ''}। इसका मतलब ${grahaLabel(planet, lang)} की ऊर्जा सीधे ${area} पर असर डालती है।${stateNote}`
      : `${grahaLabel(planet, lang)} means ${meaning}. Right now it sits in ${signLabel(signIdx, lang)}, in House ${houseNum} (${area})${dgNote ? ` — ${dgNote}` : ''}. So this planet's energy works directly on ${area}.${stateNote}`;
  } else {
    body = lang === 'hi' ? `${grahaLabel(planet, lang)} का मतलब है ${meaning}।${stateNote}` : `${grahaLabel(planet, lang)} means ${meaning}.${stateNote}`;
  }
  const example = houseNum >= 0 ? (lang === 'hi' ? BHAVA[houseNum - 1].exHi : BHAVA[houseNum - 1].exEn)
    : (lang === 'hi' ? `जैसे: ${grahaLabel(planet, lang)} जिस खाने में हो, उस क्षेत्र पर इसका रंग चढ़ता है।` : `e.g., whichever box ${grahaLabel(planet, lang)} sits in, it colours that area of life.`);

  return { heading, sub, chips, body, example, speak: [heading, sub, body, example] };
}
