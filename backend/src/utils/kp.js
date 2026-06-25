'use strict';
/**
 * kp.js — Krishnamurti Paddhati (KP) lords for a sidereal longitude.
 * 100% deterministic: Sign-lord, Star-lord (Nakshatra lord) and Sub-lord.
 *
 * Sub-lord: each nakshatra (13°20' = 800') is divided into 9 sub-divisions whose
 * spans are proportional to the Vimshottari dasha years, laid out in Vimshottari
 * order STARTING from that nakshatra's lord. The sub-lord is the lord of the
 * sub-division the longitude falls in. (Standard KP — needs only the longitude,
 * not house cusps, so it is exact from our validated sidereal positions.)
 */
const gm = require('./gunMilan');

// Vimshottari order + years (sum 120).
const VIM = [['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7], ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17]];
const PLANET_HI = { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु' };
const NAK_ARC = 360 / 27;          // 13.3333°
const TOTAL = 120;

const norm = (x) => ((x % 360) + 360) % 360;

// returns { sign, signLord, starLord, subLord, nakshatra }
function kpLords(longitude) {
  const L = norm(longitude);
  const signIdx = Math.floor(L / 30);
  const signLord = gm.PLANET_NAME[gm.RASHI_LORD[signIdx]];
  const nakIdx = Math.floor(L / NAK_ARC) % 27;
  const starLordIdx = nakIdx % 9;          // Vimshottari index of the nakshatra lord
  const starLord = VIM[starLordIdx][0];
  // walk sub-divisions from the star-lord, proportional to Vimshottari years
  const offset = L - Math.floor(L / NAK_ARC) * NAK_ARC; // 0..13.3333
  let acc = 0;
  let subLord = starLord;
  for (let i = 0; i < 9; i++) {
    const [lord, yrs] = VIM[(starLordIdx + i) % 9];
    const span = (yrs / TOTAL) * NAK_ARC;
    if (offset < acc + span || i === 8) { subLord = lord; break; }
    acc += span;
  }
  return {
    sign: gm.RASHIS[signIdx],
    signLord, signLordHi: PLANET_HI[signLord],
    starLord, starLordHi: PLANET_HI[starLord],
    subLord, subLordHi: PLANET_HI[subLord],
    nakshatra: gm.NAKSHATRAS[nakIdx],
  };
}

module.exports = { kpLords, VIM };

/* ------------------------------------------------------------------ */
if (require.main === module) {
  let ok = true;
  // At the very start of Ashwini (0°), star = Ketu and the first sub = Ketu.
  const a = kpLords(0);
  console.log('0° Aries/Ashwini:', a.signLord, '/', a.starLord, '/', a.subLord, '(expect Mars/Ketu/Ketu)');
  if (a.signLord !== 'Mars' || a.starLord !== 'Ketu' || a.subLord !== 'Ketu') { ok = false; console.log('FAIL: start of Ashwini'); }
  // First Ketu sub spans 7/120*13.3333 = 0.7778° = 46'40". Just after it -> Venus sub.
  const b = kpLords(0.8);
  console.log('0.8° Ashwini sub:', b.subLord, '(expect Venus)');
  if (b.subLord !== 'Venus') { ok = false; console.log('FAIL: second sub'); }
  // Each nakshatra's 9 subs must sum to exactly the nakshatra arc.
  let sum = 0; for (const [, y] of VIM) sum += (y / TOTAL) * NAK_ARC;
  console.log('Sub spans sum:', sum.toFixed(6), '(expect', NAK_ARC.toFixed(6) + ')');
  if (Math.abs(sum - NAK_ARC) > 1e-9) { ok = false; console.log('FAIL: spans do not sum to nakshatra arc'); }
  // Sign-lord sanity: 35° = Taurus -> Venus.
  if (kpLords(35).signLord !== 'Venus') { ok = false; console.log('FAIL: Taurus sign-lord'); }
  console.log(ok ? '\nALL CHECKS PASS' : '\nCHECKS FAILED');
  process.exit(ok ? 0 : 1);
}
