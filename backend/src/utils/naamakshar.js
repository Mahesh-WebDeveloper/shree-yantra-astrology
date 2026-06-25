'use strict';

/**
 * naamakshar.js
 * ---------------------------------------------------------------------------
 * Classical Vedic NAAMAKSHAR (नामाक्षर) — the traditional naming syllable
 * assigned to each Nakshatra + Pada (charan).
 *
 * In Hindu tradition (Naamkaran / Swar Siddhanta), the first syllable of a
 * person's name is chosen from the Pada (quarter) of the Moon's Janma
 * Nakshatra at birth. There are 27 nakshatras x 4 padas = 108 fixed
 * syllables. This is a fixed traditional table, not a computed value.
 *
 * Sources cross-checked (all 108 entries agree):
 *   - DrikPanchang "Swar Siddhanta" 108 Pada Swar table
 *     https://www.drikpanchang.com/swar-siddhanta/nakshatra/nakshatra-pada-swar-siddhanta.html
 *   - Wikipedia "List of Nakshatras" (Devanagari pada syllables)
 *   - AstroSage / classical Jyotish naming tables (spot cross-check)
 *
 * Dependency-free, CommonJS.
 * ---------------------------------------------------------------------------
 */

// 27 nakshatra English names (index 0 = Ashwini ... 26 = Revati)
const NAKSHATRAS = [
  'Ashwini',          // 1
  'Bharani',          // 2
  'Krittika',         // 3
  'Rohini',           // 4
  'Mrigashira',       // 5
  'Ardra',            // 6
  'Punarvasu',        // 7
  'Pushya',           // 8
  'Ashlesha',         // 9
  'Magha',            // 10
  'Purva Phalguni',   // 11
  'Uttara Phalguni',  // 12
  'Hasta',            // 13
  'Chitra',           // 14
  'Swati',            // 15
  'Vishakha',         // 16
  'Anuradha',         // 17
  'Jyeshtha',         // 18
  'Mula',             // 19
  'Purva Ashadha',    // 20
  'Uttara Ashadha',   // 21
  'Shravana',         // 22
  'Dhanishtha',       // 23
  'Shatabhisha',      // 24
  'Purva Bhadrapada', // 25
  'Uttara Bhadrapada',// 26
  'Revati',           // 27
];

/**
 * NAAMAKSHAR_TABLE
 * 27 rows (index 0 = Ashwini ... 26 = Revati).
 * Each row = [pada1, pada2, pada3, pada4] syllable in Devanagari.
 */
const NAAMAKSHAR_TABLE = [
  ['चू', 'चे', 'चो', 'ला'],   //  1 Ashwini
  ['ली', 'लू', 'ले', 'लो'],   //  2 Bharani
  ['अ',  'ई',  'उ',  'ए'],    //  3 Krittika
  ['ओ',  'वा', 'वी', 'वू'],   //  4 Rohini
  ['वे', 'वो', 'का', 'की'],   //  5 Mrigashira
  ['कू', 'घ',  'ङ',  'छ'],    //  6 Ardra
  ['के', 'को', 'हा', 'ही'],   //  7 Punarvasu
  ['हू', 'हे', 'हो', 'डा'],   //  8 Pushya
  ['डी', 'डू', 'डे', 'डो'],   //  9 Ashlesha
  ['मा', 'मी', 'मू', 'मे'],   // 10 Magha
  ['मो', 'टा', 'टी', 'टू'],   // 11 Purva Phalguni
  ['टे', 'टो', 'पा', 'पी'],   // 12 Uttara Phalguni
  ['पू', 'ष',  'ण',  'ठ'],    // 13 Hasta
  ['पे', 'पो', 'रा', 'री'],   // 14 Chitra
  ['रू', 'रे', 'रो', 'ता'],   // 15 Swati
  ['ती', 'तू', 'ते', 'तो'],   // 16 Vishakha
  ['ना', 'नी', 'नू', 'ने'],   // 17 Anuradha
  ['नो', 'या', 'यी', 'यू'],   // 18 Jyeshtha
  ['ये', 'यो', 'भा', 'भी'],   // 19 Mula
  ['भू', 'धा', 'फा', 'ढ'],    // 20 Purva Ashadha
  ['भे', 'भो', 'जा', 'जी'],   // 21 Uttara Ashadha
  ['खी', 'खू', 'खे', 'खो'],   // 22 Shravana
  ['गा', 'गी', 'गू', 'गे'],   // 23 Dhanishtha
  ['गो', 'सा', 'सी', 'सू'],   // 24 Shatabhisha
  ['से', 'सो', 'दा', 'दी'],   // 25 Purva Bhadrapada
  ['दू', 'थ',  'झ',  'ञ'],    // 26 Uttara Bhadrapada
  ['दे', 'दो', 'च',  'ची'],   // 27 Revati
];

/**
 * naamaksharFor(nakshatra, pada)
 * @param {number} nakshatra 1..27 (1 = Ashwini)
 * @param {number} pada      1..4
 * @returns {{ syllable: string, nakshatra: string, pada: number, note: {en:string, hi:string} }}
 */
function naamaksharFor(nakshatra, pada) {
  const n = Number(nakshatra);
  const p = Number(pada);

  if (!Number.isInteger(n) || n < 1 || n > 27) {
    throw new RangeError('nakshatra must be an integer 1..27 (got ' + nakshatra + ')');
  }
  if (!Number.isInteger(p) || p < 1 || p > 4) {
    throw new RangeError('pada must be an integer 1..4 (got ' + pada + ')');
  }

  return {
    syllable: NAAMAKSHAR_TABLE[n - 1][p - 1],
    nakshatra: NAKSHATRAS[n - 1],
    pada: p,
    note: {
      en: 'Names traditionally begin with this syllable',
      hi: 'परंपरा अनुसार नाम इस अक्षर से आरंभ होता है',
    },
  };
}

// 12 Rashi (Moon-sign) names, index 0 = Mesha (Aries) ... 11 = Meena (Pisces)
const RASHIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];
const RASHIS_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/**
 * RASHI_SYLLABLES — for each rashi, the 9 traditional naming syllables.
 * Derived deterministically from the 108-pada table: a rashi spans 30° = 9
 * consecutive padas (2.25 nakshatras), so rashi r (0-indexed) covers global
 * pada indices r*9 .. r*9+8. global pada g → nakshatra floor(g/4), pada g%4.
 * This keeps the rashi list 100% consistent with NAAMAKSHAR_TABLE.
 */
const RASHI_SYLLABLES = RASHIS.map((_, r) => {
  const out = [];
  for (let i = 0; i < 9; i++) {
    const g = r * 9 + i;
    out.push(NAAMAKSHAR_TABLE[Math.floor(g / 4)][g % 4]);
  }
  return out;
});

/**
 * rashiSyllables(rashi) — syllables for a rashi by index (0..11), Sanskrit
 * name (Mesha…) or English name (Aries…). Returns [] if unknown.
 */
function rashiSyllables(rashi) {
  let idx = -1;
  if (typeof rashi === 'number') idx = rashi;
  else if (typeof rashi === 'string') {
    const s = rashi.trim();
    idx = RASHIS.findIndex((n) => n.toLowerCase() === s.toLowerCase());
    if (idx < 0) idx = RASHIS_EN.findIndex((n) => n.toLowerCase() === s.toLowerCase());
  }
  return idx >= 0 && idx < 12 ? RASHI_SYLLABLES[idx].slice() : [];
}

module.exports = {
  naamaksharFor, NAAMAKSHAR_TABLE, NAKSHATRAS,
  RASHIS, RASHIS_EN, RASHI_SYLLABLES, rashiSyllables,
};

// ---------------------------------------------------------------------------
// Self-test: run `node naamakshar.js`
// ---------------------------------------------------------------------------
if (require.main === module) {
  let ok = true;
  const assert = (cond, msg) => {
    if (!cond) { ok = false; console.error('  FAIL: ' + msg); }
  };

  // Structural checks
  assert(NAKSHATRAS.length === 27, 'NAKSHATRAS has 27 names (got ' + NAKSHATRAS.length + ')');
  assert(NAAMAKSHAR_TABLE.length === 27, 'TABLE has 27 rows (got ' + NAAMAKSHAR_TABLE.length + ')');
  let totalCells = 0;
  NAAMAKSHAR_TABLE.forEach((row, i) => {
    assert(Array.isArray(row) && row.length === 4,
      'row ' + (i + 1) + ' (' + NAKSHATRAS[i] + ') has 4 padas (got ' + (row && row.length) + ')');
    if (Array.isArray(row)) {
      row.forEach((s) => { if (typeof s === 'string' && s.length) totalCells++; });
    }
  });
  assert(totalCells === 108, 'TABLE has 108 non-empty syllables (got ' + totalCells + ')');

  // Spot checks against the classical table
  const spot = [
    [10, 1, 'मा'],  // Magha pada 1
    [1, 1, 'चू'],   // Ashwini pada 1
    [1, 4, 'ला'],   // Ashwini pada 4
    [2, 1, 'ली'],   // Bharani pada 1
    [3, 1, 'अ'],    // Krittika pada 1
    [4, 1, 'ओ'],    // Rohini pada 1
    [19, 1, 'ये'],  // Mula pada 1
    [22, 1, 'खी'],  // Shravana pada 1
    [27, 4, 'ची'],  // Revati pada 4
  ];
  spot.forEach(([n, p, expected]) => {
    const got = naamaksharFor(n, p).syllable;
    assert(got === expected,
      NAKSHATRAS[n - 1] + ' pada ' + p + ' => expected "' + expected + '" got "' + got + '"');
  });

  // Pretty print a few results
  console.log('--- naamaksharFor() samples ---');
  [[10, 1], [1, 1], [19, 3], [27, 3], [22, 2]].forEach(([n, p]) => {
    const r = naamaksharFor(n, p);
    console.log(
      '  ' + String(n).padStart(2) + '.' + p + ' ' +
      r.nakshatra.padEnd(18) + ' -> ' + r.syllable +
      '   (' + r.note.hi + ')'
    );
  });

  // Full table dump
  console.log('\n--- Full 27 x 4 NAAMAKSHAR table ---');
  NAAMAKSHAR_TABLE.forEach((row, i) => {
    console.log('  ' + String(i + 1).padStart(2) + '. ' +
      NAKSHATRAS[i].padEnd(18) + ' : ' + row.join('  '));
  });

  console.log('\nTABLE: ' + NAAMAKSHAR_TABLE.length + ' rows x 4 padas = ' + totalCells + ' syllables');
  console.log(ok ? '\nALL SELF-TESTS PASSED' : '\nSELF-TESTS FAILED');
  process.exit(ok ? 0 : 1);
}
