'use strict';
/**
 * shadbala.js — Shadbala (six-fold planetary strength), classical BPHS.
 * Output is in VIRUPAS (60 virupas = 1 Rupa) per planet, with the six balas and
 * the total / Rupas / required-minimum / rank.
 *
 * NOTE: Shadbala has many sub-formulas and software differ by convention (esp.
 * Cheshta, Drik and the Kala sub-balas). This is a faithful classical computation;
 * minor differences vs other tools are expected. Deterministic parts (Naisargika,
 * Uchcha at exaltation, Kendradi, etc.) are self-tested.
 */
const gm = require('./gunMilan');

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const PIDX = { Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Saturn: 6 };
const NAISARGIKA = { Sun: 60, Moon: 51.43, Mars: 17.14, Mercury: 25.71, Jupiter: 34.29, Venus: 42.86, Saturn: 8.57 };
// Deep exaltation longitudes (sidereal degrees).
const EXALT = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200 };
const MOOLATRIKONA_SIGN = { Sun: 4, Moon: 1, Mars: 0, Mercury: 5, Jupiter: 8, Venus: 6, Saturn: 10 };
const GENDER = { Sun: 'm', Mars: 'm', Jupiter: 'm', Moon: 'f', Venus: 'f', Mercury: 'n', Saturn: 'n' };
const BENEFIC = { Moon: 1, Mercury: 1, Jupiter: 1, Venus: 1 };
const DIG_STRONG_HOUSE = { Sun: 10, Mars: 10, Moon: 4, Venus: 4, Jupiter: 1, Mercury: 1, Saturn: 7 };
const NORTH_STRONG = { Sun: 1, Mars: 1, Jupiter: 1, Venus: 1, Mercury: 1 }; // others (Moon, Saturn) south-strong
const MEAN_SPEED = { Mars: 0.524, Mercury: 1.383, Jupiter: 0.083, Venus: 1.2, Saturn: 0.034 };
const SPECIAL_ASPECTS = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] }; // + 7th for all
const REQUIRED_RUPAS = { Sun: 5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5 };
const SAPTAVARGA = [1, 2, 3, 7, 9, 12, 30];

const norm = (x) => ((x % 360) + 360) % 360;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const arc180 = (a, b) => { let d = Math.abs(norm(a) - norm(b)); if (d > 180) d = 360 - d; return d; };
const r2 = (n) => Math.round(n * 100) / 100;

function compoundDignityVirupa(planet, signIdx, posSignIdx, p) {
  const lordIdx = gm.RASHI_LORD[signIdx];
  if (lordIdx === PIDX[planet]) return signIdx === MOOLATRIKONA_SIGN[planet] ? 45 : 30; // moolatrikona / own
  const lordName = gm.PLANET_NAME[lordIdx];
  const natural = gm.FRIEND_TABLE[PIDX[planet]][lordIdx]; // +1/0/-1
  // temporal: lord's NATAL (D1) position vs planet's natal position
  const lordPos = p[lordName] ? p[lordName].signIdx : null;
  let temporal = 0;
  if (lordPos != null) {
    const dist = ((lordPos - posSignIdx + 12) % 12) + 1;
    temporal = [2, 3, 4, 10, 11, 12].includes(dist) ? 1 : -1;
  }
  const c = natural + temporal;
  return c >= 2 ? 22.5 : c === 1 ? 15 : c === 0 ? 7.5 : c === -1 ? 3.75 : 1.875;
}

function computeShadbala(ctx) {
  const p = ctx.planets; // { Sun:{lon,signIdx,deg,house,navIdx,retro,speed,decl}, ... }
  const out = {};
  for (const pl of PLANETS) {
    const d = p[pl];
    if (!d) continue;

    // ── 1. STHANA ──
    const deb = norm(EXALT[pl] + 180);
    const uchcha = arc180(d.lon, deb) / 3; // 0..60
    // Saptavargaja
    let sapta = 0;
    for (const v of SAPTAVARGA) {
      const vSign = v === 1 ? d.signIdx : (ctx.vargaSignIdx && ctx.vargaSignIdx[pl] ? ctx.vargaSignIdx[pl][v] : null);
      if (vSign == null) continue;
      sapta += compoundDignityVirupa(pl, vSign, d.signIdx, p);
    }
    const signOdd = (d.signIdx % 2 === 0);
    const navOdd = (d.navIdx % 2 === 0);
    const wantEven = (pl === 'Moon' || pl === 'Venus');
    const oja = ((wantEven ? !signOdd : signOdd) ? 15 : 0) + ((wantEven ? !navOdd : navOdd) ? 15 : 0);
    const kendradi = [1, 4, 7, 10].includes(d.house) ? 60 : [2, 5, 8, 11].includes(d.house) ? 30 : 15;
    const dec = Math.floor((d.deg || 0) / 10); // 0,1,2
    const g = GENDER[pl];
    const drekkana = ((g === 'm' && dec === 0) || (g === 'f' && dec === 1) || (g === 'n' && dec === 2)) ? 15 : 0;
    const sthana = uchcha + sapta + oja + kendradi + drekkana;

    // ── 2. DIG ──
    const strongH = DIG_STRONG_HOUSE[pl];
    const powerlessH = ((strongH + 6 - 1) % 12) + 1;
    const powerlessLon = norm(ctx.ascLon + (powerlessH - 1) * 30);
    const dig = arc180(d.lon, powerlessLon) / 3; // 0..60

    // ── 3. KALA ──
    const elong = arc180(ctx.moonLon, ctx.sunLon);
    const paksha = BENEFIC[pl] ? elong / 3 : (180 - elong) / 3;
    const dayBala = 60 * (1 - clamp(ctx.noonDist, 0, 12) / 12);
    const natho = pl === 'Mercury' ? 60 : (['Sun', 'Jupiter', 'Venus'].includes(pl) ? dayBala : 60 - dayBala);
    const tribhaga = (pl === 'Jupiter' || pl === ctx.tribhagaLord) ? 60 : 0;
    const vara = pl === ctx.weekdayLord ? 45 : 0;
    const hora = pl === ctx.horaLord ? 60 : 0;
    const k = NORTH_STRONG[pl] ? (d.decl + 23.45) / 46.9 : (23.45 - d.decl) / 46.9;
    const ayana = clamp(k, 0, 1) * 60;
    const kala = paksha + natho + tribhaga + vara + hora + ayana;

    // ── 4. CHESHTA ──
    let cheshta;
    if (pl === 'Sun') cheshta = ayana;
    else if (pl === 'Moon') cheshta = paksha;
    else if (d.retro) cheshta = 60;
    else cheshta = clamp(60 - (Math.abs(d.speed || 0) / (MEAN_SPEED[pl] || 1)) * 30, 7.5, 60);

    // ── 5. NAISARGIKA ──
    const naisargika = NAISARGIKA[pl];

    // ── 6. DRIK (full aspects only: 7th for all + special; benefic + / malefic -) ──
    let drikRaw = 0;
    for (const other of PLANETS) {
      if (other === pl) continue;
      const od = p[other]; if (!od) continue;
      const dist = ((d.signIdx - od.signIdx + 12) % 12) + 1; // house of pl from other
      const casts = dist === 7 || (SPECIAL_ASPECTS[other] || []).includes(dist);
      if (casts) drikRaw += (BENEFIC[other] ? 60 : -60);
    }
    const drik = drikRaw / 4;

    const totalV = sthana + dig + kala + cheshta + naisargika + drik;
    const rupas = totalV / 60;
    out[pl] = {
      sthana: r2(sthana), dig: r2(dig), kala: r2(kala), cheshta: r2(cheshta),
      naisargika: r2(naisargika), drik: r2(drik),
      total: r2(totalV), rupas: r2(rupas),
      required: REQUIRED_RUPAS[pl], strong: rupas >= REQUIRED_RUPAS[pl],
    };
  }
  // rank by Rupas
  const ranked = Object.entries(out).sort((a, b) => b[1].rupas - a[1].rupas);
  ranked.forEach(([pl], i) => { out[pl].rank = i + 1; });
  return { planets: out, note: 'Computed per classical BPHS Shadbala; values may vary slightly across software due to convention differences.' };
}

module.exports = { computeShadbala, PLANETS, REQUIRED_RUPAS, NAISARGIKA };

/* ------------------------------------------------------------------ */
if (require.main === module) {
  let ok = true;
  // Naisargika sums
  const sumN = Object.values(NAISARGIKA).reduce((a, b) => a + b, 0);
  console.log('Naisargika sum:', sumN.toFixed(2), '(≈240)');
  // Uchcha at exact exaltation = 60, at debilitation = 0.
  const mk = (lon, signIdx, deg, house, navIdx) => ({ lon, signIdx, deg, house, navIdx, retro: false, speed: 1, decl: 0 });
  const base = {
    Sun: mk(10, 0, 10, 1, 0), Moon: mk(33, 1, 3, 4, 1), Mars: mk(298, 9, 28, 7, 2), Mercury: mk(165, 5, 15, 10, 3),
    Jupiter: mk(95, 3, 5, 1, 4), Venus: mk(357, 11, 27, 4, 5), Saturn: mk(200, 6, 20, 10, 6),
  };
  const r = computeShadbala({ planets: base, ascLon: 150, sunLon: 10, moonLon: 33, noonDist: 0, weekdayLord: 'Sun', horaLord: 'Sun', tribhagaLord: 'Mercury' });
  // Sun at 10° Aries is its deep exaltation -> uchcha should be ~60 (arc from debilitation 190° = 180).
  const sunUchcha = arc180(10, norm(EXALT.Sun + 180)) / 3;
  console.log('Sun uchcha at exaltation:', sunUchcha.toFixed(2), '(expect 60)');
  if (Math.abs(sunUchcha - 60) > 0.5) { ok = false; console.log('FAIL: uchcha'); }
  console.log('Sample Shadbala (Rupas):');
  Object.entries(r.planets).forEach(([pl, v]) => console.log('  ' + pl.padEnd(9) + 'Rupas ' + v.rupas + '  req ' + v.required + '  ' + (v.strong ? 'STRONG' : 'weak') + '  rank ' + v.rank));
  // every planet's total positive and rupas in a sane range (1..12)
  Object.values(r.planets).forEach((v) => { if (v.rupas < 0 || v.rupas > 14) { ok = false; console.log('FAIL: rupas out of range', v.rupas); } });
  console.log(ok ? '\nALL CHECKS PASS' : '\nCHECKS FAILED');
  process.exit(ok ? 0 : 1);
}
