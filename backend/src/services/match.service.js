// Kundli Milan (Gun Milan / Ashtakoot Melapak)
// Data source = VedAstro (Moon nakshatra/rashi + Mangal dosha, via getKundli — cached forever).
// 36-guna scoring = pure classical algorithm in utils/gunMilan.js (web-verified tables).
const { getKundli } = require('./vedastro.service');
const { computeGunMilan, computeMangalCompat, NAKSHATRAS, RASHIS } = require('../utils/gunMilan');
const ai = require('./ai.service');

const NAK_ARC = 360 / 27; // 13°20'

// ek vyakti ki Moon-based matching info (VedAstro se)
async function personData(input) {
  const k = await getKundli(input);
  const data = (k && k.data) || {};
  const moon = (data.planets || []).find((p) => p.planet === 'Moon');
  const lon = moon && moon.nirayanaLongitude != null ? Number(moon.nirayanaLongitude) : null;

  let nakIdx = null; let rashiIdx = null; let pada = null;
  if (lon != null && Number.isFinite(lon)) {
    const L = ((lon % 360) + 360) % 360;
    nakIdx = Math.floor(L / NAK_ARC) % 27;            // 0..26
    pada = Math.floor((L % NAK_ARC) / (NAK_ARC / 4)) + 1; // 1..4
    rashiIdx = Math.floor(L / 30) % 12;               // 0..11
  } else if (data.moonSign) {
    rashiIdx = RASHIS.indexOf(data.moonSign);
    if (rashiIdx < 0) rashiIdx = null;
  }

  const mangal = (data.doshas || []).some((d) => d.name === 'Mangal Dosha' && d.present);
  return {
    name: (input.name || '').trim() || null,
    moonSign: data.moonSign || (rashiIdx != null ? RASHIS[rashiIdx] : null),
    ascendant: data.ascendant || null,
    nakshatra: nakIdx != null ? nakIdx + 1 : null,   // 1..27
    nakshatraName: nakIdx != null ? NAKSHATRAS[nakIdx] : null,
    pada,
    rashi: rashiIdx != null ? rashiIdx + 1 : null,    // 1..12
    rashiName: rashiIdx != null ? RASHIS[rashiIdx] : null,
    mangal,
  };
}

async function getMatch({ boy, girl, lang }) {
  const [b, g] = await Promise.all([personData(boy), personData(girl)]);

  if (b.nakshatra == null || b.rashi == null || g.nakshatra == null || g.rashi == null) {
    const e = new Error('Moon nakshatra/rashi calculate nahi ho paya — birth details (date/time/place) check karein.');
    e.status = 502;
    throw e;
  }

  const milan = computeGunMilan(
    { nakshatra: b.nakshatra, rashi: b.rashi },
    { nakshatra: g.nakshatra, rashi: g.rashi },
  );
  const mangal = computeMangalCompat(b.mangal, g.mangal);

  const people = { boy: b, girl: g };

  // AI se simple-language verdict + strengths/cautions/advice (cache me)
  let explanation = null;
  try {
    explanation = await ai.generateMatchExplanation({ milan, mangal, people, lang });
  } catch (_) { /* AI optional — numbers phir bhi dikhenge */ }

  return { people, milan, mangal, explanation };
}

module.exports = { getMatch };
