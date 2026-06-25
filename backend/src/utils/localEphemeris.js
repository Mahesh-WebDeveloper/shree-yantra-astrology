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

module.exports = { norm360, lahiriAyanamsa, siderealLon, parseTzMin, localMidnightUTC, riseSetMinutes };
