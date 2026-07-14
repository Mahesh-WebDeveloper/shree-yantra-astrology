'use strict';

/**
 * observanceSearchSanity.js — prints the top-5 catalog matches for the queries the festival
 * search MUST get right (typos, both scripts, families). No dates are involved: this only
 * exercises the fuzzy scorer over the catalog, which is exactly what the app does locally.
 *
 *   node src/scripts/observanceSearchSanity.js
 */

const { observanceCatalog, searchObservanceCatalog } = require('../services/observance.service');
const { canonical } = require('../utils/fuzzyMatch');

const QUERIES = [
  'dipawali', 'divali', 'deepavali', 'diwaali',
  'holika', 'hola', 'holi',
  'shivratri', 'shivaratri', 'mahashivratri',
  'janmastami', 'janmashtmi',
  'ekadasi', 'ekadashi',
  'करवा', 'दीवाली', 'होली', 'छठ',
  'karva chauth', 'karwachauth',
  'navratri', 'navaratri',
  'qwerty', // must return NOTHING
];

const catalog = observanceCatalog();
console.log(`catalog: ${catalog.length} observances\n`);

for (const q of QUERIES) {
  const hits = searchObservanceCatalog(q, { limit: 5 });
  console.log(`${q}  →  [${canonical(q)}]`);
  if (!hits.length) console.log('    (no results)');
  for (const h of hits) {
    console.log(`    ${String(Math.round(h.score)).padStart(3)}  ${h.name.en.padEnd(34)} ${h.name.hi}`);
  }
  console.log('');
}
