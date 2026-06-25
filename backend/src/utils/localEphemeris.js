'use strict';

/**
 * localEphemeris.js — self-contained, dependency-light astronomy for Panchang.
 * Uses `astronomy-engine` (MIT, NASA-grade, no network) so Panchang can be
 * computed INSTANTLY and RELIABLY without hammering the rate-limited VedAstro
 * free tier. Outputs sidereal (Lahiri) Sun/Moon longitudes + rise/set times.
 *
 * Accuracy: astronomy-engine Sun/Moon longitude ≈ arc-minute; Lahiri ayanamsa
 * via standard linear precession (error < 0.01° within 1950–2050). Tithi/yoga/
 * karana depend on Sun–Moon angle differences (ayanamsa largely cancels), and
 * nakshatra/sign on absolute sidereal longitude — both well within tolerance.
 */

const Astronomy = require('astronomy-engine');

const norm360 = (x) => ((x % 360) + 360) % 360;

// Lahiri (Chitrapaksha) ayanamsa — linear from J2000 (23.85375°, 50.2719"/yr).
function lahiriAyanamsa(date) {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01 12:00 UTC
  const years = (date.getTime() - J2000) / (365.25 * 86400000);
  return 23.85375 + years * (50.2719 / 3600);
}

// Tropical (of-date) ecliptic longitude in degrees.
function tropicalLon(body, date) {
  const t = Astronomy.MakeTime(date);
  if (body === 'Sun') return Astronomy.SunPosition(t).elon;
  return Astronomy.EclipticGeoMoon(t).lon; // Moon
}

// Sidereal (Lahiri) ecliptic longitude in degrees, normalised 0..360.
function siderealLon(body, date) {
  return norm360(tropicalLon(body, date) - lahiriAyanamsa(date));
}

// ── Full planet/node support (FALLBACK for VedAstro when it's unavailable) ──
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];

// Tropical (of-date) geocentric ecliptic longitude for Sun/Moon/planets + mean lunar nodes (Rahu/Ketu).
function bodyTropicalLon(name, date) {
  if (name === 'Sun') return Astronomy.SunPosition(Astronomy.MakeTime(date)).elon;
  if (name === 'Moon') return Astronomy.EclipticGeoMoon(Astronomy.MakeTime(date)).lon;
  if (name === 'Rahu' || name === 'Ketu') {
    // Mean ascending lunar node (Meeus): standard Vedic Rahu; Ketu = +180°.
    const T = Astronomy.MakeTime(date).tt / 36525; // Julian centuries (TT) from J2000
    const om = norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000);
    return name === 'Rahu' ? om : norm360(om + 180);
  }
  const body = Astronomy.Body[name];
  if (!body) return null;
  return Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon; // aberration-corrected
}

// Local sidereal (Lahiri) snapshot of a planet: sign + nakshatra(+pada) + retrograde.
// Validated to match VedAstro D1 sign exactly across Sun..Saturn.
function localPlanet(name, date) {
  const trop = bodyTropicalLon(name, date);
  if (trop == null || !Number.isFinite(trop)) return null;
  const lon = norm360(trop - lahiriAyanamsa(date));
  const nakSpan = 360 / 27;
  const nakIdx = Math.floor(lon / nakSpan);
  const pada = Math.floor((lon % nakSpan) / (nakSpan / 4)) + 1;
  let isRetrograde = false;
  if (name === 'Rahu' || name === 'Ketu') {
    isRetrograde = true; // nodes are always retrograde
  } else if (name !== 'Sun' && name !== 'Moon') {
    const trop2 = bodyTropicalLon(name, new Date(date.getTime() + 6 * 3600 * 1000));
    let diff = trop2 - trop;
    if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
    isRetrograde = diff < 0;
  }
  return {
    planet: name,
    sign: SIGNS[Math.floor(lon / 30)],
    nakshatra: NAKSHATRAS[nakIdx],
    pada,
    isRetrograde,
    nirayanaLongitude: lon,
  };
}

// Parse a "+05:30" / "-04:00" style offset to minutes.
function parseTzMin(tz) {
  const m = String(tz || '+05:30').match(/([+-])(\d{1,2}):?(\d{2})/);
  if (!m) return 330;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]));
}

// UTC instant corresponding to local 00:00 of the given civil date (Y/M/D read locally).
function localMidnightUTC(civilDate, tzMin) {
  return new Date(Date.UTC(civilDate.getFullYear(), civilDate.getMonth(), civilDate.getDate(), 0, 0, 0) - tzMin * 60000);
}

/**
 * Minutes-from-local-midnight of the next rise (direction=+1) or set (-1) of a
 * body, searched from local midnight of civilDate. Returns null if none in 24h.
 * Can exceed 1440 (e.g. moonrise after midnight) — caller decides.
 */
function riseSetMinutes(bodyName, civilDate, lat, lng, tzMin, direction) {
  const observer = new Astronomy.Observer(Number(lat), Number(lng), 0);
  const body = bodyName === 'Sun' ? Astronomy.Body.Sun : Astronomy.Body.Moon;
  const mid = localMidnightUTC(civilDate, tzMin);
  const ev = Astronomy.SearchRiseSet(body, observer, direction, mid, 1);
  if (!ev) return null;
  return (ev.date.getTime() - mid.getTime()) / 60000;
}

// Sidereal (Lahiri) Ascendant / Lagna — sign + longitude. Formula validated to match
// VedAstro AllHouseRasiSigns House1 exactly across multiple births.
//   asc_tropical = atan2( cos(RAMC), -(sin(RAMC)·cosε + tanφ·sinε) )
function localAscendant(date, lat, lng) {
  const t = Astronomy.MakeTime(date);
  const ramc = norm360(Astronomy.SiderealTime(t) * 15 + Number(lng)); // RA of MC = local apparent sidereal time (deg)
  const T = t.tt / 36525;
  const eps = 23.439291 - 0.0130042 * T; // mean obliquity (deg) — sufficient for sign/degree
  const d2r = Math.PI / 180, r2d = 180 / Math.PI;
  const rr = ramc * d2r, e = eps * d2r, phi = Number(lat) * d2r;
  const tropAsc = norm360(Math.atan2(Math.cos(rr), -(Math.sin(rr) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) * r2d);
  const lon = norm360(tropAsc - lahiriAyanamsa(date));
  return { sign: SIGNS[Math.floor(lon / 30)], longitude: lon, degreeInSign: lon % 30 };
}

// Navamsa (D9) sign from a sidereal longitude (continuous 3°20' scheme).
function navamsaSign(lon) { return SIGNS[Math.floor(norm360(lon) / (10 / 3)) % 12]; }

// Geocentric declination (degrees) of a body — for Shadbala Ayana Bala.
function declination(name, date) {
  let body;
  if (name === 'Sun') body = Astronomy.Body.Sun;
  else if (name === 'Moon') body = Astronomy.Body.Moon;
  else body = Astronomy.Body[name];
  if (!body) return 0;
  const vec = Astronomy.GeoVector(body, date, true);
  return Astronomy.EquatorFromVector(vec).dec;
}

// Daily motion in ecliptic longitude (deg/day, signed; negative = retrograde) — for Cheshta Bala.
function dailySpeed(name, date) {
  const l1 = bodyTropicalLon(name, date);
  const l2 = bodyTropicalLon(name, new Date(date.getTime() + 86400000));
  if (l1 == null || l2 == null) return 0;
  let d = l2 - l1;
  if (d > 180) d -= 360; if (d < -180) d += 360;
  return d;
}

// Degrees → "D:M:S" string (matches VedAstro DegreeMinuteSecond display).
function dms(deg) {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60; const m = Math.floor(mf);
  const s = Math.round((mf - m) * 60);
  return `${d}:${m}:${s}`;
}

module.exports = { norm360, lahiriAyanamsa, siderealLon, parseTzMin, localMidnightUTC, riseSetMinutes, localPlanet, bodyTropicalLon, localAscendant, navamsaSign, dms, declination, dailySpeed, SIGNS, NAKSHATRAS };
