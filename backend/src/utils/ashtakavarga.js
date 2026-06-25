'use strict';
/**
 * ashtakavarga.js — Bhinnashtakavarga (BAV) + Sarvashtakavarga (SAV).
 * 100% deterministic, classical Parashari (BPHS) benefic-place tables.
 *
 * For each planet we list, per reference point (Sun..Saturn + Lagna), the houses
 * (counted from that reference's sign) in which the planet earns a bindu. These
 * tables are fixed by BPHS. Validation: each planet's BAV total and the SAV grand
 * total (337) are invariant — the self-test below asserts them.
 *
 * Per-planet BAV totals: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56,
 * Venus 52, Saturn 39  -> Sarva = 337.
 */

// Order of the 7 charas + Lagna used as "reference points" (contributors).
const REFS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];
// The 7 planets for which we compute Bhinnashtakavarga.
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// BENEFIC[planet][reference] = array of houses (1..12 from that reference) giving a bindu.
const BENEFIC = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11], Moon: [3, 6, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12], Jupiter: [5, 6, 9, 11], Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11], Jupiter: [1, 4, 7, 8, 10, 11, 12], Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11], Lagna: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11], Moon: [3, 6, 11], Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11], Jupiter: [6, 10, 11, 12], Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11], Lagna: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12], Moon: [2, 4, 6, 8, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12], Jupiter: [6, 8, 11, 12], Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], Moon: [2, 5, 7, 9, 11], Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11], Jupiter: [1, 2, 3, 4, 7, 8, 10, 11], Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12], Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12], Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11], Jupiter: [5, 8, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11], Lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11], Moon: [3, 6, 11], Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12], Jupiter: [5, 6, 11, 12], Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11], Lagna: [1, 3, 4, 6, 10, 11],
  },
};

// Known invariant per-planet BAV totals (used to self-validate the tables).
const EXPECTED_TOTALS = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 };

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

/**
 * positions: { Sun:0..11, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna }
 *   (0-based sign index for each reference point).
 * Returns { bhinna: { planet: [12 bindus by sign] , total }, sarva: [12], sarvaTotal, signs }.
 */
function computeAshtakavarga(positions) {
  const bhinna = {};
  const sarva = new Array(12).fill(0);
  for (const planet of PLANETS) {
    const bav = new Array(12).fill(0);
    for (const ref of REFS) {
      const refSign = positions[ref];
      if (refSign == null) continue;
      const houses = BENEFIC[planet][ref];
      for (let s = 0; s < 12; s++) {
        const house = (((s - refSign) % 12) + 12) % 12 + 1; // house of sign s counted from reference
        if (houses.includes(house)) bav[s] += 1;
      }
    }
    const total = bav.reduce((a, b) => a + b, 0);
    bhinna[planet] = { bindus: bav, total };
    for (let s = 0; s < 12; s++) sarva[s] += bav[s];
  }
  const sarvaTotal = sarva.reduce((a, b) => a + b, 0);
  return { bhinna, sarva, sarvaTotal, signs: SIGNS };
}

module.exports = { computeAshtakavarga, EXPECTED_TOTALS, SIGNS, PLANETS };

/* ------------------------------------------------------------------ */
/* Self-test: table integrity is invariant of positions.              */
/* ------------------------------------------------------------------ */
if (require.main === module) {
  // Per-planet totals must match the BPHS invariants regardless of positions.
  let ok = true;
  for (const planet of PLANETS) {
    const t = Object.values(BENEFIC[planet]).reduce((a, arr) => a + arr.length, 0);
    const exp = EXPECTED_TOTALS[planet];
    const pass = t === exp;
    if (!pass) ok = false;
    console.log(`${planet.padEnd(9)} table total ${t}  (expected ${exp})  ${pass ? 'OK' : 'FAIL'}`);
  }
  const grand = Object.values(EXPECTED_TOTALS).reduce((a, b) => a + b, 0);
  console.log(`Sarva grand total = ${grand} (expected 337) ${grand === 337 ? 'OK' : 'FAIL'}`);

  // Sample compute (random-ish positions) — SAV must sum to 337 and each sign's SAV in 0..56.
  const pos = { Sun: 3, Moon: 1, Mars: 0, Mercury: 4, Jupiter: 3, Venus: 3, Saturn: 8, Lagna: 5 };
  const r = computeAshtakavarga(pos);
  console.log('Sample SAV by sign:', r.sarva.join(','), '=> total', r.sarvaTotal);
  if (r.sarvaTotal !== 337) { ok = false; console.log('FAIL: SAV total != 337'); }
  if (r.sarva.some((v) => v < 0 || v > 56)) { ok = false; console.log('FAIL: SAV sign out of 0..56'); }
  console.log(ok ? '\nALL CHECKS PASS' : '\nCHECKS FAILED');
  process.exit(ok ? 0 : 1);
}
