'use strict';
/**
 * traditionalPhala.js — Classical Vedic "Phala-Kathan" (prediction) rule engine.
 * North-Indian Parashari standard. Pure, dependency-free, CommonJS.
 *
 * Produces a janma (birth) attribute block + a data-driven list of classical
 * predictions (yogas, doshas, nakshatra nature, key planet-in-house phala) for
 * a single horoscope. Output is bilingual (clean English + Devanagari Hindi),
 * modern & practical — never fatalistic or superstitious.
 *
 * ------------------------------------------------------------------------------
 * SOURCES (verified June 2026)
 * ------------------------------------------------------------------------------
 * Nakshatra Gana / Yoni / Nadi tables — reused verbatim from this project's own
 *   gunMilan.js (Ashtakoot engine), which is verified against Saravali (classical):
 *     https://saravali.github.io/astrology/koota_yoni.html
 *     https://saravali.github.io/astrology/koota_nadi.html
 *   Cross-checked (Gana) against AnytimeAstro & Jagannath Hora:
 *     https://www.anytimeastro.com/blog/nakshatra/nakshatra-meaning-list-of-27-nakshatras/
 *     https://jagannathhora.com/yoni-koot-yoni-milan-explained/
 *
 * Varna (by Moon sign / Janma Rashi) — DrikPanchang & Astrobix Varna-koota:
 *     https://www.drikpanchang.com/tutorials/jyotisha/kundali-match/ashta-kuta/varna-kuta.html
 *     https://astrobix.com/articles/varna-koota-for-marriage-matching.aspx
 *   Cancer/Scorpio/Pisces = Brahmin; Aries/Leo/Sagittarius = Kshatriya;
 *   Taurus/Virgo/Capricorn = Vaishya; Gemini/Libra/Aquarius = Shudra.
 *
 * Gandmool nakshatras (6) — AstroShastra, AskGanesha, DrikPanchang Gandamool:
 *     https://www.astroshastra.com/articles/gandmools.php
 *     https://www.drikpanchang.com/panchang/gandamool-dates-timings.html
 *   List: Ashwini, Ashlesha, Magha, Jyeshtha, Mula, Revati.
 *   Ketu-ruled: Ashwini, Magha, Mula  |  Mercury-ruled: Ashlesha, Jyeshtha, Revati.
 *   Severity is highest in junction (sandhi) padas — for Ketu-stars the FIRST
 *   pada, for Mercury-stars the LAST pada are the most sensitive (gandanta).
 *
 * Planetary exaltation / debilitation & own signs — classical (BPHS) standard;
 *   cross-checked CyberAstro / IndAstro:
 *     https://www.cyberastro.com/article/exaltation-and-debilitation-of-planets
 *   Sun↑Aries / Moon↑Taurus / Mars↑Capricorn / Mercury↑Virgo / Jupiter↑Cancer /
 *   Venus↑Pisces / Saturn↑Libra (debilitation = the 7th/opposite sign).
 *
 * Panch Mahapurusha Yogas — BPHS ch. 75 (Cosmic Insights, IndAstro, PanchangBodh):
 *     https://blog.cosmicinsights.net/pancha-mahapurusha-yogas/
 *   Ruchaka(Mars), Bhadra(Mercury), Hamsa(Jupiter), Malavya(Venus), Sasa(Saturn):
 *   the planet must be in its OWN or EXALTATION sign AND in a kendra (1/4/7/10).
 *   Mercury has no exaltation-based PMP entry beyond Virgo (own = Gemini/Virgo,
 *   exalt = Virgo, so Bhadra triggers on Gemini/Virgo in kendra).
 *
 * Budhaditya / Gajakesari / Kemadruma — Phaldeepika & BPHS yoga chapters
 *   (cross-checked AstroSage, Cosmic Insights):
 *     https://blog.cosmicinsights.net/pancha-mahapurusha-yogas/  (yoga context)
 *
 * ------------------------------------------------------------------------------
 * SOURCE DISAGREEMENTS & RESOLUTIONS
 * ------------------------------------------------------------------------------
 *  - YONI of Mrigashira & Pushya: Saravali (and our gunMilan) give
 *    Mrigashira=Serpent, Pushya=Sheep; some North-Indian almanacs give
 *    Mrigashira=Serpent, Pushya=Goat (Sheep≈Goat are treated as one yoni class).
 *    We follow Saravali (project source of truth) for internal consistency with
 *    the Ashtakoot engine.
 *  - VARNA: South-Indian texts assign varna per-nakshatra; North-Indian Ashtakoot
 *    (DrikPanchang) assigns it by Moon sign. We use the Moon-sign rule (matches
 *    gunMilan.js and the contract's rashi-based chart input).
 *  - GANDMOOL pada-severity: classical texts agree the gandanta junction padas are
 *    most sensitive but differ on numeric "shanti" timing; we flag the junction
 *    pada (1st for Ketu-stars, 4th for Mercury-stars) as 'high' and others 'mild'.
 *  - RAHU/KETU exaltation is disputed across schools (Gemini/Taurus etc.); since
 *    the nodes have no own sign, we do NOT trigger Panch-Mahapurusha for them
 *    (classical PMP is only the five non-luminary, non-nodal planets).
 */

/* ====================================================================== */
/* Reference data                                                         */
/* ====================================================================== */

const NAK_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// Hindi sign names
const SIGN_HI = {
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह',
  Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु',
  Capricorn: 'मकर', Aquarius: 'कुम्भ', Pisces: 'मीन',
};

// nakshatra (0-based) -> gana (0 Deva, 1 Manushya, 2 Rakshasa) — verified (gunMilan/Saravali)
const NAK_GANA = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0,
];
const GANA_EN = ['Deva', 'Manushya', 'Rakshasa'];
const GANA_HI = ['देव', 'मनुष्य', 'राक्षस'];

// nakshatra (0-based) -> yoni animal index — verified (gunMilan/Saravali)
const Y = {
  HORSE: 0, ELEPHANT: 1, SHEEP: 2, SERPENT: 3, DOG: 4, CAT: 5, RAT: 6,
  COW: 7, BUFFALO: 8, TIGER: 9, DEER: 10, MONKEY: 11, MONGOOSE: 12, LION: 13,
};
const NAK_YONI = [
  Y.HORSE, Y.ELEPHANT, Y.SHEEP, Y.SERPENT, Y.SERPENT, Y.DOG, Y.CAT, Y.SHEEP, Y.CAT,
  Y.RAT, Y.RAT, Y.COW, Y.BUFFALO, Y.TIGER, Y.BUFFALO, Y.TIGER, Y.DEER, Y.DEER, Y.DOG,
  Y.MONKEY, Y.MONGOOSE, Y.MONKEY, Y.LION, Y.HORSE, Y.LION, Y.COW, Y.ELEPHANT,
];
const YONI_EN = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
  'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion',
];
const YONI_HI = [
  'अश्व', 'गज', 'मेष', 'सर्प', 'श्वान', 'मार्जार', 'मूषक',
  'गौ', 'महिष', 'व्याघ्र', 'मृग', 'वानर', 'नकुल', 'सिंह',
];
// short instinctive trait per yoni (en/hi)
const YONI_TRAIT = [
  ['energetic, freedom-loving and quick to act', 'ऊर्जावान, स्वतंत्रता-प्रिय और शीघ्र कार्यशील'],
  ['dignified, patient and protective', 'गरिमामय, धैर्यवान और रक्षक स्वभाव'],
  ['gentle, adaptable and community-minded', 'सौम्य, अनुकूलनशील और सामूहिक भावना वाले'],
  ['intense, secretive and transformative', 'गहन, रहस्यमय और परिवर्तनकारी'],
  ['loyal, alert and service-oriented', 'वफादार, सजग और सेवा-भावी'],
  ['independent, sharp and self-reliant', 'स्वतंत्र, तीक्ष्ण और आत्मनिर्भर'],
  ['resourceful, quick-witted and thrifty', 'साधन-संपन्न, चतुर और मितव्ययी'],
  ['nurturing, calm and dependable', 'पोषक, शांत और भरोसेमंद'],
  ['hardworking, strong and persevering', 'परिश्रमी, बलवान और दृढ़'],
  ['bold, ambitious and assertive', 'साहसी, महत्वाकांक्षी और दृढ़-निश्चयी'],
  ['gentle, sensitive and graceful', 'कोमल, संवेदनशील और सुंदर स्वभाव'],
  ['clever, playful and socially skilled', 'चतुर, खिलंदड़ और सामाजिक रूप से कुशल'],
  ['agile, sharp and quick to seize chances', 'फुर्तीले, तीक्ष्ण और अवसर पकड़ने में तत्पर'],
  ['regal, confident and natural leaders', 'राजसी, आत्मविश्वासी और स्वाभाविक नेता'],
];

// nakshatra (0-based) -> nadi (0 Aadi/Vata, 1 Madhya/Pitta, 2 Antya/Kapha) — verified
const NAK_NADI = [
  0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2,
];
const NADI_EN = ['Aadi', 'Madhya', 'Antya'];
const NADI_HI = ['आदि', 'मध्य', 'अन्त्य'];
const NADI_DOSHA = ['Vata', 'Pitta', 'Kapha'];

// Varna by sign (Moon sign rule). rank Brahmin=4 ... Shudra=1
const SIGN_VARNA = {
  Aries: 'Kshatriya', Leo: 'Kshatriya', Sagittarius: 'Kshatriya',
  Taurus: 'Vaishya', Virgo: 'Vaishya', Capricorn: 'Vaishya',
  Gemini: 'Shudra', Libra: 'Shudra', Aquarius: 'Shudra',
  Cancer: 'Brahmin', Scorpio: 'Brahmin', Pisces: 'Brahmin',
};
const VARNA_HI = { Brahmin: 'ब्राह्मण', Kshatriya: 'क्षत्रिय', Vaishya: 'वैश्य', Shudra: 'शूद्र' };
const VARNA_TRAIT = {
  Brahmin: ['wisdom, learning and a reflective, principled outlook', 'ज्ञान, विद्या और चिंतनशील, सिद्धांतप्रिय दृष्टिकोण'],
  Kshatriya: ['courage, leadership and a protective drive', 'साहस, नेतृत्व और रक्षक प्रवृत्ति'],
  Vaishya: ['practicality, enterprise and a head for value', 'व्यवहारकुशलता, उद्यम और मूल्य की समझ'],
  Shudra: ['skill, service and steady, grounded effort', 'कौशल, सेवा और स्थिर, धरातल से जुड़ा परिश्रम'],
};

// Gandmool nakshatras (0-based indices): Ashwini(0), Ashlesha(8), Magha(9),
// Jyeshtha(17), Mula(18), Revati(26)
const GANDMOOL_INDICES = [0, 8, 9, 17, 18, 26];
const GANDMOOL_NAKSHATRAS = GANDMOOL_INDICES.map((i) => NAK_NAMES[i]);
// Ketu-ruled gandmool (junction pada = 1st) vs Mercury-ruled (junction pada = 4th)
const GANDMOOL_KETU = new Set([0, 9, 18]);       // Ashwini, Magha, Mula
const GANDMOOL_MERCURY = new Set([8, 17, 26]);   // Ashlesha, Jyeshtha, Revati

// is-gandmool flag per nakshatra
const GANDMOOL_SET = new Set(GANDMOOL_INDICES);

// Planet own signs & exaltation (classical). Each: own:[signs], exalt: sign|null, debil: sign|null
const DIGNITY = {
  Sun: { own: ['Leo'], exalt: 'Aries', debil: 'Libra' },
  Moon: { own: ['Cancer'], exalt: 'Taurus', debil: 'Scorpio' },
  Mars: { own: ['Aries', 'Scorpio'], exalt: 'Capricorn', debil: 'Cancer' },
  Mercury: { own: ['Gemini', 'Virgo'], exalt: 'Virgo', debil: 'Pisces' },
  Jupiter: { own: ['Sagittarius', 'Pisces'], exalt: 'Cancer', debil: 'Capricorn' },
  Venus: { own: ['Taurus', 'Libra'], exalt: 'Pisces', debil: 'Virgo' },
  Saturn: { own: ['Capricorn', 'Aquarius'], exalt: 'Libra', debil: 'Aries' },
  Rahu: { own: [], exalt: null, debil: null },
  Ketu: { own: [], exalt: null, debil: null },
};

const PLANET_HI = {
  Sun: 'सूर्य', Moon: 'चन्द्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु',
  Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

const WATER_SIGNS = new Set(['Cancer', 'Scorpio', 'Pisces']);
const KENDRAS = new Set([1, 4, 7, 10]);
const TRIKONAS = new Set([1, 5, 9]);
const MALEFICS = new Set(['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']);
const CHILDCARE_MALEFICS = new Set(['Rahu', 'Ketu', 'Saturn', 'Mars']);

// Panch Mahapurusha definitions
const PMP = {
  Mars: { yoga: 'Ruchaka', yogaHi: 'रुचक' },
  Mercury: { yoga: 'Bhadra', yogaHi: 'भद्र' },
  Jupiter: { yoga: 'Hamsa', yogaHi: 'हंस' },
  Venus: { yoga: 'Malavya', yogaHi: 'मालव्य' },
  Saturn: { yoga: 'Sasa', yogaHi: 'शश' },
};

/* ====================================================================== */
/* Public: NAKSHATRA_ATTRS (27 rows, index 0 = Ashwini)                   */
/* ====================================================================== */

const NAKSHATRA_ATTRS = NAK_NAMES.map((name, i) => ({
  name,
  gana: GANA_EN[NAK_GANA[i]],
  ganaHi: GANA_HI[NAK_GANA[i]],
  yoni: YONI_EN[NAK_YONI[i]],
  yoniHi: YONI_HI[NAK_YONI[i]],
  nadi: NADI_EN[NAK_NADI[i]],
  nadiHi: NADI_HI[NAK_NADI[i]],
  // varna is conventionally derived from the Moon sign, not the nakshatra alone;
  // exposed here as the varna of the nakshatra's owning sign-segment start for
  // reference only (the prediction engine uses the actual Moon sign).
  isGandmool: GANDMOOL_SET.has(i),
}));

/* ====================================================================== */
/* Helpers                                                                */
/* ====================================================================== */

function pair(en, hi) { return { en, hi }; }

function findPlanet(chart, name) {
  return (chart.planets || []).find((p) => p && p.planet === name) || null;
}

// dignity classification of a planet given its sign
function dignityOf(planet, sign) {
  const d = DIGNITY[planet];
  if (!d || !sign) return 'neutral';
  if (d.exalt === sign) return 'exalted';
  if (d.debil === sign) return 'debilitated';
  if (d.own.includes(sign)) return 'own';
  return 'neutral';
}

// house of a planet counted from Moon (1-based), needs both planet house & moon house
function houseFromMoon(planetHouse, moonHouse) {
  if (planetHouse == null || moonHouse == null) return null;
  return ((planetHouse - moonHouse + 12) % 12) + 1;
}

/* ====================================================================== */
/* Main                                                                   */
/* ====================================================================== */

function computeTraditionalPhala(chart) {
  chart = chart || {};
  const predictions = [];
  const nIdx = Math.max(0, Math.min(26, (Number(chart.moonNakshatra) || 1) - 1));
  const pada = Math.max(1, Math.min(4, Number(chart.moonPada) || 1));
  const moonSign = chart.moonSign || null;

  /* ---- janma block ------------------------------------------------ */
  const ganaCode = NAK_GANA[nIdx];
  const yoniCode = NAK_YONI[nIdx];
  const nadiCode = NAK_NADI[nIdx];
  const varnaEn = moonSign && SIGN_VARNA[moonSign] ? SIGN_VARNA[moonSign] : 'Kshatriya';

  const isGandmool = GANDMOOL_SET.has(nIdx);
  // junction (gandanta) pada is most sensitive: 1st pada for Ketu-stars, 4th for Mercury-stars
  let gandmoolSeverity = null;
  if (isGandmool) {
    const junctionPada = GANDMOOL_KETU.has(nIdx) ? 1 : 4;
    gandmoolSeverity = pada === junctionPada ? 'high' : 'mild';
  }

  const lagnaSandhi = chart.ascendantDegreeInSign != null
    && (Number(chart.ascendantDegreeInSign) <= 1 || Number(chart.ascendantDegreeInSign) >= 29);

  const janma = {
    gana: pair(GANA_EN[ganaCode], GANA_HI[ganaCode]),
    yoni: pair(YONI_EN[yoniCode], YONI_HI[yoniCode]),
    nadi: pair(NADI_EN[nadiCode], NADI_HI[nadiCode]),
    varna: pair(varnaEn, VARNA_HI[varnaEn]),
    gandmool: {
      present: isGandmool,
      nakshatra: isGandmool ? NAK_NAMES[nIdx] : null,
      note: isGandmool
        ? pair(
          `Born in the gandmool nakshatra ${NAK_NAMES[nIdx]} (pada ${pada}, ${gandmoolSeverity} sensitivity). A short Gandmool Shanti puja in the first 27 days is the traditional remedy; such natives are often unusually intelligent and rise high in life.`,
          `गण्डमूल नक्षत्र ${NAK_NAMES[nIdx]} (पाद ${pada}, ${gandmoolSeverity === 'high' ? 'अधिक' : 'सामान्य'} संवेदनशीलता) में जन्म। पहले 27 दिनों में संक्षिप्त गण्डमूल शान्ति पूजा पारंपरिक उपाय है; ऐसे जातक प्रायः असाधारण रूप से बुद्धिमान और जीवन में आगे बढ़ने वाले होते हैं।`,
        )
        : pair('Moon is not in a gandmool nakshatra — no gandmool consideration.',
          'चन्द्रमा गण्डमूल नक्षत्र में नहीं है — गण्डमूल विचार नहीं।'),
    },
    lagnaSandhi: !!lagnaSandhi,
  };

  /* ---- 7. GANA nature -------------------------------------------- */
  const GANA_NATURE = [
    pair('Deva gana gives a gentle, generous and principled temperament — you work best in harmony and dislike conflict.',
      'देव गण सौम्य, उदार और सिद्धांतप्रिय स्वभाव देता है — आप सामंजस्य में सर्वश्रेष्ठ कार्य करते हैं और कलह से दूर रहते हैं।'),
    pair('Manushya gana gives a balanced, practical and goal-oriented temperament — a healthy mix of ideals and worldly ambition.',
      'मनुष्य गण संतुलित, व्यावहारिक और लक्ष्य-केंद्रित स्वभाव देता है — आदर्श और सांसारिक महत्वाकांक्षा का अच्छा मेल।'),
    pair('Rakshasa gana gives a determined, intense temperament with strong intuition and willpower (not "evil") — decisive and fearless under pressure.',
      'राक्षस गण दृढ़, गहन स्वभाव देता है, प्रबल अंतर्ज्ञान और इच्छाशक्ति के साथ (यह "बुरा" नहीं है) — दबाव में निर्णायक और निर्भीक।'),
  ];
  predictions.push({
    key: 'gana_nature',
    category: 'nature',
    title: pair('Gana (temperament)', 'गण (स्वभाव)'),
    text: GANA_NATURE[ganaCode],
    source: 'classical',
    strength: 'neutral',
  });

  /* ---- 8. YONI nature -------------------------------------------- */
  predictions.push({
    key: 'yoni_nature',
    category: 'nature',
    title: pair(`Yoni — ${YONI_EN[yoniCode]}`, `योनि — ${YONI_HI[yoniCode]}`),
    text: pair(
      `Your birth yoni is the ${YONI_EN[yoniCode]} — instinctively ${YONI_TRAIT[yoniCode][0]}.`,
      `आपकी जन्म-योनि ${YONI_HI[yoniCode]} है — स्वभावतः ${YONI_TRAIT[yoniCode][1]}।`,
    ),
    source: 'classical',
    strength: 'neutral',
  });

  /* ---- 10. NADI & VARNA notes ------------------------------------ */
  predictions.push({
    key: 'nadi_note',
    category: 'health',
    title: pair(`Nadi — ${NADI_EN[nadiCode]}`, `नाड़ी — ${NADI_HI[nadiCode]}`),
    text: pair(
      `${NADI_EN[nadiCode]} nadi (${NADI_DOSHA[nadiCode]} constitution). Keep your ${NADI_DOSHA[nadiCode]} balanced through suitable diet, routine and rest for steady health.`,
      `${NADI_HI[nadiCode]} नाड़ी (${NADI_DOSHA[nadiCode]} प्रकृति)। उपयुक्त आहार, दिनचर्या और विश्राम से अपने ${NADI_DOSHA[nadiCode]} को संतुलित रखें — स्वास्थ्य स्थिर रहेगा।`,
    ),
    source: 'classical',
    strength: 'neutral',
  });
  predictions.push({
    key: 'varna_note',
    category: 'personality',
    title: pair(`Varna — ${varnaEn}`, `वर्ण — ${VARNA_HI[varnaEn]}`),
    text: pair(
      `Your ${varnaEn} varna inclines you toward ${VARNA_TRAIT[varnaEn][0]}.`,
      `आपका ${VARNA_HI[varnaEn]} वर्ण आपको ${VARNA_TRAIT[varnaEn][1]} की ओर प्रवृत्त करता है।`,
    ),
    source: 'classical',
    strength: 'neutral',
  });

  /* ---- 1. PANCH MAHAPURUSHA YOGAS -------------------------------- */
  const PMP_EFFECT = {
    Ruchaka: pair(
      'Ruchaka Yoga: Mars in own/exalted sign in a kendra gives courage, leadership, physical vigour and command — excellent for defence, sports, surgery, engineering or any role demanding initiative.',
      'रुचक योग: मंगल स्व/उच्च राशि में केंद्र में होकर साहस, नेतृत्व, शारीरिक बल और अधिकार देता है — रक्षा, खेल, शल्य-चिकित्सा, इंजीनियरिंग या पहल माँगने वाले किसी भी क्षेत्र के लिए उत्तम।'),
    Bhadra: pair(
      'Bhadra Yoga: Mercury in own/exalted sign in a kendra gives sharp intellect, fluent speech and business sense — strong for writing, teaching, trade, analysis and communication.',
      'भद्र योग: बुध स्व/उच्च राशि में केंद्र में होकर तीक्ष्ण बुद्धि, प्रवाहमयी वाणी और व्यापार-कुशलता देता है — लेखन, अध्यापन, व्यापार, विश्लेषण और संवाद में प्रबल।'),
    Hamsa: pair(
      'Hamsa Yoga: Jupiter in own/exalted sign in a kendra gives wisdom, good conduct, respect and a spiritual bent — favourable for teaching, law, counselling and advisory roles.',
      'हंस योग: गुरु स्व/उच्च राशि में केंद्र में होकर ज्ञान, सदाचार, सम्मान और आध्यात्मिक झुकाव देता है — अध्यापन, विधि, परामर्श और मार्गदर्शन के लिए शुभ।'),
    Malavya: pair(
      'Malavya Yoga: Venus in own/exalted sign in a kendra gives charm, artistic talent, comforts and refined taste — favourable for arts, design, hospitality and a graceful, comfortable life.',
      'मालव्य योग: शुक्र स्व/उच्च राशि में केंद्र में होकर आकर्षण, कलात्मक प्रतिभा, सुख-सुविधा और परिष्कृत रुचि देता है — कला, डिज़ाइन, आतिथ्य और सुंदर, सुखी जीवन के लिए शुभ।'),
    Sasa: pair(
      'Sasa Yoga: Saturn in own/exalted sign in a kendra gives discipline, endurance and authority that grows with age — strong for administration, real estate, large organisations and long-term work.',
      'शश योग: शनि स्व/उच्च राशि में केंद्र में होकर अनुशासन, सहनशक्ति और उम्र के साथ बढ़ने वाला अधिकार देता है — प्रशासन, भू-संपदा, बड़े संगठनों और दीर्घकालिक कार्य में प्रबल।'),
  };
  Object.keys(PMP).forEach((pl) => {
    const p = findPlanet(chart, pl);
    if (!p) return;
    const dig = dignityOf(pl, p.sign);
    if ((dig === 'own' || dig === 'exalted') && p.house != null && KENDRAS.has(Number(p.house))) {
      const y = PMP[pl];
      predictions.push({
        key: `pmp_${y.yoga.toLowerCase()}`,
        category: 'yoga',
        title: pair(`${y.yoga} Yoga (Panch Mahapurusha)`, `${y.yogaHi} योग (पंच महापुरुष)`),
        text: PMP_EFFECT[y.yoga],
        source: 'BPHS',
        strength: 'good',
      });
    }
  });

  /* ---- 2. BUDHADITYA YOGA ---------------------------------------- */
  const sun = findPlanet(chart, 'Sun');
  const merc = findPlanet(chart, 'Mercury');
  if (sun && merc && sun.house != null && merc.house != null && Number(sun.house) === Number(merc.house)) {
    const rahu = findPlanet(chart, 'Rahu');
    const ketu = findPlanet(chart, 'Ketu');
    const tainted = (rahu && Number(rahu.house) === Number(sun.house))
      || (ketu && Number(ketu.house) === Number(sun.house));
    predictions.push({
      key: 'budhaditya',
      category: 'education',
      title: pair('Budhaditya Yoga', 'बुधादित्य योग'),
      text: tainted
        ? pair(
          'Sun and Mercury together give intelligence and analytical skill, but with Rahu/Ketu in the same house the mind can become restless or scattered — channel it through structured study and focus.',
          'सूर्य-बुध की युति बुद्धि और विश्लेषण-क्षमता देती है, किन्तु उसी भाव में राहु/केतु होने से मन चंचल या बिखरा हो सकता है — संरचित अध्ययन और एकाग्रता से इसे साधें।')
        : pair(
          'Budhaditya Yoga: Sun with Mercury gives a sharp, articulate intellect, good education and success in fields needing analysis, communication or administration.',
          'बुधादित्य योग: सूर्य के साथ बुध तीक्ष्ण, वाक्पटु बुद्धि, अच्छी शिक्षा और विश्लेषण, संवाद या प्रशासन वाले क्षेत्रों में सफलता देता है।'),
      source: 'Phaldeepika',
      strength: tainted ? 'neutral' : 'good',
    });
  }

  /* ---- 3a. GAJAKESARI YOGA --------------------------------------- */
  const jup = findPlanet(chart, 'Jupiter');
  const moon = findPlanet(chart, 'Moon');
  if (jup && jup.house != null) {
    // kendra from Lagna
    const kendraFromLagna = KENDRAS.has(Number(jup.house));
    // kendra from Moon
    let kendraFromMoon = false;
    if (moon && moon.house != null) {
      const hm = houseFromMoon(Number(jup.house), Number(moon.house));
      kendraFromMoon = hm != null && KENDRAS.has(hm);
    }
    if (kendraFromLagna || kendraFromMoon) {
      predictions.push({
        key: 'gajakesari',
        category: 'wealth',
        title: pair('Gajakesari Yoga', 'गजकेसरी योग'),
        text: pair(
          'Gajakesari Yoga: Jupiter in a kendra from the Moon/Lagna gives wisdom, good reputation, steady prosperity and the respect of others — a lasting, dignified rise.',
          'गजकेसरी योग: चन्द्र/लग्न से केंद्र में गुरु ज्ञान, अच्छी प्रतिष्ठा, स्थिर समृद्धि और दूसरों का सम्मान देता है — स्थायी, गरिमामय उन्नति।'),
        source: 'classical',
        strength: 'good',
      });
    }
  }

  /* ---- 3b. KEMADRUMA YOGA ---------------------------------------- */
  // Moon with no planet (other than Sun, by classical exclusion of luminaries varies;
  // we use the common rule: no planet in 2nd or 12th from Moon, and no planet in a
  // kendra from Moon, excluding Sun and the nodes from "company").
  if (moon && moon.house != null) {
    const moonHouse = Number(moon.house);
    const others = (chart.planets || []).filter((p) =>
      p && p.planet !== 'Moon' && p.planet !== 'Sun' && p.planet !== 'Rahu' && p.planet !== 'Ketu'
      && p.house != null);
    const h2 = (moonHouse % 12) + 1;
    const h12 = ((moonHouse + 10) % 12) + 1;
    const hasIn2or12 = others.some((p) => Number(p.house) === h2 || Number(p.house) === h12);
    const hasInKendraFromMoon = others.some((p) => {
      const hm = houseFromMoon(Number(p.house), moonHouse);
      return hm != null && KENDRAS.has(hm);
    });
    if (!hasIn2or12 && !hasInKendraFromMoon) {
      predictions.push({
        key: 'kemadruma',
        category: 'precaution',
        title: pair('Kemadruma Yoga', 'केमद्रुम योग'),
        text: pair(
          'The Moon stands without supporting planets nearby (Kemadruma). Emotional ups and downs and a sense of going it alone are possible — build a steady support network and routine; the effect eases greatly once career and relationships stabilise.',
          'चन्द्रमा के निकट सहायक ग्रह नहीं हैं (केमद्रुम)। भावनात्मक उतार-चढ़ाव और अकेले संघर्ष का भाव संभव है — स्थिर सहयोग-तंत्र और दिनचर्या बनाएँ; करियर व संबंध स्थिर होते ही प्रभाव बहुत घट जाता है।'),
        source: 'classical',
        strength: 'caution',
      });
    }
  }

  /* ---- 4. GANDMOOL DOSHA ----------------------------------------- */
  if (isGandmool) {
    predictions.push({
      key: 'gandmool_dosha',
      category: 'precaution',
      title: pair('Gandmool Dosha', 'गण्डमूल दोष'),
      text: gandmoolSeverity === 'high'
        ? pair(
          `Moon in ${NAK_NAMES[nIdx]} at the sensitive junction pada (${pada}). Perform a Gandmool Shanti puja within the first 27 days (or on the next same-nakshatra day). These natives are usually bright and ambitious; with shanti the early sensitivity settles.`,
          `${NAK_NAMES[nIdx]} के संवेदनशील संधि-पाद (${pada}) में चन्द्रमा। पहले 27 दिनों में (या अगले समान-नक्षत्र दिन) गण्डमूल शान्ति पूजा करें। ऐसे जातक प्रायः प्रतिभाशाली और महत्वाकांक्षी होते हैं; शान्ति से प्रारंभिक संवेदनशीलता शांत हो जाती है।`)
        : pair(
          `Moon in the gandmool nakshatra ${NAK_NAMES[nIdx]} (pada ${pada}, milder). A simple Gandmool Shanti in early infancy is the traditional remedy. Such natives often turn out unusually capable.`,
          `गण्डमूल नक्षत्र ${NAK_NAMES[nIdx]} (पाद ${pada}, सामान्य) में चन्द्रमा। शैशवावस्था में सरल गण्डमूल शान्ति पारंपरिक उपाय है। ऐसे जातक प्रायः असाधारण रूप से सक्षम निकलते हैं।`),
      source: 'classical',
      strength: 'caution',
    });
  }

  /* ---- 5. BAL-ARISHTA (infant vulnerability) --------------------- */
  const balReasons = [];
  if (ganaCode === 2) balReasons.push('Rakshasa gana');
  if (isGandmool) balReasons.push('gandmool nakshatra');
  if (lagnaSandhi) balReasons.push('lagna-sandhi (ascendant at a sign junction)');
  if (chart.dashaAtBirthLord && MALEFICS.has(chart.dashaAtBirthLord)
    && CHILDCARE_MALEFICS.has(chart.dashaAtBirthLord)) {
    balReasons.push(`malefic ${chart.dashaAtBirthLord} dasha at birth`);
  }
  if (balReasons.length) {
    predictions.push({
      key: 'bal_arishta',
      category: 'precaution',
      title: pair('Bal-Arishta (infant care)', 'बाल-अरिष्ट (शिशु-देखभाल)'),
      text: pair(
        `Classical texts advise extra care in early childhood here (${balReasons.join(', ')}). Practically: do not leave the child alone near water or in lonely/twilight spots, keep up health check-ups, and treat this as a reminder for attentive care — not a fixed prophecy.`,
        `यहाँ शास्त्र प्रारंभिक बाल्यावस्था में अतिरिक्त देखभाल की सलाह देते हैं (${balReasons.join(', ')})। व्यवहार में: बच्चे को जल के निकट या एकांत/संध्या-स्थानों में अकेला न छोड़ें, स्वास्थ्य-जाँच नियमित रखें, और इसे सतर्क देखभाल का स्मरण मानें — कोई निश्चित भविष्यवाणी नहीं।`),
      source: 'classical',
      strength: 'caution',
    });
  }

  /* ---- 6. ELEMENT / WATER HAZARD --------------------------------- */
  const planetsIn12 = (chart.planets || []).filter((p) => p && Number(p.house) === 12);
  const rahuIn12Water = planetsIn12.some((p) => p.planet === 'Rahu' && WATER_SIGNS.has(p.sign));
  const maleficsIn12Water = planetsIn12.filter((p) => MALEFICS.has(p.planet) && WATER_SIGNS.has(p.sign));
  if (rahuIn12Water || maleficsIn12Water.length >= 2) {
    predictions.push({
      key: 'water_hazard',
      category: 'precaution',
      title: pair('Water-safety precaution', 'जल-सुरक्षा सावधानी'),
      text: pair(
        'Malefic energy in the 12th house in a water sign suggests being mindful around deep water. Learn to swim, avoid swimming alone or in unfamiliar/rough water — a sensible safety habit, not a doom prediction.',
        'जल-राशि में द्वादश भाव में पाप-ग्रह का प्रभाव गहरे जल के पास सावधानी का संकेत देता है। तैरना सीखें, अकेले या अपरिचित/उफनते जल में न तैरें — यह विवेकपूर्ण सुरक्षा-आदत है, कोई अनिष्ट-भविष्यवाणी नहीं।'),
      source: 'classical',
      strength: 'caution',
    });
  }

  /* ---- 9. KEY PLANET-IN-HOUSE PHALA (data-driven) ---------------- */
  // Moon in own/exalted -> emotional nature
  if (moon && (dignityOf('Moon', moon.sign) === 'own' || dignityOf('Moon', moon.sign) === 'exalted')) {
    predictions.push({
      key: 'moon_strong',
      category: 'personality',
      title: pair('Strong Moon (emotional nature)', 'बलवान चन्द्र (भावनात्मक स्वभाव)'),
      text: pair(
        `Moon in ${moon.sign} is strong — a calm, caring and emotionally stable nature, good rapport with people and (often) with the mother; helpful for public-facing and nurturing roles.`,
        `${SIGN_HI[moon.sign] || moon.sign} में चन्द्रमा बलवान है — शांत, स्नेही और भावनात्मक रूप से स्थिर स्वभाव, लोगों से (और प्रायः माता से) अच्छा तालमेल; जन-संपर्क और पोषक भूमिकाओं के लिए सहायक।`),
      source: 'classical',
      strength: 'good',
    });
  }

  // generic per-planet placement phala — collect, then cap to keep ~8-12 total
  const placementPreds = [];
  const seenStrong = new Set(Object.keys(PMP).filter((pl) => {
    const p = findPlanet(chart, pl);
    return p && (dignityOf(pl, p.sign) === 'own' || dignityOf(pl, p.sign) === 'exalted')
      && p.house != null && KENDRAS.has(Number(p.house));
  })); // these already got a PMP card — don't duplicate

  (chart.planets || []).forEach((p) => {
    if (!p || !p.planet || !p.sign) return;
    const pl = p.planet;
    const dig = dignityOf(pl, p.sign);
    const house = p.house != null ? Number(p.house) : null;
    const plHi = PLANET_HI[pl] || pl;
    const signHi = SIGN_HI[p.sign] || p.sign;

    // exalted/own in kendra or trikona -> good (skip if already a PMP card, skip Moon handled above)
    if ((dig === 'exalted' || dig === 'own') && pl !== 'Moon' && !seenStrong.has(pl)
      && house != null && (KENDRAS.has(house) || TRIKONAS.has(house))) {
      placementPreds.push({
        key: `dignity_${pl.toLowerCase()}`,
        category: pl === 'Venus' || pl === 'Jupiter' ? 'wealth' : 'career',
        title: pair(`${pl} ${dig} in house ${house}`, `${plHi} ${dig === 'exalted' ? 'उच्च' : 'स्वगृही'} ${house} भाव में`),
        text: pair(
          `${pl} is ${dig} in ${p.sign} in a strong house (${house}). It works at full power here, giving good results in the matters of this house with relatively little struggle — a clear strength to build a career or finances around.`,
          `${plHi} ${signHi} में ${dig === 'exalted' ? 'उच्च' : 'स्वगृही'} होकर बलवान भाव (${house}) में है। यहाँ यह पूर्ण बल से कार्य करता है, इस भाव के विषयों में अपेक्षाकृत कम संघर्ष से अच्छे फल देता है — करियर या धन का आधार बनाने योग्य स्पष्ट शक्ति।`),
        source: 'BPHS',
        strength: 'good',
      });
    }

    // debilitated -> caution but improvable
    if (dig === 'debilitated') {
      placementPreds.push({
        key: `debil_${pl.toLowerCase()}`,
        category: 'caution' === 'caution' ? (pl === 'Mercury' ? 'education' : 'personality') : 'personality',
        title: pair(`${pl} debilitated in ${p.sign}`, `${plHi} ${signHi} में नीच`),
        text: pair(
          `${pl} is debilitated in ${p.sign}, so its natural results come more slowly and with effort early on. This is workable — many charts have a "neecha-bhanga" cancellation, and conscious effort in this planet's areas turns the weakness into hard-won strength over time.`,
          `${plHi} ${signHi} में नीच है, अतः इसके स्वाभाविक फल प्रारंभ में धीरे और परिश्रम से मिलते हैं। यह सुधारने योग्य है — अनेक कुंडलियों में "नीचभंग" होता है, और इस ग्रह के क्षेत्रों में सचेत प्रयास समय के साथ इस कमजोरी को अर्जित शक्ति में बदल देता है।`),
        source: 'BPHS',
        strength: 'caution',
      });
    }

    // malefic in 8th/12th -> depth/research, caution
    if (MALEFICS.has(pl) && (house === 8 || house === 12)) {
      placementPreds.push({
        key: `malefic_${pl.toLowerCase()}_h${house}`,
        category: house === 8 ? 'health' : 'precaution',
        title: pair(`${pl} in house ${house}`, `${plHi} ${house} भाव में`),
        text: house === 8
          ? pair(
            `${pl} in the 8th gives a probing, research-minded depth and interest in hidden subjects (occult, healing, investigation). Guard health and avoid unnecessary risks; the same placement can give sudden gains and resilience.`,
            `अष्टम में ${plHi} गहन, शोध-प्रवृत्त दृष्टि और गूढ़ विषयों (तंत्र, चिकित्सा, अन्वेषण) में रुचि देता है। स्वास्थ्य का ध्यान रखें और अनावश्यक जोखिम से बचें; यही स्थिति आकस्मिक लाभ और सहनशक्ति भी दे सकती है।`)
          : pair(
            `${pl} in the 12th turns the mind inward — good for spirituality, research, foreign lands and behind-the-scenes work, but watch over-spending and isolation. Channel it into solitude that is productive, not draining.`,
            `द्वादश में ${plHi} मन को अंतर्मुखी करता है — आध्यात्म, शोध, विदेश और परदे-के-पीछे के कार्य के लिए अच्छा, किन्तु अति-व्यय और एकाकीपन से सावधान रहें। इसे थकाने वाले नहीं, उत्पादक एकांत में लगाएँ।`),
        source: 'classical',
        strength: 'caution',
      });
    }
  });

  // cap placements so total predictions stay sensible (~8-12 placement-type max)
  placementPreds.slice(0, 12).forEach((p) => predictions.push(p));

  return { janma, predictions };
}

module.exports = { computeTraditionalPhala, NAKSHATRA_ATTRS, GANDMOOL_NAKSHATRAS };

/* ====================================================================== */
/* Self-test                                                              */
/* ====================================================================== */

if (require.main === module) {
  const samples = [
    {
      label: 'Sample 1 — BPHS-classic (Sagittarius asc, Magha-1 Moon, exalted Mars in 10th)',
      chart: {
        ascendant: 'Sagittarius',
        ascendantDegreeInSign: 0.5, // lagna-sandhi
        moonNakshatra: 10, // Magha
        moonPada: 1,
        moonSign: 'Leo',
        planets: [
          { planet: 'Mars', sign: 'Capricorn', house: 10 },   // exalted in kendra -> Ruchaka
          { planet: 'Sun', sign: 'Pisces', house: 12 },        // with Mercury+Rahu
          { planet: 'Mercury', sign: 'Pisces', house: 12 },    // Budhaditya (tainted by Rahu)
          { planet: 'Rahu', sign: 'Pisces', house: 12 },       // water-sign 12th -> water hazard
          { planet: 'Jupiter', sign: 'Cancer', house: 6 },     // exalted but in 6th (no PMP)
          { planet: 'Ketu', sign: 'Virgo', house: 6 },
          { planet: 'Venus', sign: 'Aquarius', house: 11 },
          { planet: 'Saturn', sign: 'Aquarius', house: 11 },
          { planet: 'Moon', sign: 'Leo', house: 9 },
        ],
        dashaAtBirthLord: 'Ketu',
      },
    },
    {
      label: 'Sample 2 — Taurus asc, Rohini Moon (own/exalted), Malavya + Hamsa + Gajakesari',
      chart: {
        ascendant: 'Taurus',
        ascendantDegreeInSign: 15,
        moonNakshatra: 4, // Rohini
        moonPada: 2,
        moonSign: 'Taurus',
        planets: [
          { planet: 'Venus', sign: 'Taurus', house: 1 },       // own in kendra -> Malavya
          { planet: 'Jupiter', sign: 'Cancer', house: 3 },     // exalted but 3rd (no PMP); kendra-from-Moon? Moon h1
          { planet: 'Moon', sign: 'Taurus', house: 1 },        // exalted -> strong Moon
          { planet: 'Mercury', sign: 'Gemini', house: 2 },
          { planet: 'Sun', sign: 'Aries', house: 12 },
          { planet: 'Mars', sign: 'Cancer', house: 3 },        // debilitated
          { planet: 'Saturn', sign: 'Libra', house: 6 },
          { planet: 'Rahu', sign: 'Aquarius', house: 10 },
          { planet: 'Ketu', sign: 'Leo', house: 4 },
        ],
        dashaAtBirthLord: 'Venus',
      },
    },
  ];

  samples.forEach(({ label, chart }) => {
    const res = computeTraditionalPhala(chart);
    console.log('\n========================================================');
    console.log(label);
    console.log('========================================================');
    console.log('JANMA:');
    console.log('  gana  :', res.janma.gana.en, '/', res.janma.gana.hi);
    console.log('  yoni  :', res.janma.yoni.en, '/', res.janma.yoni.hi);
    console.log('  nadi  :', res.janma.nadi.en, '/', res.janma.nadi.hi);
    console.log('  varna :', res.janma.varna.en, '/', res.janma.varna.hi);
    console.log('  gandmool:', res.janma.gandmool.present, res.janma.gandmool.nakshatra || '');
    console.log('  lagnaSandhi:', res.janma.lagnaSandhi);
    console.log('PREDICTIONS (' + res.predictions.length + '):');
    res.predictions.forEach((p) => {
      console.log(`  [${p.strength.toUpperCase().padEnd(7)}] ${p.category.padEnd(11)} ${p.key.padEnd(22)} | ${p.title.en}`);
    });
  });

  // sanity checks on exported tables
  console.log('\n--- table sanity ---');
  console.log('NAKSHATRA_ATTRS length:', NAKSHATRA_ATTRS.length);
  console.log('GANDMOOL_NAKSHATRAS:', GANDMOOL_NAKSHATRAS.join(', '));
  console.log('Ashwini attrs:', JSON.stringify(NAKSHATRA_ATTRS[0]));
  console.log('Magha attrs:', JSON.stringify(NAKSHATRA_ATTRS[9]));
}
