// Life Timeline (Vimshottari Dasha) — age-wise periods + WHY (each lord's chart placement = proof)
// + labh/nuksan + do/avoid + remedy. Chart = VedAstro (accurate); dasha math = utils/vimshottari.js (classical).
const { getKundli } = require('./vedastro.service');
const { computeVimshottari } = require('../utils/vimshottari');
const ai = require('./ai.service');

const NAK_ARC = 360 / 27;
const houseNum = (h) => { const m = String(h || '').match(/\d+/); return m ? Number(m[0]) : null; };
const EXALT = { Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo', Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra' };
const DEBIL = { Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces', Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries' };
const OWN = {
  Sun: ['Leo'], Moon: ['Cancer'], Mars: ['Aries', 'Scorpio'], Mercury: ['Gemini', 'Virgo'],
  Jupiter: ['Sagittarius', 'Pisces'], Venus: ['Taurus', 'Libra'], Saturn: ['Capricorn', 'Aquarius'],
};
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [5, 9];
const DUSTHANA = [6, 8, 12];

// lord ki chart-placement → dignity + nature ("proof")
function placementOf(lord, planets) {
  const p = planets.find((x) => x.planet === lord);
  if (!p) return { house: null, sign: null, dignity: 'neutral', nature: 'mixed' };
  const house = houseNum(p.house);
  let dignity = 'neutral';
  if (EXALT[lord] === p.sign) dignity = 'exalted';
  else if (DEBIL[lord] === p.sign) dignity = 'debilitated';
  else if ((OWN[lord] || []).includes(p.sign)) dignity = 'own';

  let score = 0;
  if (house && KENDRA.includes(house)) score += 1;
  if (house && TRIKONA.includes(house)) score += 1;
  if (house && DUSTHANA.includes(house)) score -= 1;
  if (dignity === 'exalted' || dignity === 'own') score += 1;
  if (dignity === 'debilitated') score -= 1;
  const nature = score >= 1 ? 'favorable' : score <= -1 ? 'challenging' : 'mixed';
  return { house, sign: p.sign, dignity, nature };
}

async function getLifeTimeline(input) {
  const { lang } = input;
  const skipAi = !!input.skipAi;
  const birth = { lat: input.lat, lng: input.lng, dob: input.dob, tob: input.tob, tz: input.tz, place: input.place };

  const k = await getKundli(birth);
  const d = (k && k.data) || {};
  const planets = (d.planets || []).filter((p) => p.sign).map((p) => ({ planet: p.planet, sign: p.sign, house: p.house }));
  const moon = (d.planets || []).find((p) => p.planet === 'Moon');
  const moonLon = moon && moon.nirayanaLongitude != null ? ((Number(moon.nirayanaLongitude) % 360) + 360) % 360 : null;
  if (moonLon == null) { const e = new Error('Moon calculate nahi ho paya'); e.status = 502; throw e; }

  const nakIdx = Math.floor(moonLon / NAK_ARC) % 27;
  const fraction = (moonLon % NAK_ARC) / NAK_ARC; // traversed portion of nakshatra

  // birth date (DD-MM-YYYY) → Date
  const [dd, mm, yy] = String(input.dob).split('-').map(Number);
  const birthDate = new Date(yy, (mm || 1) - 1, dd || 1);
  const now = new Date();

  const vim = computeVimshottari(nakIdx + 1, fraction, birthDate, now);

  // har period me lord ki placement (proof) + nature jodo
  vim.periods.forEach((p) => {
    const pl = placementOf(p.lord, planets);
    p.house = pl.house; p.sign = pl.sign; p.dignity = pl.dignity; p.nature = pl.nature;
  });

  // AI: har lord ke liye effect + do/avoid + remedy (user ki bhasha me, placement-grounded)
  let phala = {};
  if (!skipAi) {
  try {
    phala = await ai.generateDashaPhala({
      lang, ascendant: d.ascendant, moonSign: d.moonSign,
      periods: vim.periods.map((p) => ({ lord: p.lord, house: p.house, sign: p.sign, dignity: p.dignity, nature: p.nature, fromAge: Math.round(p.fromAge), toAge: Math.round(p.toAge) })),
    });
  } catch (_) { phala = {}; }
  }
  vim.periods.forEach((p) => { p.phala = (phala && phala[p.lord]) || null; });

  return {
    ascendant: d.ascendant || null,
    moonSign: d.moonSign || null,
    balance: vim.balance,
    currentAge: vim.currentAge,
    periods: vim.periods,
    source: 'VedAstro (Lahiri) chart + classical Vimshottari Dasha',
  };
}

module.exports = { getLifeTimeline };
