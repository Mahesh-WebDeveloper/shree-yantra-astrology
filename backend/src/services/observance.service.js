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
 */

const Astronomy = require('astronomy-engine');
const eph = require('../utils/localEphemeris');

const MS = 60000;
const DAY_MS = 86400000;

const MASA = [
  { en: 'Chaitra', hi: 'चैत्र' }, { en: 'Vaishakha', hi: 'वैशाख' }, { en: 'Jyeshtha', hi: 'ज्येष्ठ' }, { en: 'Ashadha', hi: 'आषाढ़' },
  { en: 'Shravana', hi: 'श्रावण' }, { en: 'Bhadrapada', hi: 'भाद्रपद' }, { en: 'Ashwina', hi: 'आश्विन' }, { en: 'Kartika', hi: 'कार्तिक' },
  { en: 'Margashirsha', hi: 'मार्गशीर्ष' }, { en: 'Pausha', hi: 'पौष' }, { en: 'Magha', hi: 'माघ' }, { en: 'Phalguna', hi: 'फाल्गुन' },
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
// uses): Pausha-Krishna-Ekadashi in amanta terms is "Shattila" = Magha Krishna.
const EKADASHI = {
  Shukla: [
    { en: 'Kamada', hi: 'कामदा' }, { en: 'Mohini', hi: 'मोहिनी' }, { en: 'Nirjala', hi: 'निर्जला' }, { en: 'Devshayani', hi: 'देवशयनी' },
    { en: 'Shravana Putrada', hi: 'श्रावण पुत्रदा' }, { en: 'Parivartini', hi: 'परिवर्तिनी' }, { en: 'Papankusha', hi: 'पापांकुशा' }, { en: 'Devutthana', hi: 'देवउठनी' },
    { en: 'Mokshada', hi: 'मोक्षदा' }, { en: 'Pausha Putrada', hi: 'पौष पुत्रदा' }, { en: 'Jaya', hi: 'जया' }, { en: 'Amalaki', hi: 'आमलकी' },
  ],
  Krishna: [
    { en: 'Papamochani', hi: 'पापमोचिनी' }, { en: 'Varuthini', hi: 'वरूथिनी' }, { en: 'Apara', hi: 'अपरा' }, { en: 'Yogini', hi: 'योगिनी' },
    { en: 'Kamika', hi: 'कामिका' }, { en: 'Aja', hi: 'अजा' }, { en: 'Indira', hi: 'इंदिरा' }, { en: 'Rama', hi: 'रमा' },
    { en: 'Utpanna', hi: 'उत्पन्ना' }, { en: 'Saphala', hi: 'सफला' }, { en: 'Shattila', hi: 'षटतिला' }, { en: 'Vijaya', hi: 'विजया' },
  ],
  // An adhika (leap) month has no sankranti, so it gets its own pair of Ekadashis.
  Adhika: { Shukla: { en: 'Padmini', hi: 'पद्मिनी' }, Krishna: { en: 'Parama', hi: 'परमा' } },
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
  const next = addDays(dateObj, 1);
  const nextMid = eph.localMidnightUTC(next, tzMin);
  const nsrM = eph.riseSetMinutes('Sun', next, lat, lng, tzMin, +1);
  const out = {
    key,
    dateObj,
    sunrise: srM == null ? null : at(srM),
    sunset: ssM == null ? null : at(ssM),
    moonrise: mrM == null ? null : at(mrM),
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
const DEFAULT_PICK = { madhyahna: 'max', aparahna: 'max', sayankala: 'max', purvahna: 'max' };

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
      if (ov > 0) scored.push({ d, score: ov });
    }
  }
  if (scored.length) {
    if (pick === 'last') return scored[scored.length - 1].d;
    if (pick === 'max') return scored.reduce((best, x) => (x.score > best.score ? x : best)).d;
    return scored[0].d;
  }

  let best = null;
  let bestOv = -Infinity;
  for (const d of days) {
    const c = dayCtx(d, ctx);
    if (!c.sunrise || !c.nextSunrise) continue;
    const ov = Math.min(e, c.nextSunrise.getTime()) - Math.max(s, c.sunrise.getTime());
    if (ov > bestOv) { bestOv = ov; best = d; }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE CATALOG — masa is the AMANTA index (0=Chaitra … 11=Phalguna),
// tithi is 1..15 within the paksha (15 = Purnima in Shukla, Amavasya in Krishna).
// ─────────────────────────────────────────────────────────────────────────────

const F = (key, en, hi, masa, paksha, tithi, ref, extra) => ({
  key, name: { en, hi }, masa, paksha, tithi, ref: ref || 'sunrise', type: 'festival', importance: 'major', ...(extra || {}),
});

const ANNUAL = [
  // ── Pausha / Magha ──
  F('sakat-chauth', 'Sakat Chauth', 'सकट चौथ', 9, 'Krishna', 4, 'moonrise', { type: 'vrat', aliases: ['sakat chauth', 'tilkuta chauth', 'सकट चौथ'] }),
  F('mauni-amavasya', 'Mauni Amavasya', 'मौनी अमावस्या', 9, 'Krishna', 15, 'sunrise', { aliases: ['mauni amavasya', 'magha amavasya', 'मौनी अमावस्या'] }),
  F('vasant-panchami', 'Vasant Panchami', 'वसंत पंचमी', 10, 'Shukla', 5, 'purvahna', { aliases: ['vasant panchami', 'basant panchami', 'saraswati puja', 'वसंत पंचमी'] }),
  F('ratha-saptami', 'Ratha Saptami', 'रथ सप्तमी', 10, 'Shukla', 7, 'sunrise', { aliases: ['ratha saptami', 'rath saptami', 'surya jayanti', 'रथ सप्तमी'] }),
  F('bhishma-ashtami', 'Bhishma Ashtami', 'भीष्म अष्टमी', 10, 'Shukla', 8, 'madhyahna', { importance: 'minor', aliases: ['bhishma ashtami', 'भीष्म अष्टमी'] }),
  F('maha-shivaratri', 'Maha Shivaratri', 'महाशिवरात्रि', 10, 'Krishna', 14, 'nishita', { type: 'vrat', aliases: ['maha shivratri', 'mahashivratri', 'shivaratri', 'महाशिवरात्रि'] }),

  // ── Phalguna ──
  // Rangwali Holi is not an independent tithi rule: it is by definition the day AFTER the
  // bonfire, so it is derived from Holika Dahan rather than from Krishna Pratipada (which
  // in 2026 only reaches sunrise on 4 March, a day late).
  F('holika-dahan', 'Holika Dahan', 'होलिका दहन', 11, 'Shukla', 15, 'pradosh', {
    aliases: ['holika dahan', 'holika', 'होलिका दहन'],
    follow: {
      key: 'holi', name: { en: 'Holi (Dhulandi)', hi: 'होली (धुलंडी)' }, offset: 1, paksha: 'Krishna', tithi: 1,
      aliases: ['holi', 'dhulandi', 'rangwali holi', 'होली'],
    },
  }),
  F('shitala-ashtami', 'Shitala Ashtami', 'शीतला अष्टमी', 11, 'Krishna', 8, 'sunrise', { importance: 'minor', aliases: ['shitala ashtami', 'basoda', 'शीतला अष्टमी'] }),

  // ── Chaitra ──
  F('ugadi', 'Ugadi', 'उगादी', 0, 'Shukla', 1, 'sunrise', { aliases: ['ugadi', 'yugadi', 'उगादी'] }),
  F('gudi-padwa', 'Gudi Padwa', 'गुड़ी पड़वा', 0, 'Shukla', 1, 'sunrise', { aliases: ['gudi padwa', 'gudhi padwa', 'गुड़ी पड़वा'] }),
  F('chaitra-navratri', 'Chaitra Navratri begins', 'चैत्र नवरात्रि आरंभ', 0, 'Shukla', 1, 'sunrise', { aliases: ['chaitra navratri', 'vasant navratri', 'चैत्र नवरात्रि'] }),
  F('gangaur', 'Gangaur', 'गणगौर', 0, 'Shukla', 3, 'sunrise', { type: 'vrat', aliases: ['gangaur', 'gauri tritiya', 'गणगौर'] }),
  F('ram-navami', 'Ram Navami', 'राम नवमी', 0, 'Shukla', 9, 'madhyahna', { aliases: ['ram navami', 'rama navami', 'राम नवमी'] }),
  F('hanuman-jayanti', 'Hanuman Jayanti', 'हनुमान जयंती', 0, 'Shukla', 15, 'sunrise', { aliases: ['hanuman jayanti', 'hanuman janmotsav', 'हनुमान जयंती'] }),

  // ── Vaishakha ──
  F('akshaya-tritiya', 'Akshaya Tritiya', 'अक्षय तृतीया', 1, 'Shukla', 3, 'madhyahna', { aliases: ['akshaya tritiya', 'akha teej', 'अक्षय तृतीया'] }),
  F('parashurama-jayanti', 'Parashurama Jayanti', 'परशुराम जयंती', 1, 'Shukla', 3, 'pradosh', { importance: 'minor', aliases: ['parashurama jayanti', 'parshuram jayanti', 'परशुराम जयंती'] }),
  F('sita-navami', 'Sita Navami', 'सीता नवमी', 1, 'Shukla', 9, 'madhyahna', { importance: 'minor', aliases: ['sita navami', 'janaki navami', 'सीता नवमी'] }),
  F('narasimha-jayanti', 'Narasimha Jayanti', 'नृसिंह जयंती', 1, 'Shukla', 14, 'sayankala', { aliases: ['narasimha jayanti', 'nrisimha jayanti', 'नृसिंह जयंती'] }),
  F('buddha-purnima', 'Buddha Purnima', 'बुद्ध पूर्णिमा', 1, 'Shukla', 15, 'sunrise', { aliases: ['buddha purnima', 'vesak', 'बुद्ध पूर्णिमा'] }),
  F('vat-savitri', 'Vat Savitri Vrat', 'वट सावित्री व्रत', 1, 'Krishna', 15, 'sunrise', { type: 'vrat', aliases: ['vat savitri', 'vat amavasya', 'वट सावित्री'] }),
  F('shani-jayanti', 'Shani Jayanti', 'शनि जयंती', 1, 'Krishna', 15, 'sunrise', { aliases: ['shani jayanti', 'शनि जयंती'] }),

  // ── Jyeshtha ──
  // Ganga Dussehra marks the Ganga's descent on Jyeshtha Shukla Dashami and is kept in the
  // FIRST Jyeshtha of the year — so in an Adhika-Jyeshtha year (2026) it stays in the
  // adhika month rather than sliding to the nija one, which is how Drik lists it too.
  F('ganga-dussehra', 'Ganga Dussehra', 'गंगा दशहरा', 2, 'Shukla', 10, 'sunrise', { adhikaPrefer: true, aliases: ['ganga dussehra', 'ganga dashami', 'गंगा दशहरा'] }),
  F('vat-purnima', 'Vat Purnima Vrat', 'वट पूर्णिमा व्रत', 2, 'Shukla', 15, 'sunrise', { type: 'vrat', importance: 'minor', aliases: ['vat purnima', 'वट पूर्णिमा'] }),

  // ── Ashadha ──
  F('jagannath-rathyatra', 'Jagannath Rath Yatra', 'जगन्नाथ रथ यात्रा', 3, 'Shukla', 2, 'sunrise', { aliases: ['rath yatra', 'jagannath rathyatra', 'रथ यात्रा'] }),
  F('guru-purnima', 'Guru Purnima', 'गुरु पूर्णिमा', 3, 'Shukla', 15, 'sunrise', { aliases: ['guru purnima', 'vyasa purnima', 'गुरु पूर्णिमा'] }),

  // ── Shravana ──
  F('hariyali-teej', 'Hariyali Teej', 'हरियाली तीज', 4, 'Shukla', 3, 'sunrise', { type: 'vrat', aliases: ['hariyali teej', 'shravana teej', 'हरियाली तीज'] }),
  F('nag-panchami', 'Nag Panchami', 'नाग पंचमी', 4, 'Shukla', 5, 'sunrise', { importance: 'minor', aliases: ['nag panchami', 'naag panchami', 'नाग पंचमी'] }),
  // Rakhi is always tied on Shravana Purnima itself; Aparahna is only the preferred muhurat
  // WITHIN that day (and when Purnima ends before Aparahna, as in 2026, the muhurat simply
  // moves to the morning) — so the day is fixed by the tithi at sunrise, not by Aparahna.
  F('raksha-bandhan', 'Raksha Bandhan', 'रक्षाबंधन', 4, 'Shukla', 15, 'sunrise', { aliases: ['raksha bandhan', 'rakhi', 'rakshabandhan', 'रक्षाबंधन'] }),
  F('janmashtami', 'Krishna Janmashtami', 'कृष्ण जन्माष्टमी', 4, 'Krishna', 8, 'nishita', { type: 'vrat', aliases: ['janmashtami', 'krishna janmashtami', 'gokulashtami', 'जन्माष्टमी'] }),

  // ── Bhadrapada ──
  F('hartalika-teej', 'Hartalika Teej', 'हरतालिका तीज', 5, 'Shukla', 3, 'sunrise', { type: 'vrat', aliases: ['hartalika teej', 'hartalika', 'हरतालिका तीज'] }),
  F('ganesh-chaturthi', 'Ganesh Chaturthi', 'गणेश चतुर्थी', 5, 'Shukla', 4, 'madhyahna', { aliases: ['ganesh chaturthi', 'ganpati', 'vinayaka chavithi', 'गणेश चतुर्थी'] }),
  F('rishi-panchami', 'Rishi Panchami', 'ऋषि पंचमी', 5, 'Shukla', 5, 'madhyahna', { type: 'vrat', importance: 'minor', aliases: ['rishi panchami', 'ऋषि पंचमी'] }),
  F('radha-ashtami', 'Radha Ashtami', 'राधा अष्टमी', 5, 'Shukla', 8, 'madhyahna', { importance: 'minor', aliases: ['radha ashtami', 'राधा अष्टमी'] }),
  F('anant-chaturdashi', 'Anant Chaturdashi', 'अनंत चतुर्दशी', 5, 'Shukla', 14, 'sunrise', { aliases: ['anant chaturdashi', 'ananta chaturdashi', 'अनंत चतुर्दशी'] }),
  F('ganesh-visarjan', 'Ganesh Visarjan', 'गणेश विसर्जन', 5, 'Shukla', 14, 'sunrise', { aliases: ['ganesh visarjan', 'गणेश विसर्जन'] }),
  F('pitrupaksha', 'Pitru Paksha begins', 'पितृ पक्ष आरंभ', 5, 'Krishna', 1, 'sunrise', { type: 'tithi', aliases: ['pitrupaksha', 'pitru paksha', 'shraddha', 'पितृ पक्ष'] }),
  F('sarvapitri-amavasya', 'Sarva Pitru Amavasya', 'सर्वपितृ अमावस्या', 5, 'Krishna', 15, 'sunrise', { aliases: ['sarvapitri amavasya', 'mahalaya amavasya', 'सर्वपितृ अमावस्या'] }),

  // ── Ashwina ──
  F('navratri', 'Shardiya Navratri begins', 'शारदीय नवरात्रि आरंभ', 6, 'Shukla', 1, 'sunrise', { aliases: ['navratri', 'sharadiya navratri', 'ghatasthapana', 'नवरात्रि'] }),
  F('durga-ashtami', 'Durga Ashtami', 'दुर्गा अष्टमी', 6, 'Shukla', 8, 'sunrise', { aliases: ['durga ashtami', 'maha ashtami', 'दुर्गा अष्टमी'] }),
  // Navami puja + bali are prescribed in Aparahna, so Maha Navami lands on the day Navami is
  // running that afternoon — in 2026 that is the same day as Durga Ashtami (Navami only
  // reaches sunrise on the 20th, by which time Dashami has already begun).
  F('maha-navami', 'Maha Navami', 'महा नवमी', 6, 'Shukla', 9, 'aparahna', { aliases: ['maha navami', 'महा नवमी'] }),
  F('dussehra', 'Dussehra (Vijayadashami)', 'दशहरा (विजयादशमी)', 6, 'Shukla', 10, 'aparahna', { aliases: ['dussehra', 'dasara', 'vijayadashami', 'दशहरा', 'विजयादशमी'] }),
  // Sharad Purnima's whole point is the midnight moon (Kojagara), so it is Nishita-vyapini.
  F('sharad-purnima', 'Sharad Purnima', 'शरद पूर्णिमा', 6, 'Shukla', 15, 'nishita', { aliases: ['sharad purnima', 'kojagiri', 'शरद पूर्णिमा'] }),
  F('karwa-chauth', 'Karwa Chauth', 'करवा चौथ', 6, 'Krishna', 4, 'moonrise', { type: 'vrat', aliases: ['karwa chauth', 'karva chauth', 'करवा चौथ'] }),
  // The Ahoi fast is broken at star-sighting after sunset, so the vrat follows the evening.
  F('ahoi-ashtami', 'Ahoi Ashtami', 'अहोई अष्टमी', 6, 'Krishna', 8, 'pradosh', { type: 'vrat', aliases: ['ahoi ashtami', 'अहोई अष्टमी'] }),
  F('dhanteras', 'Dhanteras', 'धनतेरस', 6, 'Krishna', 13, 'pradosh', { aliases: ['dhanteras', 'dhantrayodashi', 'धनतेरस'] }),
  F('naraka-chaturdashi', 'Naraka Chaturdashi', 'नरक चतुर्दशी', 6, 'Krishna', 14, 'sunrise', { aliases: ['naraka chaturdashi', 'choti diwali', 'roop chaudas', 'नरक चतुर्दशी'] }),
  F('diwali', 'Diwali / Lakshmi Puja', 'दीवाली / लक्ष्मी पूजा', 6, 'Krishna', 15, 'pradosh', { aliases: ['diwali', 'deepawali', 'lakshmi puja', 'दीवाली', 'दिवाली'] }),

  // ── Kartika ──
  // Annakut is offered on the Pratipada that follows the Diwali night. Pratipada often starts
  // mid-morning (12:32 on 9 Nov 2026), so it never reaches that day's Pratahkala — Sayankala
  // is the muhurat Drik then falls back to, and it identifies the day unambiguously.
  F('govardhan-puja', 'Govardhan Puja', 'गोवर्धन पूजा', 7, 'Shukla', 1, 'sayankala', { aliases: ['govardhan puja', 'annakut', 'गोवर्धन पूजा'] }),
  F('bhai-dooj', 'Bhai Dooj', 'भाई दूज', 7, 'Shukla', 2, 'aparahna', { aliases: ['bhai dooj', 'bhaiya dooj', 'yama dwitiya', 'भाई दूज'] }),
  F('chhath-puja', 'Chhath Puja', 'छठ पूजा', 7, 'Shukla', 6, 'sayankala', { type: 'vrat', aliases: ['chhath puja', 'chhath', 'छठ पूजा'] }),
  F('tulsi-vivah', 'Tulsi Vivah', 'तुलसी विवाह', 7, 'Shukla', 12, 'pradosh', { aliases: ['tulsi vivah', 'तुलसी विवाह'] }),
  F('kartik-purnima', 'Kartik Purnima', 'कार्तिक पूर्णिमा', 7, 'Shukla', 15, 'sunrise', { aliases: ['kartik purnima', 'dev deepawali', 'कार्तिक पूर्णिमा'] }),
  // Kalashtami's puja is at midnight, but the DAY is the Ashtami day itself (the Nishita
  // muhurat belongs to the night that follows it) — so this is a plain sunrise rule.
  F('kalabhairav-jayanti', 'Kalabhairav Jayanti', 'कालभैरव जयंती', 7, 'Krishna', 8, 'sunrise', { importance: 'minor', aliases: ['kalabhairav jayanti', 'kaal bhairav jayanti', 'कालभैरव जयंती'] }),

  // ── Margashirsha ──
  F('vivah-panchami', 'Vivah Panchami', 'विवाह पंचमी', 8, 'Shukla', 5, 'sunrise', { importance: 'minor', aliases: ['vivah panchami', 'विवाह पंचमी'] }),
  F('gita-jayanti', 'Gita Jayanti', 'गीता जयंती', 8, 'Shukla', 11, 'sunrise', { aliases: ['gita jayanti', 'geeta jayanti', 'गीता जयंती'] }),
  F('datta-jayanti', 'Datta Jayanti', 'दत्त जयंती', 8, 'Shukla', 15, 'sunrise', { importance: 'minor', aliases: ['datta jayanti', 'dattatreya jayanti', 'दत्त जयंती'] }),
];

// Every fortnight / month, in EVERY lunar month including adhika.
const RECURRING = [
  { key: 'pradosh', paksha: 'Shukla', tithi: 13, ref: 'pradosh', type: 'vrat', importance: 'minor', name: { en: 'Pradosh Vrat', hi: 'प्रदोष व्रत' }, aliases: ['pradosh', 'pradosh vrat', 'प्रदोष'] },
  { key: 'pradosh', paksha: 'Krishna', tithi: 13, ref: 'pradosh', type: 'vrat', importance: 'minor', name: { en: 'Pradosh Vrat', hi: 'प्रदोष व्रत' }, aliases: ['pradosh', 'pradosh vrat', 'प्रदोष'] },
  { key: 'vinayaka-chaturthi', paksha: 'Shukla', tithi: 4, ref: 'madhyahna', type: 'vrat', importance: 'minor', name: { en: 'Vinayaka Chaturthi', hi: 'विनायक चतुर्थी' }, aliases: ['vinayaka chaturthi', 'विनायक चतुर्थी'] },
  { key: 'sankashti-chaturthi', paksha: 'Krishna', tithi: 4, ref: 'moonrise', type: 'vrat', importance: 'minor', name: { en: 'Sankashti Chaturthi', hi: 'संकष्टी चतुर्थी' }, aliases: ['sankashti chaturthi', 'sankashti', 'संकष्टी चतुर्थी'] },
  { key: 'skanda-sashti', paksha: 'Shukla', tithi: 6, ref: 'sunrise', type: 'vrat', importance: 'minor', name: { en: 'Skanda Sashti', hi: 'स्कंद षष्ठी' }, aliases: ['skanda sashti', 'skanda shashti', 'स्कंद षष्ठी'] },
  { key: 'masik-durgashtami', paksha: 'Shukla', tithi: 8, ref: 'sunrise', type: 'vrat', importance: 'minor', name: { en: 'Masik Durgashtami', hi: 'मासिक दुर्गाष्टमी' }, aliases: ['durgashtami', 'masik durgashtami', 'दुर्गाष्टमी'] },
  { key: 'masik-shivaratri', paksha: 'Krishna', tithi: 14, ref: 'nishita', type: 'vrat', importance: 'minor', name: { en: 'Masik Shivaratri', hi: 'मासिक शिवरात्रि' }, aliases: ['masik shivaratri', 'मासिक शिवरात्रि'] },
];

// When a once-a-year festival lands on the same tithi as its monthly counterpart,
// only the named festival is surfaced (Drik does the same).
const OUTRANKS = { 'maha-shivaratri': 'masik-shivaratri', 'ganesh-chaturthi': 'vinayaka-chaturthi', 'sakat-chauth': 'sankashti-chaturthi', 'karwa-chauth': 'sankashti-chaturthi', 'durga-ashtami': 'masik-durgashtami', 'radha-ashtami': 'masik-durgashtami' };

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
    const emit = (rule, extra) => {
      const { start, end } = tithiSpan(m, rule.paksha, rule.tithi);
      const day = resolveDay(start, end, rule.ref, rule.pick, ctx);
      push(day, {
        key: (extra && extra.key) || rule.key,
        name: (extra && extra.name) || rule.name,
        type: rule.type || 'festival',
        importance: rule.importance || 'major',
        note: noteFor(m, rule.paksha, rule.tithi),
      });
      return day;
    };

    // Ekadashi ×2 — named by the purnimanta month; adhika months get Padmini/Parama.
    // Ekadashi is sunrise-vyapini, but when it reaches TWO sunrises (vriddhi) the first of
    // them is Dashami-viddha — the tithi only began after that day's Arunodaya, so Dashami
    // still contaminates the vrat — and the fast moves to the second day. pick:'last' IS
    // that Dashami-vedha rule (it is what puts Padmini Ekadashi 2026 on 27 May, not 26 May);
    // for the ordinary single-sunrise case 'last' and 'first' are the same day.
    for (const paksha of ['Shukla', 'Krishna']) {
      const pIdx = (m.masa + (paksha === 'Krishna' ? 1 : 0)) % 12;
      const nm = m.adhika ? EKADASHI.Adhika[paksha] : EKADASHI[paksha][pIdx];
      emit(
        { paksha, tithi: 11, ref: 'sunrise', pick: 'last', type: 'vrat', importance: 'major', key: `ekadashi-${slug(nm.en)}` },
        { key: `ekadashi-${slug(nm.en)}`, name: { en: `${nm.en} Ekadashi`, hi: `${nm.hi} एकादशी` } },
      );
    }

    // Purnima / Amavasya — named by the (purnimanta) month they close.
    emit(
      { paksha: 'Shukla', tithi: 15, ref: 'sunrise', type: 'tithi', importance: 'major' },
      { key: `purnima-${masaSlug(m)}`, name: { en: `${masaLabel(m).en} Purnima`, hi: `${masaLabel(m).hi} पूर्णिमा` } },
    );
    const amavasyaLabel = m.adhika ? masaLabel(m) : MASA[(m.masa + 1) % 12];
    emit(
      { paksha: 'Krishna', tithi: 15, ref: 'sunrise', type: 'tithi', importance: 'major' },
      { key: `amavasya-${m.adhika ? masaSlug(m) : slug(amavasyaLabel.en)}`, name: { en: `${amavasyaLabel.en} Amavasya`, hi: `${amavasyaLabel.hi} अमावस्या` } },
    );

    for (const rule of RECURRING) emit(rule);

    // Chandra Darshana / Ishti — first moon sighting, the evening AFTER Amavasya.
    const amavasyaDay = resolveDay(tithiSpan(m, 'Krishna', 15).start, tithiSpan(m, 'Krishna', 15).end, 'sunrise', 'first', ctx);
    if (amavasyaDay) {
      push(addDays(amavasyaDay, 1), {
        key: 'chandra-darshana',
        name: { en: 'Chandra Darshana', hi: 'चन्द्र दर्शन' },
        type: 'festival',
        importance: 'minor',
        note: noteFor(m, 'Shukla', 1),
      });
      push(amavasyaDay, {
        key: 'anvadhan',
        name: { en: 'Anvadhan', hi: 'अन्वाधान' },
        type: 'tithi',
        importance: 'minor',
        note: noteFor(m, 'Krishna', 15),
      });
      push(addDays(amavasyaDay, 1), {
        key: 'ishti',
        name: { en: 'Ishti', hi: 'इष्टि' },
        type: 'tithi',
        importance: 'minor',
        note: noteFor(m, 'Shukla', 1),
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
  for (const s of sankrantisBetween(new Date(Date.UTC(year - 1, 11, 1)), new Date(Date.UTC(year + 1, 0, 31)))) {
    const day = civilOf(s.moment, tzMin);
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
  }

  // Drop the monthly vrat when its once-a-year form falls on the same day.
  for (const [k, list] of byDate) {
    const drop = new Set();
    for (const o of list) if (OUTRANKS[o.key]) drop.add(OUTRANKS[o.key]);
    if (drop.size) byDate.set(k, list.filter((o) => !drop.has(o.key)));
  }

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
    for (const nm of EKADASHI[paksha]) {
      add(`ekadashi-${slug(nm.en)}`, { en: `${nm.en} Ekadashi`, hi: `${nm.hi} एकादशी` }, [`${nm.en} ekadashi`, 'ekadashi', 'एकादशी'], 'vrat', 'major');
    }
    const a = EKADASHI.Adhika[paksha];
    add(`ekadashi-${slug(a.en)}`, { en: `${a.en} Ekadashi`, hi: `${a.hi} एकादशी` }, [`${a.en} ekadashi`, 'ekadashi'], 'vrat', 'major');
  }
  for (const m of MASA) {
    add(`purnima-${slug(m.en)}`, { en: `${m.en} Purnima`, hi: `${m.hi} पूर्णिमा` }, [`${m.en} purnima`, 'purnima', 'पूर्णिमा'], 'tithi', 'major');
    add(`amavasya-${slug(m.en)}`, { en: `${m.en} Amavasya`, hi: `${m.hi} अमावस्या` }, [`${m.en} amavasya`, 'amavasya', 'अमावस्या'], 'tithi', 'major');
  }
  for (const r of RASHI) {
    add(`sankranti-${slug(r.en)}`, { en: `${r.en} Sankranti`, hi: `${r.hi} संक्रांति` }, [`${r.en} sankranti`, 'sankranti', 'संक्रांति'], 'sankranti', 'minor');
  }
  add('makar-sankranti', { en: 'Makar Sankranti', hi: 'मकर संक्रांति' }, ['makar sankranti', 'uttarayan', 'maghi', 'मकर संक्रांति'], 'festival', 'major');
  add('pongal', { en: 'Thai Pongal', hi: 'थाई पोंगल' }, ['pongal', 'thai pongal', 'पोंगल'], 'festival', 'major');
  add('chandra-darshana', { en: 'Chandra Darshana', hi: 'चन्द्र दर्शन' }, ['chandra darshana', 'चन्द्र दर्शन'], 'festival', 'minor');
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
