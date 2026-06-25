// Saal-dar-saal Gochar-fal (Year-by-year transit forecast) — slow planets (Shani/Guru) relative
// to natal Moon → Sade Sati / Dhaiya / Jupiter gochar, year-wise. Chart + transits = VedAstro (Lahiri).
const { getKundli, vedastroPost } = require('./vedastro.service');
const ai = require('./ai.service');
const env = require('../config/env');

const SIGN_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];
const SIGN_IDX = SIGN_ORDER.reduce((a, s, i) => { a[s] = i; return a; }, {});
const houseFrom = (signName, moonIdx) => { const si = SIGN_IDX[signName]; return (si == null || moonIdx == null) ? null : (((si - moonIdx) % 12) + 12) % 12 + 1; };
const JUP_GOOD = [2, 5, 7, 9, 11];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// rate-limit-resilient: retry on empty/throttle
async function planetSignAt(planet, std, location, ayan) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const json = await vedastroPost('/Calculate/AllPlanetData', { PlanetName: { Name: planet }, Time: { StdTime: std, Location: location }, Ayanamsa: ayan });
      const d = (json && json.Payload && json.Payload.AllPlanetData) || {};
      const sign = d.PlanetRasiD1Sign && d.PlanetRasiD1Sign.Name;
      if (sign) return sign;
    } catch (e) { /* 429/throttle → wait + retry */ }
    await sleep(1400 * (attempt + 1));
  }
  return null;
}

async function getTransitForecast(input) {
  let { lat, lng, place, tz, lang } = input;
  const skipAi = !!input.skipAi;
  tz = tz || '+05:30';
  const birth = { lat, lng, dob: input.dob, tob: input.tob, tz, place };
  const ayan = env.vedastro.ayanamsa;

  const k = await getKundli(birth);
  const d = (k && k.data) || {};
  const moonSign = d.moonSign;
  const moonIdx = moonSign != null ? SIGN_IDX[moonSign] : null;
  // location resolve (getKundli ne geocode kar liya — uska location reuse)
  const location = d.location || { Name: place || 'Place', Latitude: Number(lat), Longitude: Number(lng) };

  const nowY = new Date().getFullYear();
  const fromY = Number(input.fromYear) || (nowY - 1);
  const toY = Number(input.toYear) || (nowY + 7); // ~9 saal default (free-tier calls bounded)

  const years = [];
  for (let y = fromY; y <= toY; y++) {
    const std = `12:00 01/07/${y} ${tz}`;
    const sat = await planetSignAt('Saturn', std, location, ayan);
    const jup = await planetSignAt('Jupiter', std, location, ayan);
    if (!sat && !jup) continue; // dono fail → year skip (undefined mat dikhao)
    const satH = houseFrom(sat, moonIdx);
    const jupH = houseFrom(jup, moonIdx);
    let shani = { sign: sat, signHi: sat != null ? SIGN_HI[SIGN_IDX[sat]] : null, houseFromMoon: satH, event: null, eventHi: null, kind: 'neutral' };
    if ([12, 1, 2].includes(satH)) { shani.kind = 'caution'; shani.event = `Sade Sati (${satH === 12 ? 'Rising' : satH === 1 ? 'Peak' : 'Setting'})`; shani.eventHi = `साढ़े साती (${satH === 12 ? 'आरंभ' : satH === 1 ? 'शिखर' : 'अंतिम'})`; }
    else if ([4, 8].includes(satH)) { shani.kind = 'caution'; shani.event = 'Dhaiya (Small Panoti)'; shani.eventHi = 'ढैय्या (छोटी पनौती)'; }
    const guru = {
      sign: jup, signHi: jup != null ? SIGN_HI[SIGN_IDX[jup]] : null, houseFromMoon: jupH,
      kind: JUP_GOOD.includes(jupH) ? 'good' : 'neutral',
      event: JUP_GOOD.includes(jupH) ? 'Favorable Jupiter transit' : null,
      eventHi: JUP_GOOD.includes(jupH) ? 'गुरु का शुभ गोचर' : null,
    };
    years.push({ year: y, current: y === nowY, shani, guru });
  }

  // AI: overall summary + per notable-year note (grounded on the deterministic events)
  let explanation = null;
  if (!skipAi) {
  try {
    explanation = await ai.generateTransitForecast({ lang, moonSign, years });
  } catch (_) { /* events still show */ }
  }
  if (explanation && Array.isArray(explanation.notes)) {
    const byYear = {}; explanation.notes.forEach((n) => { if (n && n.year) byYear[n.year] = n.text; });
    years.forEach((yr) => { yr.note = byYear[yr.year] || null; });
  }

  return { moonSign, fromYear: fromY, toYear: toY, currentYear: nowY, years, summary: explanation ? explanation.summary : null, source: 'VedAstro (Lahiri) transits + classical Chandra-gochar' };
}

module.exports = { getTransitForecast };
