// Traditional Vedic Reading (Phala-Kathan) — classical predictions on the user's real chart.
// Chart = VedAstro (Lahiri, accurate). Rules = utils/traditionalPhala.js (BPHS/Phaldeepika/Mansagari, web-verified).
// AI sirf warm summary deta hai; saari predictions deterministic/authentic engine se.
const { getKundli } = require('./vedastro.service');
const { computeTraditionalPhala } = require('../utils/traditionalPhala');
const { computeBirthPanchang } = require('../utils/birthPanchang');
let naamaksharFor = null;
let rashiSyllables = null;
try { const nm = require('../utils/naamakshar'); naamaksharFor = nm.naamaksharFor; rashiSyllables = nm.rashiSyllables; } catch (_) { /* file aane tak skip */ }
const ai = require('./ai.service');

const SIGN_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const NAK_ARC = 360 / 27;
// Vimshottari nakshatra-lord cycle (Ashwini→Ketu ... repeating every 9)
const VIM_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const houseNum = (h) => { const m = String(h || '').match(/\d+/); return m ? Number(m[0]) : null; };

async function getReading(input) {
  const { lang } = input;
  const skipAi = !!input.skipAi;
  const birth = { lat: input.lat, lng: input.lng, dob: input.dob, tob: input.tob, tz: input.tz, place: input.place };

  const k = await getKundli(birth);
  const d = (k && k.data) || {};
  const planets = d.planets || [];

  const moon = planets.find((p) => p.planet === 'Moon');
  const moonLon = moon && moon.nirayanaLongitude != null ? ((Number(moon.nirayanaLongitude) % 360) + 360) % 360 : null;
  if (moonLon == null) {
    const e = new Error('Moon position calculate nahi ho paya — birth details check karein.');
    e.status = 502; throw e;
  }
  const nakIdx = Math.floor(moonLon / NAK_ARC) % 27;       // 0..26
  const moonPada = Math.floor((moonLon % NAK_ARC) / (NAK_ARC / 4)) + 1;
  const dashaAtBirthLord = VIM_LORDS[nakIdx % 9];

  const chart = {
    ascendant: d.ascendant || null,
    ascendantDegreeInSign: d.ascendantDegreeInSign != null ? Number(d.ascendantDegreeInSign) : null,
    moonNakshatra: nakIdx + 1,                              // 1..27
    moonPada,
    moonSign: d.moonSign || null,
    planets: planets.filter((p) => p.sign).map((p) => ({ planet: p.planet, sign: p.sign, house: houseNum(p.house) })),
    dashaAtBirthLord,
  };

  const phala = computeTraditionalPhala(chart);

  // Birth Panchang (birth moment ke Sun/Moon longitudes se) + Naamakshar
  const sun = planets.find((p) => p.planet === 'Sun');
  const sunLon = sun && sun.nirayanaLongitude != null ? ((Number(sun.nirayanaLongitude) % 360) + 360) % 360 : null;
  const sunSignIdx = sun && sun.sign != null ? SIGN_ORDER.indexOf(sun.sign) : -1;
  const [bdd, bmm, byy] = String(input.dob).split('-').map(Number);
  const birthDate = new Date(byy, (bmm || 1) - 1, bdd || 1);
  const birthPanchang = computeBirthPanchang(sunLon, moonLon, sunSignIdx >= 0 ? sunSignIdx : null, birthDate);
  const naamakshar = naamaksharFor ? naamaksharFor(nakIdx + 1, moonPada) : null;

  let explanation = null;
  if (!skipAi) {
    try {
    explanation = await ai.generateTraditionalReading({
      janma: phala.janma, predictions: phala.predictions,
      ascendant: chart.ascendant, moonSign: chart.moonSign, lang,
    });
  } catch (_) { /* AI summary optional — predictions phir bhi dikhenge */ }

  }

  return {
    ascendant: chart.ascendant,
    moonSign: chart.moonSign,
    moonNakshatra: chart.moonNakshatra,
    moonPada: chart.moonPada,
    janma: phala.janma,
    birthPanchang,
    naamakshar,
    predictions: phala.predictions,
    explanation,
    source: 'Lahiri sidereal chart + classical Phala-Kathan (BPHS/Phaldeepika/Mansagari)',
  };
}

// Name suggestions (Naamkaran) from birth → moon nakshatra/pada/rashi → naamakshar → AI
async function getNameSuggestions(input) {
  const birth = { lat: input.lat, lng: input.lng, dob: input.dob, tob: input.tob, tz: input.tz, place: input.place };
  const k = await getKundli(birth);
  const d = (k && k.data) || {};
  const moon = (d.planets || []).find((p) => p.planet === 'Moon');
  const moonLon = moon && moon.nirayanaLongitude != null ? ((Number(moon.nirayanaLongitude) % 360) + 360) % 360 : null;
  if (moonLon == null) { const e = new Error('Moon calculate nahi ho paya'); e.status = 502; throw e; }
  const nakIdx = Math.floor(moonLon / NAK_ARC) % 27;
  const pada = Math.floor((moonLon % NAK_ARC) / (NAK_ARC / 4)) + 1;
  const nm = naamaksharFor ? naamaksharFor(nakIdx + 1, pada) : null;
  // scope 'rashi' = widen from the exact pada syllable to all 9 syllables of the rashi
  const startWith = input.scope === 'rashi' && rashiSyllables
    ? rashiSyllables(d.moonSign)
    : (nm ? [nm.syllable] : []);
  const result = await ai.generateNameSuggestions({
    syllable: nm ? nm.syllable : '',
    nakshatra: nm ? nm.nakshatra : '',
    pada, rashi: d.moonSign, gender: input.gender, lang: input.lang, candidate: input.candidate,
    startWith, origin: input.origin, theme: input.theme, lengthPref: input.lengthPref,
  });
  return { naamakshar: nm, moonSign: d.moonSign, scope: input.scope || 'pada', ...result };
}

module.exports = { getReading, getNameSuggestions };
