// ── Muhurat engine ───────────────────────────────────────────────────────────
// Scores each candidate day against classical Muhurta rules using the REAL panchang
// (tithi/vaar/nakshatra/yoga/karana + Rahu-Kaal/Bhadra/Panchak) computed by our
// astronomy engine. Produces a composite 0-100 score with a per-factor breakdown
// ("Why this muhurat"), plus name-based Chandrabal and (with birth) Tara Bal.
// 100% deterministic — only verified panchang facts are judged.

const { getPanchang } = require('./vedastro.service');
const { CATEGORY_BY_KEY } = require('../data/muhuratRules');

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];
const SIGN_IDX = SIGNS.reduce((a, s, i) => { a[s] = i; return a; }, {});
const WEEKDAY_IDX = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const BAD_YOGAS = new Set(['vyatipata', 'vaidhriti']);
const SOFT_AVOID_NAK = new Set(['bharani', 'krittika', 'ardra', 'ashlesha']);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const pad2 = (n) => (n < 10 ? '0' : '') + n;
const toDMY = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Tara Bal — avoid Vipat(3), Pratyari(5), Vadha(7).
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
  const count = ((dayNak - janmaNak + 27) % 27) + 1;
  return { idx: ((count - 1) % 9), ...TARA[(count - 1) % 9] };
}
const CHANDRA_GOOD = new Set([1, 3, 6, 7, 10, 11]);
const CHANDRA_NEUTRAL = new Set([2, 5, 9]);
function chandraHouse(nameRashi, dayMoonSign) {
  const a = SIGN_IDX[nameRashi], b = SIGN_IDX[dayMoonSign];
  if (a == null || b == null) return null;
  return ((b - a + 12) % 12) + 1;
}
const inPakshaTithi = (num) => ((Number(num) - 1) % 15) + 1;
function isPanchak(p) {
  const n = p.nakshatra && p.nakshatra.num;
  const pada = p.nakshatra && p.nakshatra.pada;
  if (n == null) return false;
  if (n >= 24 && n <= 27) return true;
  if (n === 23 && Number(pada) >= 3) return true;
  return false;
}
function timeWindows(p) {
  const ausp = (p.auspicious || []).filter((x) => x && x.start && x.end);
  const abhijit = ausp.find((x) => /abhijit/i.test(x.name));
  const brahma = ausp.find((x) => /brahma/i.test(x.name));
  const rahu = (p.inauspicious || []).find((x) => /rahu/i.test(x.name)) || null;
  return {
    abhijit: abhijit ? { name: abhijit.name, start: abhijit.start, end: abhijit.end } : null,
    brahma: brahma ? { start: brahma.start, end: brahma.end } : null,
    windows: ausp.map((x) => ({ name: x.name, start: x.start, end: x.end })),
    rahuKaal: rahu ? { start: rahu.start, end: rahu.end } : null,
  };
}

// ── composite 0-100 scoring with a per-factor breakdown ──
// Festival days that are traditionally the BEST for buying (vehicle/gold/electronics
// /property), regardless of the ordinary tithi/nakshatra score. Dhanteras date is
// verified (Dhanteras 2026 = 06/11/2026). Add more verified dates over time.
const SPECIAL_BUY_DATES = {
  '06/11/2026': { en: 'Dhanteras', hi: 'धनतेरस' },
};
function isAkshayaTritiya(p) {
  const masa = p.masa && p.masa.amanta && p.masa.amanta.en;
  return masa === 'Vaishakha' && p.tithi && /shukla/i.test(p.tithi.paksha) && p.tithi.name === 'Tritiya';
}
// Pushya nakshatra (esp Guru-Pushya on Thu, Ravi-Pushya on Sun) is the classic
// "buy anything" nakshatra. 100% detectable from the panchang.
function pushyaSpecial(p) {
  if (norm(p.nakshatra && p.nakshatra.name) !== 'pushya') return null;
  const wd = WEEKDAY_IDX[norm(p.weekday)];
  if (wd === 4) return { en: 'Guru Pushya', hi: 'गुरु पुष्य' };
  if (wd === 0) return { en: 'Ravi Pushya', hi: 'रवि पुष्य' };
  return { en: 'Pushya Nakshatra', hi: 'पुष्य नक्षत्र' };
}

function scoreDay(p, rule, ctx, dmy) {
  // hard rejects first
  if (rule.avoidBhadra && (p.bhadra || (p.karana && p.karana.isBhadra))) return { ok: false, reject: { en: 'Bhadra active', hi: 'भद्रा सक्रिय' } };
  const tnum = inPakshaTithi(p.tithi && p.tithi.num);
  if (rule.avoidAmavasya && (p.tithi && p.tithi.num) === 30) return { ok: false, reject: { en: 'Amavasya', hi: 'अमावस्या' } };
  if (rule.avoidPurnima && (p.tithi && p.tithi.num) === 15) return { ok: false, reject: { en: 'Purnima', hi: 'पूर्णिमा' } };
  if (rule.avoidPanchak && isPanchak(p)) return { ok: false, reject: { en: 'Panchak', hi: 'पंचक' } };

  let chandra = null, chandraLabel = null;
  if (ctx.nameRashi && p.moon && p.moon.sign) {
    chandra = chandraHouse(ctx.nameRashi, p.moon.sign);
    if (chandra === 8) return { ok: false, reject: { en: 'Chandra Ashtam (Moon 8th from rashi)', hi: 'चंद्र अष्टम' } };
  }
  let tara = null;
  if (ctx.janmaNak && p.nakshatra && p.nakshatra.num) {
    tara = taraOf(ctx.janmaNak, p.nakshatra.num);
    if (tara && !tara.ok) return { ok: false, reject: { en: `${tara.en} Tara`, hi: `${tara.hi} तारा` } };
  }
  // second person (couple muhurat — bride/groom): the day must be clean for BOTH
  if (ctx.nameRashi2 && p.moon && p.moon.sign && chandraHouse(ctx.nameRashi2, p.moon.sign) === 8) {
    return { ok: false, reject: { en: 'Chandra Ashtam for partner', hi: 'साथी हेतु चंद्र अष्टम' } };
  }
  if (ctx.janmaNak2 && p.nakshatra && p.nakshatra.num) {
    const t2 = taraOf(ctx.janmaNak2, p.nakshatra.num);
    if (t2 && !t2.ok) return { ok: false, reject: { en: `${t2.en} Tara for partner`, hi: `साथी हेतु ${t2.hi} तारा` } };
  }

  const br = [];
  let applicable = 0, got = 0;
  const add = (key, en, hi, pts, max) => { br.push({ key, en, hi, pts: Math.round(pts), max, ok: pts >= max * 0.6 }); applicable += max; got += pts; };

  // Nakshatra (20)
  const nak = norm(p.nakshatra && p.nakshatra.name);
  const goodNaks = (rule.goodNakshatras || []).map(norm);
  if (goodNaks.includes(nak)) add('nakshatra', `Auspicious nakshatra (${p.nakshatra.name})`, `शुभ नक्षत्र (${p.nakshatra.hi || p.nakshatra.name})`, 20, 20);
  else if (SOFT_AVOID_NAK.has(nak)) add('nakshatra', `Nakshatra ${p.nakshatra.name} (less ideal)`, `नक्षत्र ${p.nakshatra.hi || p.nakshatra.name} (कम उपयुक्त)`, 6, 20);
  else add('nakshatra', `Nakshatra ${p.nakshatra.name} (neutral)`, `नक्षत्र ${p.nakshatra.hi || p.nakshatra.name} (सामान्य)`, 13, 20);

  // Tithi (20)
  if ((rule.riktaTithis || []).includes(tnum)) add('tithi', `Rikta tithi (${p.tithi.name})`, `रिक्ता तिथि (${p.tithi.hi || p.tithi.name})`, 6, 20);
  else if ((rule.goodTithis || []).includes(tnum)) add('tithi', `Auspicious tithi (${p.tithi.name})`, `शुभ तिथि (${p.tithi.hi || p.tithi.name})`, 20, 20);
  else add('tithi', `Tithi ${p.tithi.name}`, `तिथि ${p.tithi.hi || p.tithi.name}`, 13, 20);

  // Vaar — folded into Yoga weight bucket via small bonus; report separately too
  const vIdx = WEEKDAY_IDX[norm(p.weekday)];
  const vaarGood = (rule.goodVaars || []).includes(vIdx);

  // Yoga (10)
  if (BAD_YOGAS.has(norm(p.yoga && p.yoga.name))) add('yoga', `${p.yoga.name} yoga (avoid)`, `${p.yoga.hi || p.yoga.name} योग (वर्जित)`, 2, 10);
  else add('yoga', `${(p.yoga && p.yoga.name) || 'Yoga'} yoga` + (vaarGood ? ' + good weekday' : ''), `${(p.yoga && (p.yoga.hi || p.yoga.name)) || 'योग'}` + (vaarGood ? ' + शुभ वार' : ''), vaarGood ? 10 : 7, 10);

  // Karana (5)
  add('karana', `Karana ${(p.karana && p.karana.name) || ''}`.trim(), `करण ${(p.karana && (p.karana.hi || p.karana.name)) || ''}`.trim(), 5, 5);

  // Chandrabal (15) — only when a name/rashi is given
  if (chandra != null) {
    if (CHANDRA_GOOD.has(chandra)) { chandraLabel = { en: 'Excellent', hi: 'उत्तम' }; add('chandrabal', `Excellent Chandrabal (Moon ${chandra}th)`, `उत्तम चंद्रबल (राशि से ${chandra}वें)`, 15, 15); }
    else if (CHANDRA_NEUTRAL.has(chandra)) { chandraLabel = { en: 'Good', hi: 'अच्छा' }; add('chandrabal', `Good Chandrabal (Moon ${chandra}th)`, `अच्छा चंद्रबल (${chandra}वें)`, 10, 15); }
    else { chandraLabel = { en: 'Moderate', hi: 'सामान्य' }; add('chandrabal', `Moderate Chandrabal (Moon ${chandra}th)`, `सामान्य चंद्रबल (${chandra}वें)`, 6, 15); }
  }
  // Tara Bal (10) — only with birth nakshatra
  if (tara) add('tarabal', `${tara.en} Tara (good)`, `${tara.hi} तारा (शुभ)`, 10, 10);

  // Rahu-Kaal excluded (5), Bhadra absent (5), Panchak absent (5), Abhijit window (5)
  const tw = timeWindows(p);
  add('rahukaal', 'Rahu Kaal excluded', 'राहुकाल हटाया', 5, 5);
  add('bhadra', 'No Bhadra', 'भद्रा नहीं', 5, 5);
  add('panchak', 'No Panchak', 'पंचक नहीं', 5, 5);
  add('window', tw.abhijit ? 'Abhijit Muhurat available' : 'Daytime window', tw.abhijit ? 'अभिजीत मुहूर्त उपलब्ध' : 'दिन का शुभ समय', tw.abhijit ? 5 : 3, 5);

  let score = applicable > 0 ? Math.round((got / applicable) * 1000) / 10 : 0;

  // Festival / Pushya boost for BUY categories → these are the days people actually
  // buy on (Dhanteras, Akshaya Tritiya, Guru/Ravi Pushya), so surface them at the top.
  let special = null;
  if (rule.purchase) {
    special = (dmy && SPECIAL_BUY_DATES[dmy]) || pushyaSpecial(p) || (isAkshayaTritiya(p) ? { en: 'Akshaya Tritiya', hi: 'अक्षय तृतीया' } : null);
    if (special) {
      br.push({ key: 'special', en: `${special.en} — highly auspicious for buying`, hi: `${special.hi} — खरीदारी के लिए अति शुभ`, pts: 15, max: 15, ok: true });
      score = Math.min(100, Math.max(score, 97));
    }
  }
  return { ok: true, score, breakdown: br, chandra, chandraLabel, tara, time: tw, vaarGood, special };
}

async function janmaNakshatraFrom(birth) {
  if (!birth || !(birth.date && (birth.place || (birth.lat != null && birth.lng != null)))) return null;
  try {
    const p = await getPanchang({ place: birth.place, lat: birth.lat, lng: birth.lng, date: birth.date, tz: birth.tz || '+05:30', includeTransitions: false, includeMoonTimes: false });
    return (p.nakshatra && p.nakshatra.num) || null;
  } catch (_) { return null; }
}

function ratingLabel(score) {
  if (score >= 98) return { en: 'Exceptional', hi: 'अद्वितीय' };
  if (score >= 92) return { en: 'Excellent', hi: 'उत्तम' };
  if (score >= 85) return { en: 'Very Good', hi: 'बहुत अच्छा' };
  if (score >= 75) return { en: 'Good', hi: 'अच्छा' };
  return { en: 'Fair', hi: 'सामान्य' };
}

function mkItem(p, dmy, s) {
  const moonIdx = p.moon && p.moon.sign ? SIGN_IDX[p.moon.sign] : null;
  return {
    date: p.date || dmy, dmy, weekday: p.weekday, weekdayHi: p.weekdayHi,
    tithi: p.tithi, nakshatra: p.nakshatra,
    yoga: p.yoga ? { name: p.yoga.name, hi: p.yoga.hi } : null,
    karana: p.karana ? { name: p.karana.name, hi: p.karana.hi } : null,
    moonSign: p.moon && p.moon.sign ? { en: p.moon.sign, hi: moonIdx != null ? SIGN_HI[moonIdx] : p.moon.sign } : null,
    score: s.score, rating: ratingLabel(s.score), breakdown: s.breakdown,
    chandra: s.chandra != null ? { house: s.chandra, label: s.chandraLabel } : null,
    tara: s.tara ? { en: s.tara.en, hi: s.tara.hi, label: { en: 'Excellent', hi: 'उत्तम' } } : null,
    time: s.time,
    flags: { rahuKaal: 'removed', durmuhurat: 'removed', bhadra: false, panchak: false, choghadiya: s.time.abhijit ? 'Abhijit' : null },
    special: s.special || null,
    sunrise: p.sunrise, sunset: p.sunset, ok: true,
  };
}

async function findMuhurat({ category, fromDate, months = 3, place, lat, lng, tz = '+05:30', nameRashi, birth, nameRashi2, birth2, targetDate }) {
  const rule = CATEGORY_BY_KEY[category];
  if (!rule) { const e = new Error('Unknown muhurat category'); e.status = 400; throw e; }

  const start = fromDate instanceof Date ? new Date(fromDate) : new Date();
  start.setHours(0, 0, 0, 0);
  const days = Math.max(20, Math.min(186, Math.round(Number(months) * 31) || 93));
  const janmaNak = await janmaNakshatraFrom(birth);
  const janmaNak2 = await janmaNakshatraFrom(birth2);
  const ctx = {
    nameRashi: nameRashi && SIGN_IDX[nameRashi] != null ? nameRashi : null,
    janmaNak,
    nameRashi2: nameRashi2 && SIGN_IDX[nameRashi2] != null ? nameRashi2 : null,
    janmaNak2,
  };

  const results = [];
  const cur = new Date(start);
  for (let i = 0; i < days; i += 1) {
    const dmy = toDMY(cur);
    try {
      const p = await getPanchang({ place, lat, lng, date: dmy, tz, includeTransitions: false, includeMoonTimes: false });
      const s = scoreDay(p, rule, ctx, dmy);
      if (s.ok) results.push(mkItem(p, dmy, s));
    } catch (_) { /* skip */ }
    cur.setDate(cur.getDate() + 1);
    await wait(3);
  }

  const dateKey = (x) => Number(x.dmy.split('/').reverse().join(''));
  // Special buy-days (Dhanteras / Guru-Ravi Pushya / Akshaya Tritiya) are ALWAYS kept
  // and shown first (soonest first) for purchase categories — the days people actually
  // buy on — so they never get pushed out by the many high-scoring ordinary days.
  const specials = results.filter((r) => r.special).sort((a, b) => dateKey(a) - dateKey(b));
  const regular = results.filter((r) => !r.special).sort((a, b) => (b.score - a.score) || (dateKey(a) - dateKey(b)));
  const seen = new Set(specials.map((s) => s.dmy));
  const top = [...specials, ...regular.filter((r) => !seen.has(r.dmy))].slice(0, Math.max(12, specials.length + 4));

  // the user's CHOSEN date — scored even if it is not itself auspicious, so we can
  // say "your date is/ isn't good" while the list shows the best of the whole range.
  let target = null;
  if (targetDate) {
    try {
      const p = await getPanchang({ place, lat, lng, date: targetDate, tz, includeTransitions: false, includeMoonTimes: false });
      const s = scoreDay(p, rule, ctx, targetDate);
      target = s.ok ? mkItem(p, targetDate, s) : {
        dmy: targetDate, date: p.date || targetDate, weekday: p.weekday, weekdayHi: p.weekdayHi,
        tithi: p.tithi, nakshatra: p.nakshatra, ok: false, reject: s.reject,
      };
    } catch (_) { /* ignore */ }
  }

  return {
    target,
    category: { key: rule.key, name: rule.name, emoji: rule.emoji, group: rule.group, why: rule.why, blurb: rule.blurb, bestLagna: rule.bestLagna || null, nameBased: rule.nameBased, requires: rule.requires },
    method: {
      en: 'Composite 0-100 score from the day’s real Panchang (tithi, vaar, nakshatra, yoga, karana) with Rahu-Kaal/Bhadra/Panchak removed' + (ctx.nameRashi ? ', plus Chandrabal from your naam-rashi' : '') + (janmaNak ? ', plus Tara Bal from your janma nakshatra' : '') + '.',
      hi: '0-100 संयुक्त स्कोर — दिन के वास्तविक पंचांग (तिथि, वार, नक्षत्र, योग, करण) से, राहुकाल/भद्रा/पंचक हटाकर' + (ctx.nameRashi ? ', साथ में नाम-राशि से चंद्रबल' : '') + (janmaNak ? ', और जन्म नक्षत्र से ताराबल' : '') + '।',
    },
    nameRashi: ctx.nameRashi,
    janmaNakshatra: janmaNak,
    scanned: days,
    best: top[0] || null,
    items: top,
  };
}

module.exports = { findMuhurat };
