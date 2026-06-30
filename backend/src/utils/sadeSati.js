// Deterministic Sade Sati / Shani Dhaiya timeline — SINGLE SOURCE OF TRUTH.
// Sade Sati = Saturn transiting the 12th, 1st (Moon's own) or 2nd sign from the natal Moon
// (~7.5 years total, ~2.5 yrs each). Dhaiya (small panoti) = Saturn in the 4th or 8th from Moon.
// We scan Saturn's sidereal sign month-by-month (local ephemeris, same engine the rest of the
// app uses) and return EXACT start/end months — so the AI never has to guess a date.
const eph = require('./localEphemeris');

const SIGN_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];
const SIGN_IDX = SIGN_ORDER.reduce((a, s, i) => { a[s] = i; return a; }, {});
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_HI = ['जन', 'फर', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'];

const ym = (d) => `${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const ymHi = (d) => `${MON_HI[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const addMonths = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));

function satIdxAt(date) {
  const p = eph.localPlanet('Saturn', date);
  return p && p.sign != null ? SIGN_IDX[p.sign] : null;
}

/**
 * @param {string} moonSign  natal Moon sign (English, "Aries".."Pisces")
 * @param {Date}   now
 * @returns deterministic Sade Sati status + the current/next window with EXACT month-year dates,
 *          or null if the moon sign is unknown.
 */
function sadeSatiTimeline(moonSign, now = new Date()) {
  const moonIdx = SIGN_IDX[moonSign];
  if (moonIdx == null) return null;

  const ssSigns = [(moonIdx + 11) % 12, moonIdx, (moonIdx + 1) % 12]; // 12th, 1st, 2nd
  const dhaiyaSigns = [(moonIdx + 3) % 12, (moonIdx + 7) % 12];        // 4th, 8th
  const isSS = (idx) => idx != null && ssSigns.includes(idx);
  const phaseOf = (idx) => {
    const h = (((idx - moonIdx) % 12) + 12) % 12 + 1;
    return h === 12 ? { en: 'Rising phase (1st, 12th from Moon)', hi: 'आरंभिक चरण (पहला)' }
      : h === 1 ? { en: 'Peak phase (2nd, over the Moon)', hi: 'शिखर चरण (दूसरा)' }
      : h === 2 ? { en: 'Setting phase (3rd, 2nd from Moon)', hi: 'अंतिम चरण (तीसरा)' } : null;
  };

  // monthly scan: 12 yrs back → 32 yrs ahead (captures current + next Sade Sati cycle)
  const base = new Date(Date.UTC(now.getUTCFullYear() - 12, 0, 1));
  const total = (12 + 32) * 12;
  const windows = [];
  let cur = null;
  for (let i = 0; i <= total; i++) {
    const d = addMonths(base, i);
    const idx = satIdxAt(d);
    if (isSS(idx)) {
      if (!cur) cur = { start: d, end: d };
      else cur.end = d;
    } else if (cur) { windows.push(cur); cur = null; }
  }
  if (cur) windows.push(cur);

  const nowMs = now.getTime();
  const fmtWin = (w) => ({
    start: ym(w.start), startHi: ymHi(w.start),
    // Saturn leaves the 2nd sign ~1 month after the last in-window sample
    end: ym(addMonths(w.end, 1)), endHi: ymHi(addMonths(w.end, 1)),
    startYear: w.start.getUTCFullYear(), endYear: addMonths(w.end, 1).getUTCFullYear(),
  });
  const currentWin = windows.find((w) => w.start.getTime() <= nowMs && nowMs <= addMonths(w.end, 1).getTime()) || null;
  const nextWin = windows.filter((w) => w.start.getTime() > nowMs).sort((a, b) => a.start - b.start)[0] || null;

  const nowIdx = satIdxAt(now);
  const active = isSS(nowIdx);
  const dhaiya = nowIdx != null && dhaiyaSigns.includes(nowIdx);

  return {
    active,
    dhaiya,
    phase: active ? phaseOf(nowIdx) : null,
    natalMoonSign: moonSign,
    natalMoonSignHi: SIGN_HI[moonIdx],
    saturnSignNow: nowIdx != null ? SIGN_ORDER[nowIdx] : null,
    saturnSignNowHi: nowIdx != null ? SIGN_HI[nowIdx] : null,
    current: currentWin ? fmtWin(currentWin) : null, // the window we are inside right now
    next: nextWin ? fmtWin(nextWin) : null,            // the upcoming Sade Sati window
  };
}

module.exports = { sadeSatiTimeline };
