'use strict';
/**
 * numerology.test.js — standalone assertions (no framework). Run: `node numerology.test.js`.
 * Proves the MATH against known reference values. Interpretation tables are NOT asserted
 * here (they are tradition/opinion and live in editable config).
 */
const N = require('./numerology.service');

let pass = 0; let fail = 0;
function eq(label, got, want) {
  const g = JSON.stringify(got); const w = JSON.stringify(want);
  if (g === w) { pass += 1; } else { fail += 1; console.error(`✗ ${label}\n    got : ${g}\n    want: ${w}`); }
}
function ok(label, cond) { if (cond) { pass += 1; } else { fail += 1; console.error(`✗ ${label}`); } }

// ── Reference DOB 28-07-1990 ──
eq('Mulank(28-07-1990) = 1', N.mulank(28).final, 1);
eq('Bhagyank(28-07-1990) = 9', N.bhagyank(28, 7, 1990).final, 9);

// ── Chaldean: 9 is sacred — no letter is valued 9 ──
ok('Chaldean has no letter = 9', !Object.values(N.CHALDEAN).includes(9));
eq("Chaldean f = 8", N.chaldeanValue('f'), 8);
eq("Chaldean o = 7", N.chaldeanValue('o'), 7);

// ── Pythagorean map: A=1, J=1, S=1, Z=8 ──
eq('Pythagorean a = 1', N.pythagoreanValue('a'), 1);
eq('Pythagorean j = 1', N.pythagoreanValue('j'), 1);
eq('Pythagorean s = 1', N.pythagoreanValue('s'), 1);
eq('Pythagorean z = 8', N.pythagoreanValue('z'), 8);

// ── Master numbers 11/22/33 are NOT reduced ──
eq('reduce(11) stays 11', N.reduceNumber(11).final, 11);
eq('reduce(22) stays 22', N.reduceNumber(22).final, 22);
eq('reduce(33) stays 33', N.reduceNumber(33).final, 33);
ok('11 flagged master', N.reduceNumber(11).isMaster === true);

// ── Karmic Debt 13/14/16/19 flagged ──
[13, 14, 16, 19].forEach((k) => ok(`${k} flagged Karmic Debt`, N.reduceNumber(k).isKarmic === true));
eq('reduce(13).final = 4', N.reduceNumber(13).final, 4);
ok('12 NOT karmic', N.reduceNumber(12).isKarmic === false);

// ── Lo Shu grid for 28-07-1990 (digits 2,8,7,1,9,9 + Mulank 1 + Bhagyank 9) ──
const grid = N.loShuGrid(28, 7, 1990);
eq('Lo Shu count[1] = 2', grid.counts[1], 2);
eq('Lo Shu count[9] = 3', grid.counts[9], 3);
eq('Lo Shu missing = [3,4,5,6]', grid.missing, [3, 4, 5, 6]);

// ── Number → Planet ──
eq('1 → Sun', N.planetOf(1).en, 'Sun');
eq('8 → Saturn', N.planetOf(8).en, 'Saturn');

// ── Compatibility ──
eq('relation(1,8) = Enemy', N.relation(1, 8).key, 'enemy');
eq('relation(1,3) = Friend', N.relation(1, 3).key, 'friend');
eq('mobile 98765 43210 total = 9', N.numberTotal('98765 43210').final, 9); // 9+8+7+6+5+4+3+2+1+0 = 45 → 9
eq('check ignores non-digits', N.numberTotal('98-76').final, N.numberTotal('9876').final);

// ── Full profile shape ──
const prof = N.fullProfile({ name: 'Amit Sharma', d: 28, m: 7, y: 1990 });
ok('profile has mulank.planet', !!prof.mulank.planet);
ok('profile has loShu.counts', !!prof.loShu.counts);
ok('profile has disclaimer', !!prof.disclaimer.hi);

console.log(`\nNumerology tests: ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
