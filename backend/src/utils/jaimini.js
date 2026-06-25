'use strict';
/**
 * jaimini.js — Jaimini Chara Karakas + Arudha Lagna.
 * 100% deterministic. Reuses gunMilan RASHI_LORD / PLANET_NAME / RASHIS.
 *
 * Chara Karakas (7-karaka, classical Parashari-Jaimini): the 7 planets are ranked
 * by their degree WITHIN their sign (descending). Highest = Atmakaraka, then
 * Amatya, Bhratri, Matri, Putra, Gnati, Darakaraka.
 *
 * Arudha Lagna (AL): from the Lagna count the distance to its lord; count the same
 * distance again from the lord -> Arudha sign. Exception: if it lands on the 1st or
 * 7th from Lagna, take the 10th from there (BPHS rule).
 */
const gm = require('./gunMilan');

const KARAKAS = [
  { key: 'AK', en: 'Atmakaraka', hi: 'आत्मकारक', sig: 'Soul / self' },
  { key: 'AmK', en: 'Amatyakaraka', hi: 'अमात्यकारक', sig: 'Career / mind' },
  { key: 'BK', en: 'Bhratrikaraka', hi: 'भ्रातृकारक', sig: 'Siblings / courage' },
  { key: 'MK', en: 'Matrikaraka', hi: 'मातृकारक', sig: 'Mother / comforts' },
  { key: 'PK', en: 'Putrakaraka', hi: 'पुत्रकारक', sig: 'Children / wisdom' },
  { key: 'GK', en: 'Gnatikaraka', hi: 'ज्ञातिकारक', sig: 'Relatives / obstacles' },
  { key: 'DK', en: 'Darakaraka', hi: 'दारकारक', sig: 'Spouse / partner' },
];
const CHARA_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const PLANET_HI = { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि' };

/**
 * @param {Object} degrees  { Sun:{signIdx,deg}, Moon:{...}, ... Saturn }  deg = 0..30 within sign
 * @param {number} lagnaSignIdx 0..11
 * @returns {{ charaKarakas, arudhaLagna }}
 */
function computeJaimini(degrees, lagnaSignIdx) {
  // Chara Karakas — rank by degree-in-sign descending.
  const ranked = CHARA_PLANETS
    .filter((p) => degrees[p] && degrees[p].deg != null)
    .map((p) => ({ planet: p, deg: degrees[p].deg, signIdx: degrees[p].signIdx }))
    .sort((a, b) => b.deg - a.deg);
  const charaKarakas = ranked.map((r, i) => ({
    ...(KARAKAS[i] || { key: '?', en: '?', hi: '?', sig: '' }),
    planet: r.planet,
    planetHi: PLANET_HI[r.planet] || r.planet,
    sign: gm.RASHIS[r.signIdx],
    degree: Math.round(r.deg * 100) / 100,
  }));

  // Arudha Lagna.
  let arudhaLagna = null;
  if (lagnaSignIdx != null) {
    const lordIdx = gm.RASHI_LORD[lagnaSignIdx];           // ruling planet index
    const lordName = gm.PLANET_NAME[lordIdx];
    const lordSign = degrees[lordName] ? degrees[lordName].signIdx : null;
    if (lordSign != null) {
      const d = ((lordSign - lagnaSignIdx + 12) % 12) + 1; // distance lagna -> lord (1-based)
      let al = (lordSign + (d - 1)) % 12;                  // same distance from the lord
      const seventh = (lagnaSignIdx + 6) % 12;
      if (al === lagnaSignIdx || al === seventh) al = (al + 9) % 12; // 10th-from exception
      arudhaLagna = { sign: gm.RASHIS[al], signIdx: al, lord: lordName, lordHi: PLANET_HI[lordName] || lordName };
    }
  }

  return { charaKarakas, arudhaLagna, scheme: '7-karaka' };
}

module.exports = { computeJaimini };

/* ------------------------------------------------------------------ */
if (require.main === module) {
  let ok = true;
  // Chara karaka: highest degree must be AK.
  const deg = {
    Sun: { signIdx: 3, deg: 28.4 }, Moon: { signIdx: 1, deg: 7.2 }, Mars: { signIdx: 0, deg: 7.5 },
    Mercury: { signIdx: 4, deg: 1.9 }, Jupiter: { signIdx: 3, deg: 6.0 }, Venus: { signIdx: 3, deg: 26.3 },
    Saturn: { signIdx: 8, deg: 19.9 },
  };
  const r = computeJaimini(deg, 5); // Lagna Virgo
  console.log('Chara Karakas:');
  r.charaKarakas.forEach((k) => console.log('  ' + k.key.padEnd(4) + k.en.padEnd(15) + k.planet.padEnd(9) + k.degree + '° ' + k.sign));
  if (r.charaKarakas[0].planet !== 'Sun') { ok = false; console.log('FAIL: AK should be Sun (highest deg 28.4)'); }
  if (r.charaKarakas[6].planet !== 'Mercury') { ok = false; console.log('FAIL: DK should be Mercury (lowest deg 1.9)'); }
  // degrees strictly descending
  for (let i = 1; i < r.charaKarakas.length; i++) if (r.charaKarakas[i].degree > r.charaKarakas[i - 1].degree) { ok = false; console.log('FAIL: not descending'); }

  // Arudha: Lagna Aries(0), Mars in Leo(4) -> d=5 -> AL = Leo+4 = Sagittarius(8)
  const al1 = computeJaimini({ Mars: { signIdx: 4, deg: 1 } }, 0).arudhaLagna; // Aries lord = Mars
  console.log('Arudha (Aries lagna, Mars in Leo):', al1 && al1.sign, '(expect Sagittarius)');
  if (!al1 || al1.signIdx !== 8) { ok = false; console.log('FAIL: arudha case 1'); }
  // Arudha exception: lord in lagna -> AL = 10th. Aries lagna, Mars in Aries(0) -> AL Capricorn(9)
  const al2 = computeJaimini({ Mars: { signIdx: 0, deg: 1 } }, 0).arudhaLagna;
  console.log('Arudha (Aries lagna, Mars in Aries, exception):', al2 && al2.sign, '(expect Capricorn)');
  if (!al2 || al2.signIdx !== 9) { ok = false; console.log('FAIL: arudha exception'); }

  console.log(ok ? '\nALL CHECKS PASS' : '\nCHECKS FAILED');
  process.exit(ok ? 0 : 1);
}
