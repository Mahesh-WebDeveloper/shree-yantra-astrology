'use strict';

/**
 * verifyObservances.js — acceptance test for the deterministic observance engine.
 *
 * Compares every date OUR engine computes against a Drik Panchang 2026 fixture for
 * Jodhpur (26.2389 N, 73.0243 E, +05:30). No dates are hardcoded in the engine —
 * this file is the ONLY place 2026 dates appear, and only as expected values.
 *
 *   node src/scripts/verifyObservances.js
 */

const { buildIndex, observancesForDate } = require('../services/observance.service');

const LAT = 26.2389;
const LNG = 73.0243;
const TZ = '+05:30';
const YEAR = 2026;

// Drik Panchang 2026, Jodhpur. [expected date DD/MM, observance key]
const FIXTURE = [
  ['03/01', 'purnima-pausha'],
  ['06/01', 'sakat-chauth'],
  ['14/01', 'makar-sankranti'],
  ['14/01', 'pongal'],
  ['14/01', 'sankranti-makara'],
  ['14/01', 'ekadashi-shattila'],
  ['18/01', 'mauni-amavasya'],
  ['23/01', 'vasant-panchami'],
  ['25/01', 'ratha-saptami'],
  ['26/01', 'bhishma-ashtami'],
  ['29/01', 'ekadashi-jaya'],
  ['01/02', 'purnima-magha'],
  ['13/02', 'sankranti-kumbha'],
  ['13/02', 'ekadashi-vijaya'],
  ['15/02', 'maha-shivaratri'],
  ['27/02', 'ekadashi-amalaki'],
  ['02/03', 'holika-dahan'],
  ['03/03', 'holi'],
  ['03/03', 'purnima-phalguna'],
  ['11/03', 'shitala-ashtami'],
  ['15/03', 'sankranti-meena'],
  ['15/03', 'ekadashi-papamochani'],
  ['19/03', 'ugadi'],
  ['19/03', 'gudi-padwa'],
  ['19/03', 'chaitra-navratri'],
  ['21/03', 'gangaur'],
  ['26/03', 'ram-navami'],
  ['29/03', 'ekadashi-kamada'],
  ['02/04', 'hanuman-jayanti'],
  ['02/04', 'purnima-chaitra'],
  ['13/04', 'ekadashi-varuthini'],
  ['14/04', 'sankranti-mesha'],
  ['19/04', 'akshaya-tritiya'],
  ['19/04', 'parashurama-jayanti'],
  ['25/04', 'sita-navami'],
  ['27/04', 'ekadashi-mohini'],
  ['30/04', 'narasimha-jayanti'],
  ['01/05', 'buddha-purnima'],
  ['01/05', 'purnima-vaishakha'],
  ['13/05', 'ekadashi-apara'],
  ['15/05', 'sankranti-vrishabha'],
  ['16/05', 'vat-savitri'],
  ['16/05', 'shani-jayanti'],
  ['25/05', 'ganga-dussehra'],
  ['27/05', 'ekadashi-padmini'],
  ['31/05', 'purnima-jyeshtha-adhika'],
  ['11/06', 'ekadashi-parama'],
  ['15/06', 'sankranti-mithuna'],
  ['25/06', 'ekadashi-nirjala'],
  ['29/06', 'vat-purnima'],
  ['29/06', 'purnima-jyeshtha'],
  ['10/07', 'ekadashi-yogini'],
  ['16/07', 'jagannath-rathyatra'],
  ['16/07', 'sankranti-karka'],
  ['25/07', 'ekadashi-devshayani'],
  ['29/07', 'guru-purnima'],
  ['29/07', 'purnima-ashadha'],
  ['09/08', 'ekadashi-kamika'],
  ['15/08', 'hariyali-teej'],
  ['17/08', 'nag-panchami'],
  ['17/08', 'sankranti-simha'],
  ['23/08', 'ekadashi-shravana-putrada'],
  ['28/08', 'raksha-bandhan'],
  ['28/08', 'purnima-shravana'],
  ['04/09', 'janmashtami'],
  ['07/09', 'ekadashi-aja'],
  ['14/09', 'hartalika-teej'],
  ['14/09', 'ganesh-chaturthi'],
  ['15/09', 'rishi-panchami'],
  ['17/09', 'sankranti-kanya'],
  ['19/09', 'radha-ashtami'],
  ['22/09', 'ekadashi-parivartini'],
  ['25/09', 'anant-chaturdashi'],
  ['25/09', 'ganesh-visarjan'],
  ['26/09', 'purnima-bhadrapada'],
  ['27/09', 'pitrupaksha'],
  ['06/10', 'ekadashi-indira'],
  ['10/10', 'sarvapitri-amavasya'],
  ['11/10', 'navratri'],
  ['17/10', 'sankranti-tula'],
  ['19/10', 'durga-ashtami'],
  ['19/10', 'maha-navami'],
  ['20/10', 'dussehra'],
  ['22/10', 'ekadashi-papankusha'],
  ['25/10', 'sharad-purnima'],
  ['29/10', 'karwa-chauth'],
  ['01/11', 'ahoi-ashtami'],
  ['05/11', 'ekadashi-rama'],
  ['06/11', 'dhanteras'],
  ['08/11', 'diwali'],
  ['08/11', 'naraka-chaturdashi'],
  ['09/11', 'govardhan-puja'],
  ['11/11', 'bhai-dooj'],
  ['15/11', 'chhath-puja'],
  ['16/11', 'sankranti-vrishchika'],
  ['20/11', 'ekadashi-devutthana'],
  ['21/11', 'tulsi-vivah'],
  ['24/11', 'kartik-purnima'],
  ['01/12', 'kalabhairav-jayanti'],
  ['04/12', 'ekadashi-utpanna'],
  ['14/12', 'vivah-panchami'],
  ['16/12', 'sankranti-dhanu'],
  ['20/12', 'gita-jayanti'],
  ['20/12', 'ekadashi-mokshada'],
  ['23/12', 'datta-jayanti'],
  ['23/12', 'purnima-margashirsha'],
];

function run() {
  const idx = buildIndex(YEAR, LAT, LNG, TZ);

  // key → the date(s) our engine puts it on inside the target year
  const computed = new Map();
  for (const [dmy, list] of idx) {
    if (!dmy.endsWith(`/${YEAR}`)) continue;
    for (const o of list) {
      const arr = computed.get(o.key) || [];
      arr.push(dmy);
      computed.set(o.key, arr);
    }
  }

  const mismatches = [];
  let pass = 0;
  console.log(`Observance engine vs Drik Panchang ${YEAR} — Jodhpur (${LAT}, ${LNG}) ${TZ}\n`);
  console.log('EXPECTED    OURS        RESULT  KEY');
  console.log('-'.repeat(72));

  for (const [expDM, key] of FIXTURE) {
    const expected = `${expDM}/${YEAR}`;
    const ours = computed.get(key) || [];
    const ok = ours.includes(expected);
    if (ok) pass += 1; else mismatches.push({ key, expected, ours });
    console.log(
      `${expected}  ${(ours.join(', ') || '—').padEnd(11)} ${ok ? 'PASS  ' : 'FAIL  '} ${key}`,
    );
  }

  const total = FIXTURE.length;
  console.log('-'.repeat(72));
  console.log(`\n${pass}/${total} matched (${((pass / total) * 100).toFixed(1)}%)\n`);

  if (mismatches.length) {
    console.log('MISMATCHES');
    for (const m of mismatches) {
      console.log(`  ${m.key}: expected ${m.expected}, engine says ${m.ours.join(', ') || '(not produced)'}`);
      const [dd, mm, yy] = m.expected.split('/').map(Number);
      const obs = observancesForDate({ dateObj: new Date(yy, mm - 1, dd), lat: LAT, lng: LNG, tz: TZ });
      const note = obs[0] && obs[0].note ? obs[0].note.en : '(none)';
      console.log(`      panchang on ${m.expected}: ${note}`);
      console.log(`      observances our engine puts on ${m.expected}: ${obs.map((o) => o.key).join(', ') || '(none)'}`);
    }
    console.log('');
  }
  process.exitCode = mismatches.length ? 1 : 0;
}

run();
