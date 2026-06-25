const { getKundli } = require('./vedastro.service');

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_IDX = SIGNS.reduce((acc, sign, i) => { acc[sign] = i; return acc; }, {});

const META = [
  { code: 'D1', name: 'Lagna Chart', sanskrit: 'Janma Kundli', area: 'Overall life, health, identity and direction', level: 'core', why: 'This is the main birth chart and the base for every reading.' },
  { code: 'MOON', name: 'Chandra Chart', sanskrit: 'Rashi Chart', area: 'Mind, emotions, daily experience and transit impact', level: 'core', why: 'Moon is treated as the first house to read the mind and day-to-day experience.' },
  { code: 'D2', name: 'Hora Chart', sanskrit: 'Hora', area: 'Wealth, resources and money flow', level: 'advanced', why: 'Useful for understanding financial support and handling of resources.' },
  { code: 'D3', name: 'Dreshkana Chart', sanskrit: 'Drekkana', area: 'Siblings, courage, initiative and effort', level: 'advanced', why: 'Shows effort, courage and support from co-borns.' },
  { code: 'D4', name: 'Property Chart', sanskrit: 'Chaturthamsa', area: 'Home, property, comforts and fixed assets', level: 'advanced', why: 'Useful for property, residence, land and inner security.' },
  { code: 'D7', name: 'Children Chart', sanskrit: 'Saptamsha', area: 'Children, creativity and family expansion', level: 'advanced', why: 'Traditionally used for children and creative continuation.' },
  { code: 'D9', name: 'Navamsha Chart', sanskrit: 'Navamsha', area: 'Marriage, dharma, luck and real planet strength', level: 'core', why: 'The most important divisional chart after D1.' },
  { code: 'D10', name: 'Career Chart', sanskrit: 'Dashamsha', area: 'Career, status, job, business and public work', level: 'core', why: 'Best chart for career direction and professional growth.' },
  { code: 'D12', name: 'Parents Chart', sanskrit: 'Dwadashamsha', area: 'Parents, ancestry and family roots', level: 'advanced', why: 'Shows parental influence and ancestral patterns.' },
  { code: 'D16', name: 'Comforts Chart', sanskrit: 'Shodashamsha', area: 'Vehicles, comforts, lifestyle and luxuries', level: 'expert', why: 'Used for comforts, vehicles and inner satisfaction.' },
  { code: 'D20', name: 'Spiritual Chart', sanskrit: 'Vimshamsha', area: 'Spiritual path, worship and inner growth', level: 'expert', why: 'Useful for spiritual practice and devotion.' },
  { code: 'D24', name: 'Education Chart', sanskrit: 'Siddhamsha', area: 'Education, learning and knowledge', level: 'expert', why: 'Used for study, knowledge and skill development.' },
  { code: 'D27', name: 'Strength Chart', sanskrit: 'Bhamsa', area: 'Inner strength, weakness and resilience', level: 'expert', why: 'Shows subtle strengths and vulnerabilities.' },
  { code: 'D30', name: 'Challenge Chart', sanskrit: 'Trimsamsha', area: 'Obstacles, hidden issues and caution areas', level: 'expert', why: 'Used carefully for difficulties and protection-oriented analysis.' },
  { code: 'D40', name: 'Maternal Line Chart', sanskrit: 'Khavedamsha', area: 'Maternal lineage and inherited blessings', level: 'expert', why: 'A subtle lineage chart for deeper readings.' },
  { code: 'D45', name: 'Paternal Line Chart', sanskrit: 'Akshavedamsha', area: 'Paternal lineage and inherited tendencies', level: 'expert', why: 'A subtle lineage chart for deeper readings.' },
  { code: 'D60', name: 'Karma Chart', sanskrit: 'Shashtiamsha', area: 'Deep karma and subtle life patterns', level: 'expert', why: 'A sensitive advanced chart; birth time accuracy is very important.' },
];

const mod12 = (n) => ((n % 12) + 12) % 12;
const signName = (i) => SIGNS[mod12(i)];
const signIndex = (sign) => SIGN_IDX[sign] == null ? null : SIGN_IDX[sign];
const numberOf = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const degreeInSign = (lon) => {
  const n = numberOf(lon);
  if (n == null) return null;
  return ((n % 30) + 30) % 30;
};
const partIndex = (deg, division) => Math.min(division - 1, Math.floor((deg / 30) * division));
const isOddSign = (idx) => idx % 2 === 0; // Aries is sign 1, array index 0
const signMode = (idx) => idx % 3; // 0 movable, 1 fixed, 2 dual
const elementGroup = (idx) => idx % 4; // fire, earth, air, water

function d30Sign(idx, deg) {
  if (isOddSign(idx)) {
    if (deg < 5) return 0;      // Mars -> Aries
    if (deg < 10) return 10;    // Saturn -> Aquarius
    if (deg < 18) return 8;     // Jupiter -> Sagittarius
    if (deg < 25) return 2;     // Mercury -> Gemini
    return 6;                   // Venus -> Libra
  }
  if (deg < 5) return 1;        // Venus -> Taurus
  if (deg < 12) return 5;       // Mercury -> Virgo
  if (deg < 20) return 11;      // Jupiter -> Pisces
  if (deg < 25) return 9;       // Saturn -> Capricorn
  return 7;                     // Mars -> Scorpio
}

function divisionalSign(code, planet) {
  if (code === 'D1' || code === 'MOON') return planet.sign || null;
  if (code === 'D9' && planet.navamsaSign) return planet.navamsaSign;

  const idx = signIndex(planet.sign);
  const deg = degreeInSign(planet.nirayanaLongitude);
  if (idx == null || deg == null) return null;

  switch (code) {
    case 'D2': {
      const first = deg < 15;
      return signName(isOddSign(idx) ? (first ? 4 : 3) : (first ? 3 : 4)); // Leo/Cancer
    }
    case 'D3': return signName(idx + [0, 4, 8][partIndex(deg, 3)]);
    case 'D4': return signName(idx + [0, 3, 6, 9][partIndex(deg, 4)]);
    case 'D7': return signName((isOddSign(idx) ? idx : idx + 6) + partIndex(deg, 7));
    case 'D9': return signName(idx + (signMode(idx) === 0 ? 0 : signMode(idx) === 1 ? 8 : 4) + partIndex(deg, 9));
    case 'D10': return signName((isOddSign(idx) ? idx : idx + 8) + partIndex(deg, 10));
    case 'D12': return signName(idx + partIndex(deg, 12));
    case 'D16': return signName((signMode(idx) === 0 ? 0 : signMode(idx) === 1 ? 4 : 8) + partIndex(deg, 16));
    case 'D20': return signName((signMode(idx) === 0 ? 0 : signMode(idx) === 1 ? 8 : 4) + partIndex(deg, 20));
    case 'D24': return signName((isOddSign(idx) ? 4 : 3) + partIndex(deg, 24));
    case 'D27': return signName([0, 3, 6, 9][elementGroup(idx)] + partIndex(deg, 27));
    case 'D30': return signName(d30Sign(idx, deg));
    case 'D40': return signName((isOddSign(idx) ? 0 : 6) + partIndex(deg, 40));
    case 'D45': return signName((signMode(idx) === 0 ? 0 : signMode(idx) === 1 ? 4 : 8) + partIndex(deg, 45));
    case 'D60': return signName(isOddSign(idx) ? idx + partIndex(deg, 60) : idx - partIndex(deg, 60));
    default: return null;
  }
}

function toChartPlanets(code, planets) {
  return (planets || [])
    .map((p) => ({
      planet: p.planet,
      sign: divisionalSign(code, p),
      baseSign: p.sign,
      house: p.house,
      degreeInSign: p.degreeInSign,
      nirayanaLongitude: p.nirayanaLongitude,
      nakshatra: p.nakshatra,
      isRetrograde: p.isRetrograde,
      isCombust: p.isCombust,
    }))
    .filter((p) => p.sign);
}

function divisionalAscendant(code, data) {
  if (code === 'D1') return data.ascendant || null;
  if (code === 'MOON') return data.moonSign || null;
  if (!data.ascendant || data.ascendantLongitude == null) return null;
  return divisionalSign(code, {
    planet: 'Ascendant',
    sign: data.ascendant,
    nirayanaLongitude: data.ascendantLongitude,
  });
}

function chartFor(meta, kundli) {
  const data = kundli.data || {};
  const planets = toChartPlanets(meta.code, data.planets || []);
  const ascendantSign = divisionalAscendant(meta.code, data);
  return {
    ...meta,
    ascendantSign,
    planets,
    calculation: meta.code === 'D9'
      ? 'Navamsha signs use direct chart data when available; otherwise calculated from sidereal longitude.'
      : 'Calculated from sidereal planetary longitude and user birth details.',
  };
}

async function getVargaCharts(input, options = {}) {
  const kundli = await getKundli(input);
  const requested = Array.isArray(options.charts) && options.charts.length
    ? new Set(options.charts.map((x) => String(x).toUpperCase()))
    : null;
  const charts = META
    .filter((m) => !requested || requested.has(m.code))
    .map((m) => chartFor(m, kundli));
  return {
    cached: kundli.cached,
    data: {
      ayanamsa: kundli.data && kundli.data.ayanamsa,
      location: kundli.data && kundli.data.location,
      time: kundli.data && kundli.data.time,
      ascendant: kundli.data && kundli.data.ascendant,
      moonSign: kundli.data && kundli.data.moonSign,
      charts,
    },
  };
}

module.exports = { getVargaCharts };
