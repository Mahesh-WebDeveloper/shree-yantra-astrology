'use strict';
/**
 * remedies.js — Classical Vedic astrology remedies (upaay) engine.
 * North-Indian Parashari standard. Pure, dependency-free, CommonJS.
 *
 * Provides:
 *   - LAGNA_LORD   : sign -> ruling planet (lagnesh)
 *   - GEMSTONE     : planet -> {gemstone, metal, finger, weekday} (en + hi)
 *   - BEEJ_MANTRA  : planet -> {Devanagari beej mantra, classical japa count}
 *   - computeRemedies(input) -> life gemstone, dosha remedies, all 9 planet mantras
 *
 * ------------------------------------------------------------------------------
 * SOURCES (verified June 2026)
 * ------------------------------------------------------------------------------
 * Beej mantras (Devanagari) & japa counts — classical navagraha seed mantras:
 *   - AB Mantra (full internally-consistent set, ह्रां/श्रां/क्रां ... series):
 *       https://www.abmantra.com/mantra/navagraha-mantra-meaning/
 *   - Adhyatmic (confirms exact Devanagari for Guru "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः"
 *       and Shani "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः"):
 *       https://adhyatmic.com/lyrics/mantras/  (Brihaspati / Shani beej mantra pages)
 *   - Astrotalk (cross-check; note: garbled Jupiter entry there — see disagreements):
 *       https://astrotalk.com/mantras/navagraha-mantra
 *   - DrikPanchang navagraha mantra collection (cross-check of mantra family):
 *       https://www.drikpanchang.com/vedic-mantra/gods/navagraha/navagraha-mantras.html
 *
 * Gemstone <-> planet <-> metal <-> finger <-> weekday:
 *   - Navratan (14 rules of wearing gemstones), GemsMantra Navratna guide,
 *     GrahaGuru Navratna guide, 9gems Navratna:
 *       https://www.navratan.com/blog/14-rules-of-wearing-gemstones
 *       https://gemsmantra.com/blogs/news/which-gemstone-for-which-planet
 *       https://grahaguru.in/learn/gemstone-101/navratna-9-gemstones-guide
 *       https://www.9gems.in/navratna-gemstones-the-divine-nine-gems-of-vedic-astrology
 *
 * Dosha remedies (Mangal / Kaal Sarp / Sade Sati):
 *   - mPanchang Mangal Dosha & Kaal Sarp remedies; AnytimeAstro Mangal Dosha:
 *       https://www.mpanchang.com/articles/astrology/remedies-for-mangal-dosha-in-your-birth-chart/
 *       https://mpanchang.com/articles/astrology/kaal-sarp-dosh-remedies/
 *   - GaneshaSpeaks Shani Sade Sati remedies; IndAstro Sade Sati remedies;
 *     ShaniTemple.org Sade Sati remedies:
 *       https://www.ganeshaspeaks.com/predictions/astrology/shani-sade-sati-remedies/
 *       https://www.indastro.com/sade-sati/shani-sade-sati-remedies.html
 *       https://www.shanitemple.org/remedies-to-reduce-the-effects-of-shani-sade-sati/
 *
 * Lagna lord (rashi swami) — standard Parashari rulership; universal consensus
 * (AstroSage, DrikPanchang). No source disagreement.
 *
 * ------------------------------------------------------------------------------
 * SOURCE DISAGREEMENTS & RESOLUTIONS
 * ------------------------------------------------------------------------------
 * 1) BEEJ MANTRAS: AB Mantra gives one clean, internally-consistent series where
 *    each planet uses the same vowel-pattern (बीज + ह्रीं-style + सः + dative name).
 *    Astrotalk reproduces the same series for most planets but has a corrupted
 *    Jupiter line ("ॐ ब्रिम बृहस्पतये नमः") and minor sandhi typos (स/सः, बुद्धाय).
 *    Adhyatmic confirms the clean AB Mantra forms verbatim for Guru and Shani.
 *    => We adopt the AB Mantra / Adhyatmic standard series (the form taught in most
 *       Jyotish texts). Mantra uses "ॐ" and proper visarga "सः".
 *
 * 2) JAPA COUNTS: counts vary by tradition (40-day purashcharan totals differ between
 *    sources: e.g. Saturn 23000 vs 19000; Mercury 9000 vs 17000; Moon 11000 vs 10000).
 *    => We use the most widely-cited classical purashcharan totals (Mantra-Maharnava /
 *       standard navagraha-shanti school): Sun 7000, Moon 11000, Mars 10000,
 *       Mercury 9000, Jupiter 19000, Venus 16000, Saturn 23000, Rahu 18000, Ketu 17000.
 *       (For daily practice, 108/day on the planet's weekday is the common maintenance.)
 *
 * 3) GEMSTONE FINGER/METAL: minor variation exists (Venus = middle OR ring finger;
 *    Mars metal = copper OR gold; Mercury metal = gold OR silver/panchdhatu).
 *    => We list the most commonly-prescribed primary: Sun=Gold/ring; Moon=Silver/little;
 *       Mars=Copper(or Gold)/ring; Mercury=Gold(or Silver)/little; Jupiter=Gold/index;
 *       Venus=Silver or Platinum/middle(or ring); Saturn=Iron/Panchdhatu/Silver/middle;
 *       Rahu=Silver(Panchdhatu)/middle; Ketu=Silver(Panchdhatu)/ring. Secondary metals
 *       are noted with "·". All gemstones worn after consultation.
 *
 * NOTE: Gemstones are strengtheners of a planet and must be worn only after
 *       consulting a qualified astrologer. This module is informational.
 */

/* ------------------------------------------------------------------ */
/* Public constants                                                    */
/* ------------------------------------------------------------------ */

// Sign -> ruling planet (lagnesh / rashi swami). Standard Parashari rulership.
const LAGNA_LORD = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter'
};

// Planet -> gemstone with metal / finger / weekday (English + Hindi/Devanagari).
const GEMSTONE = {
  Sun: {
    en: 'Ruby', hi: 'माणिक्य',
    metal: 'Gold', metalHi: 'सोना',
    finger: 'Ring finger', fingerHi: 'अनामिका',
    day: 'Sunday', dayHi: 'रविवार'
  },
  Moon: {
    en: 'Pearl', hi: 'मोती',
    metal: 'Silver', metalHi: 'चाँदी',
    finger: 'Little finger', fingerHi: 'कनिष्ठा',
    day: 'Monday', dayHi: 'सोमवार'
  },
  Mars: {
    en: 'Red Coral', hi: 'मूँगा',
    metal: 'Copper · Gold', metalHi: 'ताँबा · सोना',
    finger: 'Ring finger', fingerHi: 'अनामिका',
    day: 'Tuesday', dayHi: 'मंगलवार'
  },
  Mercury: {
    en: 'Emerald', hi: 'पन्ना',
    metal: 'Gold · Silver', metalHi: 'सोना · चाँदी',
    finger: 'Little finger', fingerHi: 'कनिष्ठा',
    day: 'Wednesday', dayHi: 'बुधवार'
  },
  Jupiter: {
    en: 'Yellow Sapphire', hi: 'पुखराज',
    metal: 'Gold', metalHi: 'सोना',
    finger: 'Index finger', fingerHi: 'तर्जनी',
    day: 'Thursday', dayHi: 'गुरुवार'
  },
  Venus: {
    en: 'Diamond', hi: 'हीरा',
    metal: 'Silver · Platinum', metalHi: 'चाँदी · प्लैटिनम',
    finger: 'Middle finger', fingerHi: 'मध्यमा',
    day: 'Friday', dayHi: 'शुक्रवार'
  },
  Saturn: {
    en: 'Blue Sapphire', hi: 'नीलम',
    metal: 'Iron · Panchdhatu · Silver', metalHi: 'लोहा · पंचधातु · चाँदी',
    finger: 'Middle finger', fingerHi: 'मध्यमा',
    day: 'Saturday', dayHi: 'शनिवार'
  },
  Rahu: {
    en: "Hessonite (Gomed)", hi: 'गोमेद',
    metal: 'Silver · Panchdhatu', metalHi: 'चाँदी · पंचधातु',
    finger: 'Middle finger', fingerHi: 'मध्यमा',
    day: 'Saturday', dayHi: 'शनिवार'
  },
  Ketu: {
    en: "Cat's Eye (Lehsunia)", hi: 'लहसुनिया',
    metal: 'Silver · Panchdhatu', metalHi: 'चाँदी · पंचधातु',
    finger: 'Ring finger', fingerHi: 'अनामिका',
    day: 'Thursday', dayHi: 'गुरुवार'
  }
};

// Planet -> beej (seed) mantra in Devanagari + classical purashcharan japa count.
const BEEJ_MANTRA = {
  Sun:     { mantra: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',      count: 7000 },
  Moon:    { mantra: 'ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः',      count: 11000 },
  Mars:    { mantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',        count: 10000 },
  Mercury: { mantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',        count: 9000 },
  Jupiter: { mantra: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',        count: 19000 },
  Venus:   { mantra: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',      count: 16000 },
  Saturn:  { mantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',    count: 23000 },
  Rahu:    { mantra: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',        count: 18000 },
  Ketu:    { mantra: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',        count: 17000 }
};

// Planet -> Hindi name (for output labels).
const PLANET_HI = {
  Sun: 'सूर्य', Moon: 'चन्द्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'गुरु (बृहस्पति)', Venus: 'शुक्र', Saturn: 'शनि',
  Rahu: 'राहु', Ketu: 'केतु'
};

// What each planet's mantra strengthens (one simple line, en + hi).
const PLANET_FORWHAT = {
  Sun:     { en: 'vitality, confidence, leadership and health',           hi: 'जीवनशक्ति, आत्मविश्वास, नेतृत्व और स्वास्थ्य' },
  Moon:    { en: 'mental peace, emotional balance and motherly comfort',  hi: 'मानसिक शांति, भावनात्मक संतुलन और मातृ सुख' },
  Mars:    { en: 'courage, energy, property and protection from enemies', hi: 'साहस, ऊर्जा, भूमि-भवन और शत्रु से रक्षा' },
  Mercury: { en: 'intellect, speech, communication and business',        hi: 'बुद्धि, वाणी, संवाद और व्यापार' },
  Jupiter: { en: 'wisdom, wealth, marriage, children and good fortune',   hi: 'ज्ञान, धन, विवाह, संतान और भाग्य' },
  Venus:   { en: 'love, marriage, comforts, beauty and artistic talent',  hi: 'प्रेम, विवाह, सुख-सुविधा, सौंदर्य और कला' },
  Saturn:  { en: 'discipline, longevity, career and relief from delays',  hi: 'अनुशासन, आयु, करियर और विलंब से राहत' },
  Rahu:    { en: 'protection from sudden troubles, illusion and confusion', hi: 'अचानक संकट, भ्रम और दुविधा से रक्षा' },
  Ketu:    { en: 'spiritual growth, detachment and relief from hidden fears', hi: 'आध्यात्मिक उन्नति, वैराग्य और गुप्त भय से मुक्ति' }
};

/* ------------------------------------------------------------------ */
/* Dosha remedy tables (classical, verified upaay)                     */
/* ------------------------------------------------------------------ */

const DOSHA_REMEDIES = {
  mangal: {
    name: 'Mangal Dosha (Manglik)',
    nameHi: 'मंगल दोष (मांगलिक)',
    deity: 'Lord Hanuman',
    deityHi: 'श्री हनुमान',
    mantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    mantraHi: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    remedies: [
      { title: 'Worship Lord Hanuman and recite the Hanuman Chalisa daily, especially on Tuesdays',
        titleHi: 'प्रतिदिन, विशेषकर मंगलवार को, श्री हनुमान की पूजा करें और हनुमान चालीसा का पाठ करें' },
      { title: 'Observe a fast (vrat) on Tuesdays and offer red flowers, red cloth and sindoor to Hanuman',
        titleHi: 'मंगलवार का व्रत रखें और हनुमान जी को लाल पुष्प, लाल वस्त्र व सिंदूर अर्पित करें' },
      { title: 'Recite the Sundarkand path on Tuesday/Saturday evenings',
        titleHi: 'मंगलवार/शनिवार की संध्या को सुंदरकांड का पाठ करें' },
      { title: 'Donate red masoor (red lentils), copper, jaggery and red cloth on Tuesdays',
        titleHi: 'मंगलवार को लाल मसूर दाल, ताँबा, गुड़ और लाल वस्त्र का दान करें' },
      { title: 'Wear Red Coral (Moonga) only after consulting a qualified astrologer',
        titleHi: 'योग्य ज्योतिषी की सलाह के बाद ही मूँगा (लाल) धारण करें' }
    ]
  },
  kaalsarp: {
    name: 'Kaal Sarp Dosha',
    nameHi: 'काल सर्प दोष',
    deity: 'Lord Shiva',
    deityHi: 'भगवान शिव',
    mantra: 'ॐ नमः शिवाय',
    mantraHi: 'ॐ नमः शिवाय',
    remedies: [
      { title: 'Perform Rahu-Ketu shanti puja / Kaal Sarp Dosh nivaran puja (Trimbakeshwar is traditional)',
        titleHi: 'राहु-केतु शांति पूजा / काल सर्प दोष निवारण पूजा करवाएं (त्र्यंबकेश्वर परंपरागत स्थान है)' },
      { title: 'Chant "Om Namah Shivaya" and worship Lord Shiva, offering water on the Shivling daily',
        titleHi: '"ॐ नमः शिवाय" का जाप करें, भगवान शिव की पूजा करें और प्रतिदिन शिवलिंग पर जल चढ़ाएं' },
      { title: 'Recite the Maha Mrityunjaya Mantra 108 times daily',
        titleHi: 'प्रतिदिन महामृत्युंजय मंत्र का 108 बार जाप करें' },
      { title: 'Worship the Naga (serpent) deities and observe a fast on Nag Panchami',
        titleHi: 'नाग देवता की पूजा करें और नाग पंचमी का व्रत रखें' },
      { title: 'Donate black sesame, iron and blankets; offer milk to a serpent idol',
        titleHi: 'काले तिल, लोहा और कंबल का दान करें; नाग प्रतिमा पर दूध अर्पित करें' }
    ]
  },
  sadesati: {
    name: 'Shani Sade Sati',
    nameHi: 'शनि साढ़े साती',
    deity: 'Lord Shani / Lord Hanuman',
    deityHi: 'शनि देव / श्री हनुमान',
    mantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
    mantraHi: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
    remedies: [
      { title: 'Recite the Hanuman Chalisa daily (especially on Saturdays and Tuesdays)',
        titleHi: 'प्रतिदिन (विशेषकर शनिवार और मंगलवार को) हनुमान चालीसा का पाठ करें' },
      { title: 'Chant the Shani beej/Shani mantra and worship Lord Shani on Saturdays',
        titleHi: 'शनि बीज/शनि मंत्र का जाप करें और शनिवार को शनि देव की पूजा करें' },
      { title: 'Observe a fast (vrat) on Saturdays',
        titleHi: 'शनिवार का व्रत रखें' },
      { title: 'Donate black sesame (til), mustard oil, iron and black cloth on Saturdays',
        titleHi: 'शनिवार को काले तिल, सरसों का तेल, लोहा और काला वस्त्र दान करें' },
      { title: 'Feed crows, dogs and the needy; light a mustard-oil lamp under a Peepal tree',
        titleHi: 'कौवों, कुत्तों व जरूरतमंदों को भोजन कराएं; पीपल के नीचे सरसों के तेल का दीपक जलाएं' }
    ]
  }
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function findDosha(doshas, names) {
  if (!Array.isArray(doshas)) return false;
  const wanted = names.map((n) => String(n).toLowerCase());
  return doshas.some((d) => {
    if (!d || d.present !== true) return false;
    const nm = String(d.name || '').toLowerCase();
    return wanted.some((w) => nm.includes(w));
  });
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

/**
 * computeRemedies(input)
 * input = {
 *   ascendant: <sign name|null>,
 *   moonSign:  <sign name|null>,
 *   planets:   [{planet, sign, house}],
 *   doshas:    [{name, present}],
 *   sadeSati:  {active, dhaiya}
 * }
 */
function computeRemedies(input) {
  input = input || {};
  const ascendant = input.ascendant || null;
  const doshas = input.doshas || [];
  const sadeSati = input.sadeSati || {};

  /* ----- Life gemstone (gemstone of the lagna lord) ----- */
  let lifeGem = null;
  if (ascendant && LAGNA_LORD[ascendant]) {
    const lord = LAGNA_LORD[ascendant];
    const g = GEMSTONE[lord];
    const beej = BEEJ_MANTRA[lord];
    lifeGem = {
      planet: lord,
      gemstone: g.en,
      gemstoneHi: g.hi,
      metal: g.metal,
      metalHi: g.metalHi,
      finger: g.finger,
      fingerHi: g.fingerHi,
      day: g.day,
      dayHi: g.dayHi,
      mantra: beej.mantra,
      note: `${g.en} is your life-stone because ${lord} rules your ${ascendant} ascendant (lagnesh); strengthening it supports your whole chart. Wear only after consulting an astrologer.`,
      noteHi: `${g.hi} आपका जीवन रत्न है क्योंकि ${PLANET_HI[lord]} आपके ${ascendant} लग्न के स्वामी (लग्नेश) हैं; इसे बल देने से सम्पूर्ण कुंडली को सहारा मिलता है। योग्य ज्योतिषी की सलाह के बाद ही धारण करें।`
    };
  }

  /* ----- Dosha remedies (Mangal, Kaal Sarp, Sade Sati) ----- */
  const mangalPresent = findDosha(doshas, ['mangal', 'manglik', 'kuja', 'bhaum']);
  const kaalsarpPresent = findDosha(doshas, ['kaal sarp', 'kaalsarp', 'kalsarp', 'kal sarp']);
  // Sade Sati: prefer explicit sadeSati.active; also honour a dosha entry if provided.
  const sadeSatiPresent =
    sadeSati.active === true ||
    sadeSati.dhaiya === true ||
    findDosha(doshas, ['sade sati', 'sadesati', 'shani']);

  const presence = { mangal: mangalPresent, kaalsarp: kaalsarpPresent, sadesati: sadeSatiPresent };

  const doshaRemedies = ['mangal', 'kaalsarp', 'sadesati'].map((key) => {
    const d = DOSHA_REMEDIES[key];
    return {
      key,
      name: d.name,
      nameHi: d.nameHi,
      present: presence[key] === true,
      remedies: d.remedies,
      mantra: d.mantra,
      mantraHi: d.mantraHi,
      deity: d.deity,
      deityHi: d.deityHi
    };
  });

  /* ----- All 9 planet mantras ----- */
  const planetMantras = PLANET_ORDER.map((planet) => ({
    planet,
    planetHi: PLANET_HI[planet],
    mantra: BEEJ_MANTRA[planet].mantra,
    count: BEEJ_MANTRA[planet].count,
    forWhat: PLANET_FORWHAT[planet].en,
    forWhatHi: PLANET_FORWHAT[planet].hi
  }));

  return { lifeGem, doshaRemedies, planetMantras };
}

module.exports = { computeRemedies, LAGNA_LORD, GEMSTONE, BEEJ_MANTRA };

/* ------------------------------------------------------------------ */
/* Self-test                                                           */
/* ------------------------------------------------------------------ */

if (require.main === module) {
  const util = require('util');
  const show = (x) => console.log(util.inspect(x, { depth: null, colors: false, maxArrayLength: null }));

  console.log('================ SAMPLE 1: Leo ascendant, Mangal + Sade Sati present ================');
  const sample1 = computeRemedies({
    ascendant: 'Leo',
    moonSign: 'Scorpio',
    planets: [
      { planet: 'Sun', sign: 'Leo', house: 1 },
      { planet: 'Mars', sign: 'Scorpio', house: 4 },
      { planet: 'Saturn', sign: 'Cancer', house: 12 }
    ],
    doshas: [
      { name: 'Mangal Dosha', present: true },
      { name: 'Kaal Sarp Dosha', present: false }
    ],
    sadeSati: { active: true, dhaiya: false }
  });
  show(sample1);

  console.log('\n================ SAMPLE 2: Taurus ascendant, no doshas, Kaal Sarp only ================');
  const sample2 = computeRemedies({
    ascendant: 'Taurus',
    moonSign: 'Gemini',
    planets: [
      { planet: 'Venus', sign: 'Taurus', house: 1 },
      { planet: 'Rahu', sign: 'Aries', house: 12 }
    ],
    doshas: [
      { name: 'Mangal Dosha', present: false },
      { name: 'Kaal Sarp Dosha', present: true }
    ],
    sadeSati: { active: false, dhaiya: false }
  });
  show(sample2);

  console.log('\n================ Devanagari spot-check (beej mantras) ================');
  Object.keys(BEEJ_MANTRA).forEach((p) => {
    console.log(`${p.padEnd(8)} -> ${BEEJ_MANTRA[p].mantra}   (${BEEJ_MANTRA[p].count})`);
  });

  console.log('\n================ Null ascendant -> lifeGem null ================');
  console.log('lifeGem =', computeRemedies({ ascendant: null }).lifeGem);
}
