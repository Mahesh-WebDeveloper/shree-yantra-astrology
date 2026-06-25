'use strict';

const { getKundli, getDasha, getYoga, getGochar } = require('./vedastro.service');
const { getVargaCharts } = require('./varga.service');
const { getReading } = require('./reading.service');
const { getLifeTimeline } = require('./lifeTimeline.service');
const { getRemedies } = require('./remedies.service');
const { getTransitForecast } = require('./transitForecast.service');
const { computeAvakhada } = require('../utils/avakhada');
const { computeAshtakavarga } = require('../utils/ashtakavarga');
const { birthNumerology } = require('../utils/numerology');
const { computeJaimini } = require('../utils/jaimini');
const { computeVarshphal } = require('../utils/varshphal');
const { kpLords } = require('../utils/kp');
const { computeLalKitab } = require('../utils/lalKitab');
const { computeShadbala } = require('../utils/shadbala');
const eph = require('../utils/localEphemeris');

const SHADBALA_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const WEEKDAY_LORD = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // Sun..Sat
const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
const isRetroFn = (v) => v === true || String(v).toLowerCase() === 'true';
const hnumFn = (h) => { const m = String(h ?? '').match(/\d+/); return m ? Number(m[0]) : null; };

const RASHIS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const RASHI_IDX = RASHIS.reduce((a, s, i) => { a[s] = i; return a; }, {});

const DOMAIN_CONFIG = [
  {
    key: 'marriage',
    title: { en: 'Marriage & Relationships', hi: 'विवाह और संबंध' },
    charts: ['D1', 'D9'],
    focus: ['7th house', 'Venus', 'Jupiter', 'Navamsha', 'Dasha timing'],
  },
  {
    key: 'career',
    title: { en: 'Career & Status', hi: 'करियर और प्रतिष्ठा' },
    charts: ['D1', 'D10'],
    focus: ['10th house', 'Saturn', 'Sun', 'Dashamsha', 'Current dasha'],
  },
  {
    key: 'finance',
    title: { en: 'Finance & Wealth', hi: 'धन और वित्त' },
    charts: ['D1', 'D2'],
    focus: ['2nd house', '11th house', 'Jupiter', 'Venus', 'Hora'],
  },
  {
    key: 'health',
    title: { en: 'Health & Vitality', hi: 'स्वास्थ्य और ऊर्जा' },
    charts: ['D1', 'D30'],
    focus: ['1st house', '6th house', 'Moon', 'Mars', 'Trimsamsha'],
  },
  {
    key: 'children',
    title: { en: 'Children & Creativity', hi: 'संतान और रचनात्मकता' },
    charts: ['D1', 'D7'],
    focus: ['5th house', 'Jupiter', 'Saptamsha'],
  },
  {
    key: 'property',
    title: { en: 'Property & Comforts', hi: 'संपत्ति और सुख' },
    charts: ['D1', 'D4', 'D16'],
    focus: ['4th house', 'Mars', 'Moon', 'Chaturthamsa', 'Shodashamsha'],
  },
  {
    key: 'family',
    title: { en: 'Family & Roots', hi: 'परिवार और मूल' },
    charts: ['D1', 'D12'],
    focus: ['2nd house', '4th house', 'Dwadashamsha', 'Moon'],
  },
];

const ROADMAP = []; // all expert modules implemented

const ok = (value) => ({ ok: true, value });
const fail = (error) => ({ ok: false, error: error && error.message ? error.message : String(error || 'Unavailable') });

async function settle(label, fn) {
  try {
    return ok(await fn());
  } catch (error) {
    return fail(error);
  }
}

function countPresent(items) {
  return Array.isArray(items) ? items.filter(Boolean).length : 0;
}

function signLabel(sign) {
  return sign || 'Unknown';
}

function activeDashaFrom(timeline, dasha) {
  const current = timeline && Array.isArray(timeline.periods) ? timeline.periods.find((p) => p.current) : null;
  if (current) {
    return {
      lord: current.lord,
      fromAge: current.fromAge,
      toAge: current.toAge,
      fromYear: current.fromYear,
      toYear: current.toYear,
      nature: current.nature,
      phala: current.phala || null,
    };
  }
  const first = dasha && Array.isArray(dasha.dasha) ? dasha.dasha[0] : null;
  return first ? { lord: first.lord, start: first.start, end: first.end, durationText: first.durationText } : null;
}

function pickPredictions(reading, domainKey) {
  const list = Array.isArray(reading && reading.predictions) ? reading.predictions : [];
  const keyMap = {
    marriage: ['marriage', 'relationship', 'venus', '7th'],
    career: ['career', 'work', 'status', 'profession', '10th'],
    finance: ['finance', 'wealth', 'money', '2nd', '11th'],
    health: ['health', 'vitality', '6th', 'lagna'],
    children: ['children', 'creativity', '5th'],
    property: ['property', 'home', 'comfort', '4th'],
    family: ['family', 'parents', 'roots', '2nd', '12th'],
  };
  const needles = keyMap[domainKey] || [];
  const scored = list
    .map((p) => {
      const hay = `${p.key || ''} ${p.category || ''} ${p.title && p.title.en || ''} ${p.text && p.text.en || ''}`.toLowerCase();
      const score = needles.reduce((n, s) => n + (hay.includes(s) ? 1 : 0), 0);
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.p);
  return scored;
}

function buildDomains({ reading, timeline, transitForecast }) {
  const current = timeline && Array.isArray(timeline.periods) ? timeline.periods.find((p) => p.current) : null;
  const favorableYears = transitForecast && Array.isArray(transitForecast.years)
    ? transitForecast.years
      .filter((y) => y.guru && y.guru.kind === 'good')
      .slice(0, 4)
      .map((y) => y.year)
    : [];

  return DOMAIN_CONFIG.map((domain) => {
    const predictions = pickPredictions(reading, domain.key);
    return {
      ...domain,
      summary: predictions[0] ? predictions[0].text : null,
      supportingPredictions: predictions,
      timing: {
        currentDashaLord: current ? current.lord : null,
        currentDashaNature: current ? current.nature : null,
        favorableYears,
      },
      confidence: predictions.length ? 'calculated' : 'needs-deeper-rules',
    };
  });
}

function buildSections({ kundli, varga, dasha, yoga, reading, timeline, remedies, gochar, transitForecast }) {
  const planets = kundli && kundli.data && kundli.data.planets ? kundli.data.planets : [];
  const doshas = kundli && kundli.data && kundli.data.doshas ? kundli.data.doshas : [];
  const yogas = yoga && Array.isArray(yoga.yogas) ? yoga.yogas : (kundli && kundli.data && kundli.data.yogas) || [];
  const charts = varga && varga.data && Array.isArray(varga.data.charts) ? varga.data.charts : [];
  const predictions = reading && Array.isArray(reading.predictions) ? reading.predictions : [];
  const periods = timeline && Array.isArray(timeline.periods) ? timeline.periods : [];
  const transitYears = transitForecast && Array.isArray(transitForecast.years) ? transitForecast.years : [];

  return [
    {
      key: 'birth-foundation',
      title: { en: 'Birth Foundation', hi: 'जन्म आधार' },
      status: kundli ? 'ready' : 'unavailable',
      count: planets.length,
      source: kundli ? 'Real planetary positions (Lahiri sidereal)' : null,
    },
    {
      key: 'planetary-positions',
      title: { en: 'Planetary Positions', hi: 'ग्रह स्थिति' },
      status: planets.length ? 'ready' : 'unavailable',
      count: planets.length,
      source: 'AllPlanetData',
    },
    {
      key: 'divisional-charts',
      title: { en: 'Divisional Charts', hi: 'वर्ग कुंडली' },
      status: charts.length ? 'ready' : 'partial',
      count: charts.length,
      source: 'D1 to D60 from sidereal longitude',
    },
    {
      key: 'dasha',
      title: { en: 'Dasha Timeline', hi: 'दशा काल' },
      status: periods.length || (dasha && dasha.dasha && dasha.dasha.length) ? 'ready' : 'partial',
      count: periods.length || countPresent(dasha && dasha.dasha),
      source: timeline && timeline.source ? timeline.source : 'Vimshottari',
    },
    {
      key: 'yoga-dosha',
      title: { en: 'Yogas & Doshas', hi: 'योग और दोष' },
      status: yogas.length || doshas.length ? 'ready' : 'partial',
      count: yogas.length + doshas.length,
      source: 'HoroscopePredictions + deterministic dosha checks',
    },
    {
      key: 'classical-reading',
      title: { en: 'Classical Reading', hi: 'शास्त्रीय फलादेश' },
      status: predictions.length ? 'ready' : 'partial',
      count: predictions.length,
      source: reading && reading.source,
    },
    {
      key: 'remedies',
      title: { en: 'Gemstones & Remedies', hi: 'रत्न और उपाय' },
      status: remedies ? 'ready' : 'partial',
      count: remedies && remedies.remedies ? countPresent([remedies.remedies.lifeGem, ...(remedies.remedies.doshaRemedies || []), ...(remedies.remedies.planetMantras || [])]) : 0,
      source: 'Chart-derived remedy tables',
    },
    {
      key: 'gochar-varshphal',
      title: { en: 'Transit & Yearly Forecast', hi: 'गोचर और वार्षिक संकेत' },
      status: gochar || transitYears.length ? 'ready' : 'partial',
      count: transitYears.length,
      source: transitForecast && transitForecast.source,
    },
  ];
}

async function getBrihatKundli(input) {
  const birth = { lat: input.lat, lng: input.lng, dob: input.dob, tob: input.tob, tz: input.tz, place: input.place };
  const lang = input.lang;

  const kundliResult = await settle('kundli', () => getKundli(birth));
  if (!kundliResult.ok) {
    const error = new Error(kundliResult.error);
    error.status = 502;
    throw error;
  }
  const kundli = kundliResult.value;
  const nowY = new Date().getFullYear();

  const [vargaResult, dashaResult, yogaResult, readingResult, timelineResult, remediesResult, gocharResult, transitResult] = await Promise.all([
    settle('varga', () => getVargaCharts(birth)),
    settle('dasha', () => getDasha(birth)),
    settle('yoga', () => getYoga(birth)),
    settle('reading', () => getReading({ ...birth, lang, skipAi: true })),
    settle('timeline', () => getLifeTimeline({ ...birth, lang, skipAi: true })),
    settle('remedies', () => getRemedies({ ...birth, lang, skipAi: true })),
    settle('gochar', () => getGochar(birth)),
    settle('transitForecast', () => getTransitForecast({ ...birth, lang, skipAi: true, fromYear: nowY, toYear: nowY + 4 })),
  ]);

  const optional = {
    varga: vargaResult.ok ? vargaResult.value : null,
    dasha: dashaResult.ok ? dashaResult.value : null,
    yoga: yogaResult.ok ? yogaResult.value : null,
    reading: readingResult.ok ? readingResult.value : null,
    timeline: timelineResult.ok ? timelineResult.value : null,
    remedies: remediesResult.ok ? remediesResult.value : null,
    gochar: gocharResult.ok ? gocharResult.value : null,
    transitForecast: transitResult.ok ? transitResult.value : null,
  };

  const errors = {
    varga: vargaResult.ok ? null : vargaResult.error,
    dasha: dashaResult.ok ? null : dashaResult.error,
    yoga: yogaResult.ok ? null : yogaResult.error,
    reading: readingResult.ok ? null : readingResult.error,
    timeline: timelineResult.ok ? null : timelineResult.error,
    remedies: remediesResult.ok ? null : remediesResult.error,
    gochar: gocharResult.ok ? null : gocharResult.error,
    transitForecast: transitResult.ok ? null : transitResult.error,
  };

  const data = kundli.data || {};
  const planets = data.planets || [];
  const moon = planets.find((p) => p.planet === 'Moon') || {};
  const sun = planets.find((p) => p.planet === 'Sun') || {};
  const activeDasha = activeDashaFrom(optional.timeline, optional.dasha);
  const domains = buildDomains({ reading: optional.reading, timeline: optional.timeline, transitForecast: optional.transitForecast });
  const sections = buildSections({ kundli, ...optional });

  // Avakhada Chakra — deterministic classical attributes from Moon + Lagna.
  let avakhada = null;
  try {
    const moonLon = moon && moon.nirayanaLongitude != null ? (((Number(moon.nirayanaLongitude) % 360) + 360) % 360) : null;
    if (moonLon != null && Number.isFinite(moonLon)) {
      const NAK = 360 / 27;
      const nakIdx0 = Math.floor(moonLon / NAK) % 27;
      const moonPada = Math.floor((moonLon % NAK) / (NAK / 4)) + 1;
      const lagnaIdx = data.ascendant ? RASHIS.indexOf(data.ascendant) : -1;
      const bal = optional.timeline && optional.timeline.balance;
      const dashaBalance = bal
        ? `${bal.lord}${bal.bhogyaYears != null ? ' ' + bal.bhogyaYears + 'y' : ''}`.trim()
        : (activeDasha ? activeDasha.lord : null);
      avakhada = computeAvakhada({
        moonNakIdx0: nakIdx0,
        moonPada,
        moonRashiIdx0: Math.floor(moonLon / 30),
        lagnaRashiIdx0: lagnaIdx >= 0 ? lagnaIdx : null,
        dashaBalance,
      });
    }
  } catch (_) { /* avakhada optional — report still renders */ }

  // Ashtakavarga (Bhinna + Sarva) — deterministic BPHS bindu tables.
  let ashtakavarga = null;
  try {
    const byName = {};
    planets.forEach((p) => { byName[p.planet] = p; });
    const posOf = (n) => { const p = byName[n]; return p && p.sign != null && RASHI_IDX[p.sign] != null ? RASHI_IDX[p.sign] : null; };
    const positions = {
      Sun: posOf('Sun'), Moon: posOf('Moon'), Mars: posOf('Mars'), Mercury: posOf('Mercury'),
      Jupiter: posOf('Jupiter'), Venus: posOf('Venus'), Saturn: posOf('Saturn'),
      Lagna: data.ascendant != null && RASHI_IDX[data.ascendant] != null ? RASHI_IDX[data.ascendant] : null,
    };
    if (Object.values(positions).every((v) => v != null)) {
      ashtakavarga = computeAshtakavarga(positions);
    }
  } catch (_) { /* optional */ }

  // Numerology — Moolank (psychic) + Bhagyank (destiny) from DOB.
  let numerology = null;
  try { numerology = birthNumerology(input.dob); } catch (_) { /* optional */ }

  // Jaimini (Chara Karakas + Arudha Lagna) + Varshphal (Muntha) — deterministic.
  let jaimini = null;
  let varshphal = null;
  try {
    const lagnaIdx = data.ascendant != null && RASHI_IDX[data.ascendant] != null ? RASHI_IDX[data.ascendant] : null;
    const degMap = {};
    planets.forEach((p) => {
      if (p.nirayanaLongitude != null && Number.isFinite(Number(p.nirayanaLongitude))) {
        const lon = (((Number(p.nirayanaLongitude) % 360) + 360) % 360);
        degMap[p.planet] = { signIdx: Math.floor(lon / 30), deg: lon % 30 };
      }
    });
    if (Object.keys(degMap).length >= 7) jaimini = computeJaimini(degMap, lagnaIdx);
    const birthYear = Number(String(input.dob || '').split('-')[2]);
    if (lagnaIdx != null && birthYear) {
      varshphal = computeVarshphal({ lagnaSignIdx: lagnaIdx, birthYear, fromYear: nowY, count: 5 });
    }
  } catch (_) { /* optional */ }

  // KP — Sign-lord / Star-lord / Sub-lord for each planet + Ascendant (deterministic).
  let kp = null;
  try {
    const rows = planets
      .filter((p) => p.nirayanaLongitude != null && Number.isFinite(Number(p.nirayanaLongitude)))
      .map((p) => ({ planet: p.planet, ...kpLords(Number(p.nirayanaLongitude)) }));
    const ascLon = data.ascendantLongitude;
    const ascendant = ascLon != null && Number.isFinite(Number(ascLon)) ? { planet: 'Ascendant', ...kpLords(Number(ascLon)) } : null;
    if (rows.length) kp = { ascendant, planets: rows };
  } catch (_) { /* optional */ }

  // Lal Kitab house chart (deterministic placement only).
  let lalKitab = null;
  try {
    const lagnaIdx = data.ascendant != null && RASHI_IDX[data.ascendant] != null ? RASHI_IDX[data.ascendant] : null;
    if (lagnaIdx != null) lalKitab = computeLalKitab(planets.filter((p) => p.sign), lagnaIdx);
  } catch (_) { /* optional */ }

  // Shadbala (six-fold strength, classical BPHS).
  let shadbala = null;
  try {
    const [bd, bm, by] = String(input.dob).split('-').map(Number);
    const [bh, bmin] = String(input.tob).split(':').map(Number);
    const tzMin = eph.parseTzMin(input.tz || '+05:30');
    const birthDate = new Date(Date.UTC(by, bm - 1, bd, bh, bmin, 0) - tzMin * 60000);
    const byName = {}; planets.forEach((p) => { byName[p.planet] = p; });
    const ctxPlanets = {};
    for (const pl of SHADBALA_PLANETS) {
      const pp = byName[pl];
      if (!pp || pp.nirayanaLongitude == null) continue;
      const lon = (((Number(pp.nirayanaLongitude)) % 360) + 360) % 360;
      let navIdx = pp.navamsaSign != null ? RASHI_IDX[pp.navamsaSign] : null;
      if (navIdx == null) navIdx = RASHI_IDX[eph.navamsaSign(lon)];
      ctxPlanets[pl] = {
        lon, signIdx: Math.floor(lon / 30), deg: lon % 30,
        house: hnumFn(pp.house) || (((Math.floor(lon / 30) - (RASHI_IDX[data.ascendant] || 0) + 12) % 12) + 1),
        navIdx: navIdx || 0, retro: isRetroFn(pp.isRetrograde),
        speed: eph.dailySpeed(pl, birthDate), decl: eph.declination(pl, birthDate),
      };
    }
    // varga signs for Saptavargaja
    const vargaSignIdx = {};
    SHADBALA_PLANETS.forEach((pl) => { vargaSignIdx[pl] = {}; });
    ((optional.varga && optional.varga.data && optional.varga.data.charts) || []).forEach((c) => {
      const dn = Number(String(c.code).replace(/\D/g, ''));
      if (![2, 3, 7, 9, 12, 30].includes(dn)) return;
      (c.planets || []).forEach((pp) => { if (vargaSignIdx[pp.planet] && pp.sign != null) vargaSignIdx[pp.planet][dn] = RASHI_IDX[pp.sign]; });
    });
    // time context
    const localMin = bh * 60 + bmin;
    const civil = new Date(by, bm - 1, bd, 12);
    const sunrise = eph.riseSetMinutes('Sun', civil, input.lat, input.lng, tzMin, 1);
    const sunset = eph.riseSetMinutes('Sun', civil, input.lat, input.lng, tzMin, -1);
    const sr = sunrise == null ? 360 : sunrise;
    const ss = sunset == null ? 1080 : sunset;
    let weekday = civil.getDay();
    if (localMin < sr) weekday = (weekday + 6) % 7;
    const weekdayLord = WEEKDAY_LORD[weekday];
    let msr = localMin - sr; if (msr < 0) msr += 1440;
    const horaIndex = Math.floor(msr / 60);
    const horaLord = CHALDEAN[(CHALDEAN.indexOf(weekdayLord) + horaIndex) % 7];
    const isDay = localMin >= sr && localMin < ss;
    let tribhagaLord;
    if (isDay) { const part = Math.min(2, Math.floor((localMin - sr) / Math.max(1, (ss - sr) / 3))); tribhagaLord = ['Mercury', 'Sun', 'Saturn'][part]; }
    else { const t = localMin >= ss ? localMin : localMin + 1440; const nl = (sr + 1440) - ss; const part = Math.min(2, Math.floor((t - ss) / Math.max(1, nl / 3))); tribhagaLord = ['Moon', 'Venus', 'Mars'][part]; }

    if (ctxPlanets.Sun && ctxPlanets.Moon) {
      shadbala = computeShadbala({
        planets: ctxPlanets, vargaSignIdx,
        ascLon: data.ascendantLongitude != null ? Number(data.ascendantLongitude) : (RASHI_IDX[data.ascendant] || 0) * 30,
        sunLon: ctxPlanets.Sun.lon, moonLon: ctxPlanets.Moon.lon,
        noonDist: Math.abs(localMin / 60 - 12),
        weekdayLord, horaLord, tribhagaLord,
      });
    }
  } catch (_) { /* optional */ }

  if (ashtakavarga) sections.push({ key: 'ashtakavarga', title: { en: 'Ashtakavarga', hi: 'अष्टकवर्ग' }, status: 'ready', count: ashtakavarga.sarvaTotal, source: 'BPHS bindu tables (Sarva total 337)' });
  if (shadbala) sections.push({ key: 'shadbala', title: { en: 'Shadbala', hi: 'षड्बल' }, status: 'ready', count: Object.keys(shadbala.planets).length, source: 'Six-fold strength (classical BPHS, Rupas)' });
  if (lalKitab) sections.push({ key: 'lal-kitab', title: { en: 'Lal Kitab Chart', hi: 'लाल किताब' }, status: 'ready', count: 12, source: 'House-wise placement (Teva)' });
  if (kp) sections.push({ key: 'kp', title: { en: 'KP Significators', hi: 'KP कारक' }, status: 'ready', count: (kp.planets || []).length, source: 'Sign / Star / Sub lord (Vimshottari sub-division)' });
  if (numerology) sections.push({ key: 'numerology', title: { en: 'Numerology', hi: 'अंक ज्योतिष' }, status: 'ready', count: 2, source: 'Moolank + Bhagyank (Chaldean)' });
  if (jaimini) sections.push({ key: 'jaimini', title: { en: 'Jaimini Karakas', hi: 'जैमिनी कारक' }, status: 'ready', count: (jaimini.charaKarakas || []).length, source: 'Chara Karakas + Arudha Lagna' });
  if (varshphal && varshphal.years.length) sections.push({ key: 'varshphal', title: { en: 'Varshphal (Muntha)', hi: 'वर्षफल (मुन्था)' }, status: 'ready', count: varshphal.years.length, source: 'Tajika Muntha progression' });

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'brihat-kundli-v1',
    title: { en: 'Brihat Kundli', hi: 'बृहत कुंडली' },
    summary: {
      ascendant: data.ascendant || null,
      moonSign: data.moonSign || null,
      sunSign: sun.sign || null,
      moonNakshatra: moon.nakshatra || (optional.reading && optional.reading.moonNakshatra) || null,
      ayanamsa: data.ayanamsa || 'LAHIRI',
      location: data.location || null,
      time: data.time || null,
      activeDasha,
      yogasCount: ((optional.yoga && optional.yoga.yogas) || data.yogas || []).length,
      doshas: data.doshas || [],
    },
    accuracy: {
      calculation: 'high',
      engine: 'Real astronomical planetary positions + Lahiri ayanamsa + exact birth coordinates',
      requires: [
        'Exact birth time',
        'Exact birth place latitude/longitude',
        'Correct timezone for birth date',
        'Visible calculation source per section',
      ],
      note: 'Astronomical calculations can be validated. Interpretations are traditional indications, not guaranteed outcomes.',
    },
    avakhada,
    ashtakavarga,
    numerology,
    jaimini,
    varshphal,
    kp,
    shadbala,
    lalKitab,
    sections,
    domains,
    data: {
      kundli,
      varga: optional.varga,
      dasha: optional.dasha,
      yoga: optional.yoga,
      reading: optional.reading,
      timeline: optional.timeline,
      remedies: optional.remedies,
      gochar: optional.gochar,
      transitForecast: optional.transitForecast,
    },
    roadmap: ROADMAP,
    errors,
  };
}

module.exports = { getBrihatKundli };
