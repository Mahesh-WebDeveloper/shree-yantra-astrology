// VedAstro ke saath baat-cheet — TIER-AWARE + sahi POST format.
//
// SAHI FORMAT (API Builder se confirmed):
//   POST /Calculate/AllPlanetData
//   { "PlanetName": { "Name": "Moon" },                 // <- OBJECT (string dene par sab Sun ban jaata hai!)
//     "Time": { "StdTime": "HH:MM DD/MM/YYYY +TZ",
//               "Location": { "Name": "...", "Latitude": <num>, "Longitude": <num> } },  // <- Location, Time ke ANDAR
//     "Ayanamsa": "LAHIRI" }
//
// 'free' tier: bina API key (15 req/min). 'paid' tier: x-api-key header. Tier dashboard se badalta hai.
const env = require('../config/env');
const Settings = require('../models/Settings');
const Kundli = require('../models/Kundli');
const { resolveLocation } = require('./location.service');
const eph = require('../utils/localEphemeris');
const { computeVimshottari } = require('../utils/vimshottari');
const { fetchT } = require('../utils/httpFetch');

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SIGN_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_INDEX = SIGN_ORDER.reduce((acc, sign, i) => { acc[sign] = i; return acc; }, {});

// Local-ephemeris planet object in VedAstro's shape — FALLBACK jab VedAstro flaky ho.
// (sign/longitude/nakshatra/retro local; house ascendant se; navamsa D9; combust Sun-sep se.)
const COMBUST_ORB = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
function buildLocalPlanet(lp, ascSignIdx, sunLon) {
  const signIdx = SIGN_INDEX[lp.sign];
  const house = (ascSignIdx != null && signIdx != null) ? ((signIdx - ascSignIdx + 12) % 12) + 1 : null;
  let isCombust = false;
  const orb = COMBUST_ORB[lp.planet];
  if (orb && sunLon != null) {
    const sep = Math.abs((((lp.nirayanaLongitude - sunLon) % 360) + 540) % 360 - 180); // 0..180
    isCombust = sep < orb;
  }
  return {
    planet: lp.planet,
    sign: lp.sign,
    degreeInSign: eph.dms(lp.nirayanaLongitude % 30),
    nirayanaLongitude: lp.nirayanaLongitude,
    nakshatra: { Name: lp.nakshatra, Pada: lp.pada },
    house: house != null ? `House${house}` : null,
    navamsaSign: eph.navamsaSign(lp.nirayanaLongitude),
    isRetrograde: lp.isRetrograde,
    isCombust,
    source: 'local',
  };
}

// ── Insight ke liye classical data (sign traits + planet strengths) ──
const SIGN_TRAIT = {
  Aries: 'bold and pioneering', Taurus: 'steady and grounded', Gemini: 'curious and communicative',
  Cancer: 'nurturing and intuitive', Leo: 'confident and warm', Virgo: 'analytical and precise',
  Libra: 'balanced and diplomatic', Scorpio: 'intense and transformative', Sagittarius: 'optimistic and philosophical',
  Capricorn: 'disciplined and ambitious', Aquarius: 'independent and visionary', Pisces: 'compassionate and imaginative',
};
const EXALT = { Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo', Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra' };
const DEBIL = { Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces', Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries' };
const OWN = {
  Sun: ['Leo'], Moon: ['Cancer'], Mars: ['Aries', 'Scorpio'], Mercury: ['Gemini', 'Virgo'],
  Jupiter: ['Sagittarius', 'Pisces'], Venus: ['Taurus', 'Libra'], Saturn: ['Capricorn', 'Aquarius'],
};

// Kundli data se "Key Insights" banata hai (sab kuch VedAstro positions se derived).
function computeInsights({ ascendant, moonSign, planets, yogas, doshas }) {
  const out = [];
  const byName = {};
  (planets || []).forEach((p) => { byName[p.planet] = p; });

  if (ascendant && SIGN_TRAIT[ascendant]) {
    out.push({ title: 'Lagna (Ascendant)', text: `${ascendant} rising — your outward nature is ${SIGN_TRAIT[ascendant]}.` });
  }
  if (moonSign && SIGN_TRAIT[moonSign]) {
    out.push({ title: 'Moon Sign (Rashi)', text: `Moon in ${moonSign} — your mind and emotions are ${SIGN_TRAIT[moonSign]}.` });
  }

  // strongest planet: exalted ya own sign me
  const strong = [];
  Object.keys(EXALT).forEach((pl) => {
    const sign = byName[pl] && byName[pl].sign;
    if (!sign) return;
    if (sign === EXALT[pl]) strong.push(`${pl} is exalted in ${sign}`);
    else if ((OWN[pl] || []).includes(sign)) strong.push(`${pl} is in its own sign ${sign}`);
  });
  if (strong.length) {
    out.push({ title: 'Key Strength', text: `${strong[0]} — a strong, supportive placement in your chart.` });
  } else {
    // koi debilitated ho to wo bhi useful insight
    const weak = Object.keys(DEBIL).find((pl) => byName[pl] && byName[pl].sign === DEBIL[pl]);
    if (weak) out.push({ title: 'Area to Strengthen', text: `${weak} is debilitated in ${DEBIL[weak]} — focus and remedies help here.` });
  }

  if (Array.isArray(yogas) && yogas.length) {
    const names = yogas.slice(0, 3).map((y) => String(y.name).replace(/Yoga$/, '')).join(', ');
    out.push({ title: 'Auspicious Yogas', text: `${yogas.length} classical yoga${yogas.length > 1 ? 's' : ''} present (${names}) — favourable combinations in your chart.` });
  }

  if (Array.isArray(doshas)) {
    const present = doshas.filter((d) => d.present).map((d) => d.name);
    out.push({
      title: 'Dosha Check',
      text: present.length ? `${present.join(' & ')} present — see remedies.` : 'No major dosha (Mangal / Kaal Sarp) in your chart — clear.',
    });
  }
  return out;
}

async function vedastroHeaders() {
  let dbTier = 'free';
  try { dbTier = (await Settings.getGlobal()).vedastroTier; } catch (_) { /* DB down → env decides */ }
  // env VEDASTRO_TIER=paid forces paid even if the DB singleton still says 'free'
  // (DB tier is $setOnInsert only, so a pre-existing doc won't auto-upgrade).
  const tier = (env.vedastro.tier === 'paid' || dbTier === 'paid') ? 'paid' : 'free';
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (tier === 'paid' && env.vedastro.apiKey) {
    headers['x-api-key'] = env.vedastro.apiKey;
  }
  return { headers, tier };
}

// ── VedAstro circuit breaker ────────────────────────────────────────────────
// VedAstro hamara PRIMARY source hai. Agar wo down/suspend/timeout ho, hum kuch
// der ke liye use skip karke seedhe LOCAL ephemeris fallback use karte hain —
// taaki har request 15s VedAstro-timeout ka wait na kare (app fast rahe).
let _vedastroCoolUntil = 0;
function vedastroHealthy() { return Date.now() >= _vedastroCoolUntil; }
function tripVedastro(ms = 60000) { _vedastroCoolUntil = Date.now() + ms; }
function clearVedastroCooldown() { _vedastroCoolUntil = 0; }

// generic POST caller — koi bhi VedAstro calculator
async function vedastroPost(path, body, timeoutMs = 15000) {
  const { headers } = await vedastroHeaders();
  const res = await fetchT(`${env.vedastro.baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }, timeoutMs);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const err = new Error(`VedAstro ${res.status}: ${txt.slice(0, 200)}`);
    err.status = res.status === 429 ? 429 : 502;
    throw err;
  }
  return res.json();
}

// ── geocoding (place name → coords), provider selected in location.service ──
const GEO_CACHE = new Map();
async function geocode(place) {
  const key = String(place).trim().toLowerCase();
  if (GEO_CACHE.has(key)) return GEO_CACHE.get(key);
  const item = await resolveLocation({ query: place, description: place, country: env.maps.defaultCountry });
  if (item?.lat == null || item?.lng == null) throw Object.assign(new Error(`Place nahi mila: ${place}`), { status: 404 });
  const geo = { lat: Number(item.lat), lng: Number(item.lng), name: item.description || place };
  GEO_CACHE.set(key, geo);
  return geo;
}

function parseDmsDegrees(value) {
  const nums = String(value || '').match(/-?\d+(?:\.\d+)?/g);
  if (!nums || !nums.length) return null;
  const deg = Number(nums[0]);
  const min = Number(nums[1] || 0);
  const sec = Number(nums[2] || 0);
  if (!Number.isFinite(deg) || !Number.isFinite(min) || !Number.isFinite(sec)) return null;
  return deg + (min / 60) + (sec / 3600);
}

function parseHouseRasiSign(value) {
  const text = String(value || '');
  const parts = text.split(':');
  const sign = (parts[0] || '').trim();
  const degreeInSign = parseDmsDegrees(parts.slice(1).join(':'));
  const signIdx = SIGN_INDEX[sign];
  return {
    sign: sign || null,
    degreeInSign,
    nirayanaLongitude: signIdx != null && degreeInSign != null ? (signIdx * 30) + degreeInSign : null,
  };
}

// input: { lat?, lng?, dob:'DD-MM-YYYY', tob:'HH:MM', tz:'+05:30', place?:string }
// coords nahi diye par place diya hai → geocode kar lete hain.
async function getKundli(input) {
  let { lat, lng, dob, tob, tz, place } = input;
  if ((lat == null || lng == null) && place) {
    const geo = await geocode(place);
    lat = geo.lat;
    lng = geo.lng;
  }
  if (lat == null || lng == null) {
    throw Object.assign(new Error('lat/lng ya place chahiye'), { status: 400 });
  }
  const ayan = env.vedastro.ayanamsa;
  // v10: Key Insights add (computed from positions) → cache bump
  const cacheKey = `v11|${lat},${lng}|${dob}|${tob}|${tz}|${ayan}`;

  // 1) Cache check (kundli kabhi nahi badalti → forever cache)
  const cached = await Kundli.findOne({ cacheKey });
  if (cached) return { cached: true, ...cached.toObject() };

  // StdTime: "HH:MM DD/MM/YYYY +TZ"  (dob ke dash ko slash me badlo)
  const stdTime = `${tob} ${dob.replace(/-/g, '/')} ${tz}`;
  const location = { Name: place || 'Birth Place', Latitude: Number(lat), Longitude: Number(lng) };

  // 2) Har planet ka data parallel me (per-planet SingleCall = distinct sahi data)
  let planets = await Promise.all(
    PLANETS.map(async (p) => {
      const body = {
        PlanetName: { Name: p },
        Time: { StdTime: stdTime, Location: location },
        Ayanamsa: ayan,
      };
      try {
        const json = await vedastroPost('/Calculate/AllPlanetData', body);
        const d = (json && json.Payload && json.Payload.AllPlanetData) || {};
        // saaf summary nikaalo (kundli render ke liye kaafi; pura noisy payload nahi)
        return {
          planet: p,
          sign: d.PlanetRasiD1Sign && d.PlanetRasiD1Sign.Name,
          degreeInSign: d.PlanetRasiD1Sign && d.PlanetRasiD1Sign.DegreesIn && d.PlanetRasiD1Sign.DegreesIn.DegreeMinuteSecond,
          nirayanaLongitude: d.PlanetNirayanaLongitude && d.PlanetNirayanaLongitude.TotalDegrees,
          nakshatra: d.PlanetConstellation,
          house: d.HousePlanetOccupiesBasedOnSign,
          navamsaSign: d.PlanetNavamshaD9Sign && d.PlanetNavamshaD9Sign.Name,
          isRetrograde: d.IsPlanetRetrograde,
          isCombust: d.IsPlanetCombust,
        };
      } catch (e) {
        return { planet: p, error: e.message };
      }
    })
  );

  // ascendant (Lagna = House-1 sign) + moon sign
  let ascendant = null;
  let ascendantDegreeInSign = null;
  let ascendantLongitude = null;
  try {
    const hs = await vedastroPost('/Calculate/AllHouseRasiSigns', {
      Time: { StdTime: stdTime, Location: location },
      Ayanamsa: ayan,
    });
    const arr = (hs && hs.Payload && hs.Payload.AllHouseRasiSigns) || [];
    const h1 = arr.find((x) => x.House === 'House1');
    if (h1) {
      const parsed = parseHouseRasiSign(h1.AllHouseRasiSigns);
      ascendant = parsed.sign;
      ascendantDegreeInSign = parsed.degreeInSign;
      ascendantLongitude = parsed.nirayanaLongitude;
    }
  } catch (e) { /* ascendant optional — neeche local fallback bhar dega */ }

  // ── LOCAL FALLBACK (VedAstro down/flaky se chart adhoora na rahe) ──
  // Ascendant aur jo bhi planets fail hue, unhe local ephemeris se bhar do
  // (signs VedAstro se exact-match validated). Aise charts CACHE nahi hote —
  // taaki agli baar VedAstro healthy ho to authoritative chart dobara bane.
  const tzMin = eph.parseTzMin(tz);
  const [bd, bm, by] = dob.split('-').map(Number);
  const [bh, bmin] = tob.split(':').map(Number);
  const birthDate = new Date(Date.UTC(by, bm - 1, bd, bh, bmin, 0) - tzMin * 60000);
  let ascSource = 'vedastro';
  if (!ascendant) {
    const la = eph.localAscendant(birthDate, lat, lng);
    ascendant = la.sign; ascendantDegreeInSign = la.degreeInSign; ascendantLongitude = la.longitude;
    ascSource = 'local';
  }
  const ascSignIdx = ascendant != null ? SIGN_INDEX[ascendant] : null;
  if (planets.some((p) => !p.sign || p.error)) {
    const sunP = planets.find((p) => p.planet === 'Sun' && p.nirayanaLongitude != null);
    const sunLon = sunP ? Number(sunP.nirayanaLongitude) : ((eph.localPlanet('Sun', birthDate) || {}).nirayanaLongitude);
    planets = planets.map((p) => {
      if (p.sign && !p.error) return p;
      const lp = eph.localPlanet(p.planet, birthDate);
      return lp ? buildLocalPlanet(lp, ascSignIdx, sunLon) : p;
    });
  }
  const usedLocal = ascSource === 'local' || planets.some((p) => p.source === 'local');

  const moon = planets.find((p) => p.planet === 'Moon');
  const moonSign = moon ? moon.sign : null;

  // ── HoroscopePredictions (yogas + VedAstro ki apni authoritative Mangal Dosha) ──
  let predictions = [];
  try {
    const hp = await vedastroPost('/Calculate/HoroscopePredictions', {
      birthTime: { StdTime: stdTime, Location: location },
      Ayanamsa: ayan,
    });
    if (Array.isArray(hp && hp.Payload)) predictions = hp.Payload;
  } catch (e) { /* optional */ }

  const yogas = predictions
    .filter((it) => Array.isArray(it.Tags) && it.Tags.includes('Yoga'))
    .map((it) => ({ name: it.Name, description: (it.Description || '').trim() }));

  // ── Doshas ──
  const byName = {};
  planets.forEach((p) => { byName[p.planet] = p; });
  const hNum = (h) => { const m = (h || '').match(/\d+/); return m ? Number(m[0]) : null; };
  const lonOf = (n) => (byName[n] && byName[n].nirayanaLongitude != null ? Number(byName[n].nirayanaLongitude) : null);
  const marsH = hNum(byName.Mars && byName.Mars.house);

  // Mangal — VedAstro authoritative (uski prediction "MarsIn2nd4th7th8th12th")
  const mangal = predictions.some((it) => it.Name === 'MarsIn2nd4th7th8th12th');

  // Kaal Sarp — VedAstro ka ready calculator nahi, PAR VedAstro ke sidereal longitudes (nirayanaLongitude)
  // par standard Rahu–Ketu arc rule lagate hain. Data = VedAstro, rule = classical geometry.
  let kaalSarp = false;
  const rahuLon = lonOf('Rahu');
  const sevenLons = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(lonOf);
  if (rahuLon != null && sevenLons.every((v) => v != null)) {
    const ds = sevenLons.map((v) => (((v - rahuLon) % 360) + 360) % 360);
    kaalSarp = ds.every((d) => d > 0 && d < 180) || ds.every((d) => d > 180 && d < 360);
  }

  const doshas = [
    { name: 'Mangal Dosha', present: mangal, detail: mangal ? (marsH ? `Mars in House ${marsH}` : 'Mars in 2/4/7/8/12') : 'Mars not in dosha houses', tag: mangal ? 'Present' : 'Clear', source: 'Planetary positions' },
    { name: 'Kaal Sarp Dosha', present: kaalSarp, detail: kaalSarp ? 'All planets between Rahu–Ketu axis' : 'Not formed in your chart', tag: kaalSarp ? 'Present' : 'Clear', source: 'Planetary positions' },
  ];

  const insights = computeInsights({ ascendant, moonSign, planets, yogas, doshas });
  const data = { ayanamsa: ayan, location, time: stdTime, ascendant, ascendantDegreeInSign, ascendantLongitude, moonSign, doshas, yogas, insights, planets };

  // 3) Cache rules: sab planet signs hone chahiye AUR koi local fallback use na hua ho.
  //    (local-fallback chart accurate hai par authoritative nahi — isliye persist nahi
  //    karte; agli request par VedAstro healthy hone par asli chart ban jaayega.)
  const ok = planets.every((p) => p.sign && !p.error);
  if (!ok) {
    return { cached: false, saved: false, note: 'Some planet positions failed — result not cached.', input, data };
  }
  if (usedLocal) {
    return { cached: false, saved: false, source: 'local-fallback', note: 'Computed via local ephemeris fallback — not cached.', input, data };
  }
  const saved = await Kundli.create({ cacheKey, input, data });
  return { cached: false, saved: true, ...saved.toObject() };
}

// ── Vimshottari Dasha (current + upcoming Mahadashas) ──
const pad2 = (n) => (n < 10 ? '0' : '') + n;
async function getDasha(input) {
  const { dob, tob, tz } = input;
  if (!dob || !tob) throw Object.assign(new Error('dob (DD-MM-YYYY) aur tob (HH:MM) chahiye'), { status: 400 });
  const ayan = env.vedastro.ayanamsa;

  // DASHA = classical Vimshottari, computed LOCALLY (instant + exact). VedAstro ka
  // DasaAtRange endpoint 60-saal scan karta hai → consistently 22-29s (paid par bhi),
  // app ke liye unusably slow. Vimshottari deterministic hai aur iska EKMATRA input
  // Moon ki sidereal longitude hai — jo VedAstro se exact-match validated hai. Yaani
  // result bilkul wahi, bas reliable + turant. (Ye global breaker ko trip NAHI karta,
  // taaki kundli/gochar/transit waale fast VedAstro calls primary bane rahein.)
  return { ayanamsa: ayan, source: 'local-vimshottari', ...localDasha({ dob, tob, tz: tz || '+05:30' }) };
}

// Classical Vimshottari mahadasha from Moon's sidereal longitude (local ephemeris).
// VedAstro DasaAtRange ka EXACT-same result (Moon longitude validated match) — instant.
function localDasha({ dob, tob, tz }) {
  const [dd, mm, yy] = dob.split('-').map(Number);
  const [hh, mi] = tob.split(':').map(Number);
  const tzMin = eph.parseTzMin(tz);
  const birthDate = new Date(Date.UTC(yy, mm - 1, dd, hh, mi, 0) - tzMin * 60000);
  const moon = eph.localPlanet('Moon', birthDate);
  const moonLon = moon ? moon.nirayanaLongitude : 0;
  const NAK_ARC = 360 / 27;
  const nakIdx = Math.floor(moonLon / NAK_ARC) % 27;
  const fraction = (moonLon % NAK_ARC) / NAK_ARC;
  const now = new Date();
  const vim = computeVimshottari(nakIdx + 1, fraction, birthDate, now);
  const MS_YEAR = 365.2425 * 86400000;
  const fmt = (d) => `00:00 ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${tz}`;
  // current + future mahadashas (VedAstro "ab se aage 60 saal" jaisa)
  const dasha = vim.periods
    .filter((p) => !p.past)
    .map((p) => ({
      lord: p.lord,
      start: fmt(new Date(birthDate.getTime() + p.fromAge * MS_YEAR)),
      end: fmt(new Date(birthDate.getTime() + p.toAge * MS_YEAR)),
      durationText: `${Math.round(p.years * 100) / 100} years`,
    }));
  return { dasha };
}

// ── Yogas (HoroscopePredictions me se Tag "Yoga" wale classic yogas) ──
async function getYoga(input) {
  let { lat, lng, dob, tob, tz, place } = input;
  if ((lat == null || lng == null) && place) {
    const geo = await geocode(place);
    lat = geo.lat;
    lng = geo.lng;
  }
  if (lat == null || lng == null) throw Object.assign(new Error('lat/lng ya place chahiye'), { status: 400 });
  const ayan = env.vedastro.ayanamsa;
  const location = { Name: place || 'Birth Place', Latitude: Number(lat), Longitude: Number(lng) };
  const birthStd = `${tob} ${dob.replace(/-/g, '/')} ${tz}`;

  const json = await vedastroPost('/Calculate/HoroscopePredictions', {
    birthTime: { StdTime: birthStd, Location: location },
    Ayanamsa: ayan,
  });
  const list = Array.isArray(json && json.Payload) ? json.Payload : [];
  const yogas = list
    .filter((it) => Array.isArray(it.Tags) && it.Tags.includes('Yoga'))
    .map((it) => ({ name: it.Name, description: (it.Description || '').trim() }));
  return { ayanamsa: ayan, yogas };
}

// ── Choghadiya (VedAstro sunrise/sunset + classical 8-part division) ──
// Fixed cyclic order (lords: Sun,Venus,Mercury,Moon,Saturn,Jupiter,Mars):
const CHOG_CYCLE = [
  { name: 'Udveg', lord: 'Sun', quality: 'Bad' },
  { name: 'Char', lord: 'Venus', quality: 'Neutral' },
  { name: 'Labh', lord: 'Mercury', quality: 'Good' },
  { name: 'Amrit', lord: 'Moon', quality: 'Good' },
  { name: 'Kaal', lord: 'Saturn', quality: 'Bad' },
  { name: 'Shubh', lord: 'Jupiter', quality: 'Good' },
  { name: 'Rog', lord: 'Mars', quality: 'Bad' },
];
// din ka pehla choghadiya weekday ke hisaab se (0=Sun..6=Sat) → CHOG_CYCLE index
const DAY_FIRST_IDX = [0, 3, 6, 2, 5, 1, 4];

const stdToMin = (std) => {
  const t = String(std).split(' ')[0];
  const [h, m, s] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0) + (s || 0) / 60;
};
const minToHM = (min) => {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  let h = Math.floor(min / 60); const m = min % 60; const ap = h < 12 ? 'AM' : 'PM';
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${m < 10 ? '0' : ''}${m} ${ap}`;
};
const minToParts = (min) => {
  const rounded = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return { hm12: minToHM(rounded), hm24: `${pad2(h)}:${pad2(m)}`, minutesFromMidnight: rounded };
};
const stdToParts = (std) => {
  if (!std) return null;
  const raw = String(std).split(' ')[0];
  const [hh, mm, ss] = raw.split(':').map(Number);
  const h = hh || 0;
  const m = mm || 0;
  const s = ss || 0;
  return {
    raw,
    hm12: minToHM(h * 60 + m + s / 60),
    hm24: `${pad2(h)}:${pad2(m)}${raw.split(':').length > 2 ? `:${pad2(s)}` : ''}`,
    hour: h,
    minute: m,
    second: s,
    minutesFromMidnight: h * 60 + m + s / 60,
  };
};
const durationInfo = (minutes) => {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return { minutes: total, hours: h, remainingMinutes: m, text: `${h}h ${m}m`, hi: `${h} घं ${m} मि` };
};
const payloadStdTime = (json, key) => json && json.Payload && json.Payload[key] && json.Payload[key].StdTime;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function vedastroPostRetry(path, body, isValid, label, attempts = 3) {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const json = await vedastroPost(path, body);
      if (!isValid || isValid(json)) return json;
      lastError = new Error(`${label || path} returned incomplete data`);
    } catch (err) {
      lastError = err;
    }
    if (i < attempts - 1) await wait(250 * (i + 1));
  }
  throw lastError || new Error(`${label || path} unavailable`);
}

async function getChoghadiya(input) {
  let { lat, lng, place, tz } = input;
  tz = tz || '+05:30';
  if ((lat == null || lng == null) && place) {
    const geo = await geocode(place);
    lat = geo.lat;
    lng = geo.lng;
  }
  if (lat == null || lng == null) throw Object.assign(new Error('lat/lng ya place chahiye'), { status: 400 });

  const ayan = env.vedastro.ayanamsa;
  const location = { Name: place || 'Place', Latitude: Number(lat), Longitude: Number(lng) };
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const dmy = (dt) => `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`;
  const call = (cal, std) => vedastroPost(`/Calculate/${cal}`, { Time: { StdTime: std, Location: location }, Ayanamsa: ayan });

  const [srT, ssT, srTomT] = await Promise.all([
    call('SunriseTime', `12:00 ${dmy(now)} ${tz}`),
    call('SunsetTime', `12:00 ${dmy(now)} ${tz}`),
    call('SunriseTime', `12:00 ${dmy(tomorrow)} ${tz}`),
  ]);
  const sr = stdToMin(srT && srT.Payload && srT.Payload.SunriseTime && srT.Payload.SunriseTime.StdTime);
  const ss = stdToMin(ssT && ssT.Payload && ssT.Payload.SunsetTime && ssT.Payload.SunsetTime.StdTime);
  const srTom = stdToMin(srTomT && srTomT.Payload && srTomT.Payload.SunriseTime && srTomT.Payload.SunriseTime.StdTime) + 1440;

  const dayLen = ss - sr;
  const nightLen = srTom - ss;
  const wd = now.getDay();
  const dayFirst = DAY_FIRST_IDX[wd];
  const nightFirst = (dayFirst + 5) % 7; // standard: night-first = day-first + 5 (mod 7)

  let nowAbs = now.getHours() * 60 + now.getMinutes();
  if (nowAbs < sr) nowAbs += 1440; // raat (aadhi raat ke baad) ko absolute me laao

  const mk = (cyc, startIdx, baseMin, segLen, label) => {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const c = cyc[(startIdx + i) % 7];
      const start = baseMin + i * segLen;
      const end = baseMin + (i + 1) * segLen;
      out.push({ name: c.name, lord: c.lord, quality: c.quality, period: label, start: minToHM(start), end: minToHM(end), isCurrent: nowAbs >= start && nowAbs < end });
    }
    return out;
  };

  const periods = [
    ...mk(CHOG_CYCLE, dayFirst, sr, dayLen / 8, 'Day'),
    ...mk(CHOG_CYCLE, nightFirst, ss, nightLen / 8, 'Night'),
  ];
  const current = periods.find((p) => p.isCurrent) || null;
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    date: dmy(now),
    weekday: WEEKDAYS[wd],
    sunrise: minToHM(sr),
    sunset: minToHM(ss),
    location: location.Name,
    current,
    periods,
  };
}

// ── Sunrise/Sunset for a place + date (frontend Choghadiya engine ko real times feed karne ke liye) ──
async function getSunTimes(input) {
  let { lat, lng, place, date, tz } = input; // date: 'DD/MM/YYYY' (optional → today)
  tz = tz || '+05:30';
  if ((lat == null || lng == null) && place) {
    const geo = await geocode(place);
    lat = geo.lat;
    lng = geo.lng;
  }
  if (lat == null || lng == null) throw Object.assign(new Error('lat/lng ya place chahiye'), { status: 400 });
  const location = { Name: place || 'Place', Latitude: Number(lat), Longitude: Number(lng) };
  let dstr = date;
  if (!dstr) { const n = new Date(); dstr = `${pad2(n.getDate())}/${pad2(n.getMonth() + 1)}/${n.getFullYear()}`; }
  const std = `12:00 ${dstr} ${tz}`;
  const [srR, ssR] = await Promise.all([
    vedastroPost('/Calculate/SunriseTime', { Time: { StdTime: std, Location: location }, Ayanamsa: env.vedastro.ayanamsa }),
    vedastroPost('/Calculate/SunsetTime', { Time: { StdTime: std, Location: location }, Ayanamsa: env.vedastro.ayanamsa }),
  ]);
  const srHM = String(srR && srR.Payload && srR.Payload.SunriseTime && srR.Payload.SunriseTime.StdTime).split(' ')[0];
  const ssHM = String(ssR && ssR.Payload && ssR.Payload.SunsetTime && ssR.Payload.SunsetTime.StdTime).split(' ')[0];
  const [srH, srM] = srHM.split(':').map(Number);
  const [ssH, ssM] = ssHM.split(':').map(Number);
  return { date: dstr, place: location.Name, sunrise: { h: srH, m: srM }, sunset: { h: ssH, m: ssM } };
}

// ════════════════════════════════════════════════════════════════════
//  DAILY PANCHANG  (VedAstro positions + classical computation)
// ════════════════════════════════════════════════════════════════════
// Tithi / Nakshatra / Yoga / Karana = Moon & Sun ke sidereal longitudes se
// (longitudes VedAstro/Swiss-Ephemeris se aate hain → accurate; rule classical).
// Rahu Kaal / Yamaganda / Gulika = sunrise→sunset ko 8 hisson me baant kar
// weekday ke hisaab se (har panchang isi tarah karta hai).
const TITHI = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima'];
const NAKSHATRA = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
const YOGA = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
const KARANA_MOV = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

// ── Devanagari name tables (for bilingual + verifiable display) ──
const TITHI_HI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा'];
const NAK_HI = ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपदा', 'उत्तरा भाद्रपदा', 'रेवती'];
const YOGA_HI = ['विष्कम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा', 'धृति', 'शूल', 'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र', 'सिद्धि', 'व्यतीपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति'];
const KARANA_HI = { Bava: 'बव', Balava: 'बालव', Kaulava: 'कौलव', Taitila: 'तैतिल', Gara: 'गर', Vanija: 'वणिज', Vishti: 'विष्टि (भद्रा)', Kimstughna: 'किंस्तुघ्न', Shakuni: 'शकुनि', Chatushpada: 'चतुष्पाद', Naga: 'नाग' };
const MASA = [
  { en: 'Chaitra', hi: 'चैत्र' }, { en: 'Vaishakha', hi: 'वैशाख' }, { en: 'Jyeshtha', hi: 'ज्येष्ठ' }, { en: 'Ashadha', hi: 'आषाढ़' },
  { en: 'Shravana', hi: 'श्रावण' }, { en: 'Bhadrapada', hi: 'भाद्रपद' }, { en: 'Ashwina', hi: 'आश्विन' }, { en: 'Kartika', hi: 'कार्तिक' },
  { en: 'Margashirsha', hi: 'मार्गशीर्ष' }, { en: 'Pausha', hi: 'पौष' }, { en: 'Magha', hi: 'माघ' }, { en: 'Phalguna', hi: 'फाल्गुन' },
];
const SAMVATSARA = ['Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angirasa', 'Shrimukha', 'Bhava', 'Yuva', 'Dhata', 'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrisha', 'Chitrabhanu', 'Svabhanu', 'Tarana', 'Parthiva', 'Vyaya', 'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi', 'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava', 'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadi', 'Ananda', 'Rakshasa', 'Nala', 'Pingala', 'Kalayukti', 'Siddharthi', 'Raudra', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya'];

const norm360 = (x) => ((x % 360) + 360) % 360;
// "minutes from local midnight of dateObj" → VedAstro StdTime string (handles next-day rollover)
function stdAtMinutes(dateObj, minutes, tz) {
  const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
  d.setMinutes(Math.round(minutes));
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${tz}`;
}
// Panchang for a (date, location, ayanamsa) is immutable → cache forever (per process)
const PANCHANG_CACHE = new Map();

// Karana name from half-tithi index 0..59 (VedAstro definition: every 6° of elongation)
function karanaName(kIdx) {
  if (kIdx === 0) return 'Kimstughna';
  if (kIdx >= 57) return ['Shakuni', 'Chatushpada', 'Naga'][kIdx - 57];
  return KARANA_MOV[(kIdx - 1) % 7];
}

function computePanchangElements(sunLon, moonLon) {
  if (sunLon == null || moonLon == null) return null;
  const nak = 360 / 27; // 13°20'
  const diff = norm360(moonLon - sunLon);
  const sumLon = norm360(sunLon + moonLon);

  const tithiNum = Math.floor(diff / 12) + 1; // 1..30
  const paksha = tithiNum <= 15 ? 'Shukla' : 'Krishna';
  const pakshaHi = tithiNum <= 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
  let tithiName = TITHI[(tithiNum - 1) % 15];
  let tithiHi = TITHI_HI[(tithiNum - 1) % 15];
  if (tithiNum === 30) { tithiName = 'Amavasya'; tithiHi = 'अमावस्या'; }

  const nakIdx = Math.floor(moonLon / nak) % 27;
  const pada = Math.floor((moonLon % nak) / (nak / 4)) + 1;
  const yogaIdx = Math.floor(sumLon / nak) % 27;
  const kIdx = Math.floor(diff / 6); // 0..59
  const kName = karanaName(kIdx);

  return {
    tithi: { num: tithiNum, name: tithiName, hi: tithiHi, paksha, pakshaHi },
    nakshatra: { num: nakIdx + 1, name: NAKSHATRA[nakIdx], hi: NAK_HI[nakIdx], pada },
    yoga: { num: yogaIdx + 1, name: YOGA[yogaIdx], hi: YOGA_HI[yogaIdx] },
    karana: { name: kName, hi: KARANA_HI[kName] || kName, isBhadra: kName === 'Vishti' },
    // raw angles for end-time crossing search
    _raw: { diff, sumLon, moonLon: norm360(moonLon) },
  };
}

function buildPanchangObservances(elements, masa) {
  if (!elements || !elements.tithi) return [];
  const out = [];
  const tithi = elements.tithi.name;
  const paksha = elements.tithi.paksha;
  const month = masa && masa.amanta && masa.amanta.en;
  const add = (key, en, hi, type, guidanceEn, guidanceHi, importance = 'regular') => {
    if (out.some((o) => o.key === key)) return;
    out.push({ key, name: { en, hi }, type, importance, guidance: { en: guidanceEn, hi: guidanceHi } });
  };

  if (tithi === 'Ekadashi') {
    add('ekadashi', `${paksha} Ekadashi`, `${paksha === 'Shukla' ? 'शुक्ल' : 'कृष्ण'} एकादशी`, 'vrat', 'Good for Vishnu puja, fasting, mantra japa and sattvic food.', 'विष्णु पूजा, व्रत, मंत्र-जप और सात्त्विक भोजन के लिए शुभ।', 'high');
  }
  if (tithi === 'Trayodashi') {
    add('pradosh', `Pradosh Vrat (${paksha === 'Shukla' ? 'S' : 'K'})`, `प्रदोष व्रत (${paksha === 'Shukla' ? 'शु' : 'कृ'})`, 'vrat', 'Evening Shiva puja is traditionally preferred.', 'सायंकाल शिव पूजा परंपरागत रूप से श्रेष्ठ मानी जाती है।', 'high');
  }
  if (tithi === 'Purnima') {
    add('purnima', 'Purnima Vrat', 'पूर्णिमा व्रत', 'vrat', 'Good for Satyanarayan puja, daan, mantra and moon-related worship.', 'सत्यनारायण पूजा, दान, मंत्र और चन्द्र पूजा के लिए शुभ।', 'high');
  }
  if (tithi === 'Amavasya') {
    add('amavasya', 'Amavasya', 'अमावस्या', 'vrat', 'Good for pitru tarpan, daan and quiet spiritual practice; avoid major auspicious starts.', 'पितृ तर्पण, दान और शांत साधना के लिए अच्छा; बड़े शुभ आरम्भ से बचें।', 'high');
  }
  if (tithi === 'Chaturthi' && paksha === 'Krishna') {
    add('sankashti', 'Sankashti Chaturthi', 'संकष्टी चतुर्थी', 'vrat', 'Ganesha worship and moonrise-related vrat observance.', 'गणेश पूजा और चन्द्रोदय से जुड़ी व्रत परंपरा।', 'high');
  }
  if (tithi === 'Chaturthi' && paksha === 'Shukla') {
    add('vinayaka-chaturthi', 'Vinayaka Chaturthi', 'विनायक चतुर्थी', 'vrat', 'Good for Ganesha puja and removing obstacles.', 'गणेश पूजा और विघ्न निवारण के लिए शुभ।');
  }
  if (tithi === 'Ashtami' && paksha === 'Shukla') {
    add('durgashtami', 'Masik Durgashtami', 'मासिक दुर्गाष्टमी', 'vrat', 'Good for Durga puja, protection prayers and discipline.', 'दुर्गा पूजा, रक्षा प्रार्थना और अनुशासन के लिए शुभ।');
  }
  if (tithi === 'Chaturdashi' && paksha === 'Krishna') {
    add('masik-shivaratri', 'Masik Shivaratri', 'मासिक शिवरात्रि', 'vrat', 'Night Shiva puja, japa and meditation are preferred.', 'रात्रि शिव पूजा, जप और ध्यान श्रेष्ठ माने जाते हैं।', 'high');
  }
  if (elements.karana && elements.karana.isBhadra) {
    add('bhadra', 'Bhadra / Vishti Karana', 'भद्रा / विष्टि करण', 'caution', 'Avoid marriage, housewarming, travel starts and major auspicious work.', 'विवाह, गृह-प्रवेश, यात्रा आरम्भ और बड़े शुभ कार्य से बचें।', 'high');
  }

  if (month === 'Jyeshtha' && paksha === 'Shukla' && tithi === 'Ekadashi') {
    add('nirjala-ekadashi', 'Nirjala Ekadashi', 'निर्जला एकादशी', 'festival', 'One of the most significant Ekadashi vrats; follow health-safe fasting only.', 'सबसे महत्वपूर्ण एकादशी व्रतों में से एक; स्वास्थ्य के अनुसार ही व्रत रखें।', 'major');
  }
  if (month === 'Ashadha' && paksha === 'Shukla' && tithi === 'Ekadashi') {
    add('devshayani-ekadashi', 'Dev Shayani Ekadashi', 'देवशयनी एकादशी', 'festival', 'Important Vishnu vrat and beginning of Chaturmas tradition.', 'महत्वपूर्ण विष्णु व्रत और चातुर्मास परंपरा का आरम्भ।', 'major');
  }
  if (month === 'Ashadha' && tithi === 'Purnima') {
    add('guru-purnima', 'Guru Purnima', 'गुरु पूर्णिमा', 'festival', 'Good for guru puja, study, daan and gratitude rituals.', 'गुरु पूजा, अध्ययन, दान और कृतज्ञता के लिए शुभ।', 'major');
  }
  if (month === 'Bhadrapada' && paksha === 'Shukla' && tithi === 'Chaturthi') {
    add('ganesh-chaturthi', 'Ganesh Chaturthi', 'गणेश चतुर्थी', 'festival', 'Ganesha sthapana and puja are performed according to local muhurat.', 'गणेश स्थापना और पूजा स्थानीय मुहूर्त के अनुसार की जाती है।', 'major');
  }
  if (month === 'Ashwina' && paksha === 'Shukla' && tithi === 'Dashami') {
    add('vijayadashami', 'Vijayadashami / Dussehra', 'विजयादशमी / दशहरा', 'festival', 'Good for shastra puja, new learning and victory-related sankalpa.', 'शस्त्र पूजा, नई शिक्षा और विजय-संकल्प के लिए शुभ।', 'major');
  }
  if (month === 'Kartika' && paksha === 'Krishna' && tithi === 'Amavasya') {
    add('diwali', 'Diwali / Lakshmi Puja', 'दीवाली / लक्ष्मी पूजा', 'festival', 'Lakshmi puja should use the evening pradosh-specific muhurat for the location.', 'लक्ष्मी पूजा के लिए स्थान-आधारित सायंकाल प्रदोष मुहूर्त देखें।', 'major');
  }
  if (month === 'Phalguna' && tithi === 'Purnima') {
    add('holika-dahan', 'Holika Dahan', 'होलिका दहन', 'festival', 'Holika Dahan needs evening muhurat after checking Bhadra carefully.', 'भद्रा देखकर सायंकालीन मुहूर्त में होलिका दहन किया जाता है।', 'major');
  }
  if (month === 'Chaitra' && paksha === 'Shukla' && tithi === 'Navami') {
    add('ram-navami', 'Ram Navami', 'राम नवमी', 'festival', 'Midday Rama puja is traditionally preferred.', 'मध्याह्न राम पूजा परंपरागत रूप से श्रेष्ठ मानी जाती है।', 'major');
  }
  return out;
}

// single planet ka nirayana longitude + sign
async function planetLonSign(name, stdTime, location, ayan) {
  const body = {
    PlanetName: { Name: name },
    Time: { StdTime: stdTime, Location: location },
    Ayanamsa: ayan,
  };
  const json = await vedastroPostRetry('/Calculate/AllPlanetData', body, (res) => {
    const d = (res && res.Payload && res.Payload.AllPlanetData) || {};
    return Number.isFinite(Number(d.PlanetNirayanaLongitude && d.PlanetNirayanaLongitude.TotalDegrees));
  }, `AllPlanetData:${name}`);
  const d = (json && json.Payload && json.Payload.AllPlanetData) || {};
  return {
    lon: d.PlanetNirayanaLongitude && d.PlanetNirayanaLongitude.TotalDegrees != null ? Number(d.PlanetNirayanaLongitude.TotalDegrees) : null,
    sign: d.PlanetRasiD1Sign && d.PlanetRasiD1Sign.Name,
    nakshatra: d.PlanetConstellation && d.PlanetConstellation.Name,
  };
}

// Rahu/Yamaganda/Gulika kis part me (1..8), weekday index 0=Sun..6=Sat
const RAHU_PART = [8, 2, 7, 5, 6, 4, 3];
const YAMA_PART = [5, 4, 3, 2, 1, 7, 6];
const GULI_PART = [7, 6, 5, 4, 3, 2, 1];

// sidereal longitude → { sign, nakshatra } (Lahiri)
function signNakFromLon(lon) {
  const L = norm360(lon);
  return { sign: SIGN_ORDER[Math.floor(L / 30) % 12], nakshatra: NAKSHATRA[Math.floor(L / (360 / 27)) % 27] };
}

// Compute the panchang "five-limb" end-times from a (synchronous) longitude sampler.
function endTimesFromSampler(srMin, rawEl, lonsAt) {
  const a = lonsAt(srMin), b = lonsAt(srMin + 60);
  const fwd = (x, y) => { let d = y - x; if (d < -180) d += 360; return d; };
  const vSun = fwd(a.sun, b.sun) / 60, vMoon = fwd(a.moon, b.moon) / 60; // deg/min
  const crossing = (theta0, step, rate, angleAt) => {
    if (!(rate > 0)) return null;
    const B = (Math.floor(theta0 / step) + 1) * step;
    let est = srMin + (B - theta0) / rate;
    for (let i = 0; i < 4; i++) {
      let ang = angleAt(est);
      if (ang < theta0 - 0.001) ang += 360;
      let r = B - ang;
      while (r > step / 2) r -= step;
      while (r < -step / 2) r += step;
      est += r / rate;
      if (Math.abs(r) < 0.005) break;
    }
    return est;
  };
  const fmt = (min) => (min == null ? null : { hm: minToHM(min), nextDay: min >= 1440 });
  return {
    tithi: fmt(crossing(rawEl.diff, 12, vMoon - vSun, (m) => { const l = lonsAt(m); return norm360(l.moon - l.sun); })),
    karana: fmt(crossing(rawEl.diff, 6, vMoon - vSun, (m) => { const l = lonsAt(m); return norm360(l.moon - l.sun); })),
    nakshatra: fmt(crossing(rawEl.moonLon, 360 / 27, vMoon, (m) => { const l = lonsAt(m); return norm360(l.moon); })),
    yoga: fmt(crossing(rawEl.sumLon, 360 / 27, vMoon + vSun, (m) => { const l = lonsAt(m); return norm360(l.sun + l.moon); })),
  };
}

function attachEndTimes(elements, endTimes) {
  if (!elements) return;
  delete elements._raw;
  if (endTimes) {
    if (endTimes.tithi) elements.tithi.endsAt = endTimes.tithi;
    if (endTimes.nakshatra) elements.nakshatra.endsAt = endTimes.nakshatra;
    if (endTimes.yoga) elements.yoga.endsAt = endTimes.yoga;
    if (endTimes.karana) elements.karana.endsAt = endTimes.karana;
  }
}

// LOCAL provider — astronomy-engine (instant, no network, no rate limit).
function localPanchangPrimitives({ dateObj, tz, lat, lng, includeTransitions, includeMoonTimes }) {
  const tzMin = eph.parseTzMin(tz);
  const midUTC = eph.localMidnightUTC(dateObj, tzMin);
  const srMin = eph.riseSetMinutes('Sun', dateObj, lat, lng, tzMin, +1);
  const ssMin = eph.riseSetMinutes('Sun', dateObj, lat, lng, tzMin, -1);
  if (srMin == null || ssMin == null) throw new Error('local rise/set unavailable');
  const sunriseUTC = new Date(midUTC.getTime() + srMin * 60000);
  const sunLon = eph.siderealLon('Sun', sunriseUTC);
  const moonLon = eph.siderealLon('Moon', sunriseUTC);
  const sun = { lon: sunLon, ...signNakFromLon(sunLon) };
  const moon = { lon: moonLon, ...signNakFromLon(moonLon) };
  const elements = computePanchangElements(sunLon, moonLon);
  const mrMin = includeMoonTimes ? eph.riseSetMinutes('Moon', dateObj, lat, lng, tzMin, +1) : null;
  const msMin = includeMoonTimes ? eph.riseSetMinutes('Moon', dateObj, lat, lng, tzMin, -1) : null;
  let endTimes = null;
  if (includeTransitions && elements && elements._raw) {
    const lonsAt = (min) => {
      const d = new Date(midUTC.getTime() + min * 60000);
      return { sun: eph.siderealLon('Sun', d), moon: eph.siderealLon('Moon', d) };
    };
    try { endTimes = endTimesFromSampler(srMin, elements._raw, lonsAt); } catch (_) { endTimes = null; }
  }
  attachEndTimes(elements, endTimes);
  return {
    srMin: Math.round(srMin), ssMin: Math.round(ssMin),
    srStd: stdAtMinutes(dateObj, srMin, tz), ssStd: stdAtMinutes(dateObj, ssMin, tz),
    mrStd: mrMin != null ? stdAtMinutes(dateObj, mrMin, tz) : null,
    msStd: msMin != null ? stdAtMinutes(dateObj, msMin, tz) : null,
    sun, moon, elements, endTimes, provider: 'local',
  };
}

// VEDASTRO provider — fallback (only if the local ephemeris ever fails).
async function vedastroPanchangPrimitives({ dateObj, dstr, tz, location, ayan, includeTransitions, includeMoonTimes }) {
  const calcBody = { Time: { StdTime: `12:00 ${dstr} ${tz}`, Location: location }, Ayanamsa: ayan };
  const calc = (name) => vedastroPostRetry(`/Calculate/${name}`, calcBody, (res) => !!payloadStdTime(res, name), name);
  const optionalCalc = (name) => calc(name).catch(() => null);
  const [srR, ssR, mrR, msR] = await Promise.all([
    calc('SunriseTime'), calc('SunsetTime'),
    includeMoonTimes ? optionalCalc('MoonriseTime') : Promise.resolve(null),
    includeMoonTimes ? optionalCalc('MoonsetTime') : Promise.resolve(null),
  ]);
  const srStd = payloadStdTime(srR, 'SunriseTime');
  const ssStd = payloadStdTime(ssR, 'SunsetTime');
  const mrStd = payloadStdTime(mrR, 'MoonriseTime');
  const msStd = payloadStdTime(msR, 'MoonsetTime');
  if (!srStd || !ssStd) throw Object.assign(new Error('Panchang provider did not return sunrise/sunset'), { status: 502 });
  const srMin = stdToMin(srStd);
  const ssMin = stdToMin(ssStd);
  const srHM = String(srStd).split(' ')[0];
  const sunriseStd = `${srHM} ${dstr} ${tz}`;
  const [sun, moon] = await Promise.all([
    planetLonSign('Sun', sunriseStd, location, ayan),
    planetLonSign('Moon', sunriseStd, location, ayan),
  ]);
  if (!Number.isFinite(sun.lon) || !Number.isFinite(moon.lon)) {
    throw Object.assign(new Error('Panchang provider did not return Sun/Moon longitude'), { status: 502 });
  }
  const elements = computePanchangElements(sun.lon, moon.lon);
  let endTimes = null;
  if (includeTransitions && elements && elements._raw) {
    const lonsAt = async (min) => {
      const std = stdAtMinutes(dateObj, min, tz);
      const [s, m] = await Promise.all([planetLonSign('Sun', std, location, ayan), planetLonSign('Moon', std, location, ayan)]);
      return { sun: s.lon, moon: m.lon };
    };
    try {
      const a = await lonsAt(srMin), b = await lonsAt(srMin + 60);
      const fwd = (x, y) => { let d = y - x; if (d < -180) d += 360; return d; };
      const vSun = fwd(a.sun, b.sun) / 60, vMoon = fwd(a.moon, b.moon) / 60;
      const crossing = async (theta0, step, rate, angleAt) => {
        if (!(rate > 0)) return null;
        const B = (Math.floor(theta0 / step) + 1) * step;
        let est = srMin + (B - theta0) / rate;
        for (let i = 0; i < 3; i++) {
          let ang = await angleAt(est);
          if (ang < theta0 - 0.001) ang += 360;
          let r = B - ang;
          while (r > step / 2) r -= step;
          while (r < -step / 2) r += step;
          est += r / rate;
          if (Math.abs(r) < 0.01) break;
        }
        return est;
      };
      const fmt = (min) => (min == null ? null : { hm: minToHM(min), nextDay: min >= 1440 });
      const safe = (args) => crossing(...args).catch(() => null);
      const [tEnd, kEnd, nEnd, yEnd] = await Promise.all([
        safe([elements._raw.diff, 12, vMoon - vSun, async (min) => { const l = await lonsAt(min); return norm360(l.moon - l.sun); }]),
        safe([elements._raw.diff, 6, vMoon - vSun, async (min) => { const l = await lonsAt(min); return norm360(l.moon - l.sun); }]),
        safe([elements._raw.moonLon, 360 / 27, vMoon, async (min) => { const l = await lonsAt(min); return norm360(l.moon); }]),
        safe([elements._raw.sumLon, 360 / 27, vMoon + vSun, async (min) => { const l = await lonsAt(min); return norm360(l.sun + l.moon); }]),
      ]);
      endTimes = { tithi: fmt(tEnd), karana: fmt(kEnd), nakshatra: fmt(nEnd), yoga: fmt(yEnd) };
    } catch (_) { endTimes = null; }
  }
  attachEndTimes(elements, endTimes);
  return { srMin, ssMin, srStd, ssStd, mrStd, msStd, sun, moon, elements, endTimes, provider: 'vedastro' };
}

async function getPanchang(input) {
  let { lat, lng, place, date, tz } = input; // date: 'DD/MM/YYYY' (optional → today)
  tz = tz || '+05:30';
  const includeTransitions = input.includeTransitions !== false;
  const includeMoonTimes = input.includeMoonTimes !== false;
  if ((lat == null || lng == null) && place) {
    const geo = await geocode(place);
    lat = geo.lat;
    lng = geo.lng;
  }
  if (lat == null || lng == null) throw Object.assign(new Error('lat/lng ya place chahiye'), { status: 400 });

  const ayan = env.vedastro.ayanamsa;
  const location = { Name: place || 'Place', Latitude: Number(lat), Longitude: Number(lng) };

  let dateObj, dstr = date;
  if (dstr) { const [dd, mm, yy] = dstr.split('/').map(Number); dateObj = new Date(yy, mm - 1, dd); }
  else { dateObj = new Date(); dstr = `${pad2(dateObj.getDate())}/${pad2(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`; }
  const noon = `12:00 ${dstr} ${tz}`;

  const detailMode = `${includeTransitions ? 'end' : 'noend'}|${includeMoonTimes ? 'moon' : 'nomoon'}`;
  const cacheKey = `${dstr}|${lat},${lng}|${ayan}|${detailMode}`;
  const cHit = PANCHANG_CACHE.get(cacheKey);
  if (cHit) return cHit;

  // Astronomy primitives — LOCAL ephemeris first (instant, accurate, no rate limit);
  // VedAstro only as fallback if the local engine ever fails. This is what makes
  // Panchang load reliably (was ~30 VedAstro calls/req → blew the 15/min free tier).
  let prim;
  try {
    prim = localPanchangPrimitives({ dateObj, tz, lat, lng, includeTransitions, includeMoonTimes });
  } catch (eLocal) {
    prim = await vedastroPanchangPrimitives({ dateObj, dstr, tz, location, ayan, includeTransitions, includeMoonTimes });
  }
  const { srMin, ssMin, srStd, ssStd, mrStd, msStd, sun, moon, elements, endTimes } = prim;

  // inauspicious periods (day ko 8 hisson me)
  const wd = dateObj.getDay();
  const seg = (ssMin - srMin) / 8;
  const kaal = (partArr, name, note) => {
    const n = partArr[wd];
    return { name, note, start: minToHM(srMin + (n - 1) * seg), end: minToHM(srMin + n * seg) };
  };

  // auspicious muhurats (day = 15 muhurtas; Abhijit = 8th, midday)
  const dayLen = ssMin - srMin;
  const muh = dayLen / 15;
  const auspicious = [
    { name: 'Abhijit Muhurat', note: 'Most auspicious midday window for any work', start: minToHM(srMin + 7 * muh), end: minToHM(srMin + 8 * muh) },
    { name: 'Brahma Muhurat', note: 'Ideal for prayer, meditation & study', start: minToHM(srMin - 96), end: minToHM(srMin - 48) },
  ];

  // Ritu (season) + Ayana from Sun's sidereal sign; Samvat from Gregorian (approx around Chaitra new-year)
  const sIdx = sun.sign != null ? SIGN_INDEX[sun.sign] : null;
  const RITU = [
    { en: 'Vasanta', hi: 'वसंत' }, { en: 'Grishma', hi: 'ग्रीष्म' }, { en: 'Grishma', hi: 'ग्रीष्म' },
    { en: 'Varsha', hi: 'वर्षा' }, { en: 'Varsha', hi: 'वर्षा' }, { en: 'Sharad', hi: 'शरद' },
    { en: 'Sharad', hi: 'शरद' }, { en: 'Hemanta', hi: 'हेमंत' }, { en: 'Hemanta', hi: 'हेमंत' },
    { en: 'Shishira', hi: 'शिशिर' }, { en: 'Shishira', hi: 'शिशिर' }, { en: 'Vasanta', hi: 'वसंत' },
  ];
  const ritu = sIdx != null ? RITU[sIdx] : null;
  const ayana = sIdx != null ? ([9, 10, 11, 0, 1, 2].includes(sIdx) ? { en: 'Uttarayana', hi: 'उत्तरायण' } : { en: 'Dakshinayana', hi: 'दक्षिणायन' }) : null;
  const gy = dateObj.getFullYear(); const gm = dateObj.getMonth();
  const samvat = { vikram: gy + (gm >= 3 ? 57 : 56), shaka: gy - (gm >= 3 ? 78 : 79) };
  const samvatsara = SAMVATSARA[((samvat.shaka + 11) % 60 + 60) % 60];

  // Lunar month (Masa): Amanta = Sun's sidereal sign (verified: Mithuna→Jyeshtha);
  // Purnimanta = +1 month during Krishna paksha (north convention).
  const isKrishna = elements && elements.tithi && elements.tithi.paksha === 'Krishna';
  const masa = sIdx == null ? null : {
    amanta: MASA[sIdx],
    purnimanta: MASA[(sIdx + (isKrishna ? 1 : 0)) % 12],
  };
  const observances = buildPanchangObservances(elements, masa);

  const result = {
    date: dstr,
    weekday: WEEKDAYS[wd],
    weekdayHi: WEEKDAYS_HI[wd],
    location: location.Name,
    sunrise: minToHM(srMin),
    sunset: minToHM(ssMin),
    moonrise: mrStd ? stdToParts(mrStd).hm12 : null,
    moonset: msStd ? stdToParts(msStd).hm12 : null,
    timings: {
      sunrise: stdToParts(srStd),
      sunset: stdToParts(ssStd),
      moonrise: stdToParts(mrStd),
      moonset: stdToParts(msStd),
      midday: minToParts(srMin + dayLen / 2),
      daylight: durationInfo(dayLen),
      night: durationInfo(1440 - dayLen),
    },
    sun: { sign: sun.sign, nakshatra: sun.nakshatra },
    moon: { sign: moon.sign, nakshatra: moon.nakshatra },
    ...elements, // tithi, nakshatra, yoga, karana (with hi + endsAt + isBhadra)
    masa,
    ritu,
    ayana,
    samvat,
    samvatsara,
    bhadra: !!(elements && elements.karana && elements.karana.isBhadra),
    observances,
    auspicious,
    inauspicious: [
      kaal(RAHU_PART, 'Rahu Kaal', 'Avoid important new work'),
      kaal(YAMA_PART, 'Yamaganda', 'Inauspicious for beginnings'),
      kaal(GULI_PART, 'Gulika Kaal', 'Avoid auspicious activities'),
    ],
    calculation: {
      dayStartsAt: 'sunrise',
      ayanamsa: ayan,
      fiveLimbs: 'Sun/Moon sidereal longitude at local sunrise',
      endTimes: endTimes ? 'longitude crossing refined by resampling' : 'not available',
      observanceRule: 'sunrise tithi/month rule; complex festival puja muhurat needs dedicated rule checks',
    },
    ayanamsa: ayan,
    provider: prim.provider,
    source: prim.provider === 'local'
      ? 'Local ephemeris (astronomy-engine, Lahiri) + classical Panchang'
      : 'Real planetary positions (Lahiri) + classical Panchang',
  };
  const hasAnyEndTime = !!(endTimes && (endTimes.tithi || endTimes.karana || endTimes.nakshatra || endTimes.yoga));
  if (!includeTransitions || hasAnyEndTime) PANCHANG_CACHE.set(cacheKey, result);
  return result;
}

// ════════════════════════════════════════════════════════════════════
//  GOCHAR (TRANSITS) — abhi grah kahan, natal Moon/Lagna se house, Sade Sati
// ════════════════════════════════════════════════════════════════════
// Transit positions = current planet signs (global at an instant).
// House-from-Moon = standard Chandra-gochar. Sade Sati = Saturn in 12/1/2 from natal Moon.
const TRANSIT_CACHE = new Map(); // key: date|hour|lat,lng → transit array (per-process, short-lived)

async function getGochar(input) {
  let { lat, lng, dob, tob, tz, place } = input;
  tz = tz || '+05:30';
  if ((lat == null || lng == null) && place) {
    const geo = await geocode(place);
    lat = geo.lat; lng = geo.lng;
  }
  if (lat == null || lng == null) throw Object.assign(new Error('lat/lng ya place chahiye'), { status: 400 });
  const ayan = env.vedastro.ayanamsa;
  const location = { Name: place || 'Place', Latitude: Number(lat), Longitude: Number(lng) };

  // natal Moon + Lagna (getKundli — forever cached)
  const natal = await getKundli({ lat, lng, dob, tob, tz, place });
  const nd = (natal && natal.data) || {};
  const natalMoonSign = nd.moonSign || null;
  const natalAsc = nd.ascendant || null;
  const moonIdx = natalMoonSign != null ? SIGN_INDEX[natalMoonSign] : null;
  const ascIdx = natalAsc != null ? SIGN_INDEX[natalAsc] : null;

  // current transit positions (cache by date+hour+place)
  const now = new Date();
  const dstr = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
  const nowStd = `${pad2(now.getHours())}:${pad2(now.getMinutes())} ${dstr} ${tz}`;
  const ckey = `${dstr}|${now.getHours()}|${lat},${lng}`;
  let raw = TRANSIT_CACHE.get(ckey);
  if (!raw) {
    // PRIMARY: VedAstro (authoritative). FALLBACK: local ephemeris (astronomy-engine,
    // sign/nakshatra/retro — VedAstro se exact match validated). Circuit breaker se
    // VedAstro down hone par seedhe local use hota hai (app slow nahi hota).
    const fetchOne = async (p) => {
      if (vedastroHealthy()) {
        try {
          // 6s tight timeout: VedAstro slow ho to fast local fallback (sign exact-match).
          const json = await vedastroPost('/Calculate/AllPlanetData', {
            PlanetName: { Name: p }, Time: { StdTime: nowStd, Location: location }, Ayanamsa: ayan,
          }, 6000);
          const d = (json && json.Payload && json.Payload.AllPlanetData) || {};
          const sign = d.PlanetRasiD1Sign && d.PlanetRasiD1Sign.Name;
          if (sign) {
            clearVedastroCooldown();
            return { planet: p, sign, nakshatra: (d.PlanetConstellation && d.PlanetConstellation.Name) || null, isRetrograde: d.IsPlanetRetrograde, source: 'vedastro' };
          }
          throw new Error('empty');
        } catch (e) { tripVedastro(); /* → local fallback */ }
      }
      const lp = eph.localPlanet(p, now);
      return lp
        ? { planet: p, sign: lp.sign, nakshatra: lp.nakshatra, isRetrograde: lp.isRetrograde, source: 'local' }
        : { planet: p, error: 'unavailable' };
    };
    raw = await Promise.all(PLANETS.map(fetchOne));
    if (raw.every((t) => t.sign)) TRANSIT_CACHE.set(ckey, raw);
  }

  const houseFrom = (signName, baseIdx) => {
    const si = signName != null ? SIGN_INDEX[signName] : null;
    if (si == null || baseIdx == null) return null;
    return ((si - baseIdx + 12) % 12) + 1;
  };

  const transits = raw.filter((t) => t.sign).map((t) => ({
    planet: t.planet,
    sign: t.sign,
    nakshatra: t.nakshatra,
    isRetrograde: t.isRetrograde,
    houseFromMoon: houseFrom(t.sign, moonIdx),
    houseFromLagna: houseFrom(t.sign, ascIdx),
  }));

  // Sade Sati (Saturn 12/1/2 from Moon) + Dhaiya/small-panoti (4 or 8)
  const sat = transits.find((t) => t.planet === 'Saturn');
  let sadeSati = { active: false, dhaiya: false, phase: null, phaseHi: null };
  if (sat && sat.houseFromMoon != null) {
    const h = sat.houseFromMoon;
    if (h === 12) sadeSati = { active: true, dhaiya: false, phase: 'Rising phase (1st)', phaseHi: 'आरंभिक चरण (पहला)' };
    else if (h === 1) sadeSati = { active: true, dhaiya: false, phase: 'Peak phase (2nd)', phaseHi: 'शिखर चरण (दूसरा)' };
    else if (h === 2) sadeSati = { active: true, dhaiya: false, phase: 'Setting phase (3rd)', phaseHi: 'अंतिम चरण (तीसरा)' };
    else if (h === 4 || h === 8) sadeSati = { active: false, dhaiya: true, phase: 'Dhaiya (Small Panoti)', phaseHi: 'ढैय्या (छोटी पनौती)' };
  }

  return { date: dstr, ayanamsa: ayan, natalMoonSign, natalAsc, sadeSati, transits };
}

module.exports = { getKundli, getDasha, getYoga, getChoghadiya, getSunTimes, getPanchang, getGochar, vedastroPost, vedastroHealthy, tripVedastro, clearVedastroCooldown };
