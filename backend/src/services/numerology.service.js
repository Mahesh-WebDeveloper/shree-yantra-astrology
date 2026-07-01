'use strict';
/**
 * numerology.service.js — 100% local, deterministic numerology engine. NO external API.
 *
 * Faithful JS port of the reference numerology_engine.py. The MATH here is exact and
 * reproducible (see numerology.test.js). The INTERPRETATION tables (friend/enemy, lucky,
 * planet remedies) come from TRADITION and vary between numerologists — they are kept in
 * clearly-marked, editable config below so a real numerologist can validate them. The app
 * always ships a "guidance only" disclaimer. The AI layer NEVER computes any of these
 * numbers — it only interprets this finished payload.
 *
 * Primary system for Indian users: CHALDEAN (phonetic, planet-linked). Pythagorean extras
 * (Soul Urge / Personality) are provided too.
 */

// ── 1. LETTER MAPS ─────────────────────────────────────────────────────────
// Chaldean: values 1-8 only. 9 is sacred and never assigned to a letter.
const CHALDEAN = {
  a: 1, i: 1, j: 1, q: 1, y: 1,
  b: 2, k: 2, r: 2,
  c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8,
};
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const MASTER_NUMBERS = new Set([11, 22, 33]);
const KARMIC_DEBT = new Set([13, 14, 16, 19]);

function pythagoreanValue(ch) {
  const pos = ch.toLowerCase().charCodeAt(0) - 96; // a=1 … z=26
  if (pos < 1 || pos > 26) return 0;
  return ((pos - 1) % 9) + 1;
}
function chaldeanValue(ch) { return CHALDEAN[ch.toLowerCase()] || 0; }

// ── 2. REDUCTION WITH MASTER + KARMIC RULES ────────────────────────────────
function reduceNumber(n, keepMaster = true) {
  const compound = n;                 // the sum BEFORE final reduction (e.g. 13 behind a 4)
  let isKarmic = KARMIC_DEBT.has(compound);
  while (n > 9) {
    if (keepMaster && MASTER_NUMBERS.has(n)) break;
    n = String(n).split('').reduce((s, d) => s + Number(d), 0);
    if (KARMIC_DEBT.has(n)) isKarmic = true;
  }
  return { final: n, compound, isMaster: MASTER_NUMBERS.has(n), isKarmic };
}

// ── 3. CORE NUMBERS ────────────────────────────────────────────────────────
const pad2 = (n) => (n < 10 ? '0' : '') + n;
function normalizeName(name) { return String(name || '').toLowerCase().replace(/[^a-z]/g, ''); }

function mulank(day) { return reduceNumber(Number(day), false); }                 // Driver / Psychic
function bhagyank(d, m, y) {                                                        // Conductor / Destiny (Life Path)
  const digits = `${pad2(d)}${pad2(m)}${String(y).padStart(4, '0')}`;
  const total = digits.split('').reduce((s, c) => s + Number(c), 0);
  return reduceNumber(total);
}
function namank(name, system = 'chaldean') {
  const valfn = system === 'chaldean' ? chaldeanValue : pythagoreanValue;
  const total = normalizeName(name).split('').reduce((s, c) => s + valfn(c), 0);
  return reduceNumber(total);
}
function soulUrge(name) {                                                           // vowels (Pythagorean)
  const total = normalizeName(name).split('').filter((c) => VOWELS.has(c)).reduce((s, c) => s + pythagoreanValue(c), 0);
  return reduceNumber(total);
}
function personality(name) {                                                       // consonants (Pythagorean)
  const total = normalizeName(name).split('').filter((c) => !VOWELS.has(c)).reduce((s, c) => s + pythagoreanValue(c), 0);
  return reduceNumber(total);
}
function personalYear(d, m, year) {
  const total = `${d}${m}${year}`.split('').reduce((s, c) => s + Number(c), 0);
  return reduceNumber(total, false);
}

// ── 4. NUMBER → PLANET (Vedic / Indian numerology convention) ──────────────
const NUMBER_PLANET = {
  1: { en: 'Sun', hi: 'सूर्य' }, 2: { en: 'Moon', hi: 'चंद्र' }, 3: { en: 'Jupiter', hi: 'गुरु' },
  4: { en: 'Rahu', hi: 'राहु' }, 5: { en: 'Mercury', hi: 'बुध' }, 6: { en: 'Venus', hi: 'शुक्र' },
  7: { en: 'Ketu', hi: 'केतु' }, 8: { en: 'Saturn', hi: 'शनि' }, 9: { en: 'Mars', hi: 'मंगल' },
  11: { en: 'Sun (Master)', hi: 'सूर्य (मास्टर)' }, 22: { en: 'Rahu (Master)', hi: 'राहु (मास्टर)' }, 33: { en: 'Jupiter (Master)', hi: 'गुरु (मास्टर)' },
};
const planetOf = (n) => NUMBER_PLANET[n] || NUMBER_PLANET[reduceNumber(n, false).final] || null;

// ── 5. LO SHU GRID (Saturn magic square) ───────────────────────────────────
//   4 9 2
//   3 5 7
//   8 1 6
const LOSHU_POS = { 4: [0, 0], 9: [0, 1], 2: [0, 2], 3: [1, 0], 5: [1, 1], 7: [1, 2], 8: [2, 0], 1: [2, 1], 6: [2, 2] };
const LOSHU_LINES = {
  mental: { nums: [4, 9, 2], en: 'Mental Plane', hi: 'मानसिक तल' },
  emotional: { nums: [3, 5, 7], en: 'Emotional Plane', hi: 'भावनात्मक तल' },
  practical: { nums: [8, 1, 6], en: 'Practical Plane', hi: 'व्यावहारिक तल' },
  thought: { nums: [4, 3, 8], en: 'Thought Plane', hi: 'विचार तल' },
  will: { nums: [9, 5, 1], en: 'Will Plane', hi: 'इच्छाशक्ति तल' },
  action: { nums: [2, 7, 6], en: 'Action Plane', hi: 'कर्म तल' },
  golden: { nums: [4, 5, 6], en: 'Golden Yog (Rajyog)', hi: 'स्वर्ण योग (राजयोग)' },
  silver: { nums: [2, 5, 8], en: 'Silver Yog', hi: 'रजत योग' },
};
function loShuGrid(d, m, y, addDriverConductor = true) {
  const digits = `${pad2(d)}${pad2(m)}${String(y).padStart(4, '0')}`.split('').map(Number).filter((x) => x !== 0);
  if (addDriverConductor) { digits.push(mulank(d).final); digits.push(bhagyank(d, m, y).final); }
  const counts = {};
  for (let n = 1; n <= 9; n += 1) counts[n] = 0;
  digits.forEach((x) => { if (x >= 1 && x <= 9) counts[x] += 1; });
  const missing = [];
  for (let n = 1; n <= 9; n += 1) if (counts[n] === 0) missing.push(n);
  const present = []; const absent = [];
  Object.entries(LOSHU_LINES).forEach(([key, line]) => {
    if (line.nums.every((n) => counts[n] > 0)) present.push({ key, en: line.en, hi: line.hi });
    else if (line.nums.every((n) => counts[n] === 0)) absent.push({ key, en: line.en, hi: line.hi });
  });
  return { counts, positions: LOSHU_POS, missing, presentArrows: present, missingArrows: absent };
}

// ── 6. COMPATIBILITY (mobile / vehicle / partner) ──────────────────────────
// NOTE: Friend/enemy tables VARY by tradition. Editable — validate with a numerologist.
const FRIENDS = {
  1: [1, 2, 3, 5, 9], 2: [1, 2, 3, 5], 3: [1, 2, 3, 5, 9], 4: [1, 5, 6, 7],
  5: [1, 2, 3, 4, 5, 6, 7, 8, 9], 6: [1, 4, 5, 6, 7, 8], 7: [1, 4, 5, 6], 8: [3, 5, 6, 8], 9: [1, 2, 3, 5, 9],
};
const ENEMIES = {
  1: [8], 2: [4, 8, 9], 3: [6, 8], 4: [2, 3, 8, 9], 5: [], 6: [2, 3, 9], 7: [2, 3, 8, 9], 8: [1, 2, 4, 7], 9: [4, 6, 7],
};
function numberTotal(digitsStr) {
  const total = String(digitsStr).replace(/\D/g, '').split('').reduce((s, c) => s + Number(c), 0);
  return reduceNumber(total, false);
}
function relation(userNumber, targetNumber) {
  if ((ENEMIES[userNumber] || []).includes(targetNumber)) return { key: 'enemy', en: 'Enemy', hi: 'शत्रु' };
  if ((FRIENDS[userNumber] || []).includes(targetNumber)) return { key: 'friend', en: 'Friend', hi: 'मित्र' };
  return { key: 'neutral', en: 'Neutral', hi: 'सम' };
}
function checkNumber(userMulank, sequence) {
  const t = numberTotal(sequence).final;
  return { input: String(sequence), numberTotal: t, planet: planetOf(t), relation: relation(userMulank, t) };
}

// ── 7. LUCKY + PLANET REMEDIES (traditional, editable config) ──────────────
const LUCKY = {
  1: { numbers: [1, 3, 9], colors: { en: ['Gold', 'Orange', 'Red'], hi: ['सुनहरा', 'नारंगी', 'लाल'] }, days: { en: ['Sunday'], hi: ['रविवार'] }, gem: { en: 'Ruby', hi: 'माणिक्य' } },
  2: { numbers: [2, 7, 1], colors: { en: ['White', 'Cream', 'Silver'], hi: ['सफेद', 'क्रीम', 'चाँदी'] }, days: { en: ['Monday'], hi: ['सोमवार'] }, gem: { en: 'Pearl', hi: 'मोती' } },
  3: { numbers: [3, 6, 9], colors: { en: ['Yellow', 'Saffron'], hi: ['पीला', 'केसरिया'] }, days: { en: ['Thursday'], hi: ['गुरुवार'] }, gem: { en: 'Yellow Sapphire', hi: 'पुखराज' } },
  4: { numbers: [4, 1, 7], colors: { en: ['Grey', 'Blue'], hi: ['धूसर', 'नीला'] }, days: { en: ['Saturday'], hi: ['शनिवार'] }, gem: { en: 'Gomed (Hessonite)', hi: 'गोमेद' } },
  5: { numbers: [5, 6, 1], colors: { en: ['Green', 'Turquoise'], hi: ['हरा', 'फ़िरोज़ी'] }, days: { en: ['Wednesday'], hi: ['बुधवार'] }, gem: { en: 'Emerald', hi: 'पन्ना' } },
  6: { numbers: [6, 5, 3], colors: { en: ['White', 'Pink', 'Blue'], hi: ['सफेद', 'गुलाबी', 'नीला'] }, days: { en: ['Friday'], hi: ['शुक्रवार'] }, gem: { en: 'Diamond / Opal', hi: 'हीरा / ओपल' } },
  7: { numbers: [7, 2, 1], colors: { en: ['Light Green', 'Grey'], hi: ['हल्का हरा', 'धूसर'] }, days: { en: ['Monday'], hi: ['सोमवार'] }, gem: { en: "Cat's Eye", hi: 'लहसुनिया' } },
  8: { numbers: [8, 3, 5], colors: { en: ['Dark Blue', 'Black'], hi: ['गहरा नीला', 'काला'] }, days: { en: ['Saturday'], hi: ['शनिवार'] }, gem: { en: 'Blue Sapphire', hi: 'नीलम' } },
  9: { numbers: [9, 3, 1], colors: { en: ['Red', 'Crimson'], hi: ['लाल', 'सिंदूरी'] }, days: { en: ['Tuesday'], hi: ['मंगलवार'] }, gem: { en: 'Red Coral', hi: 'मूंगा' } },
};
const PLANET_REMEDY = {
  1: { en: 'Offer water to the Sun at sunrise; respect father/elders; Sunday.', hi: 'सूर्योदय पर सूर्य को जल दें; पिता/बड़ों का सम्मान; रविवार का महत्व।' },
  2: { en: 'Keep silver; drink water in a silver vessel; Monday; respect mother.', hi: 'चाँदी रखें; चाँदी के पात्र में जल; सोमवार; माँ का सम्मान।' },
  3: { en: 'Serve teachers/Brahmins; turmeric; Thursday; Guru mantra.', hi: 'गुरु/ब्राह्मण की सेवा; हल्दी; गुरुवार; गुरु मंत्र।' },
  4: { en: 'Donate on Saturday; keep discipline; Rahu mantra; avoid shortcuts.', hi: 'शनिवार दान; अनुशासन; राहु मंत्र; शॉर्टकट से बचें।' },
  5: { en: 'Green items; feed birds; Wednesday; Budh mantra.', hi: 'हरी वस्तुएँ; पक्षियों को दाना; बुधवार; बुध मंत्र।' },
  6: { en: 'Respect women; white/fragrance; Friday; Shukra mantra.', hi: 'स्त्रियों का सम्मान; सफेद/सुगंध; शुक्रवार; शुक्र मंत्र।' },
  7: { en: 'Keep faith; donate blankets; Ketu mantra; meditation.', hi: 'श्रद्धा रखें; कम्बल दान; केतु मंत्र; ध्यान।' },
  8: { en: 'Serve the poor/labourers; mustard oil on Saturday; Shani mantra.', hi: 'गरीब/मज़दूर की सेवा; शनिवार सरसों तेल दान; शनि मंत्र।' },
  9: { en: 'Donate on Tuesday; Hanuman ji; Mangal mantra; control anger.', hi: 'मंगलवार दान; हनुमान जी; मंगल मंत्र; क्रोध नियंत्रण।' },
};

// ── 7b. PER-NUMBER MEANINGS (traditional, editable config) ─────────────────
// Deterministic, number-specific content so every card shows real meaning (not a
// generic label). Different for each number → "dynamic" per profile. Validate with a
// numerologist; the AI layer adds extra personalisation on top of this.
const NUMBER_MEANINGS = {
  1: {
    keywords: { en: ['Leadership', 'Confidence', 'Independence', 'Ambition', 'Originality'], hi: ['नेतृत्व', 'आत्मविश्वास', 'स्वतंत्रता', 'महत्वाकांक्षा', 'मौलिकता'] },
    nature: { en: 'A born leader — confident, independent and determined. You dislike taking orders and prefer to forge your own path.', hi: 'आप जन्मजात नेता हैं — आत्मविश्वासी, स्वतंत्र और दृढ़-निश्चयी। आदेश लेना पसंद नहीं, अपने दम पर आगे बढ़ते हैं।' },
    lifePath: { en: 'Your path leads toward leadership, authority and self-reliance — where you initiate and show others the way.', hi: 'आपका जीवन-पथ नेतृत्व, अधिकार और आत्मनिर्भरता की ओर है — जहाँ आप पहल करें और राह दिखाएँ।' },
    career: { en: ['Administration', 'Own business', 'Politics / Govt', 'Management'], hi: ['प्रशासन', 'स्वयं का व्यवसाय', 'राजनीति/सरकारी पद', 'प्रबंधन'] },
    strength: { en: 'Strong willpower and clear vision.', hi: 'दृढ़ इच्छाशक्ति और स्पष्ट दृष्टि।' },
    caution: { en: 'Avoid ego and stubbornness; listen to others.', hi: 'अहंकार और ज़िद से बचें; दूसरों की राय सुनें।' },
  },
  2: {
    keywords: { en: ['Sensitivity', 'Cooperation', 'Intuition', 'Diplomacy', 'Imagination'], hi: ['संवेदनशीलता', 'सहयोग', 'अंतर्ज्ञान', 'कूटनीति', 'कल्पनाशीलता'] },
    nature: { en: 'Gentle, emotional and cooperative — you seek depth and peace in relationships and have sharp intuition.', hi: 'आप कोमल, भावुक और सहयोगी हैं — रिश्तों में गहराई व शांति चाहते हैं, अंतर्दृष्टि तेज़ है।' },
    lifePath: { en: 'Partnership, support and creativity — a path of connecting and nurturing.', hi: 'साझेदारी, सहयोग और सृजन आपकी राह — जोड़ने व सँवारने का काम।' },
    career: { en: ['Counselling', 'Art / Music', 'Teaching', 'Teamwork', 'Public relations'], hi: ['परामर्श', 'कला/संगीत', 'शिक्षण', 'टीम-वर्क', 'जनसंपर्क'] },
    strength: { en: 'Empathy and the gift of harmony.', hi: 'सहानुभूति और तालमेल की शक्ति।' },
    caution: { en: 'Control over-sensitivity and mood swings.', hi: 'अति-भावुकता व मन के उतार-चढ़ाव पर नियंत्रण रखें।' },
  },
  3: {
    keywords: { en: ['Wisdom', 'Optimism', 'Creativity', 'Expression', 'Discipline'], hi: ['ज्ञान', 'आशावाद', 'रचनात्मकता', 'अभिव्यक्ति', 'अनुशासन'] },
    nature: { en: 'Cheerful, wise and ambitious — you love learning and teaching, and discipline is your strength.', hi: 'आप हँसमुख, ज्ञानी और महत्वाकांक्षी हैं — सीखना-सिखाना पसंद, अनुशासन आपकी ताक़त।' },
    lifePath: { en: 'Education, guidance and expansion — sharing knowledge and growing.', hi: 'शिक्षा, मार्गदर्शन और विस्तार आपकी राह — ज्ञान बाँटें और बढ़ें।' },
    career: { en: ['Teaching', 'Law', 'Finance / Banking', 'Advisory', 'Writing', 'Spirituality'], hi: ['शिक्षण', 'कानून', 'वित्त/बैंकिंग', 'सलाहकार', 'लेखन', 'अध्यात्म'] },
    strength: { en: 'Knowledge, discipline and optimism.', hi: 'ज्ञान, अनुशासन और आशावाद।' },
    caution: { en: 'Avoid over-confidence and scattering energy.', hi: 'अति-आत्मविश्वास व बिखराव से बचें।' },
  },
  4: {
    keywords: { en: ['Practicality', 'Hard work', 'System', 'Reformer', 'Persistence'], hi: ['व्यावहारिकता', 'परिश्रम', 'व्यवस्था', 'सुधारवादी', 'दृढ़ता'] },
    nature: { en: 'Hard-working, systematic and practical — you think differently, but can be stubborn.', hi: 'आप मेहनती, व्यवस्थित और व्यावहारिक हैं — लीक से हटकर सोचते हैं, पर जिद्दी हो सकते हैं।' },
    lifePath: { en: 'Solid building and reform — creating structure and driving change.', hi: 'ठोस निर्माण और सुधार आपकी राह — व्यवस्था बनाएँ व बदलाव लाएँ।' },
    career: { en: ['Technology / Engineering', 'Real estate', 'Administration', 'Social reform'], hi: ['तकनीक/इंजीनियरिंग', 'रियल एस्टेट', 'प्रशासनिक कार्य', 'समाज-सुधार'] },
    strength: { en: 'Diligence and dependability.', hi: 'परिश्रम और भरोसेमंदी।' },
    caution: { en: 'Be ready for sudden change; stay patient, ease the stubbornness.', hi: 'अचानक बदलाव के लिए तैयार रहें; धैर्य रखें, ज़िद कम करें।' },
  },
  5: {
    keywords: { en: ['Intelligence', 'Versatile', 'Communication', 'Business', 'Adaptable'], hi: ['बुद्धि', 'बहुमुखी', 'संवाद', 'व्यापार', 'अनुकूलनशीलता'] },
    nature: { en: 'Quick-witted, talkative and friendly — you love novelty and freedom, but stay restless.', hi: 'आप तेज़ बुद्धि, बातूनी और मिलनसार हैं — नयापन व स्वतंत्रता पसंद, पर बेचैन रहते हैं।' },
    lifePath: { en: 'Communication, trade and movement — connecting, selling and travelling.', hi: 'संवाद, व्यापार और गति आपकी राह — जुड़ें, बेचें और घूमें।' },
    career: { en: ['Business', 'Media / Communication', 'Marketing', 'Travel / Tourism', 'Broking'], hi: ['व्यापार', 'मीडिया/संचार', 'मार्केटिंग', 'यात्रा/पर्यटन', 'दलाली'] },
    strength: { en: 'Sharp mind and adaptability.', hi: 'तेज़ दिमाग और अनुकूलन।' },
    caution: { en: 'Avoid restlessness; commit to one direction.', hi: 'बेचैनी व बिखराव से बचें; एक दिशा पर टिकें।' },
  },
  6: {
    keywords: { en: ['Love', 'Art', 'Beauty', 'Responsibility', 'Family'], hi: ['प्रेम', 'कला', 'सौंदर्य', 'ज़िम्मेदारी', 'परिवार'] },
    nature: { en: 'Loving, artistic and charming — drawn to beauty, comfort and family bonds.', hi: 'आप प्रेममयी, कलात्मक और आकर्षक हैं — सुंदरता, सुख-सुविधा व परिवार से जुड़ाव।' },
    lifePath: { en: 'Beauty, service and harmony — a path of caring and creating.', hi: 'सौंदर्य, सेवा और सामंजस्य आपकी राह — सँवारें और सँभालें।' },
    career: { en: ['Art / Design', 'Hospitality', 'Beauty / Fashion', 'Healthcare / Service', 'Family business'], hi: ['कला/डिज़ाइन', 'आतिथ्य', 'सौंदर्य/फैशन', 'चिकित्सा/सेवा', 'पारिवारिक व्यवसाय'] },
    strength: { en: 'Love, art and responsibility.', hi: 'प्रेम, कला और उत्तरदायित्व।' },
    caution: { en: 'Avoid over-indulgence and over-dependence on others.', hi: 'अति-भोग व दूसरों पर निर्भरता से बचें।' },
  },
  7: {
    keywords: { en: ['Spirituality', 'Analysis', 'Introspection', 'Research', 'Detachment'], hi: ['अध्यात्म', 'विश्लेषण', 'अंतर्मुखता', 'शोध', 'वैराग्य'] },
    nature: { en: 'Thoughtful, spiritual and introverted — drawn to depth, mystery and research.', hi: 'आप विचारशील, आध्यात्मिक और अंतर्मुखी हैं — गहराई, रहस्य व शोध में रुचि।' },
    lifePath: { en: 'Research, spirituality and self-discovery — going deep within.', hi: 'शोध, अध्यात्म और आत्म-खोज आपकी राह — गहराई तक जाएँ।' },
    career: { en: ['Research / Science', 'Spirituality', 'Psychology', 'Healthcare', 'Philosophy'], hi: ['शोध/विज्ञान', 'अध्यात्म', 'मनोविज्ञान', 'चिकित्सा', 'दर्शन'] },
    strength: { en: 'Deep thinking and intuition.', hi: 'गहन सोच और अंतर्ज्ञान।' },
    caution: { en: 'Avoid isolation and doubt; keep faith.', hi: 'अकेलेपन व संशय से बचें; श्रद्धा रखें।' },
  },
  8: {
    keywords: { en: ['Ambition', 'Discipline', 'Justice', 'Karma', 'Patience'], hi: ['महत्वाकांक्षा', 'अनुशासन', 'न्याय', 'कर्म', 'धैर्य'] },
    nature: { en: 'Ambitious, disciplined and serious — karma-driven; success comes after struggle but lasts.', hi: 'आप महत्वाकांक्षी, अनुशासित और गंभीर हैं — कर्म-प्रधान; सफलता संघर्ष के बाद, पर स्थायी।' },
    lifePath: { en: 'Justice, organisation and lasting success — building big through patience.', hi: 'न्याय, संगठन और स्थायी सफलता आपकी राह — धैर्य से बड़ा निर्माण।' },
    career: { en: ['Business', 'Law', 'Administration', 'Real estate', 'Service'], hi: ['व्यापार', 'कानून', 'प्रशासन', 'रियल एस्टेट', 'सेवा-कार्य'] },
    strength: { en: 'Patience, discipline and persistence.', hi: 'धैर्य, अनुशासन और दृढ़ता।' },
    caution: { en: 'Avoid despair and haste; stay honest.', hi: 'निराशा व जल्दबाज़ी से बचें; ईमानदारी रखें।' },
  },
  9: {
    keywords: { en: ['Energy', 'Courage', 'Determination', 'Humanity', 'Leadership'], hi: ['ऊर्जा', 'साहस', 'दृढ़ता', 'मानवता', 'नेतृत्व'] },
    nature: { en: 'Energetic, courageous and firm — a protector at heart; controlling anger is key.', hi: 'आप ऊर्जावान, साहसी और दृढ़ हैं — रक्षक स्वभाव; क्रोध पर नियंत्रण ज़रूरी।' },
    lifePath: { en: 'Courage, service and leadership — a path of fighting for and protecting others.', hi: 'साहस, सेवा और नेतृत्व आपकी राह — लड़ें और रक्षा करें।' },
    career: { en: ['Defence / Police', 'Sports', 'Surgery', 'Engineering', 'Social service'], hi: ['रक्षा/पुलिस', 'खेल', 'सर्जरी', 'इंजीनियरिंग', 'समाज-सेवा'] },
    strength: { en: 'Courage and energy.', hi: 'साहस और ऊर्जा।' },
    caution: { en: 'Control anger and impulsiveness.', hi: 'क्रोध व आवेग पर नियंत्रण रखें।' },
  },
  11: {
    keywords: { en: ['Intuition', 'Idealism', 'Inspiration', 'Vision'], hi: ['अंतर्ज्ञान', 'आदर्शवाद', 'प्रेरणा', 'दूरदृष्टि'] },
    nature: { en: 'A master number — highly intuitive and idealistic, meant to inspire others.', hi: 'मास्टर अंक — अत्यंत अंतर्ज्ञानी व आदर्शवादी, दूसरों को प्रेरित करने के लिए।' },
    lifePath: { en: 'Spiritual inspiration and guidance on a large scale.', hi: 'बड़े स्तर पर आध्यात्मिक प्रेरणा व मार्गदर्शन।' },
    career: { en: ['Spiritual guide', 'Counselling', 'Arts', 'Innovation'], hi: ['आध्यात्मिक गुरु', 'परामर्श', 'कला', 'नवाचार'] },
    strength: { en: 'Vision and inspiration.', hi: 'दूरदृष्टि और प्रेरणा।' },
    caution: { en: 'Ground your ideals in practical action.', hi: 'आदर्शों को व्यावहारिक कर्म में उतारें।' },
  },
  22: {
    keywords: { en: ['Master Builder', 'Vision', 'Mastery', 'Impact'], hi: ['मास्टर बिल्डर', 'दूरदृष्टि', 'निपुणता', 'प्रभाव'] },
    nature: { en: 'A master number — the "master builder": big vision paired with practical mastery.', hi: 'मास्टर अंक — "मास्टर बिल्डर": बड़ी दूरदृष्टि के साथ व्यावहारिक निपुणता।' },
    lifePath: { en: 'Turning great ideas into large, lasting achievements.', hi: 'बड़े विचारों को स्थायी, विशाल उपलब्धियों में बदलना।' },
    career: { en: ['Large enterprise', 'Architecture', 'Nation-building work', 'Leadership'], hi: ['बड़ा उद्यम', 'वास्तुकला', 'राष्ट्र-निर्माण कार्य', 'नेतृत्व'] },
    strength: { en: 'Vision plus execution.', hi: 'दूरदृष्टि के साथ क्रियान्वयन।' },
    caution: { en: 'Avoid burnout under great pressure.', hi: 'भारी दबाव में थकान से बचें।' },
  },
  33: {
    keywords: { en: ['Master Teacher', 'Compassion', 'Healing', 'Guidance'], hi: ['मास्टर शिक्षक', 'करुणा', 'उपचार', 'मार्गदर्शन'] },
    nature: { en: 'A master number — the "master teacher": compassion and selfless service to uplift others.', hi: 'मास्टर अंक — "मास्टर शिक्षक": करुणा व निःस्वार्थ सेवा से दूसरों का उत्थान।' },
    lifePath: { en: 'Healing, teaching and guiding humanity.', hi: 'मानवता का उपचार, शिक्षण व मार्गदर्शन।' },
    career: { en: ['Teaching', 'Healing', 'Social leadership', 'Spirituality'], hi: ['शिक्षण', 'उपचार', 'सामाजिक नेतृत्व', 'अध्यात्म'] },
    strength: { en: 'Compassion and wisdom.', hi: 'करुणा और ज्ञान।' },
    caution: { en: 'Care for self while serving others.', hi: 'दूसरों की सेवा में स्वयं का भी ध्यान रखें।' },
  },
};
const meaningOf = (n) => NUMBER_MEANINGS[n] || NUMBER_MEANINGS[reduceNumber(n, false).final] || null;

// Personal-year theme (deterministic, editable).
const PERSONAL_YEAR_MEANINGS = {
  1: { en: 'New beginnings — plant seeds, take initiative, start fresh.', hi: 'नई शुरुआत — बीज बोएँ, पहल करें, नए सिरे से आरंभ।' },
  2: { en: 'Patience & partnerships — nurture relationships and cooperation.', hi: 'धैर्य व साझेदारी — रिश्ते और सहयोग सँवारें।' },
  3: { en: 'Creativity & expansion — express yourself, socialise, grow.', hi: 'रचनात्मकता व विस्तार — आत्म-अभिव्यक्ति, मेल-जोल, विकास।' },
  4: { en: 'Hard work & foundations — build structure and stability.', hi: 'मेहनत व नींव — व्यवस्था और स्थिरता बनाएँ।' },
  5: { en: 'Change & freedom — opportunities, travel and new directions.', hi: 'बदलाव व स्वतंत्रता — अवसर, यात्रा व नई दिशाएँ।' },
  6: { en: 'Family & responsibility — love, service and home matters.', hi: 'परिवार व ज़िम्मेदारी — प्रेम, सेवा व घर के मामले।' },
  7: { en: 'Reflection & study — inner growth and spirituality.', hi: 'आत्म-चिंतन व अध्ययन — आंतरिक विकास व अध्यात्म।' },
  8: { en: 'Achievement & reward — success, money and recognition.', hi: 'सफलता व फल — उपलब्धि, धन व मान-सम्मान।' },
  9: { en: 'Completion & release — let go of the old, make space for the new.', hi: 'समापन व त्याग — पुराना छोड़ें, नए के लिए जगह बनाएँ।' },
};

// ── 8. NAME-CORRECTION HINT (premium) ──────────────────────────────────────
// Honest, config-driven hint (NOT a guarantee): if the current Namank clashes with the
// Destiny/Bhagyank, list which target Name-numbers would be friendlier.
function nameCorrectionHint(name, driverMulank, destinyBhagyank) {
  const cur = namank(name, 'chaldean');
  const relToDriver = relation(driverMulank, cur.final);
  const relToDestiny = relation(destinyBhagyank, cur.final);
  const already = relToDriver.key !== 'enemy' && relToDestiny.key !== 'enemy';
  // numbers that are friendly to BOTH driver and destiny
  const targets = [];
  for (let n = 1; n <= 9; n += 1) {
    if (relation(driverMulank, n).key === 'friend' && relation(destinyBhagyank, n).key === 'friend') targets.push(n);
  }
  return {
    currentNamank: cur.final,
    relationToDriver: relToDriver,
    relationToDestiny: relToDestiny,
    isHarmonious: already,
    suggestedNameNumbers: targets,
    note: {
      en: already
        ? 'Your name number sits well with your core numbers — no change needed.'
        : 'A minor spelling tweak that shifts your Name number to one of the suggested numbers can improve harmony. Confirm with a professional numerologist before changing your name.',
      hi: already
        ? 'आपका नामांक आपके मूल अंकों से मेल खाता है — बदलाव की ज़रूरत नहीं।'
        : 'नाम की स्पेलिंग में छोटा बदलाव जिससे नामांक सुझाए गए अंकों में से कोई बने, सामंजस्य बढ़ा सकता है। नाम बदलने से पहले किसी योग्य अंकशास्त्री से पुष्टि करें।',
    },
  };
}

// ── 9. FULL PROFILE ────────────────────────────────────────────────────────
const DISCLAIMER = {
  en: 'The calculations are exact; the interpretations are traditional guidance for reflection only, not scientific fact.',
  hi: 'गणनाएँ सटीक हैं; व्याख्या केवल परंपरागत मार्गदर्शन है (चिंतन हेतु), वैज्ञानिक तथ्य नहीं।',
};

function withPlanet(r) { return { ...r, planet: planetOf(r.final), remedy: PLANET_REMEDY[r.final] || null, meaning: meaningOf(r.final) }; }

function fullProfile({ name = '', d, m, y, currentYear }) {
  const day = Number(d); const month = Number(m); const year = Number(y);
  if (!(day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1000)) {
    const e = new Error('Valid date of birth (d, m, y) required'); e.status = 400; throw e;
  }
  const cy = Number(currentYear) || new Date().getFullYear();
  const mu = mulank(day);
  const bh = bhagyank(day, month, year);
  const nk = namank(name, 'chaldean');
  const py = personalYear(day, month, cy);
  return {
    name: String(name || '').trim(),
    dob: `${pad2(day)}/${pad2(month)}/${year}`,
    system: 'chaldean',
    mulank: withPlanet(mu),
    bhagyank: withPlanet(bh),
    namank: { ...withPlanet(nk), pythagorean: namank(name, 'pythagorean').final },
    soulUrge: soulUrge(name),
    personality: personality(name),
    personalYear: { ...py, meaning: PERSONAL_YEAR_MEANINGS[py.final] || null },
    loShu: loShuGrid(day, month, year),
    lucky: LUCKY[mu.final] || null,
    nameCorrection: name ? nameCorrectionHint(name, mu.final, bh.final) : null,
    disclaimer: DISCLAIMER,
  };
}

module.exports = {
  // constants (exported for tests / config editing)
  CHALDEAN, MASTER_NUMBERS, KARMIC_DEBT, NUMBER_PLANET, LOSHU_LINES, FRIENDS, ENEMIES, LUCKY, PLANET_REMEDY, NUMBER_MEANINGS, PERSONAL_YEAR_MEANINGS, meaningOf, DISCLAIMER,
  // primitives
  pythagoreanValue, chaldeanValue, reduceNumber, normalizeName,
  // core
  mulank, bhagyank, namank, soulUrge, personality, personalYear, planetOf,
  loShuGrid, numberTotal, relation, checkNumber, nameCorrectionHint,
  // top-level
  fullProfile,
};
