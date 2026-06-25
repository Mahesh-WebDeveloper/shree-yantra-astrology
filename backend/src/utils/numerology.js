'use strict';

/**
 * numerology.js
 * ---------------------------------------------------------------------------
 * Deterministic NAME NUMEROLOGY (Cheiro / Chaldean system) — the convention
 * used by Indian name platforms (Hamariweb, FirstCry, MomJunction) to show a
 * name's "lucky number" and its lucky color / stone / metal / day / planet.
 *
 * This is computed in CODE (never AI-generated) so the per-name astrology card
 * is trustworthy. The Chaldean letter values and the root-number → lucky
 * associations are the standard Cheiro tables, cross-checked against the
 * Indian naming sites above.
 *
 *   Chaldean letter map (1..8; no letter = 9, considered sacred):
 *     1 A I J Q Y      2 B K R       3 C G L S
 *     4 D M T          5 E H N X     6 U V W
 *     7 O Z            8 F P
 *
 * Dependency-free, CommonJS.
 * ---------------------------------------------------------------------------
 */

// Chaldean numerology letter values
const CHALDEAN = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

// Root-number (1..9) → ruling planet + lucky attributes (Cheiro, standard).
// en + hi labels so the app can show either language.
const NUMBER_INFO = {
  1: { planet: 'Sun',     planetHi: 'सूर्य',    color: 'Gold / Orange',   colorHi: 'सुनहरा / नारंगी', stone: 'Ruby',          stoneHi: 'माणिक',       metal: 'Gold',   metalHi: 'सोना',    day: 'Sunday',    dayHi: 'रविवार',   supporting: [2, 4, 7] },
  2: { planet: 'Moon',    planetHi: 'चंद्र',    color: 'White / Cream',   colorHi: 'सफ़ेद / क्रीम',   stone: 'Pearl',         stoneHi: 'मोती',        metal: 'Silver', metalHi: 'चाँदी',   day: 'Monday',    dayHi: 'सोमवार',   supporting: [1, 7] },
  3: { planet: 'Jupiter', planetHi: 'गुरु',     color: 'Yellow',          colorHi: 'पीला',           stone: 'Yellow Sapphire', stoneHi: 'पुखराज',   metal: 'Gold',   metalHi: 'सोना',    day: 'Thursday',  dayHi: 'गुरुवार',  supporting: [6, 9] },
  4: { planet: 'Rahu',    planetHi: 'राहु',     color: 'Grey / Blue',     colorHi: 'धूसर / नीला',    stone: 'Hessonite (Gomed)', stoneHi: 'गोमेद',  metal: 'Mixed',  metalHi: 'मिश्र',   day: 'Saturday',  dayHi: 'शनिवार',   supporting: [1, 8] },
  5: { planet: 'Mercury', planetHi: 'बुध',      color: 'Green',           colorHi: 'हरा',            stone: 'Emerald',       stoneHi: 'पन्ना',       metal: 'Bronze', metalHi: 'काँसा',   day: 'Wednesday', dayHi: 'बुधवार',   supporting: [6, 9] },
  6: { planet: 'Venus',   planetHi: 'शुक्र',    color: 'White / Pink',    colorHi: 'सफ़ेद / गुलाबी',  stone: 'Diamond',       stoneHi: 'हीरा',        metal: 'Silver', metalHi: 'चाँदी',   day: 'Friday',    dayHi: 'शुक्रवार', supporting: [3, 5, 9] },
  7: { planet: 'Ketu',    planetHi: 'केतु',     color: 'White / Sea-green', colorHi: 'सफ़ेद / समुद्री हरा', stone: "Cat's Eye",   stoneHi: 'लहसुनिया',   metal: 'Silver', metalHi: 'चाँदी',   day: 'Monday',    dayHi: 'सोमवार',   supporting: [1, 2] },
  8: { planet: 'Saturn',  planetHi: 'शनि',      color: 'Black / Dark Blue', colorHi: 'काला / गहरा नीला', stone: 'Blue Sapphire', stoneHi: 'नीलम',     metal: 'Iron',   metalHi: 'लोहा',    day: 'Saturday',  dayHi: 'शनिवार',   supporting: [4, 1] },
  9: { planet: 'Mars',    planetHi: 'मंगल',     color: 'Red',             colorHi: 'लाल',            stone: 'Red Coral',     stoneHi: 'मूँगा',       metal: 'Copper', metalHi: 'ताँबा',   day: 'Tuesday',   dayHi: 'मंगलवार',  supporting: [3, 6] },
};

// reduce any integer to a single digit 1..9 (0 stays 9 to avoid empty)
function reduceToDigit(n) {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) {
    x = String(x).split('').reduce((s, d) => s + Number(d), 0);
  }
  return x === 0 ? 9 : x;
}

/**
 * nameNumerology(name)
 * @param {string} name  a personal name (Roman letters; diacritics tolerated)
 * @returns {{
 *   compound:number, nameNumber:number, luckyNumber:number,
 *   planet:string, planetHi:string, color:string, colorHi:string,
 *   stone:string, stoneHi:string, metal:string, metalHi:string,
 *   day:string, dayHi:string, supporting:number[]
 * } | null}
 */
function nameNumerology(name) {
  const clean = String(name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
    .toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return null;
  let compound = 0;
  for (const ch of clean) compound += CHALDEAN[ch] || 0;
  const nameNumber = reduceToDigit(compound);
  const info = NUMBER_INFO[nameNumber];
  return {
    compound,
    nameNumber,
    luckyNumber: nameNumber,
    planet: info.planet, planetHi: info.planetHi,
    color: info.color, colorHi: info.colorHi,
    stone: info.stone, stoneHi: info.stoneHi,
    metal: info.metal, metalHi: info.metalHi,
    day: info.day, dayHi: info.dayHi,
    supporting: info.supporting,
  };
}

// Map a root number (1..9) to its full info card.
function numberCard(number) {
  const info = NUMBER_INFO[number] || NUMBER_INFO[9];
  return {
    number,
    planet: info.planet, planetHi: info.planetHi,
    color: info.color, colorHi: info.colorHi,
    stone: info.stone, stoneHi: info.stoneHi,
    metal: info.metal, metalHi: info.metalHi,
    day: info.day, dayHi: info.dayHi,
    supporting: info.supporting,
  };
}

/**
 * birthNumerology(dob, name?)
 * @param {string} dob  "DD-MM-YYYY"
 * @param {string} [name]
 * @returns {{ psychic, destiny, name? } | null}
 *   psychic (Moolank) = reduced day-of-birth; destiny (Bhagyank) = reduced full DOB.
 */
function birthNumerology(dob, name) {
  const m = String(dob || '').match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const allDigits = (m[1] + m[2] + m[3]).split('').reduce((s, d) => s + Number(d), 0);
  const out = {
    psychic: numberCard(reduceToDigit(day)),   // Moolank
    destiny: numberCard(reduceToDigit(allDigits)), // Bhagyank
  };
  if (name && String(name).trim()) {
    const nn = nameNumerology(name);
    if (nn) out.name = numberCard(nn.nameNumber);
  }
  return out;
}

module.exports = { nameNumerology, birthNumerology, numberCard, reduceToDigit, CHALDEAN, NUMBER_INFO };

// ---------------------------------------------------------------------------
// Self-test: run `node numerology.js`
// ---------------------------------------------------------------------------
if (require.main === module) {
  let ok = true;
  const assert = (cond, msg) => { if (!cond) { ok = false; console.error('  FAIL: ' + msg); } };

  // Chaldean map completeness (26 letters)
  assert(Object.keys(CHALDEAN).length === 26, 'CHALDEAN has 26 letters (got ' + Object.keys(CHALDEAN).length + ')');
  // No letter maps to 9
  assert(!Object.values(CHALDEAN).includes(9), 'no Chaldean letter equals 9');
  // every root number has info
  for (let i = 1; i <= 9; i++) assert(NUMBER_INFO[i], 'NUMBER_INFO has ' + i);

  // reduceToDigit
  assert(reduceToDigit(38) === 2, '38 → 2 (3+8=11 → 2)');
  assert(reduceToDigit(9) === 9, '9 → 9');
  assert(reduceToDigit(10) === 1, '10 → 1');

  // worked example: "Shreya" → S3 H5 R2 E5 Y1 A1 = 17 → 8
  const sh = nameNumerology('Shreya');
  assert(sh && sh.compound === 17, 'Shreya compound 17 (got ' + (sh && sh.compound) + ')');
  assert(sh && sh.nameNumber === 8, 'Shreya number 8 (got ' + (sh && sh.nameNumber) + ')');
  assert(sh && sh.planet === 'Saturn', 'Shreya planet Saturn (got ' + (sh && sh.planet) + ')');

  console.log('--- nameNumerology samples ---');
  ['Aarav', 'Shreya', 'Krishna', 'Riya', 'Mohit'].forEach((nm) => {
    const r = nameNumerology(nm);
    console.log('  ' + nm.padEnd(10) + ' compound=' + String(r.compound).padStart(3) +
      ' → number ' + r.nameNumber + '  (' + r.planet + ', ' + r.stone + ', ' + r.day + ')');
  });

  console.log(ok ? '\nALL SELF-TESTS PASSED' : '\nSELF-TESTS FAILED');
  process.exit(ok ? 0 : 1);
}
