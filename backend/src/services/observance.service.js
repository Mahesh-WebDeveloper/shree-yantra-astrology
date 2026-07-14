'use strict';

/**
 * observance.service.js — DETERMINISTIC Hindu festival / vrat engine.
 *
 * Every date is computed from astronomy (astronomy-engine, MIT) — there is not a
 * single hardcoded festival date in this file. The pipeline is:
 *
 *   new moons  → lunar months (amavasya→amavasya)
 *   sankrantis → the month's NAME (and adhika-masa detection)
 *   30 tithi boundaries per month (exact 12° elongation crossings)
 *   rule.ref   → which civil day the tithi is "assigned" to
 *
 * The last step is where Drik-level accuracy actually comes from: a tithi spans an
 * arbitrary ~24h window, so a festival is placed on the day where its tithi is live
 * at the moment the shastra prescribes for THAT festival (sunrise for most vrats,
 * Nishita for Shivaratri/Janmashtami, Madhyahna for Ganesh Chaturthi/Ram Navami,
 * Pradosh for Dhanteras/Holika Dahan/Diwali, Aparahna for Vijayadashami, moonrise
 * for Karwa Chauth/Sankashti). Getting that reference moment right is why e.g.
 * Hartalika Teej and Ganesh Chaturthi correctly land on the SAME day in 2026.
 *
 * On top of the tithi rules four other astronomical sources feed the calendar:
 *   • the Sun's sidereal sign      → Sankrantis, Baisakhi, Vishwakarma Puja, Onam's window
 *   • the Moon's sidereal position → nakshatra-named days (Onam, Saraswati Avahan/Puja)
 *   • Sun–Moon syzygy geometry     → eclipses (Surya/Chandra Grahan)
 *   • the Sun's tropical longitude → solstices and equinoxes
 * and one purely observational one: the crescent's lag behind the setting Sun, which
 * is what actually decides Chandra Darshana.
 */

const Astronomy = require('astronomy-engine');
const eph = require('../utils/localEphemeris');

const MS = 60000;
const DAY_MS = 86400000;

const MASA = [
  { en: 'Chaitra', hi: 'चैत्र' }, { en: 'Vaishakha', hi: 'वैशाख' }, { en: 'Jyeshtha', hi: 'ज्येष्ठ' }, { en: 'Ashadha', hi: 'आषाढ़' },
  { en: 'Shravana', hi: 'श्रावण' }, { en: 'Bhadrapada', hi: 'भाद्रपद' }, { en: 'Ashwina', hi: 'आश्विन' }, { en: 'Kartika', hi: 'कार्तिक' },
  { en: 'Margashirsha', hi: 'मार्गशीर्ष' }, { en: 'Paush', hi: 'पौष' }, { en: 'Magha', hi: 'माघ' }, { en: 'Phalguna', hi: 'फाल्गुन' },
];
// Sidereal sign the Sun enters at each Sankranti. Index i is also the amanta month
// index (Sun enters Mesha during Chaitra, Vrishabha during Vaishakha, …).
const RASHI = [
  { en: 'Mesha', hi: 'मेष' }, { en: 'Vrishabha', hi: 'वृषभ' }, { en: 'Mithuna', hi: 'मिथुन' }, { en: 'Karka', hi: 'कर्क' },
  { en: 'Simha', hi: 'सिंह' }, { en: 'Kanya', hi: 'कन्या' }, { en: 'Tula', hi: 'तुला' }, { en: 'Vrishchika', hi: 'वृश्चिक' },
  { en: 'Dhanu', hi: 'धनु' }, { en: 'Makara', hi: 'मकर' }, { en: 'Kumbha', hi: 'कुम्भ' }, { en: 'Meena', hi: 'मीन' },
];
const TITHI_EN = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima'];
const TITHI_HI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा'];

// Ekadashi names are keyed on the PURNIMANTA month (the North-Indian convention Drik
// uses): Paush-Krishna-Ekadashi in amanta terms is "Shattila" = Magha Krishna.
// `key` is given explicitly because the two Putrada Ekadashis have to stay distinguishable.
const EKADASHI = {
  Shukla: [
    { key: 'kamada', en: 'Kamada', hi: 'कामदा' }, { key: 'mohini', en: 'Mohini', hi: 'मोहिनी' }, { key: 'nirjala', en: 'Nirjala', hi: 'निर्जला' }, { key: 'devshayani', en: 'Devshayani', hi: 'देवशयनी' },
    { key: 'putrada-shravana', en: 'Shravana Putrada', hi: 'श्रावण पुत्रदा' }, { key: 'parivartini', en: 'Parivartini', hi: 'परिवर्तिनी' }, { key: 'papankusha', en: 'Papankusha', hi: 'पापांकुशा' }, { key: 'devutthana', en: 'Devutthana', hi: 'देवउठनी' },
    { key: 'mokshada', en: 'Mokshada', hi: 'मोक्षदा' }, { key: 'putrada-paush', en: 'Paush Putrada', hi: 'पौष पुत्रदा' }, { key: 'jaya', en: 'Jaya', hi: 'जया' }, { key: 'amalaki', en: 'Amalaki', hi: 'आमलकी' },
  ],
  Krishna: [
    { key: 'papamochani', en: 'Papamochani', hi: 'पापमोचिनी' }, { key: 'varuthini', en: 'Varuthini', hi: 'वरूथिनी' }, { key: 'apara', en: 'Apara', hi: 'अपरा' }, { key: 'yogini', en: 'Yogini', hi: 'योगिनी' },
    { key: 'kamika', en: 'Kamika', hi: 'कामिका' }, { key: 'aja', en: 'Aja', hi: 'अजा' }, { key: 'indira', en: 'Indira', hi: 'इंदिरा' }, { key: 'rama', en: 'Rama', hi: 'रमा' },
    { key: 'utpanna', en: 'Utpanna', hi: 'उत्पन्ना' }, { key: 'saphala', en: 'Saphala', hi: 'सफला' }, { key: 'shattila', en: 'Shattila', hi: 'षटतिला' }, { key: 'vijaya', en: 'Vijaya', hi: 'विजया' },
  ],
  // An adhika (leap) month has no sankranti, so it gets its own pair of Ekadashis.
  Adhika: {
    Shukla: { key: 'padmini', en: 'Padmini', hi: 'पद्मिनी' },
    Krishna: { key: 'parama', en: 'Parama', hi: 'परमा' },
  },
};

const PAKSHA_HI = { Shukla: 'शुक्ल', Krishna: 'कृष्ण' };
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pad2 = (n) => (n < 10 ? '0' : '') + n;
const dmyOf = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
const civilOf = (moment, tzMin) => {
  const s = new Date(moment.getTime() + tzMin * MS);
  return new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Weekday-qualified vrats (Bhanu Saptami, Shani Trayodashi) and the weekday-named
// Pradosh both need the Vedic day-lord, so it is named once here.
const WEEKDAY = [
  { idx: 0, en: 'Ravi', hi: 'रवि' }, { idx: 1, en: 'Soma', hi: 'सोम' }, { idx: 2, en: 'Bhauma', hi: 'भौम' },
  { idx: 3, en: 'Budha', hi: 'बुध' }, { idx: 4, en: 'Guru', hi: 'गुरु' }, { idx: 5, en: 'Shukra', hi: 'शुक्र' },
  { idx: 6, en: 'Shani', hi: 'शनि' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ASTRONOMY PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

// Moon phase angle (Moon−Sun ecliptic longitude) is ayanamsa-independent, so tithi
// boundaries can be found directly as exact 12° crossings.
const newMoonAfter = (from) => {
  const t = Astronomy.SearchMoonPhase(0, from, 40);
  return t ? t.date : null;
};
const phaseAfter = (angle, from) => {
  const t = Astronomy.SearchMoonPhase(angle % 360, from, 4);
  return t ? t.date : null;
};

const sunSignAt = (d) => Math.floor(eph.siderealLon('Sun', d) / 30) % 12;
const nakshatraAt = (d) => eph.NAKSHATRAS[Math.floor(eph.siderealLon('Moon', d) / (360 / 27))];

// Exact Sankranti moment: bisect the 1-day bracket in which the Sun's sidereal sign changed.
function bisectSankranti(lo, hi, targetSign) {
  let a = lo.getTime();
  let b = hi.getTime();
  while (b - a > 1000) {
    const m = (a + b) / 2;
    if (sunSignAt(new Date(m)) === targetSign) b = m; else a = m;
  }
  return new Date(b);
}

function sankrantisBetween(from, to) {
  const out = [];
  let prev = sunSignAt(from);
  for (let t = from.getTime() + DAY_MS; t <= to.getTime(); t += DAY_MS) {
    const cur = new Date(t);
    const sign = sunSignAt(cur);
    if (sign !== prev) {
      out.push({ sign, moment: bisectSankranti(new Date(t - DAY_MS), cur, sign) });
      prev = sign;
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY CONTEXT (rise/set) + REFERENCE MOMENTS
// ─────────────────────────────────────────────────────────────────────────────

function dayCtx(dateObj, ctx) {
  const key = dmyOf(dateObj);
  const hit = ctx.days.get(key);
  if (hit) return hit;
  const { lat, lng, tzMin } = ctx;
  const mid = eph.localMidnightUTC(dateObj, tzMin);
  const at = (min) => new Date(mid.getTime() + min * MS);
  const srM = eph.riseSetMinutes('Sun', dateObj, lat, lng, tzMin, +1);
  const ssM = eph.riseSetMinutes('Sun', dateObj, lat, lng, tzMin, -1);
  const mrM = eph.riseSetMinutes('Moon', dateObj, lat, lng, tzMin, +1);
  const msM = eph.riseSetMinutes('Moon', dateObj, lat, lng, tzMin, -1);
  const next = addDays(dateObj, 1);
  const nextMid = eph.localMidnightUTC(next, tzMin);
  const nsrM = eph.riseSetMinutes('Sun', next, lat, lng, tzMin, +1);
  const out = {
    key,
    dateObj,
    sunrise: srM == null ? null : at(srM),
    sunset: ssM == null ? null : at(ssM),
    moonrise: mrM == null ? null : at(mrM),
    moonset: msM == null ? null : at(msM),
    nextSunrise: nsrM == null ? null : new Date(nextMid.getTime() + nsrM * MS),
  };
  ctx.days.set(key, out);
  return out;
}

/**
 * The reference moment/window a rule is judged against.
 * Daytime is split into 5 parts (Pratahkala, Sangava, Madhyahna, Aparahna, Sayankala);
 * night into 15 muhurtas, of which the 8th is Nishita. Pradosh is the 3-muhurta
 * (~2h24m) window straight after sunset.
 */
function refWindow(kind, c) {
  if (!c.sunrise || !c.sunset) return null;
  const sr = c.sunrise.getTime();
  const ss = c.sunset.getTime();
  const dayLen = ss - sr;
  const part = (i) => new Date(sr + (dayLen * i) / 5);
  switch (kind) {
    case 'moonrise': return c.moonrise ? { point: c.moonrise } : null;
    case 'sunset': return { point: c.sunset };
    case 'purvahna': return { a: new Date(sr), b: new Date(sr + dayLen / 2) };
    case 'madhyahna': return { a: part(2), b: part(3) };
    case 'aparahna': return { a: part(3), b: part(4) };
    case 'sayankala': return { a: part(4), b: new Date(ss) };
    case 'pradosh': return { a: new Date(ss), b: new Date(ss + 144 * MS) };
    case 'nishita': {
      if (!c.nextSunrise) return null;
      const night = c.nextSunrise.getTime() - ss;
      return { a: new Date(ss + (night * 7) / 15), b: new Date(ss + (night * 8) / 15) };
    }
    case 'sunrise':
    default: return { point: c.sunrise };
  }
}

// For a "vyapini" (window) reference the tithi must PREVAIL over that window, so when two
// days qualify the one that covers more of it wins — that is what puts Bhai Dooj on the
// second Aparahna and Radha Ashtami on the second Madhyahna. Point references have no
// notion of coverage, so the earlier day simply wins.
const DEFAULT_PICK = { madhyahna: 'max', aparahna: 'max', sayankala: 'max', purvahna: 'max', pradosh: 'max' };

/**
 * Assign a tithi [tStart,tEnd) to a civil day.
 * When NO day satisfies the reference (tithi kshaya — the tithi begins and ends between
 * two sunrises, so it never "owns" a sunrise), the tithi is given to the day that holds
 * the largest share of it, which is what the shastra means by "the day on which the
 * tithi falls".
 */
function resolveDay(tStart, tEnd, ref, pickIn, ctx) {
  const pick = pickIn || DEFAULT_PICK[ref] || 'first';
  const s = tStart.getTime();
  const e = tEnd.getTime();
  const base = civilOf(tStart, ctx.tzMin);
  const days = [];
  for (let i = -1; i <= 2; i += 1) days.push(addDays(base, i));

  const scored = [];
  for (const d of days) {
    const w = refWindow(ref, dayCtx(d, ctx));
    if (!w) continue;
    if (w.point) {
      const m = w.point.getTime();
      if (m >= s && m < e) scored.push({ d, score: 1 });
    } else {
      const ov = Math.min(e, w.b.getTime()) - Math.max(s, w.a.getTime());
      // pick 'full' is the strict reading of "vyapini": the tithi must PERVADE the whole
      // window, not merely hold the larger part of it. Drik applies the strict reading to
      // Akshaya Tritiya and the loose one to Ram Navami — same window, different convention.
      const need = pick === 'full' ? w.b.getTime() - w.a.getTime() : 0;
      if (ov > 0 && ov >= need) scored.push({ d, score: ov });
    }
  }
  // A strict-vyapini rule that no day satisfies falls back to the plain sunrise tithi.
  if (!scored.length && pick === 'full') return resolveDay(tStart, tEnd, 'sunrise', 'first', ctx);
  if (scored.length) {
    if (pick === 'last') return scored[scored.length - 1].d;
    if (pick === 'max') return scored.reduce((best, x) => (x.score > best.score ? x : best)).d;
    return scored[0].d;
  }

  return maxShareDay(tStart, tEnd, ctx);
}

/**
 * The Hindu day — which runs sunrise → sunrise, not midnight → midnight — that holds the
 * largest share of a tithi. This is what the shastra means by "the day on which the tithi
 * falls" when no reference moment settles it.
 */
function maxShareDay(tStart, tEnd, ctx) {
  const s = tStart.getTime();
  const e = tEnd.getTime();
  const base = civilOf(tStart, ctx.tzMin);
  let best = null;
  let bestOv = -Infinity;
  for (let i = -1; i <= 2; i += 1) {
    const d = addDays(base, i);
    const c = dayCtx(d, ctx);
    if (!c.sunrise || !c.nextSunrise) continue;
    const ov = Math.min(e, c.nextSunrise.getTime()) - Math.max(s, c.sunrise.getTime());
    if (ov > bestOv) { bestOv = ov; best = d; }
  }
  return best;
}

// How many sunrises a tithi actually owns.
function sunriseCount(tStart, tEnd, ctx) {
  const s = tStart.getTime();
  const e = tEnd.getTime();
  let n = 0;
  const base = civilOf(tStart, ctx.tzMin);
  for (let i = -1; i <= 2; i += 1) {
    const c = dayCtx(addDays(base, i), ctx);
    if (!c.sunrise) continue;
    const m = c.sunrise.getTime();
    if (m >= s && m < e) n += 1;
  }
  return n;
}

/**
 * EKADASHI — the one tithi whose day is not decided by a reference moment at all, because
 * the fast is bracketed at BOTH ends: it must be free of any trace of Dashami at its start,
 * and it must be broken (Parana) on the Dwadashi the morning after.
 *
 * ARUNODAYA is the last 4 ghatis (96 minutes) before sunrise; Dashami still running then
 * makes the Ekadashi "Dashami-viddha".
 *
 * The day:
 *   • VRIDDHI (the Ekadashi owns two sunrises) — the first is Dashami-viddha and the second
 *     is clean, so the fast takes the second. (Padmini 2026: 27 May, not 26 May.)
 *   • KSHAYA (it owns none) — there is no sunrise to take, so the fast falls on the Hindu day
 *     that actually holds the tithi. (Yogini 2026: 10 Jul. Devutthana 2026: 20 Nov.)
 *   • Otherwise the single sunrise it owns — UNLESS the following DWADASHI is itself kshaya
 *     and reaches no sunrise, in which case there would be no morning left on which to break
 *     the fast. The vrat is then kept a day EARLIER and the Parana is done on the morning the
 *     Ekadashi ends. This is the whole of the 2027 Pausha Putrada case: the Ekadashi ends
 *     19 Jan at 07:49, twenty-two minutes after sunrise, and its Dwadashi dies at 04:42 on
 *     the 20th, before sunrise — so Drik fasts on 18 Jan and paranas on the 19th.
 *
 * The Gauna (Vaishnava) Ekadashi is the day after the smarta one, emitted exactly when the
 * smarta day is still Dashami-viddha — i.e. when there was no clean sunrise to escape to.
 * Smartas accept the viddha day; Vaishnavas will not, and take the Dwadashi instead. That
 * yields precisely the two Drik prints for 2026 (11 Jul, 21 Nov) and the three for 2027
 * (19 Jan, 30 Jul, 26 Oct) — and none for Padmini, whose chosen day is clean.
 */
const ARUNODAYA_MIN = 96;

function ownedSunrises(tStart, tEnd, ctx) {
  const out = [];
  const base = civilOf(tStart, ctx.tzMin);
  for (let i = -1; i <= 2; i += 1) {
    const d = addDays(base, i);
    const c = dayCtx(d, ctx);
    if (!c.sunrise) continue;
    const m = c.sunrise.getTime();
    if (m >= tStart.getTime() && m < tEnd.getTime()) out.push(d);
  }
  return out;
}

function ekadashiDay(ekSpan, dwSpan, ctx) {
  const sunrises = ownedSunrises(ekSpan.start, ekSpan.end, ctx);
  if (sunrises.length >= 2) return sunrises[sunrises.length - 1];
  if (sunrises.length === 0) return maxShareDay(ekSpan.start, ekSpan.end, ctx);
  const day = sunrises[0];
  if (dwSpan && ownedSunrises(dwSpan.start, dwSpan.end, ctx).length === 0) return addDays(day, -1);
  return day;
}

function isDashamiViddha(day, tStart, tEnd, ctx) {
  const c = dayCtx(day, ctx);
  if (!c.sunrise) return false;
  const arunodaya = c.sunrise.getTime() - ARUNODAYA_MIN * MS;
  return !(arunodaya >= tStart.getTime() && arunodaya < tEnd.getTime());
}

/**
 * KRISHNA JANMASHTAMI (smarta) — the one festival Drik decides with TWO bodies, because the
 * shastra wants Krishna's birth star as well as his birth tithi: the Ashtami-Rohini
 * ("Jayanti") yoga.
 *
 *   • If the Ashtami tithi and the Rohini nakshatra OVERLAP at any moment, the yoga exists,
 *     and the festival is the ordinary sunrise-vyapini Ashtami day.
 *   • If they never overlap at all, there is no yoga to honour, and the day falls back to
 *     the Nishita rule — the night whose midnight the Ashtami actually holds.
 *
 * That second branch is not hypothetical: in 2050 the Ashtami ends 10 Aug 09:54 and Rohini
 * only begins 11 Aug 05:34, so the two never meet. Drik puts Janmashtami on 9 Aug — the
 * Nishita day — even though the Ashtami owns the sunrise of the 10th. Verified against Drik
 * for 2026, 2027, 2028, 2029, 2030, 2035, 2040 and 2050 (Jodhpur), and 2027/2029/2030 each
 * disprove a pure Nishita rule while 2050 disproves a pure sunrise rule.
 */
const ROHINI = 3; // index into eph.NAKSHATRAS

function nakshatraOverlaps(idx, tStart, tEnd) {
  const step = 5 * MS;
  for (let t = tStart.getTime(); t <= tEnd.getTime(); t += step) {
    if (Math.floor(eph.siderealLon('Moon', new Date(t)) / (360 / 27)) === idx) return true;
  }
  return false;
}

function janmashtamiDay(tStart, tEnd, ctx) {
  const jayantiYoga = nakshatraOverlaps(ROHINI, tStart, tEnd);
  return jayantiYoga
    ? resolveDay(tStart, tEnd, 'sunrise', 'first', ctx)
    : resolveDay(tStart, tEnd, 'nishita', 'max', ctx);
}

/**
 * RAKSHA BANDHAN — the rakhi wants the Aparahna of the Purnima, but BHADRA stands in the way.
 * Bhadra is the Vishti karana, and on Shravana Purnima Vishti is always the FIRST of the
 * tithi's two karanas — it runs from the start of the Purnima to its midpoint. (Computed that
 * way it reproduces Drik's printed "Bhadra End Time" to the minute: 19:04 in 2029, 21:09 in
 * 2031, 12:57 in 2033, 21:33 in 2050.) Because Bhadra begins WITH the Purnima, it always
 * swallows the Aparahna of the day the Purnima starts. So neither day offers the textbook
 * Aparahna slot, and the choice is between two second-best windows:
 *
 *   day A (Purnima starts) — tie the rakhi in the evening, once Bhadra has cleared
 *   day B (Purnima ends)   — tie it in the morning, before the tithi runs out
 *
 * Drik takes day B only if the Purnima there actually LASTS into the day — specifically past
 * PRATAHKALA, the first fifth of daylight. If the tithi is gone by mid-morning there is no
 * real window on day B, and the ceremony stays on day A's post-Bhadra evening.
 *
 *   2026: Purnima ends 09:49 on day B, well past Pratahkala → day B (Drik: 28 Aug, 06:16-09:48)
 *   2050: Purnima ends 07:50 on day B, inside Pratahkala   → day A (Drik: 2 Aug, after 21:33)
 *
 * Those two are structurally identical in every other respect — same Bhadra shape, same dead
 * Aparahna on both days — so the extent of the tithi on day B is the only thing that separates
 * them. Crucially this test is made against a DAY-PART boundary, which scales with the local
 * day, so it gives the same answer at Jodhpur and at Kanpur — as Drik's does. An earlier
 * version of this rule gated on the Pradosh window instead; that keys off sunset, drifts east
 * to west, and silently disagreed with Drik at Kanpur while looking perfect at Jodhpur.
 *
 * Verified against Drik at BOTH cities for 2026-2035, 2040 and 2050.
 */
function rakshaBandhanDay(tStart, tEnd, ctx) {
  const dayA = civilOf(tStart, ctx.tzMin);
  const dayB = civilOf(tEnd, ctx.tzMin);
  if (dayB.getTime() === dayA.getTime()) return dayA;
  const c = dayCtx(dayB, ctx);
  if (!c.sunrise || !c.sunset) return dayA;
  const pratahkalaEnd = c.sunrise.getTime() + (c.sunset.getTime() - c.sunrise.getTime()) / 5;
  return tEnd.getTime() > pratahkalaEnd ? dayB : dayA;
}

/**
 * The span of a nakshatra inside a search window. A nakshatra, like a tithi, can be KSHAYA —
 * begin after one sunrise and end before the next, owning no sunrise at all. Onam 2050 is
 * exactly that (Shravana runs 30 Aug 08:14 → 31 Aug 05:34), so resolving the nakshatra by
 * "which sunrise does it hold" silently produces nothing. Returning the span instead lets
 * resolveDay apply its normal kshaya fallback.
 */
function nakshatraSpanIn(idx, from, to) {
  const w = 360 / 27;
  const step = 5 * MS;
  let start = null;
  let prev = Math.floor(eph.siderealLon('Moon', from) / w);
  for (let t = from.getTime() + step; t <= to.getTime(); t += step) {
    const cur = Math.floor(eph.siderealLon('Moon', new Date(t)) / w);
    if (cur === prev) continue;
    if (cur === idx) start = new Date(t);
    else if (prev === idx && start) return { start, end: new Date(t) };
    prev = cur;
  }
  return null;
}

/**
 * HOLIKA DAHAN — the bonfire is lit in Pradosh, and like the rakhi it must avoid BHADRA (the
 * Vishti karana, the first half of the Purnima). So the day is the first one whose Pradosh
 * window holds a moment that is Purnima AND past Bhadra.
 *
 * In 2050 the Phalguna Purnima runs 7 Mar 18:34 → 8 Mar 20:54, so Bhadra covers the whole of
 * the 7th's Pradosh — Drik lights the fire on the 8th instead, and Holi follows on the 9th.
 * A plain Pradosh rule takes the 7th, because the Purnima pervades that window perfectly.
 */
function holikaDahanDay(tStart, tEnd, ctx) {
  const bhadraEnd = new Date((tStart.getTime() + tEnd.getTime()) / 2);
  const clearFrom = Math.max(tStart.getTime(), bhadraEnd.getTime());
  const base = civilOf(tStart, ctx.tzMin);
  for (let i = -1; i <= 2; i += 1) {
    const d = addDays(base, i);
    const c = dayCtx(d, ctx);
    if (!c.sunset) continue;
    const a = c.sunset.getTime();
    const b = a + 144 * MS;
    if (Math.min(b, tEnd.getTime()) > Math.max(a, clearFrom)) return d;
  }
  return resolveDay(tStart, tEnd, 'pradosh', 'max', ctx);
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE CATALOG — masa is the AMANTA index (0=Chaitra … 11=Phalguna),
// tithi is 1..15 within the paksha (15 = Purnima in Shukla, Amavasya in Krishna).
// ─────────────────────────────────────────────────────────────────────────────

const F = (key, en, hi, masa, paksha, tithi, ref, extra) => ({
  key, name: { en, hi }, masa, paksha, tithi, ref: ref || 'sunrise', type: 'festival', importance: 'major', ...(extra || {}),
});

const ANNUAL = [
  // ── Paush / Magha ──
  F('shakambhari-purnima', 'Shakambhari Purnima', 'शाकंभरी पूर्णिमा', 9, 'Shukla', 15, 'sunrise', { importance: 'minor', aliases: ['shakambhari purnima', 'शाकंभरी पूर्णिमा'] }),
  F('sakat-chauth', 'Sakat Chauth', 'सकट चौथ', 9, 'Krishna', 4, 'moonrise', { type: 'vrat', aliases: ['sakat chauth', 'tilkuta chauth', 'सकट चौथ'] }),
  F('mauni-amavasya', 'Mauni Amavasya', 'मौनी अमावस्या', 9, 'Krishna', 15, 'sunrise', { aliases: ['mauni amavasya', 'magha amavasya', 'मौनी अमावस्या'] }),
  F('magha-navratri', 'Magha Gupt Navratri begins', 'माघ गुप्त नवरात्रि आरंभ', 10, 'Shukla', 1, 'sunrise', { importance: 'minor', aliases: ['magha navratri', 'gupt navratri', 'माघ नवरात्रि'] }),
  // Ganesha's birth is celebrated in the Madhyahna of Magha Shukla Chaturthi, exactly as
  // Ganesh Chaturthi is in Bhadrapada — same deity, same reference moment.
  F('ganesh-jayanti', 'Ganesh Jayanti', 'गणेश जयंती', 10, 'Shukla', 4, 'madhyahna', { importance: 'minor', aliases: ['ganesh jayanti', 'magha vinayaka chaturthi', 'गणेश जयंती'] }),
  F('vasant-panchami', 'Vasant Panchami', 'वसंत पंचमी', 10, 'Shukla', 5, 'purvahna', { aliases: ['vasant panchami', 'basant panchami', 'वसंत पंचमी'] }),
  F('ratha-saptami', 'Ratha Saptami', 'रथ सप्तमी', 10, 'Shukla', 7, 'sunrise', { aliases: ['ratha saptami', 'rath saptami', 'surya jayanti', 'रथ सप्तमी'] }),
  F('bhishma-ashtami', 'Bhishma Ashtami', 'भीष्म अष्टमी', 10, 'Shukla', 8, 'madhyahna', { importance: 'minor', aliases: ['bhishma ashtami', 'भीष्म अष्टमी'] }),
  F('maha-shivaratri', 'Maha Shivaratri', 'महाशिवरात्रि', 10, 'Krishna', 14, 'nishita', { type: 'vrat', aliases: ['maha shivratri', 'mahashivratri', 'shivaratri', 'महाशिवरात्रि'] }),

  // ── Phalguna ──
  F('phulera-dooj', 'Phulera Dooj', 'फुलेरा दूज', 11, 'Shukla', 2, 'sunrise', { importance: 'minor', aliases: ['phulera dooj', 'फुलेरा दूज'] }),
  // Rangwali Holi is not an independent tithi rule: it is by definition the day AFTER the
  // bonfire, so it is derived from Holika Dahan rather than from Krishna Pratipada (which
  // in 2026 only reaches sunrise on 4 March, a day late).
  // Day comes from holikaDahanDay() — Pradosh minus Bhadra. See the note there.
  F('holika-dahan', 'Holika Dahan', 'होलिका दहन', 11, 'Shukla', 15, 'pradosh', {
    holika: true,
    aliases: ['holika dahan', 'holika', 'होलिका दहन'],
    follow: {
      key: 'holi', name: { en: 'Holi (Dhulandi)', hi: 'होली (धुलंडी)' }, offset: 1, paksha: 'Krishna', tithi: 1,
      aliases: ['holi', 'dhulandi', 'rangwali holi', 'होली'],
    },
  }),
  F('rang-panchami', 'Rang Panchami', 'रंग पंचमी', 11, 'Krishna', 5, 'sunrise', { importance: 'minor', aliases: ['rang panchami', 'रंग पंचमी'] }),
  F('shitala-ashtami', 'Shitala Ashtami', 'शीतला अष्टमी', 11, 'Krishna', 8, 'sunrise', { importance: 'minor', aliases: ['shitala ashtami', 'शीतला अष्टमी'] }),
  F('basoda', 'Basoda', 'बसोड़ा', 11, 'Krishna', 8, 'sunrise', { importance: 'minor', aliases: ['basoda', 'बसोड़ा'] }),

  // ── Chaitra ──
  F('ugadi', 'Ugadi', 'उगादी', 0, 'Shukla', 1, 'sunrise', { aliases: ['ugadi', 'yugadi', 'उगादी'] }),
  F('gudi-padwa', 'Gudi Padwa', 'गुड़ी पड़वा', 0, 'Shukla', 1, 'sunrise', { aliases: ['gudi padwa', 'gudhi padwa', 'गुड़ी पड़वा'] }),
  F('chaitra-navratri', 'Chaitra Navratri begins', 'चैत्र नवरात्रि आरंभ', 0, 'Shukla', 1, 'sunrise', { aliases: ['chaitra navratri', 'vasant navratri', 'चैत्र नवरात्रि'] }),
  F('gangaur', 'Gangaur', 'गणगौर', 0, 'Shukla', 3, 'sunrise', { type: 'vrat', aliases: ['gangaur', 'gauri tritiya', 'गणगौर'] }),
  F('gauri-puja', 'Gauri Puja', 'गौरी पूजा', 0, 'Shukla', 3, 'sunrise', { importance: 'minor', aliases: ['gauri puja', 'गौरी पूजा'] }),
  F('matsya-jayanti', 'Matsya Jayanti', 'मत्स्य जयंती', 0, 'Shukla', 3, 'sunrise', { importance: 'minor', aliases: ['matsya jayanti', 'मत्स्य जयंती'] }),
  // Skanda Sashti is the evening rite of Shashthi, so it is the tithi at Sayankala that
  // names the day (23 Mar 2026: Shashthi only begins at 18:40, minutes before sunset, and
  // Drik still gives that evening the vrat) — while Yamuna Chhath, a bathing/morning
  // observance on the same tithi, is sunrise-vyapini and lands the next day.
  F('yamuna-chhath', 'Yamuna Chhath', 'यमुना छठ', 0, 'Shukla', 6, 'sunrise', { importance: 'minor', aliases: ['yamuna chhath', 'yamuna jayanti', 'यमुना छठ'] }),
  // Smarta Ram Navami is a Madhyahna observance (Rama's birth is at noon); the Vaishnava
  // (ISKCON) reckoning is sunrise-vyapini, so in 2026 the two split across 26/27 March.
  F('ram-navami', 'Ram Navami', 'राम नवमी', 0, 'Shukla', 9, 'madhyahna', { aliases: ['ram navami', 'rama navami', 'राम नवमी'] }),
  F('ram-navami-iskcon', 'Ram Navami (Vaishnava)', 'राम नवमी (वैष्णव)', 0, 'Shukla', 9, 'sunrise', { importance: 'minor', aliases: ['ram navami iskcon', 'vaishnava ram navami', 'इस्कॉन राम नवमी'] }),
  F('swaminarayan-jayanti', 'Swaminarayan Jayanti', 'स्वामीनारायण जयंती', 0, 'Shukla', 9, 'sunrise', { importance: 'minor', aliases: ['swaminarayan jayanti', 'स्वामीनारायण जयंती'] }),
  F('mahavir-jayanti', 'Mahavir Jayanti', 'महावीर जयंती', 0, 'Shukla', 13, 'sunrise', { aliases: ['mahavir jayanti', 'mahaveer jayanti', 'महावीर जयंती'] }),
  F('hanuman-jayanti', 'Hanuman Jayanti', 'हनुमान जयंती', 0, 'Shukla', 15, 'sunrise', { aliases: ['hanuman jayanti', 'hanuman janmotsav', 'हनुमान जयंती'] }),

  // ── Vaishakha ──
  // Akshaya Tritiya wants the Tritiya to PERVADE the whole Madhyahna, not just to hold most of
  // it. In 2026 it does (19 Apr, Tritiya from 10:50 vs Madhyahna 11:20-13:53) and that is the
  // day. In 2027 it never does — on 8 May the Tritiya starts 11:44, half an hour into the
  // Madhyahna — so the rule falls back to the sunrise tithi and lands on 9 May, which is
  // Drik's day. A "greater share" reading would wrongly give 8 May.
  F('akshaya-tritiya', 'Akshaya Tritiya', 'अक्षय तृतीया', 1, 'Shukla', 3, 'madhyahna', { pick: 'full', aliases: ['akshaya tritiya', 'akha teej', 'अक्षय तृतीया'] }),
  F('parashurama-jayanti', 'Parashurama Jayanti', 'परशुराम जयंती', 1, 'Shukla', 3, 'pradosh', { importance: 'minor', aliases: ['parashurama jayanti', 'parshuram jayanti', 'परशुराम जयंती'] }),
  F('shankaracharya-jayanti', 'Adi Shankaracharya Jayanti', 'आदि शंकराचार्य जयंती', 1, 'Shukla', 5, 'sunrise', { importance: 'minor', aliases: ['shankaracharya jayanti', 'शंकराचार्य जयंती'] }),
  F('ganga-saptami', 'Ganga Saptami', 'गंगा सप्तमी', 1, 'Shukla', 7, 'sunrise', { importance: 'minor', aliases: ['ganga saptami', 'ganga jayanti', 'गंगा सप्तमी'] }),
  F('sita-navami', 'Sita Navami', 'सीता नवमी', 1, 'Shukla', 9, 'madhyahna', { importance: 'minor', aliases: ['sita navami', 'janaki navami', 'सीता नवमी'] }),
  F('narasimha-jayanti', 'Narasimha Jayanti', 'नृसिंह जयंती', 1, 'Shukla', 14, 'sayankala', { aliases: ['narasimha jayanti', 'nrisimha jayanti', 'नृसिंह जयंती'] }),
  F('buddha-purnima', 'Buddha Purnima', 'बुद्ध पूर्णिमा', 1, 'Shukla', 15, 'sunrise', { aliases: ['buddha purnima', 'vesak', 'बुद्ध पूर्णिमा'] }),
  // The Kurma avatara rose during the evening churning, so this Purnima is kept in Pradosh —
  // which is a day earlier than the sunrise-Purnima whenever the tithi begins in the afternoon
  // (19 May 2027, where Vaishakha Purnima itself is the 20th).
  F('kurma-jayanti', 'Kurma Jayanti', 'कूर्म जयंती', 1, 'Shukla', 15, 'pradosh', { importance: 'minor', aliases: ['kurma jayanti', 'कूर्म जयंती'] }),
  F('narada-jayanti', 'Narada Jayanti', 'नारद जयंती', 1, 'Krishna', 1, 'sunrise', { importance: 'minor', aliases: ['narada jayanti', 'नारद जयंती'] }),
  F('vat-savitri', 'Vat Savitri Vrat', 'वट सावित्री व्रत', 1, 'Krishna', 15, 'sunrise', { type: 'vrat', aliases: ['vat savitri', 'vat amavasya', 'वट सावित्री'] }),
  F('shani-jayanti', 'Shani Jayanti', 'शनि जयंती', 1, 'Krishna', 15, 'sunrise', { aliases: ['shani jayanti', 'शनि जयंती'] }),

  // ── Jyeshtha ──
  // Ganga Dussehra marks the Ganga's descent on Jyeshtha Shukla Dashami and is kept in the
  // FIRST Jyeshtha of the year — so in an Adhika-Jyeshtha year (2026) it stays in the
  // adhika month rather than sliding to the nija one, which is how Drik lists it too.
  F('ganga-dussehra', 'Ganga Dussehra', 'गंगा दशहरा', 2, 'Shukla', 10, 'sunrise', { adhikaPrefer: true, aliases: ['ganga dussehra', 'ganga dashami', 'गंगा दशहरा'] }),
  F('mahesh-navami', 'Mahesh Navami', 'महेश नवमी', 2, 'Shukla', 9, 'sunrise', { importance: 'minor', aliases: ['mahesh navami', 'महेश नवमी'] }),
  // Gayatri Jayanti is kept on Nirjala Ekadashi, so it inherits the Ekadashi's Dashami-vedha
  // pick rather than a plain first-sunrise pick.
  F('gayatri-jayanti', 'Gayatri Jayanti', 'गायत्री जयंती', 2, 'Shukla', 11, 'sunrise', { ekadashi: true, importance: 'minor', aliases: ['gayatri jayanti', 'गायत्री जयंती'] }),
  F('vat-purnima', 'Vat Purnima Vrat', 'वट पूर्णिमा व्रत', 2, 'Shukla', 15, 'sunrise', { type: 'vrat', importance: 'minor', aliases: ['vat purnima', 'वट पूर्णिमा'] }),

  // ── Ashadha ──
  F('ashadha-navratri', 'Ashadha Gupt Navratri begins', 'आषाढ़ गुप्त नवरात्रि आरंभ', 3, 'Shukla', 1, 'sunrise', { importance: 'minor', aliases: ['ashadha navratri', 'gupt navratri', 'आषाढ़ नवरात्रि'] }),
  F('jagannath-rathyatra', 'Jagannath Rath Yatra', 'जगन्नाथ रथ यात्रा', 3, 'Shukla', 2, 'sunrise', { aliases: ['rath yatra', 'jagannath rathyatra', 'रथ यात्रा'] }),
  F('parvati-jayanti', 'Parvati Jayanti', 'पार्वती जयंती', 3, 'Shukla', 8, 'sunrise', { importance: 'minor', aliases: ['parvati jayanti', 'पार्वती जयंती'] }),
  F('bhadali-navami', 'Bhadali Navami', 'भड़ली नवमी', 3, 'Shukla', 9, 'sunrise', { importance: 'minor', aliases: ['bhadali navami', 'भड़ली नवमी'] }),
  F('asha-dashami', 'Asha Dashami', 'आशा दशमी', 3, 'Shukla', 10, 'sunrise', { importance: 'minor', aliases: ['asha dashami', 'आशा दशमी'] }),
  // The Gujarati Gauri Vrat runs Devshayani Ekadashi → Purnima, so it opens on the very day
  // the Ekadashi is kept (Dashami-vedha pick included).
  F('gauri-vrat-start', 'Gauri Vrat begins', 'गौरी व्रत आरंभ', 3, 'Shukla', 11, 'sunrise', { ekadashi: true, type: 'vrat', importance: 'minor', aliases: ['gauri vrat', 'गौरी व्रत'] }),
  F('guru-purnima', 'Guru Purnima', 'गुरु पूर्णिमा', 3, 'Shukla', 15, 'sunrise', { aliases: ['guru purnima', 'vyasa purnima', 'गुरु पूर्णिमा'] }),
  F('hariyali-amavasya', 'Hariyali Amavasya', 'हरियाली अमावस्या', 3, 'Krishna', 15, 'sunrise', { importance: 'minor', aliases: ['hariyali amavasya', 'shravan amavasya', 'हरियाली अमावस्या'] }),

  // ── Shravana ──
  F('hariyali-teej', 'Hariyali Teej', 'हरियाली तीज', 4, 'Shukla', 3, 'sunrise', { type: 'vrat', aliases: ['hariyali teej', 'shravana teej', 'हरियाली तीज'] }),
  F('nag-panchami', 'Nag Panchami', 'नाग पंचमी', 4, 'Shukla', 5, 'sunrise', { importance: 'minor', aliases: ['nag panchami', 'naag panchami', 'नाग पंचमी'] }),
  // Day comes from rakshaBandhanDay() — Aparahna/Pradosh minus Bhadra. See the note there.
  F('raksha-bandhan', 'Raksha Bandhan', 'रक्षाबंधन', 4, 'Shukla', 15, 'sunrise', { rakshaBandhan: true, aliases: ['raksha bandhan', 'rakhi', 'rakshabandhan', 'रक्षाबंधन'] }),
  F('kajri-teej', 'Kajri Teej', 'कजरी तीज', 4, 'Krishna', 3, 'sunrise', { type: 'vrat', importance: 'minor', aliases: ['kajri teej', 'kajari teej', 'कजरी तीज'] }),
  // Day comes from janmashtamiDay() — the Ashtami-Rohini (Jayanti) yoga decides between the
  // sunrise rule and the Nishita rule. See the note there. The MONTHLY Krishna Ashtami vrat is
  // unconditionally Nishita-selected (masik-krishna-janmashtami), so the two can part company.
  F('krishna-janmashtami', 'Krishna Janmashtami', 'कृष्ण जन्माष्टमी', 4, 'Krishna', 8, 'sunrise', { jayanti: true,
    type: 'vrat', aliases: ['janmashtami', 'krishna janmashtami', 'gokulashtami', 'जन्माष्टमी'],
    // Dahi Handi is by definition the morning after the midnight birth, never an independent tithi.
    follow: {
      key: 'dahi-handi', name: { en: 'Dahi Handi', hi: 'दही हांडी' }, offset: 1, paksha: 'Krishna', tithi: 9,
      importance: 'minor', aliases: ['dahi handi', 'gopalkala', 'दही हांडी'],
    },
  }),

  // ── Bhadrapada ──
  F('hartalika-teej', 'Hartalika Teej', 'हरतालिका तीज', 5, 'Shukla', 3, 'sunrise', { type: 'vrat', aliases: ['hartalika teej', 'hartalika', 'हरतालिका तीज'] }),
  F('ganesh-chaturthi', 'Ganesh Chaturthi', 'गणेश चतुर्थी', 5, 'Shukla', 4, 'madhyahna', { aliases: ['ganesh chaturthi', 'ganpati', 'vinayaka chavithi', 'गणेश चतुर्थी'] }),
  F('rishi-panchami', 'Rishi Panchami', 'ऋषि पंचमी', 5, 'Shukla', 5, 'madhyahna', { type: 'vrat', importance: 'minor', aliases: ['rishi panchami', 'ऋषि पंचमी'] }),
  // Balarama's appearance is at noon, so it is Madhyahna-vyapini — which separates it from
  // Skanda Sashti on the very same Shashthi, an evening rite that lands a day earlier.
  F('balaram-jayanti', 'Balaram Jayanti', 'बलराम जयंती', 5, 'Shukla', 6, 'madhyahna', { importance: 'minor', aliases: ['balaram jayanti', 'baladeva jayanti', 'बलराम जयंती'] }),
  // Sunrise-vyapini for the same reason as Akshaya Tritiya (7 vs 8 Sep 2027); in 2026 the
  // Madhyahna and the sunrise happened to agree, which is what hid this.
  F('radha-ashtami', 'Radha Ashtami', 'राधा अष्टमी', 5, 'Shukla', 8, 'sunrise', { importance: 'minor', aliases: ['radha ashtami', 'राधा अष्टमी'] }),
  F('vamana-jayanti', 'Vamana Jayanti', 'वामन जयंती', 5, 'Shukla', 12, 'sunrise', { importance: 'minor', aliases: ['vamana jayanti', 'वामन जयंती'] }),
  F('anant-chaturdashi', 'Anant Chaturdashi', 'अनंत चतुर्दशी', 5, 'Shukla', 14, 'sunrise', { aliases: ['anant chaturdashi', 'ananta chaturdashi', 'अनंत चतुर्दशी'] }),
  F('ganesh-visarjan', 'Ganesh Visarjan', 'गणेश विसर्जन', 5, 'Shukla', 14, 'sunrise', { aliases: ['ganesh visarjan', 'गणेश विसर्जन'] }),
  F('pitrupaksha-start', 'Pitru Paksha begins', 'पितृ पक्ष आरंभ', 5, 'Krishna', 1, 'sunrise', { type: 'tithi', aliases: ['pitrupaksha', 'pitru paksha', 'shraddha', 'पितृ पक्ष'] }),
  // Jitiya is a sunrise-vyapini fast; in 2026 the Ashtami is kshaya (it owns no sunrise at
  // all), so it falls back to the day that holds most of the tithi.
  F('jivitputrika-vrat', 'Jivitputrika Vrat', 'जीवित्पुत्रिका व्रत', 5, 'Krishna', 8, 'sunrise', { type: 'vrat', importance: 'minor', aliases: ['jivitputrika', 'jitiya', 'jiutiya', 'जीवित्पुत्रिका'] }),
  // Shraddha is offered in the Aparahna, so Sarva Pitru Amavasya follows the Amavasya that owns
  // the afternoon — the same reference Darsha Amavasya uses, and a day before the sunrise-
  // Amavasya whenever the tithi starts around midday (29 vs 30 Sep 2027).
  F('sarvapitri-amavasya', 'Sarva Pitru Amavasya', 'सर्वपितृ अमावस्या', 5, 'Krishna', 15, 'aparahna', { aliases: ['sarvapitri amavasya', 'mahalaya amavasya', 'सर्वपितृ अमावस्या'] }),

  // ── Ashwina ──
  F('navratri-start', 'Shardiya Navratri begins', 'शारदीय नवरात्रि आरंभ', 6, 'Shukla', 1, 'sunrise', { aliases: ['navratri', 'sharadiya navratri', 'नवरात्रि'] }),
  F('ghatasthapana', 'Ghatasthapana', 'घटस्थापना', 6, 'Shukla', 1, 'sunrise', { importance: 'minor', aliases: ['ghatasthapana', 'kalash sthapana', 'घटस्थापना'] }),
  F('durga-ashtami', 'Durga Ashtami', 'दुर्गा अष्टमी', 6, 'Shukla', 8, 'sunrise', { aliases: ['durga ashtami', 'maha ashtami', 'दुर्गा अष्टमी'] }),
  // Navami puja + bali are prescribed in Aparahna, so Maha Navami lands on the day Navami is
  // running that afternoon — in 2026 that is the same day as Durga Ashtami (Navami only
  // reaches sunrise on the 20th, by which time Dashami has already begun). Ayudha Puja, the
  // morning tool-worship on the same Navami, is sunrise-vyapini and so lands on the 20th.
  F('maha-navami', 'Maha Navami', 'महा नवमी', 6, 'Shukla', 9, 'aparahna', { aliases: ['maha navami', 'महा नवमी'] }),
  F('ayudha-puja', 'Ayudha Puja', 'आयुध पूजा', 6, 'Shukla', 9, 'sunrise', { importance: 'minor', aliases: ['ayudha puja', 'astra puja', 'आयुध पूजा'] }),
  F('vijayadashami', 'Vijayadashami (Dussehra)', 'विजयादशमी (दशहरा)', 6, 'Shukla', 10, 'aparahna', { aliases: ['dussehra', 'dasara', 'vijayadashami', 'दशहरा', 'विजयादशमी'] }),
  // Sharad Purnima's whole point is the midnight moon (Kojagara), so it is Nishita-vyapini,
  // while Valmiki Jayanti on the same Purnima is a sunrise observance and can fall a day later.
  F('sharad-purnima', 'Sharad Purnima', 'शरद पूर्णिमा', 6, 'Shukla', 15, 'nishita', { aliases: ['sharad purnima', 'kojagiri', 'शरद पूर्णिमा'] }),
  F('kojagara-puja', 'Kojagara Puja', 'कोजागरा पूजा', 6, 'Shukla', 15, 'nishita', { importance: 'minor', aliases: ['kojagara puja', 'kojagiri', 'कोजागरा पूजा'] }),
  F('valmiki-jayanti', 'Valmiki Jayanti', 'वाल्मीकि जयंती', 6, 'Shukla', 15, 'sunrise', { importance: 'minor', aliases: ['valmiki jayanti', 'वाल्मीकि जयंती'] }),
  F('karwa-chauth', 'Karwa Chauth', 'करवा चौथ', 6, 'Krishna', 4, 'moonrise', { type: 'vrat', aliases: ['karwa chauth', 'karva chauth', 'करवा चौथ'] }),
  // The Ahoi fast is broken at star-sighting after sunset, so the vrat follows the evening.
  F('ahoi-ashtami', 'Ahoi Ashtami', 'अहोई अष्टमी', 6, 'Krishna', 8, 'pradosh', { type: 'vrat', aliases: ['ahoi ashtami', 'अहोई अष्टमी'] }),
  // Vasu Baras is a Pradosh-kala cow worship, so the Dwadashi that owns the evening wins.
  F('govatsa-dwadashi', 'Govatsa Dwadashi', 'गोवत्स द्वादशी', 6, 'Krishna', 12, 'pradosh', { importance: 'minor', aliases: ['govatsa dwadashi', 'vasu baras', 'गोवत्स द्वादशी'] }),
  F('dhanteras', 'Dhanteras', 'धनतेरस', 6, 'Krishna', 13, 'pradosh', { aliases: ['dhanteras', 'dhantrayodashi', 'धनतेरस'] }),
  // Kali Chaudas is the midnight (Nishita) half of Chaturdashi; Roop Chaudas / Naraka
  // Chaturdashi is the pre-dawn oil bath, so it belongs to the following sunrise.
  F('kali-chaudas', 'Kali Chaudas', 'काली चौदस', 6, 'Krishna', 14, 'nishita', { importance: 'minor', aliases: ['kali chaudas', 'काली चौदस'] }),
  F('naraka-chaturdashi', 'Naraka Chaturdashi', 'नरक चतुर्दशी', 6, 'Krishna', 14, 'sunrise', { aliases: ['naraka chaturdashi', 'choti diwali', 'roop chaudas', 'नरक चतुर्दशी'] }),
  // Lakshmi Puja needs the Amavasya to PERVADE the Pradosh, not merely to hold most of it. In
  // 2050 the Amavasya (13 Nov 18:02 → 14 Nov 19:12) pervades neither day's Pradosh, so the rule
  // falls back to the sunrise tithi and lands on the 14th — Drik's day. A "greater share"
  // reading would take the 13th, where the Amavasya covers 131 of the 144 Pradosh minutes.
  F('diwali', 'Diwali / Lakshmi Puja', 'दीवाली / लक्ष्मी पूजा', 6, 'Krishna', 15, 'pradosh', { pick: 'full', aliases: ['diwali', 'deepawali', 'lakshmi puja', 'दीवाली', 'दिवाली'] }),

  // ── Kartika ──
  // Annakut is offered on the Pratipada that follows the Diwali night. Pratipada often starts
  // mid-morning (12:32 on 9 Nov 2026), so it never reaches that day's Pratahkala — Sayankala
  // is the muhurat Drik then falls back to, and it identifies the day unambiguously. The
  // Gujarati new year, by contrast, is the sunrise-vyapini Pratipada, one day later.
  F('govardhan-puja', 'Govardhan Puja', 'गोवर्धन पूजा', 7, 'Shukla', 1, 'sayankala', { aliases: ['govardhan puja', 'annakut', 'गोवर्धन पूजा'] }),
  F('gujarati-new-year', 'Gujarati New Year', 'गुजराती नववर्ष', 7, 'Shukla', 1, 'sunrise', { importance: 'minor', aliases: ['gujarati new year', 'bestu varas', 'गुजराती नववर्ष'] }),
  F('bhai-dooj', 'Bhai Dooj', 'भाई दूज', 7, 'Shukla', 2, 'aparahna', { aliases: ['bhai dooj', 'bhaiya dooj', 'yama dwitiya', 'भाई दूज'] }),
  F('labh-chaturthi', 'Labh Chaturthi', 'लाभ चतुर्थी', 7, 'Shukla', 4, 'sunrise', { importance: 'minor', aliases: ['labh chaturthi', 'labh pancham', 'लाभ चतुर्थी'] }),
  F('chhath-puja', 'Chhath Puja', 'छठ पूजा', 7, 'Shukla', 6, 'sayankala', { type: 'vrat', aliases: ['chhath puja', 'chhath', 'छठ पूजा'] }),
  F('gopashtami', 'Gopashtami', 'गोपाष्टमी', 7, 'Shukla', 8, 'sunrise', { importance: 'minor', aliases: ['gopashtami', 'गोपाष्टमी'] }),
  F('akshaya-navami', 'Akshaya Navami', 'अक्षय नवमी', 7, 'Shukla', 9, 'sunrise', { importance: 'minor', aliases: ['akshaya navami', 'amla navami', 'अक्षय नवमी'] }),
  // The wedding is held in the evening, but the DAY is the sunrise-vyapini Dwadashi (11 Nov
  // 2027, though the Dwadashi already owns the 10th's Pradosh).
  F('tulsi-vivah', 'Tulsi Vivah', 'तुलसी विवाह', 7, 'Shukla', 12, 'sunrise', { aliases: ['tulsi vivah', 'तुलसी विवाह'] }),
  // The Vaikuntha Chaturdashi puja is offered at Nishita, so the day is the one whose MIDNIGHT
  // the Chaturdashi holds (12 Nov 2027, not the 13th, which owns its sunrise).
  F('vaikuntha-chaturdashi', 'Vaikuntha Chaturdashi', 'वैकुण्ठ चतुर्दशी', 7, 'Shukla', 14, 'nishita', { importance: 'minor', aliases: ['vaikuntha chaturdashi', 'वैकुण्ठ चतुर्दशी'] }),
  F('kartik-purnima', 'Kartik Purnima', 'कार्तिक पूर्णिमा', 7, 'Shukla', 15, 'sunrise', { aliases: ['kartik purnima', 'कार्तिक पूर्णिमा'] }),
  // Dev Deepawali is the lamp-lighting on the ghats after sunset, so it follows the Pradosh
  // and can precede Kartik Purnima itself (13 vs 14 Nov 2027).
  F('dev-diwali', 'Dev Deepawali', 'देव दीपावली', 7, 'Shukla', 15, 'pradosh', { importance: 'minor', aliases: ['dev diwali', 'dev deepawali', 'देव दीपावली'] }),
  F('guru-nanak-jayanti', 'Guru Nanak Jayanti', 'गुरु नानक जयंती', 7, 'Shukla', 15, 'sunrise', { aliases: ['guru nanak jayanti', 'gurpurab', 'गुरु नानक जयंती'] }),
  // Kalabhairav Jayanti is simply the Kartika Kalashtami, so it takes the same Pradosh
  // reference as the monthly one (20 Nov 2027, where the sunrise-Ashtami is the 21st).
  F('kalabhairav-jayanti', 'Kalabhairav Jayanti', 'कालभैरव जयंती', 7, 'Krishna', 8, 'pradosh', { importance: 'minor', aliases: ['kalabhairav jayanti', 'kaal bhairav jayanti', 'कालभैरव जयंती'] }),

  // ── Margashirsha ──
  F('vivah-panchami', 'Vivah Panchami', 'विवाह पंचमी', 8, 'Shukla', 5, 'sunrise', { importance: 'minor', aliases: ['vivah panchami', 'विवाह पंचमी'] }),
  F('champa-sashti', 'Champa Sashti', 'चंपा षष्ठी', 8, 'Shukla', 6, 'sayankala', { importance: 'minor', aliases: ['champa sashti', 'champa shashti', 'चंपा षष्ठी'] }),
  F('gita-jayanti', 'Gita Jayanti', 'गीता जयंती', 8, 'Shukla', 11, 'sunrise', { ekadashi: true, aliases: ['gita jayanti', 'geeta jayanti', 'गीता जयंती'] }),
  F('datta-jayanti', 'Datta Jayanti', 'दत्त जयंती', 8, 'Shukla', 15, 'sunrise', { importance: 'minor', aliases: ['datta jayanti', 'dattatreya jayanti', 'दत्त जयंती'] }),
  F('annapurna-jayanti', 'Annapurna Jayanti', 'अन्नपूर्णा जयंती', 8, 'Shukla', 15, 'sunrise', { importance: 'minor', aliases: ['annapurna jayanti', 'अन्नपूर्णा जयंती'] }),
];

// Every fortnight / month, in EVERY lunar month including adhika.
const RECURRING = [
  // Pradosh is an after-sunset vrat, and it is NAMED for the weekday it lands on
  // (Soma Pradosh, Shani Pradosh …) — see weekdayNamed below.
  { key: 'pradosh', paksha: 'Shukla', tithi: 13, ref: 'pradosh', type: 'vrat', importance: 'minor', weekdayNamed: true, name: { en: 'Pradosh Vrat', hi: 'प्रदोष व्रत' }, aliases: ['pradosh', 'pradosh vrat', 'प्रदोष'] },
  { key: 'pradosh', paksha: 'Krishna', tithi: 13, ref: 'pradosh', type: 'vrat', importance: 'minor', weekdayNamed: true, name: { en: 'Pradosh Vrat', hi: 'प्रदोष व्रत' }, aliases: ['pradosh', 'pradosh vrat', 'प्रदोष'] },
  // Trayodashi that falls on a Saturday is Shani Trayodashi — same tithi and same evening
  // window as the Pradosh, only emitted when the weekday agrees.
  { key: 'shani-trayodashi', paksha: 'Shukla', tithi: 13, ref: 'pradosh', weekday: 6, type: 'vrat', importance: 'minor', name: { en: 'Shani Trayodashi', hi: 'शनि त्रयोदशी' }, aliases: ['shani trayodashi', 'शनि त्रयोदशी'] },
  { key: 'shani-trayodashi', paksha: 'Krishna', tithi: 13, ref: 'pradosh', weekday: 6, type: 'vrat', importance: 'minor', name: { en: 'Shani Trayodashi', hi: 'शनि त्रयोदशी' }, aliases: ['shani trayodashi', 'शनि त्रयोदशी'] },
  // Saptami on a Sunday is the Sun's own day twice over — Bhanu Saptami.
  { key: 'bhanu-saptami', paksha: 'Shukla', tithi: 7, ref: 'sunrise', weekday: 0, type: 'vrat', importance: 'minor', name: { en: 'Bhanu Saptami', hi: 'भानु सप्तमी' }, aliases: ['bhanu saptami', 'भानु सप्तमी'] },
  { key: 'bhanu-saptami', paksha: 'Krishna', tithi: 7, ref: 'sunrise', weekday: 0, type: 'vrat', importance: 'minor', name: { en: 'Bhanu Saptami', hi: 'भानु सप्तमी' }, aliases: ['bhanu saptami', 'भानु सप्तमी'] },
  { key: 'vinayaka-chaturthi', paksha: 'Shukla', tithi: 4, ref: 'madhyahna', type: 'vrat', importance: 'minor', name: { en: 'Vinayaka Chaturthi', hi: 'विनायक चतुर्थी' }, aliases: ['vinayaka chaturthi', 'विनायक चतुर्थी'] },
  { key: 'sankashti-chaturthi', paksha: 'Krishna', tithi: 4, ref: 'moonrise', type: 'vrat', importance: 'minor', name: { en: 'Sankashti Chaturthi', hi: 'संकष्टी चतुर्थी' }, aliases: ['sankashti chaturthi', 'sankashti', 'संकष्टी चतुर्थी'] },
  // Skanda's abhishekam is an evening rite: the Shashthi that owns Sayankala names the day.
  { key: 'skanda-sashti', paksha: 'Shukla', tithi: 6, ref: 'sayankala', type: 'vrat', importance: 'minor', name: { en: 'Skanda Sashti', hi: 'स्कंद षष्ठी' }, aliases: ['skanda sashti', 'skanda shashti', 'स्कंद षष्ठी'] },
  { key: 'masik-durgashtami', paksha: 'Shukla', tithi: 8, ref: 'sunrise', type: 'vrat', importance: 'minor', name: { en: 'Masik Durgashtami', hi: 'मासिक दुर्गाष्टमी' }, aliases: ['durgashtami', 'masik durgashtami', 'दुर्गाष्टमी'] },
  // The two Krishna-Ashtami vrats split on their reference moment, which is why they can
  // land on different days: Kalashtami's Bhairav puja is offered in the Pradosh that follows
  // sunset (5 Aug 2026 — where the Ashtami only starts at 20:44, well after sunset, and Drik
  // still gives that evening the vrat), while the monthly Janmashtami — like the annual one —
  // is decided at Nishita.
  { key: 'kalashtami', paksha: 'Krishna', tithi: 8, ref: 'pradosh', type: 'vrat', importance: 'minor', name: { en: 'Kalashtami', hi: 'कालाष्टमी' }, aliases: ['kalashtami', 'kala ashtami', 'कालाष्टमी'] },
  { key: 'masik-krishna-janmashtami', paksha: 'Krishna', tithi: 8, ref: 'nishita', type: 'vrat', importance: 'minor', name: { en: 'Masik Krishna Janmashtami', hi: 'मासिक कृष्ण जन्माष्टमी' }, aliases: ['masik krishna janmashtami', 'मासिक जन्माष्टमी'] },
  { key: 'masik-shivaratri', paksha: 'Krishna', tithi: 14, ref: 'nishita', type: 'vrat', importance: 'minor', name: { en: 'Masik Shivaratri', hi: 'मासिक शिवरात्रि' }, aliases: ['masik shivaratri', 'मासिक शिवरात्रि'] },
  // An Amavasya that lands on a Monday is Somavati Amavasya — the sunrise-vyapini Amavasya
  // day (NOT the Aparahna one Darsha uses), which is why in March 2027 Darsha falls on the
  // 7th while Somavati is the 8th.
  { key: 'somavati-amavasya', paksha: 'Krishna', tithi: 15, ref: 'sunrise', weekday: 1, type: 'tithi', importance: 'minor', name: { en: 'Somavati Amavasya', hi: 'सोमवती अमावस्या' }, aliases: ['somavati amavasya', 'सोमवती अमावस्या'] },
  // Darsha Amavasya is the ancestral rite of the "vanishing" moon, performed in the afternoon,
  // so it is the Aparahna-vyapini Amavasya — which is a day EARLIER than the sunrise-Amavasya
  // whenever the tithi begins around midday (8 Nov vs 9 Nov 2026).
  { key: 'darsha-amavasya', paksha: 'Krishna', tithi: 15, ref: 'aparahna', type: 'tithi', importance: 'minor', name: { en: 'Darsha Amavasya', hi: 'दर्श अमावस्या' }, aliases: ['darsha amavasya', 'दर्श अमावस्या'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// LUNAR MONTH MODEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A lunar month runs new-moon → new-moon. It is NAMED after the sidereal sign the
 * Sun enters during it (Sun enters Mesha → Chaitra). A month in which the Sun enters
 * no sign at all is an ADHIKA (leap) month and borrows the name of the month that
 * follows it — this is what produces "Jyeshtha Adhika" in 2026.
 */
function buildLunarMonths(from, to, withBounds = true) {
  const newMoons = [];
  let t = newMoonAfter(from);
  while (t && t <= to) {
    newMoons.push(t);
    t = newMoonAfter(new Date(t.getTime() + 2 * DAY_MS));
  }
  const sankrantis = sankrantisBetween(from, to);
  const months = [];
  for (let i = 0; i < newMoons.length - 1; i += 1) {
    const start = newMoons[i];
    const end = newMoons[i + 1];
    months.push({ start, end, sankrantis: sankrantis.filter((s) => s.moment >= start && s.moment < end) });
  }
  for (let i = 0; i < months.length; i += 1) {
    const m = months[i];
    if (m.sankrantis.length) {
      m.masa = m.sankrantis[0].sign;
      m.adhika = false;
    } else {
      const next = months[i + 1];
      if (!next || !next.sankrantis.length) { m.masa = null; m.adhika = true; continue; }
      m.masa = next.sankrantis[0].sign;
      m.adhika = true;
    }
  }
  const named = months.filter((m) => m.masa != null);
  if (!withBounds) return named;
  // Exact 12° elongation crossings: bounds[k-1]..bounds[k] is tithi k (1..30).
  for (const m of named) {
    const bounds = [m.start];
    for (let k = 1; k <= 29; k += 1) {
      const b = phaseAfter(k * 12, bounds[k - 1]);
      if (!b) break;
      bounds.push(b);
    }
    bounds.push(m.end);
    m.bounds = bounds;
  }
  return named.filter((m) => m.bounds.length === 31);
}

const masaLabel = (m) => (m.adhika
  ? { en: `${MASA[m.masa].en} Adhika`, hi: `${MASA[m.masa].hi} अधिक` }
  : MASA[m.masa]);
// In Krishna paksha the purnimanta month is already the NEXT one (it began at the
// preceding Purnima) — this is the naming Drik shows in its subtitles.
const purnimantaLabel = (m, paksha) => {
  if (m.adhika) return masaLabel(m);
  return paksha === 'Krishna' ? MASA[(m.masa + 1) % 12] : MASA[m.masa];
};
const masaSlug = (m) => (m.adhika ? `${slug(MASA[m.masa].en)}-adhika` : slug(MASA[m.masa].en));

const tithiLabel = (paksha, t) => (t === 15
  ? (paksha === 'Shukla' ? { en: 'Purnima', hi: 'पूर्णिमा' } : { en: 'Amavasya', hi: 'अमावस्या' })
  : { en: TITHI_EN[t - 1], hi: TITHI_HI[t - 1] });

function noteFor(m, paksha, t) {
  const pm = purnimantaLabel(m, paksha);
  const ti = tithiLabel(paksha, t);
  return {
    en: `${pm.en}, ${paksha} ${ti.en}`,
    hi: `${pm.hi}, ${PAKSHA_HI[paksha]} ${ti.hi}`,
  };
}

const tithiSpan = (m, paksha, t) => {
  const k = paksha === 'Shukla' ? t : t + 15; // 1..30 across the lunar month
  return { start: m.bounds[k - 1], end: m.bounds[k] };
};

// ─────────────────────────────────────────────────────────────────────────────
// MASA (for the daily Panchang) — location-independent, so cached by calendar month.
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_CACHE = new Map();

/**
 * The lunar month a moment falls in, named the Drik way. NOT the Sun's current sign:
 * on 14 Sep 2026 the Sun is still in Simha, but the lunar month is Bhadrapada because
 * that is the month in which the Sun enters Kanya — which is why Ganesh Chaturthi is a
 * Bhadrapada festival even though it precedes the Kanya Sankranti.
 */
function masaFor(moment, paksha) {
  const y = moment.getUTCFullYear();
  const mo = moment.getUTCMonth();
  const key = `${y}-${mo}`;
  let months = MONTH_CACHE.get(key);
  if (!months) {
    months = buildLunarMonths(new Date(Date.UTC(y, mo - 2, 1)), new Date(Date.UTC(y, mo + 3, 1)), false);
    MONTH_CACHE.set(key, months);
  }
  const m = months.find((x) => moment >= x.start && moment < x.end);
  if (!m) return null;
  return {
    amanta: masaLabel(m),
    purnimanta: purnimantaLabel(m, paksha === 'Krishna' ? 'Krishna' : 'Shukla'),
    adhika: !!m.adhika,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NON-TITHI SOURCES: eclipses, seasons, crescent visibility
// ─────────────────────────────────────────────────────────────────────────────

const SOLAR_KIND = {
  total: { en: 'Total Solar Eclipse', hi: 'पूर्ण सूर्य ग्रहण' },
  annular: { en: 'Annular Solar Eclipse', hi: 'वलयाकार सूर्य ग्रहण' },
  partial: { en: 'Partial Solar Eclipse', hi: 'आंशिक सूर्य ग्रहण' },
  hybrid: { en: 'Hybrid Solar Eclipse', hi: 'संकर सूर्य ग्रहण' },
};
const LUNAR_KIND = {
  total: { en: 'Total Lunar Eclipse', hi: 'पूर्ण चंद्र ग्रहण' },
  partial: { en: 'Partial Lunar Eclipse', hi: 'आंशिक चंद्र ग्रहण' },
  penumbral: { en: 'Penumbral Lunar Eclipse', hi: 'उपच्छाया चंद्र ग्रहण' },
};

/**
 * Eclipses are computed, not listed. A solar eclipse can only happen at Amavasya and a
 * lunar one only at Purnima, so these fall straight out of the same syzygy geometry the
 * tithis come from — astronomy-engine just solves it exactly.
 * Drik shows every eclipse in the panchang whether or not it is visible locally, so the
 * GLOBAL peak decides the civil day.
 */
function eclipsesIn(year, tzMin) {
  const out = [];
  const from = new Date(Date.UTC(year, 0, 1));
  const until = new Date(Date.UTC(year + 1, 0, 1));

  let s = Astronomy.SearchGlobalSolarEclipse(from);
  while (s && s.peak.date < until) {
    const k = SOLAR_KIND[s.kind] || SOLAR_KIND.partial;
    out.push({
      day: civilOf(s.peak.date, tzMin),
      key: 'surya-grahan',
      name: { en: 'Surya Grahan (Solar Eclipse)', hi: 'सूर्य ग्रहण' },
      type: 'grahan',
      importance: 'major',
      note: k,
    });
    s = Astronomy.NextGlobalSolarEclipse(s.peak);
  }

  let l = Astronomy.SearchLunarEclipse(from);
  while (l && l.peak.date < until) {
    const k = LUNAR_KIND[l.kind] || LUNAR_KIND.penumbral;
    out.push({
      day: civilOf(l.peak.date, tzMin),
      key: 'chandra-grahan',
      name: { en: 'Chandra Grahan (Lunar Eclipse)', hi: 'चंद्र ग्रहण' },
      type: 'grahan',
      importance: 'major',
      note: k,
    });
    l = Astronomy.NextLunarEclipse(l.peak);
  }
  return out;
}

// The two sampat (equinox) and two ayana (solstice) points of the tropical year.
const SEASON_MARKS = [
  { field: 'mar_equinox', key: 'vasant-sampat', en: 'Vasant Sampat (Vernal Equinox)', hi: 'वसंत संपात (वसंत विषुव)' },
  { field: 'jun_solstice', key: 'summer-solstice', en: 'Summer Solstice', hi: 'ग्रीष्म संक्रांति (दीर्घतम दिन)' },
  { field: 'sep_equinox', key: 'sharad-sampat', en: 'Sharad Sampat (Autumnal Equinox)', hi: 'शरद संपात (शरद विषुव)' },
  { field: 'dec_solstice', key: 'winter-solstice', en: 'Winter Solstice', hi: 'शीत संक्रांति (लघुतम दिन)' },
];

function seasonsIn(year, tzMin) {
  const s = Astronomy.Seasons(year);
  return SEASON_MARKS.map((mk) => ({
    day: civilOf(s[mk.field].date, tzMin),
    key: mk.key,
    name: { en: mk.en, hi: mk.hi },
    type: 'solar',
    importance: 'minor',
    note: { en: 'Sun reaches the turning point of the tropical year', hi: 'सूर्य सायन वर्ष के संधि-बिंदु पर' },
  }));
}

/**
 * Chandra Darshana is the FIRST sighting of the new crescent, and that is an observational
 * fact, not a tithi: the crescent is only visible if the Moon still hangs above the horizon
 * long enough after the Sun has gone. The classic lag-time criterion (moonset at least ~40–45
 * minutes after sunset) reproduces Drik exactly — including the years where the sighting
 * slips to the third evening after the new moon (10 Sep → 13 Sep 2026), which no tithi rule
 * can explain.
 */
const CRESCENT_LAG_MIN = 45;

function firstCrescentDay(newMoon, ctx) {
  const base = civilOf(newMoon, ctx.tzMin);
  for (let i = 0; i <= 5; i += 1) {
    const d = addDays(base, i);
    const c = dayCtx(d, ctx);
    if (!c.sunset || !c.moonset) continue;
    let lag = (c.moonset.getTime() - c.sunset.getTime()) / MS;
    if (lag < -600) lag += 1440; // moonset landed after local midnight
    if (c.moonset.getTime() > newMoon.getTime() && lag >= CRESCENT_LAG_MIN) return d;
  }
  return null;
}

/**
 * The civil day a Sankranti is OBSERVED on, which is not always the day the Sun actually
 * crosses: the crossing is an instant, but the observance belongs to its Punya Kaal, and the
 * two AYANA sankrantis have a ONE-SIDED punya kaal.
 *
 *   Makara (Uttarayana) — punya kaal runs AFTER the moment. A crossing after sunset therefore
 *     cannot be honoured until the next sunrise, so the day moves forward.
 *       14 Jan 2026 14:59 (daytime) → 14 Jan.   14 Jan 2027 21:14 (after sunset) → 15 Jan.
 *   Karka (Dakshinayana) — punya kaal runs BEFORE the moment. A crossing before sunrise must
 *     be honoured in the daylight that preceded it, so the day moves back.
 *       16 Jul 2026 23:30 (after sunset, punya kaal still fits that day) → 16 Jul.
 *       17 Jul 2027 05:52 (before sunrise)                              → 16 Jul.
 *
 * The other ten have a two-sided (vishuva) or apara punya kaal that always finds room on the
 * crossing day itself — verified against all 22 non-ayana sankranti rows of 2026 and 2027,
 * including night crossings like Tula 18 Oct 2027 02:12, which Drik keeps on the 18th.
 */
function sankrantiDay(sign, moment, ctx) {
  const d = civilOf(moment, ctx.tzMin);
  const c = dayCtx(d, ctx);
  if (!c.sunrise || !c.sunset) return d;
  if (sign === 9 && moment > c.sunset) return addDays(d, 1);
  if (sign === 3 && moment < c.sunrise) return addDays(d, -1);
  return d;
}

/**
 * Ishti (the Darsha / Paurnamasa sacrifice) is a FORENOON rite performed once the parva
 * tithi has run out, and Anvadhana is the fire-laying on the evening before it. So the Ishti
 * day is simply the first day whose forenoon lies entirely after the end of the Purnima /
 * Amavasya. That is why the Ishti after the 9 Nov 2026 Amavasya slips to the 10th — the
 * Amavasya only ends at 12:32, eleven minutes past that day's mid-day point.
 */
function ishtiDay(tithiEnd, ctx) {
  const base = civilOf(tithiEnd, ctx.tzMin);
  for (let i = -1; i <= 2; i += 1) {
    const d = addDays(base, i);
    const c = dayCtx(d, ctx);
    if (!c.sunrise || !c.sunset) continue;
    const midday = c.sunrise.getTime() + (c.sunset.getTime() - c.sunrise.getTime()) / 2;
    if (midday >= tithiEnd.getTime()) return d;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// INDEX BUILDER
// ─────────────────────────────────────────────────────────────────────────────

const INDEX_CACHE = new Map();

function buildIndex(year, lat, lng, tz) {
  const cacheKey = `${year}|${lat}|${lng}|${tz}`;
  const hit = INDEX_CACHE.get(cacheKey);
  if (hit) return hit;

  const tzMin = eph.parseTzMin(tz);
  const ctx = { lat: Number(lat), lng: Number(lng), tzMin, days: new Map() };
  // Widen past both year edges so lunar months straddling 1 Jan / 31 Dec are complete.
  const from = new Date(Date.UTC(year - 1, 10, 1));
  const to = new Date(Date.UTC(year + 1, 1, 20));
  const months = buildLunarMonths(from, to);
  const adhikaMasa = new Set(months.filter((m) => m.adhika).map((m) => m.masa));

  const byDate = new Map();
  const push = (dateObj, obs) => {
    if (!dateObj) return;
    const k = dmyOf(dateObj);
    const list = byDate.get(k) || [];
    if (!list.some((o) => o.key === obs.key)) list.push(obs);
    byDate.set(k, list);
  };

  for (const m of months) {
    // Resolve a tithi rule to its civil day and file it. Returns the day so callers can
    // hang follow-ups (Holi, Dahi Handi) off it.
    const emit = (rule, extra) => {
      const { start, end } = tithiSpan(m, rule.paksha, rule.tithi);
      // Observances kept ON the Ekadashi (Gita Jayanti, Gayatri Jayanti, the Gauri Vrat's
      // opening day) inherit the Ekadashi's vedha rule rather than a plain sunrise pick.
      let day;
      if (rule.ekadashi) day = ekadashiDay({ start, end }, tithiSpan(m, rule.paksha, 12), ctx);
      else if (rule.jayanti) day = janmashtamiDay(start, end, ctx);
      else if (rule.rakshaBandhan) day = rakshaBandhanDay(start, end, ctx);
      else if (rule.holika) day = holikaDahanDay(start, end, ctx);
      else day = resolveDay(start, end, rule.ref, rule.pick, ctx);
      if (!day) return null;
      if (rule.weekday != null && day.getDay() !== rule.weekday) return null;
      let name = (extra && extra.name) || rule.name;
      if (rule.weekdayNamed) {
        const w = WEEKDAY[day.getDay()];
        name = { en: `${w.en} ${name.en}`, hi: `${w.hi} ${name.hi}` };
      }
      push(day, {
        key: (extra && extra.key) || rule.key,
        name,
        type: rule.type || 'festival',
        importance: rule.importance || 'major',
        note: noteFor(m, rule.paksha, rule.tithi),
      });
      return day;
    };

    // Ekadashi ×2 — named by the purnimanta month; adhika months get Padmini/Parama.
    // Day and Gauna both come from the Dashami-vedha rule above.
    for (const paksha of ['Shukla', 'Krishna']) {
      const pIdx = (m.masa + (paksha === 'Krishna' ? 1 : 0)) % 12;
      const nm = m.adhika ? EKADASHI.Adhika[paksha] : EKADASHI[paksha][pIdx];
      const rule = { paksha, tithi: 11, ekadashi: true, type: 'vrat', importance: 'major' };
      const day = emit(rule, {
        key: `ekadashi-${nm.key}`,
        name: { en: `${nm.en} Ekadashi`, hi: `${nm.hi} एकादशी` },
      });
      const span = tithiSpan(m, paksha, 11);
      if (day && isDashamiViddha(day, span.start, span.end, ctx)) {
        push(addDays(day, 1), {
          key: `ekadashi-${nm.key}-gauna`,
          name: { en: `${nm.en} Ekadashi (Vaishnava)`, hi: `${nm.hi} एकादशी (वैष्णव)` },
          type: 'vrat',
          importance: 'minor',
          note: noteFor(m, paksha, 12),
        });
      }
    }

    // Purnima / Amavasya — both named for the AMANTA month they close.
    emit(
      { paksha: 'Shukla', tithi: 15, ref: 'sunrise', type: 'tithi', importance: 'major' },
      { key: `purnima-${masaSlug(m)}`, name: { en: `${masaLabel(m).en} Purnima`, hi: `${masaLabel(m).hi} पूर्णिमा` } },
    );
    emit(
      { paksha: 'Krishna', tithi: 15, ref: 'sunrise', type: 'tithi', importance: 'major' },
      { key: `amavasya-${masaSlug(m)}`, name: { en: `${masaLabel(m).en} Amavasya`, hi: `${masaLabel(m).hi} अमावस्या` } },
    );

    for (const rule of RECURRING) emit(rule);

    // An adhika month is bracketed for the user: it opens on its Shukla Pratipada and
    // closes on its Amavasya, both plain sunrise-vyapini days.
    if (m.adhika) {
      const s = tithiSpan(m, 'Shukla', 1);
      const e = tithiSpan(m, 'Krishna', 15);
      push(resolveDay(s.start, s.end, 'sunrise', 'first', ctx), {
        key: 'adhika-masa-start',
        name: { en: `${masaLabel(m).en} begins`, hi: `${masaLabel(m).hi} मास आरंभ` },
        type: 'tithi',
        importance: 'minor',
        note: { en: 'A lunar month with no Sankranti — the leap month', hi: 'बिना संक्रांति का चंद्रमास — अधिक मास' },
      });
      push(resolveDay(e.start, e.end, 'sunrise', 'first', ctx), {
        key: 'adhika-masa-end',
        name: { en: `${masaLabel(m).en} ends`, hi: `${masaLabel(m).hi} मास समाप्त` },
        type: 'tithi',
        importance: 'minor',
        note: { en: 'A lunar month with no Sankranti — the leap month', hi: 'बिना संक्रांति का चंद्रमास — अधिक मास' },
      });
    }

    // Anvadhan / Ishti — one pair for each parva tithi of the month.
    for (const paksha of ['Shukla', 'Krishna']) {
      const span = tithiSpan(m, paksha, 15);
      const ishti = ishtiDay(span.end, ctx);
      if (!ishti) continue;
      push(addDays(ishti, -1), {
        key: 'anvadhan',
        name: { en: 'Anvadhan', hi: 'अन्वाधान' },
        type: 'tithi',
        importance: 'minor',
        note: noteFor(m, paksha, 15),
      });
      push(ishti, {
        key: 'ishti',
        name: { en: 'Ishti', hi: 'इष्टि' },
        type: 'tithi',
        importance: 'minor',
        note: noteFor(m, paksha, 15),
      });
    }

    // Chandra Darshana — the first evening the young crescent clears the Sun by enough.
    push(firstCrescentDay(m.start, ctx), {
      key: 'chandra-darshana',
      name: { en: 'Chandra Darshana', hi: 'चन्द्र दर्शन' },
      type: 'festival',
      importance: 'minor',
      note: noteFor(m, 'Shukla', 1),
    });

    // Shravana's weekday vrats: every Monday of the month is a Shravana Somvar and every
    // Tuesday a Mangala Gauri, counted from the month's own Pratipada to its Amavasya.
    if (m.masa === 4 && !m.adhika) {
      const s = tithiSpan(m, 'Shukla', 1);
      const e = tithiSpan(m, 'Krishna', 15);
      const first = resolveDay(s.start, s.end, 'sunrise', 'first', ctx);
      const last = resolveDay(e.start, e.end, 'sunrise', 'first', ctx);
      const purnima = resolveDay(tithiSpan(m, 'Shukla', 15).start, tithiSpan(m, 'Shukla', 15).end, 'sunrise', 'first', ctx);
      if (first && last) {
        const somvar = [];
        const mangal = [];
        for (let d = first; d <= last; d = addDays(d, 1)) {
          if (d.getDay() === 1) somvar.push(new Date(d));
          if (d.getDay() === 2) mangal.push(new Date(d));
        }
        somvar.forEach((d, i) => push(d, {
          key: `shravana-somvar-${i + 1}`,
          name: { en: `Shravana Somvar Vrat ${i + 1}`, hi: `श्रावण सोमवार व्रत ${i + 1}` },
          type: 'vrat',
          importance: 'minor',
          note: { en: `Monday ${i + 1} of Shravana`, hi: `श्रावण का ${i + 1} सोमवार` },
        }));
        mangal.forEach((d, i) => push(d, {
          key: `mangala-gauri-${i + 1}`,
          name: { en: `Mangala Gauri Vrat ${i + 1}`, hi: `मंगला गौरी व्रत ${i + 1}` },
          type: 'vrat',
          importance: 'minor',
          note: { en: `Tuesday ${i + 1} of Shravana`, hi: `श्रावण का ${i + 1} मंगलवार` },
        }));
      }
      // Varalakshmi is kept on the last Friday that falls on or before Shravana Purnima.
      if (purnima) {
        let f = purnima;
        while (f.getDay() !== 5) f = addDays(f, -1);
        push(f, {
          key: 'varalakshmi-vrat',
          name: { en: 'Varalakshmi Vrat', hi: 'वरलक्ष्मी व्रत' },
          type: 'vrat',
          importance: 'minor',
          note: { en: 'Friday before Shravana Purnima', hi: 'श्रावण पूर्णिमा से पूर्व शुक्रवार' },
        });
      }
    }

    /**
     * Saraswati Avahan / Puja are nakshatra days, not tithi days: the goddess is invoked on
     * Moola and worshipped on Purva Ashadha during Shardiya Navratri. Both are evening rites,
     * so it is the nakshatra the Moon holds at SUNSET that names the day — in 2026 Moola only
     * begins at 06:48 on 16 Oct, eleven minutes after sunrise, and Drik still gives the 16th
     * the Avahan.
     */
    if (m.masa === 6 && !m.adhika) {
      const s = tithiSpan(m, 'Shukla', 1);
      const e = tithiSpan(m, 'Shukla', 15);
      const first = resolveDay(s.start, s.end, 'sunrise', 'first', ctx);
      const last = resolveDay(e.start, e.end, 'sunrise', 'first', ctx);
      const nakDay = (target) => {
        for (let d = first; d && last && d <= last; d = addDays(d, 1)) {
          const c = dayCtx(d, ctx);
          if (c.sunset && nakshatraAt(c.sunset) === target) return new Date(d);
        }
        return null;
      };
      push(nakDay('Mula'), {
        key: 'saraswati-avahan',
        name: { en: 'Saraswati Avahan', hi: 'सरस्वती आवाहन' },
        type: 'festival',
        importance: 'minor',
        note: { en: 'Moola nakshatra during Shardiya Navratri', hi: 'शारदीय नवरात्रि में मूल नक्षत्र' },
      });
      push(nakDay('Purva Ashadha'), {
        key: 'saraswati-puja',
        name: { en: 'Saraswati Puja', hi: 'सरस्वती पूजा' },
        type: 'festival',
        importance: 'minor',
        note: { en: 'Purva Ashadha nakshatra during Shardiya Navratri', hi: 'शारदीय नवरात्रि में पूर्वाषाढ़ा नक्षत्र' },
      });
    }

    for (const rule of ANNUAL) {
      if (rule.masa !== m.masa) continue;
      // Annual festivals belong to the nija (regular) month; only a rule that explicitly
      // prefers the adhika month (Ganga Dussehra) stays in the leap month.
      if (rule.adhikaPrefer) {
        if (!m.adhika && adhikaMasa.has(rule.masa)) continue;
      } else if (m.adhika) continue;

      const day = emit(rule);
      if (rule.follow && day) {
        push(addDays(day, rule.follow.offset), {
          key: rule.follow.key,
          name: rule.follow.name,
          type: rule.follow.type || 'festival',
          importance: rule.follow.importance || 'major',
          note: noteFor(m, rule.follow.paksha, rule.follow.tithi),
        });
      }
    }
  }

  // Sankrantis — the Sun's own calendar, independent of the lunar month.
  const sankrantis = sankrantisBetween(new Date(Date.UTC(year - 1, 11, 1)), new Date(Date.UTC(year + 1, 0, 31)));
  for (const s of sankrantis) {
    const day = sankrantiDay(s.sign, s.moment, ctx);
    const r = RASHI[s.sign];
    push(day, {
      key: `sankranti-${slug(r.en)}`,
      name: { en: `${r.en} Sankranti`, hi: `${r.hi} संक्रांति` },
      type: 'sankranti',
      importance: s.sign === 9 ? 'major' : 'minor',
      note: { en: `Sun enters ${r.en}`, hi: `सूर्य का ${r.hi} राशि में प्रवेश` },
    });
    if (s.sign === 9) { // Sun into Makara — Uttarayana
      push(day, {
        key: 'makar-sankranti',
        name: { en: 'Makar Sankranti', hi: 'मकर संक्रांति' },
        type: 'festival',
        importance: 'major',
        note: { en: 'Sun enters Makara — Uttarayana begins', hi: 'सूर्य का मकर राशि में प्रवेश — उत्तरायण आरंभ' },
      });
      push(day, {
        key: 'pongal',
        name: { en: 'Thai Pongal', hi: 'थाई पोंगल' },
        type: 'festival',
        importance: 'major',
        note: { en: 'First day of Thai — Sun enters Makara', hi: 'थाई मास का प्रथम दिन — सूर्य मकर में' },
      });
    }
    if (s.sign === 0) { // Sun into Mesha — the solar new year of the north
      push(day, {
        key: 'baisakhi',
        name: { en: 'Baisakhi', hi: 'बैसाखी' },
        type: 'festival',
        importance: 'major',
        note: { en: 'Sun enters Mesha — solar new year', hi: 'सूर्य का मेष राशि में प्रवेश — सौर नववर्ष' },
      });
    }
    if (s.sign === 5) { // Sun into Kanya — Vishwakarma's day is solar, not lunar
      push(day, {
        key: 'vishwakarma-puja',
        name: { en: 'Vishwakarma Puja', hi: 'विश्वकर्मा पूजा' },
        type: 'festival',
        importance: 'minor',
        note: { en: 'Kanya Sankranti — Sun enters Kanya', hi: 'कन्या संक्रांति — सूर्य का कन्या में प्रवेश' },
      });
    }
  }

  /**
   * Onam is the Thiruvonam (Shravana) nakshatra of the Malayalam month Chingam, i.e. the
   * Shravana nakshatra the Moon holds at sunrise while the Sun is in Simha — so it is fixed
   * jointly by the Sun's sign and the Moon's nakshatra, and needs no tithi at all.
   */
  for (let i = 0; i < sankrantis.length - 1; i += 1) {
    if (sankrantis[i].sign !== 4) continue; // Simha Sankranti opens Chingam
    const a = civilOf(sankrantis[i].moment, tzMin);
    const b = civilOf(sankrantis[i + 1].moment, tzMin);
    const span = nakshatraSpanIn(21, eph.localMidnightUTC(a, tzMin), eph.localMidnightUTC(b, tzMin)); // 21 = Shravana
    if (span) {
      push(resolveDay(span.start, span.end, 'sunrise', 'first', ctx), {
        key: 'onam',
        name: { en: 'Thiru Onam', hi: 'ओणम' },
        type: 'festival',
        importance: 'major',
        note: { en: 'Shravana nakshatra with the Sun in Simha', hi: 'सूर्य सिंह राशि में, श्रवण नक्षत्र' },
      });
    }
  }

  for (const e of eclipsesIn(year, tzMin)) push(e.day, e);
  for (const s of seasonsIn(year, tzMin)) push(s.day, s);

  INDEX_CACHE.set(cacheKey, byDate);
  return byDate;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

const IMPORTANCE_RANK = { major: 0, minor: 1 };
const sortObs = (list) => list.slice().sort((a, b) => (IMPORTANCE_RANK[a.importance] ?? 2) - (IMPORTANCE_RANK[b.importance] ?? 2));

function observancesForDate({ dateObj, lat, lng, tz = '+05:30' }) {
  const idx = buildIndex(dateObj.getFullYear(), lat, lng, tz);
  return sortObs(idx.get(dmyOf(dateObj)) || []);
}

function observancesInRange({ start, days, lat, lng, tz = '+05:30' }) {
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const d = addDays(start, i);
    const obs = observancesForDate({ dateObj: d, lat, lng, tz });
    if (obs.length) out.push({ date: dmyOf(d), dateObj: d, observances: obs });
  }
  return out;
}

// Next occurrence of an observance key on/after `start` (scans up to `years` ahead).
function nextOccurrence({ key, start, lat, lng, tz = '+05:30', years = 2 }) {
  for (let y = start.getFullYear(); y <= start.getFullYear() + years; y += 1) {
    const idx = buildIndex(y, lat, lng, tz);
    const hits = [];
    for (const [dmy, list] of idx) {
      const obs = list.find((o) => o.key === key);
      if (!obs) continue;
      const [dd, mm, yy] = dmy.split('/').map(Number);
      const d = new Date(yy, mm - 1, dd);
      if (d >= start) hits.push({ dateObj: d, dmy, obs });
    }
    hits.sort((a, b) => a.dateObj - b.dateObj);
    if (hits.length) return hits[0];
  }
  return null;
}

// Searchable catalog — every key the engine can produce, with aliases.
function observanceCatalog() {
  const out = [];
  const add = (key, name, aliases, type, importance) => {
    if (out.some((o) => o.key === key)) return;
    out.push({ key, name, aliases: aliases || [], type: type || 'festival', importance: importance || 'major' });
  };
  for (const r of ANNUAL) {
    add(r.key, r.name, r.aliases, r.type, r.importance);
    if (r.follow) add(r.follow.key, r.follow.name, r.follow.aliases, r.follow.type || 'festival', r.follow.importance || 'major');
  }
  for (const r of RECURRING) add(r.key, r.name, r.aliases, r.type, r.importance);
  for (const paksha of ['Shukla', 'Krishna']) {
    for (const nm of EKADASHI[paksha].concat([EKADASHI.Adhika[paksha]])) {
      add(`ekadashi-${nm.key}`, { en: `${nm.en} Ekadashi`, hi: `${nm.hi} एकादशी` }, [`${nm.en} ekadashi`, 'ekadashi', 'एकादशी'], 'vrat', 'major');
      add(`ekadashi-${nm.key}-gauna`, { en: `${nm.en} Ekadashi (Vaishnava)`, hi: `${nm.hi} एकादशी (वैष्णव)` }, [`${nm.en} gauna ekadashi`, 'gauna ekadashi', 'vaishnava ekadashi'], 'vrat', 'minor');
    }
  }
  for (const m of MASA) {
    add(`purnima-${slug(m.en)}`, { en: `${m.en} Purnima`, hi: `${m.hi} पूर्णिमा` }, [`${m.en} purnima`, 'purnima', 'पूर्णिमा'], 'tithi', 'major');
    add(`amavasya-${slug(m.en)}`, { en: `${m.en} Amavasya`, hi: `${m.hi} अमावस्या` }, [`${m.en} amavasya`, 'amavasya', 'अमावस्या'], 'tithi', 'major');
  }
  for (const r of RASHI) {
    add(`sankranti-${slug(r.en)}`, { en: `${r.en} Sankranti`, hi: `${r.hi} संक्रांति` }, [`${r.en} sankranti`, 'sankranti', 'संक्रांति'], 'sankranti', 'minor');
  }
  for (let i = 1; i <= 5; i += 1) {
    add(`shravana-somvar-${i}`, { en: `Shravana Somvar Vrat ${i}`, hi: `श्रावण सोमवार व्रत ${i}` }, ['shravana somvar', 'sawan somvar', 'श्रावण सोमवार'], 'vrat', 'minor');
    add(`mangala-gauri-${i}`, { en: `Mangala Gauri Vrat ${i}`, hi: `मंगला गौरी व्रत ${i}` }, ['mangala gauri', 'मंगला गौरी'], 'vrat', 'minor');
  }
  add('makar-sankranti', { en: 'Makar Sankranti', hi: 'मकर संक्रांति' }, ['makar sankranti', 'uttarayan', 'maghi', 'मकर संक्रांति'], 'festival', 'major');
  add('pongal', { en: 'Thai Pongal', hi: 'थाई पोंगल' }, ['pongal', 'thai pongal', 'पोंगल'], 'festival', 'major');
  add('baisakhi', { en: 'Baisakhi', hi: 'बैसाखी' }, ['baisakhi', 'vaisakhi', 'बैसाखी'], 'festival', 'major');
  add('vishwakarma-puja', { en: 'Vishwakarma Puja', hi: 'विश्वकर्मा पूजा' }, ['vishwakarma puja', 'विश्वकर्मा पूजा'], 'festival', 'minor');
  add('onam', { en: 'Thiru Onam', hi: 'ओणम' }, ['onam', 'thiruvonam', 'ओणम'], 'festival', 'major');
  add('saraswati-avahan', { en: 'Saraswati Avahan', hi: 'सरस्वती आवाहन' }, ['saraswati avahan', 'सरस्वती आवाहन'], 'festival', 'minor');
  add('saraswati-puja', { en: 'Saraswati Puja', hi: 'सरस्वती पूजा' }, ['saraswati puja', 'सरस्वती पूजा'], 'festival', 'minor');
  add('varalakshmi-vrat', { en: 'Varalakshmi Vrat', hi: 'वरलक्ष्मी व्रत' }, ['varalakshmi vrat', 'वरलक्ष्मी व्रत'], 'vrat', 'minor');
  add('chandra-darshana', { en: 'Chandra Darshana', hi: 'चन्द्र दर्शन' }, ['chandra darshana', 'चन्द्र दर्शन'], 'festival', 'minor');
  add('anvadhan', { en: 'Anvadhan', hi: 'अन्वाधान' }, ['anvadhan', 'अन्वाधान'], 'tithi', 'minor');
  add('ishti', { en: 'Ishti', hi: 'इष्टि' }, ['ishti', 'इष्टि'], 'tithi', 'minor');
  add('adhika-masa-start', { en: 'Adhika Masa begins', hi: 'अधिक मास आरंभ' }, ['adhika masa', 'malmas', 'purushottam maas', 'अधिक मास'], 'tithi', 'minor');
  add('adhika-masa-end', { en: 'Adhika Masa ends', hi: 'अधिक मास समाप्त' }, ['adhika masa end', 'अधिक मास समाप्त'], 'tithi', 'minor');
  add('surya-grahan', { en: 'Surya Grahan (Solar Eclipse)', hi: 'सूर्य ग्रहण' }, ['surya grahan', 'solar eclipse', 'सूर्य ग्रहण'], 'grahan', 'major');
  add('chandra-grahan', { en: 'Chandra Grahan (Lunar Eclipse)', hi: 'चंद्र ग्रहण' }, ['chandra grahan', 'lunar eclipse', 'चंद्र ग्रहण'], 'grahan', 'major');
  for (const mk of SEASON_MARKS) add(mk.key, { en: mk.en, hi: mk.hi }, [mk.key.replace(/-/g, ' ')], 'solar', 'minor');
  return out;
}

const compact = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9ऀ-ॿ]/g, '');

function searchObservanceCatalog(query) {
  const cq = compact(query);
  const catalog = observanceCatalog();
  if (!cq) return catalog;
  const hit = (a) => { const ca = compact(a); return !!ca && (ca.includes(cq) || cq.includes(ca)); };
  return catalog.filter((o) => hit(o.key) || hit(o.name.en) || hit(o.name.hi) || (o.aliases || []).some(hit));
}

module.exports = {
  observancesForDate,
  observancesInRange,
  masaFor,
  nextOccurrence,
  searchObservanceCatalog,
  buildIndex,
};
