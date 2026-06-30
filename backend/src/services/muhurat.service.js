// ── Muhurat engine ───────────────────────────────────────────────────────────
// Scores each candidate day against classical Muhurta rules using the REAL panchang
// (tithi/vaar/nakshatra/yoga/karana + Rahu-Kaal/Bhadra) computed by our astronomy
// engine. Name-based selection adds Chandrabal (Moon transit from the person's naam-
// rashi) and, when birth details are given, Tara Bal (from the exact janma nakshatra).
// 100% deterministic — no value is invented; only verified panchang facts are judged.

const { getPanchang } = require('./vedastro.service');
const { CATEGORY_BY_KEY } = require('../data/muhuratRules');

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_IDX = SIGNS.reduce((a, s, i) => { a[s] = i; return a; }, {});
const WEEKDAY_IDX = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const VAAR_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
// inauspicious yogas (Vyatipata, Vaidhriti) and the 4 "tikshna/ugra" nakshatras to soft-avoid
const BAD_YOGAS = new Set(['vyatipata', 'vaidhriti']);
const SOFT_AVOID_NAK = new Set(['bharani', 'krittika', 'ardra', 'ashlesha']);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const pad2 = (n) => (n < 10 ? '0' : '') + n;
const toDMY = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Tara Bal: 9-fold star from janma nakshatra. Avoid Vipat(3), Pratyari(5), Vadha(7).
const TARA = [
  { en: 'Janma', hi: 'जन्म', ok: true },
  { en: 'Sampat', hi: 'सम्पत', ok: true },
  { en: 'Vipat', hi: 'विपत', ok: false },
  { en: 'Kshema', hi: 'क्षेम', ok: true },
  { en: 'Pratyari', hi: 'प्रत्यरि', ok: false },
  { en: 'Sadhaka', hi: 'साधक', ok: true },
  { en: 'Vadha', hi: 'वध', ok: false },
  { en: 'Mitra', hi: 'मित्र', ok: true },
  { en: 'Ati-Mitra', hi: 'परम मित्र', ok: true },
];
function taraOf(janmaNak, dayNak) {
  if (!janmaNak || !dayNak) return null;
  const count = ((dayNak - janmaNak + 27) % 27) + 1; // 1-based count from janma
  return { type: ((count - 1) % 9), ...TARA[(count - 1) % 9] };
}

// Chandrabal: Moon's transit house from the naam-rashi. 8th (Chandra Ashtam) is rejected.
const CHANDRA_GOOD = new Set([1, 3, 6, 7, 10, 11]);
const CHANDRA_BAD = new Set([4, 12]);
function chandraHouse(nameRashi, dayMoonSign) {
  const a = SIGN_IDX[nameRashi], b = SIGN_IDX[dayMoonSign];
  if (a == null || b == null) return null;
  return ((b - a + 12) % 12) + 1;
}

function inPakshaTithi(num) { return ((Number(num) - 1) % 15) + 1; } // 1..15
function isPanchak(p) {
  const n = p.nakshatra && p.nakshatra.num;
  const pada = p.nakshatra && p.nakshatra.pada;
  if (n == null) return false;
  if (n >= 24 && n <= 27) return true;           // Shatabhisha..Revati
  if (n === 23 && Number(pada) >= 3) return true; // Dhanishtha 2nd half
  return false;
}

// pull the Abhijit muhurat window + any benefic windows from the panchang
function timeWindows(p) {
  const ausp = (p.auspicious || []).filter((x) => x && x.start && x.end);
  const abhijit = ausp.find((x) => /abhijit/i.test(x.name));
  const rahu = (p.inauspicious || []).find((x) => /rahu/i.test(x.name)) || null;
  return {
    abhijit: abhijit ? { name: abhijit.name, start: abhijit.start, end: abhijit.end } : null,
    windows: ausp.map((x) => ({ name: x.name, start: x.start, end: x.end })),
    rahuKaal: rahu ? { start: rahu.start, end: rahu.end } : null,
  };
}

function scoreDay(p, rule, ctx) {
  const reasons = [];
  const rb = (en, hi, good = true) => reasons.push({ en, hi, good });
  let score = 0;
  const L = (o) => o; // keep bilingual objects

  // ── hard rejects ──
  if (rule.avoidBhadra && (p.bhadra || (p.karana && p.karana.isBhadra))) {
    return { ok: false, reject: { en: 'Bhadra active', hi: 'भद्रा सक्रिय' } };
  }
  const tnum = inPakshaTithi(p.tithi && p.tithi.num);
  const isAmavasya = (p.tithi && p.tithi.num) === 30;
  const isPurnima = (p.tithi && p.tithi.num) === 15;
  if (rule.avoidAmavasya && isAmavasya) return { ok: false, reject: { en: 'Amavasya', hi: 'अमावस्या' } };
  if (rule.avoidPurnima && isPurnima) return { ok: false, reject: { en: 'Purnima', hi: 'पूर्णिमा' } };
  if (rule.avoidPanchak && isPanchak(p)) return { ok: false, reject: { en: 'Panchak', hi: 'पंचक' } };

  // Chandrabal (name-based) — reject Chandra Ashtam
  let chandra = null;
  if (ctx.nameRashi && p.moon && p.moon.sign) {
    const h = chandraHouse(ctx.nameRashi, p.moon.sign);
    chandra = h;
    if (h === 8) return { ok: false, reject: { en: 'Chandra Ashtam (Moon 8th from your rashi)', hi: 'चंद्र अष्टम (आपकी राशि से 8वें)' } };
  }
  // Tara Bal (birth-based) — reject the harmful taras
  let tara = null;
  if (ctx.janmaNak && p.nakshatra && p.nakshatra.num) {
    tara = taraOf(ctx.janmaNak, p.nakshatra.num);
    if (tara && !tara.ok) return { ok: false, reject: { en: `${tara.en} Tara`, hi: `${tara.hi} तारा` } };
  }

  // ── scoring ──
  const nak = norm(p.nakshatra && p.nakshatra.name);
  const goodNaks = (rule.goodNakshatras || []).map(norm);
  if (goodNaks.includes(nak)) { score += 42; rb(`Auspicious nakshatra (${p.nakshatra.name})`, `शुभ नक्षत्र (${p.nakshatra.hi || p.nakshatra.name})`); }
  else if (SOFT_AVOID_NAK.has(nak)) { score += 4; rb(`Nakshatra ${p.nakshatra.name} is less ideal`, `नक्षत्र ${p.nakshatra.hi || p.nakshatra.name} कम उपयुक्त`, false); }
  else { score += 16; }

  if ((rule.riktaTithis || []).includes(tnum)) { score -= 12; rb('Rikta tithi (weaker)', 'रिक्ता तिथि (कमज़ोर)', false); }
  else if ((rule.goodTithis || []).includes(tnum)) { score += 20; rb(`Good tithi (${p.tithi.name})`, `शुभ तिथि (${p.tithi.hi || p.tithi.name})`); }
  else { score += 6; }
  if (p.tithi && /shukla/i.test(p.tithi.paksha)) score += 4;

  const vIdx = WEEKDAY_IDX[norm(p.weekday)];
  if ((rule.goodVaars || []).includes(vIdx)) { score += 15; rb(`Favourable weekday (${p.weekday})`, `शुभ वार (${VAAR_HI[vIdx] || p.weekday})`); }
  else { score += 2; }

  if (BAD_YOGAS.has(norm(p.yoga && p.yoga.name))) { score -= 18; rb(`${p.yoga.name} yoga (avoid)`, `${p.yoga.hi || p.yoga.name} योग (वर्जित)`, false); }

  if (chandra != null) {
    if (CHANDRA_GOOD.has(chandra)) { score += 22; rb(`Strong Chandrabal (Moon ${chandra}th from your rashi)`, `शुभ चंद्रबल (राशि से ${chandra}वें चंद्र)`); }
    else if (CHANDRA_BAD.has(chandra)) { score -= 8; rb(`Weak Chandrabal (Moon ${chandra}th)`, `कमज़ोर चंद्रबल (${chandra}वें चंद्र)`, false); }
    else { score += 8; }
  }
  if (tara && tara.ok) { score += 16; rb(`Good Tara Bal (${tara.en})`, `शुभ ताराबल (${tara.hi})`); }

  return { ok: true, score, reasons, chandra, tara, abhijit: timeWindows(p) };
}

async function janmaNakshatraFrom(birth) {
  if (!birth || !(birth.date && (birth.place || (birth.lat != null && birth.lng != null)))) return null;
  try {
    const p = await getPanchang({ place: birth.place, lat: birth.lat, lng: birth.lng, date: birth.date, tz: birth.tz || '+05:30', includeTransitions: false, includeMoonTimes: false });
    return (p.nakshatra && p.nakshatra.num) || null;
  } catch (_) { return null; }
}

async function findMuhurat({ category, fromDate, months = 2, place, lat, lng, tz = '+05:30', nameRashi, birth }) {
  const rule = CATEGORY_BY_KEY[category];
  if (!rule) { const e = new Error('Unknown muhurat category'); e.status = 400; throw e; }

  const start = fromDate instanceof Date ? new Date(fromDate) : new Date();
  start.setHours(0, 0, 0, 0);
  const days = Math.max(15, Math.min(95, Math.round(Number(months) * 31) || 62));
  const janmaNak = await janmaNakshatraFrom(birth);
  const ctx = { nameRashi: nameRashi && SIGN_IDX[nameRashi] != null ? nameRashi : null, janmaNak };

  const results = [];
  const cur = new Date(start);
  for (let i = 0; i < days; i += 1) {
    const dmy = toDMY(cur);
    try {
      const p = await getPanchang({ place, lat, lng, date: dmy, tz, includeTransitions: false, includeMoonTimes: false });
      const s = scoreDay(p, rule, ctx);
      if (s.ok) {
        results.push({
          date: p.date || dmy,
          dmy,
          weekday: p.weekday,
          weekdayHi: p.weekdayHi,
          tithi: p.tithi,
          nakshatra: p.nakshatra,
          yoga: p.yoga,
          score: Math.round(s.score),
          reasons: s.reasons,
          chandraHouse: s.chandra,
          tara: s.tara ? { en: s.tara.en, hi: s.tara.hi } : null,
          time: s.abhijit,
          sunrise: p.sunrise,
          sunset: p.sunset,
        });
      }
    } catch (_) { /* skip unreadable day */ }
    cur.setDate(cur.getDate() + 1);
    await wait(4);
  }

  results.sort((a, b) => (b.score - a.score) || (new Date(a.dmy.split('/').reverse().join('-')) - new Date(b.dmy.split('/').reverse().join('-'))));
  const top = results.slice(0, 8).sort((a, b) => a.dmy.split('/').reverse().join('') - b.dmy.split('/').reverse().join(''));

  return {
    category: { key: rule.key, name: rule.name, emoji: rule.emoji, group: rule.group, why: rule.why, blurb: rule.blurb, bestLagna: rule.bestLagna || null, nameBased: rule.nameBased },
    method: {
      en: 'Computed from the day’s real Panchang (tithi, vaar, nakshatra, yoga, karana) with Rahu-Kaal/Bhadra/Panchak removed' + (ctx.nameRashi ? ', plus Chandrabal from your naam-rashi' : '') + (janmaNak ? ', plus Tara Bal from your janma nakshatra' : '') + '.',
      hi: 'दिन के वास्तविक पंचांग (तिथि, वार, नक्षत्र, योग, करण) से गणना, राहुकाल/भद्रा/पंचक हटाकर' + (ctx.nameRashi ? ', साथ में आपकी नाम-राशि से चंद्रबल' : '') + (janmaNak ? ', और जन्म नक्षत्र से ताराबल' : '') + '।',
    },
    nameRashi: ctx.nameRashi,
    janmaNakshatra: janmaNak,
    scanned: days,
    items: top,
  };
}

module.exports = { findMuhurat };
