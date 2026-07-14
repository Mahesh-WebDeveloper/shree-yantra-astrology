'use strict';

/**
 * verifyObservances.js — acceptance test for the deterministic observance engine.
 *
 * Scores TWO years of Drik Panchang ground truth for Jodhpur:
 *   2026 — the year the rules were derived against (in-sample)
 *   2027 — fetched from Drik afterwards (OUT-OF-SAMPLE; this is the year that actually
 *          tests whether the rules are rules, or just curve-fitting to 2026)
 *
 * The fixtures are the ONLY place a real date appears; the engine never reads them.
 * A failing row is a wrong RULE, never a wrong date — so each mismatch prints the
 * fixture's `basis`, which says what the rule was supposed to be.
 *
 *   node src/scripts/verifyObservances.js
 */

const { buildIndex, observancesForDate } = require('../services/observance.service');

const LAT = 26.2389;
const LNG = 73.0243;
const TZ = '+05:30';

const YEARS = [
  { year: 2026, fixture: require('./drik2026.fixture') },
  { year: 2027, fixture: require('./drik2027.fixture') },
];

function scoreYear({ year, fixture }) {
  const idx = buildIndex(year, LAT, LNG, TZ);

  // key → every date the engine puts it on inside the target year
  const computed = new Map();
  for (const [dmy, list] of idx) {
    if (!dmy.endsWith(`/${year}`)) continue;
    for (const o of list) {
      const arr = computed.get(o.key) || [];
      arr.push(dmy);
      computed.set(o.key, arr);
    }
  }

  const scored = fixture.filter((r) => !r.skip);
  const skipped = fixture.filter((r) => r.skip);
  const mismatches = [];
  let pass = 0;

  console.log(`\n${'='.repeat(96)}`);
  console.log(`${year} — Jodhpur (${LAT}, ${LNG}) ${TZ}`);
  console.log('='.repeat(96));
  console.log('EXPECTED     OURS                     RESULT  KEY');
  console.log('-'.repeat(96));

  for (const row of scored) {
    const ours = (computed.get(row.key) || []).slice().sort();
    const ok = ours.includes(row.date);
    if (ok) pass += 1; else mismatches.push({ ...row, ours });
    console.log(
      `${row.date}   ${(ours.join(' ') || '—').padEnd(24)} ${ok ? 'PASS  ' : 'FAIL  '} ${row.key}`,
    );
  }

  console.log('-'.repeat(96));
  console.log(`${year}: ${pass}/${scored.length} matched (${((pass / scored.length) * 100).toFixed(1)}%)`);

  if (mismatches.length) {
    console.log(`\n${year} MISMATCHES`);
    for (const m of mismatches) {
      console.log(`  ${m.key}`);
      console.log(`      basis:    ${m.basis}`);
      console.log(`      expected: ${m.date}`);
      console.log(`      engine:   ${m.ours.join(', ') || '(key never produced)'}`);
      const [dd, mm, yy] = m.date.split('/').map(Number);
      const obs = observancesForDate({ dateObj: new Date(yy, mm - 1, dd), lat: LAT, lng: LNG, tz: TZ });
      console.log(`      engine puts on ${m.date}: ${obs.map((o) => o.key).join(', ') || '(nothing)'}`);
      if (obs[0] && obs[0].note) console.log(`      panchang there: ${obs[0].note.en}`);
    }
  }

  if (skipped.length) {
    console.log(`\n${year} NOT SCORED (${skipped.length}) — Drik prints these, the engine has no rule for them`);
    for (const s of skipped) console.log(`  ${s.date}  ${s.key.padEnd(22)} ${s.basis}`);
  }

  return { year, pass, total: scored.length, mismatches: mismatches.length, skipped: skipped.length };
}

function run() {
  const results = YEARS.map(scoreYear);

  const pass = results.reduce((a, r) => a + r.pass, 0);
  const total = results.reduce((a, r) => a + r.total, 0);
  const skipped = results.reduce((a, r) => a + r.skipped, 0);

  console.log(`\n${'='.repeat(96)}`);
  console.log('SUMMARY');
  console.log('='.repeat(96));
  for (const r of results) {
    console.log(`  ${r.year}: ${String(r.pass).padStart(3)}/${String(r.total).padEnd(3)} (${((r.pass / r.total) * 100).toFixed(1)}%)  ${r.mismatches ? `${r.mismatches} FAILED` : 'all passed'}`);
  }
  console.log(`\n  ${pass}/${total} matched (${((pass / total) * 100).toFixed(1)}%)  —  ${skipped} rows recorded but not scored\n`);

  process.exitCode = pass === total ? 0 : 1;
}

run();
