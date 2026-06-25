'use strict';
/**
 * avakhada.js — Avakhada Chakra (the classic first table of every Janam Kundli).
 * 100% deterministic; reuses the SOURCE-VERIFIED lookup tables from gunMilan.js
 * (Saravali/BPHS-cited Varna/Vashya/Yoni/Gana/Nadi/Rashi-lord). Adds Tatva, Paya,
 * Nakshatra/Lagna/Rashi lords and Nakshatra-Pada.
 *
 * Inputs are CHART-DERIVED (Moon sidereal longitude, Moon sign, Lagna sign) so the
 * result is exactly as accurate as the underlying ephemeris — no interpretation.
 */
const gm = require('./gunMilan');

// Vimshottari nakshatra-lord cycle (Ashwini -> Ketu ...), repeats every 9.
const NAK_LORD = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const NAK_LORD_HI = ['केतु', 'शुक्र', 'सूर्य', 'चंद्र', 'मंगल', 'राहु', 'गुरु', 'शनि', 'बुध'];

// Rashi (0-based) -> element (Tatva). Fire/Earth/Air/Water in the 1-5-9 triplicities.
const TATVA = ['Agni (Fire)', 'Prithvi (Earth)', 'Vayu (Air)', 'Jal (Water)'];
const TATVA_HI = ['अग्नि', 'पृथ्वी', 'वायु', 'जल'];
const RASHI_TATVA = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]; // Aries=Fire, Taurus=Earth, Gemini=Air, Cancer=Water ...

// Paya from Moon's house-count from Lagna (classical, complete): 1/6/11 Gold, 2/5/9 Silver, 3/7/10 Copper, 4/8/12 Iron.
const PAYA = ['Gold', 'Silver', 'Copper', 'Iron'];
const PAYA_HI = ['स्वर्ण', 'रजत', 'ताम्र', 'लौह'];
function payaFromHouse(house) {
  if ([1, 6, 11].includes(house)) return 0;
  if ([2, 5, 9].includes(house)) return 1;
  if ([3, 7, 10].includes(house)) return 2;
  return 3; // 4, 8, 12
}

const pair = (en, hi) => ({ en, hi });

/**
 * @param {object} p
 * @param {number} p.moonNakIdx0   Moon nakshatra index 0..26
 * @param {number} p.moonPada      1..4
 * @param {number} p.moonRashiIdx0 Moon sign index 0..11
 * @param {number} p.lagnaRashiIdx0 Lagna sign index 0..11 (null ok)
 * @param {string} [p.dashaBalance] e.g. "Venus 7y 4m"
 */
function computeAvakhada(p) {
  const nak = ((p.moonNakIdx0 % 27) + 27) % 27;
  const mR = ((p.moonRashiIdx0 % 12) + 12) % 12;
  const lR = p.lagnaRashiIdx0 == null ? null : (((p.lagnaRashiIdx0 % 12) + 12) % 12);

  const varnaRank = gm.RASHI_VARNA[mR];
  const vashya = gm.RASHI_VASHYA[mR];
  const yoni = gm.NAK_YONI[nak];
  const gana = gm.NAK_GANA[nak];
  const nadi = gm.NAK_NADI[nak];
  const lordIdx = nak % 9;

  // Moon's house from Lagna (whole-sign) for Paya; null if Lagna unknown.
  const moonHouseFromLagna = lR == null ? null : (((mR - lR + 12) % 12) + 1);
  const payaIdx = moonHouseFromLagna == null ? payaFromHouse(((mR - mR + 12) % 12) + 1) : payaFromHouse(moonHouseFromLagna);

  return {
    varna: pair(gm.VARNA_NAME[varnaRank], gm.VARNA_NAME_HI[varnaRank]),
    vashya: pair(gm.VASHYA_NAME[vashya], gm.VASHYA_NAME_HI[vashya]),
    yoni: pair(gm.YONI_NAME[yoni], gm.YONI_NAME_HI[yoni]),
    gana: pair(gm.GANA_NAME[gana], gm.GANA_NAME_HI[gana]),
    nadi: pair(gm.NADI_NAME[nadi], gm.NADI_NAME_HI[nadi]),
    tatva: pair(TATVA[RASHI_TATVA[mR]], TATVA_HI[RASHI_TATVA[mR]]),
    paya: lR == null ? null : pair(PAYA[payaIdx], PAYA_HI[payaIdx]),
    nakshatra: {
      name: gm.NAKSHATRAS[nak],
      pada: p.moonPada || null,
      lord: pair(NAK_LORD[lordIdx], NAK_LORD_HI[lordIdx]),
    },
    rashi: {
      name: gm.RASHIS[mR],
      lord: pair(gm.PLANET_NAME[gm.RASHI_LORD[mR]], gm.PLANET_NAME_HI[gm.RASHI_LORD[mR]]),
    },
    lagna: lR == null ? null : {
      name: gm.RASHIS[lR],
      lord: pair(gm.PLANET_NAME[gm.RASHI_LORD[lR]], gm.PLANET_NAME_HI[gm.RASHI_LORD[lR]]),
    },
    dashaBalance: p.dashaBalance || null,
  };
}

module.exports = { computeAvakhada };
