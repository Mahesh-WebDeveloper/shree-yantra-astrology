'use strict';
/**
 * lalKitab.js — Lal Kitab Teva (house chart) ONLY.
 * 100% deterministic: each house (bhava) from the Lagna gets its sign and the
 * planets occupying it (whole-sign / bhava placement). We intentionally do NOT
 * include the edition-variant debts (rinn) or remedies — only the verifiable
 * chart placement.
 */
const gm = require('./gunMilan');
const RASHI_IDX = gm.RASHIS.reduce((a, s, i) => { a[s] = i; return a; }, {});
const PLANET_HI = { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु' };

/**
 * @param {Array} planets  [{ planet, sign }]
 * @param {number} lagnaSignIdx 0..11
 * @returns {{ lagna, houses:[{house,sign,planets:[{en,hi}]}] }}
 */
function computeLalKitab(planets, lagnaSignIdx) {
  if (lagnaSignIdx == null) return { lagna: null, houses: [] };
  const byHouse = {};
  (planets || []).forEach((p) => {
    const si = RASHI_IDX[p.sign];
    if (si == null) return;
    const h = ((si - lagnaSignIdx + 12) % 12) + 1;
    (byHouse[h] = byHouse[h] || []).push({ en: p.planet, hi: PLANET_HI[p.planet] || p.planet });
  });
  const houses = [];
  for (let h = 1; h <= 12; h++) {
    houses.push({ house: h, sign: gm.RASHIS[(lagnaSignIdx + h - 1) % 12], planets: byHouse[h] || [] });
  }
  return { lagna: gm.RASHIS[lagnaSignIdx], houses };
}

module.exports = { computeLalKitab };

/* ------------------------------------------------------------------ */
if (require.main === module) {
  // Lagna Virgo(5): House1=Virgo. A planet in Virgo -> house 1; in Libra -> house 2.
  const r = computeLalKitab([{ planet: 'Mercury', sign: 'Virgo' }, { planet: 'Venus', sign: 'Libra' }, { planet: 'Sun', sign: 'Cancer' }], 5);
  let ok = r.houses[0].sign === 'Virgo' && r.houses[0].planets[0].en === 'Mercury' && r.houses[1].sign === 'Libra';
  // Cancer is house ((3-5+12)%12)+1 = 11 from Virgo.
  ok = ok && r.houses[10].planets.some((p) => p.en === 'Sun');
  r.houses.forEach((h) => h.planets.length && console.log(`  H${h.house} ${h.sign}: ${h.planets.map((p) => p.en).join(', ')}`));
  console.log(ok ? '\nALL CHECKS PASS' : '\nCHECKS FAILED');
  process.exit(ok ? 0 : 1);
}
