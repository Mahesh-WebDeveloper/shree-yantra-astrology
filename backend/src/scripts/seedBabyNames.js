'use strict';
/**
 * seedBabyNames.js — Phase 2: bake a LARGE curated baby-name dataset ONCE using the
 * (Phase-1 constrained, accuracy-verified) AI, then write it to src/data/babyNames.js.
 * Runtime then serves browse queries from this static dataset (real, fast, offline) —
 * the AI is removed from the common name-generation path, so no fake names are possible.
 *
 * The existing curated entries are PRESERVED (they take priority over generated ones).
 * Run:  node src/scripts/seedBabyNames.js
 */
require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { generateBabyNames } = require('../services/ai.service');
const { NAMES } = require('../data/babyNames');

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVY'.split(''); // Roman first-letters with real Indian names
const GENDERS = ['boy', 'girl'];
const PER = 24; // max per (letter, gender) the engine returns
const CONCURRENCY = 3;

// keep only clean single-token given names (no surnames / spaces / digits)
const isCleanGivenName = (s) => /^[A-Z][a-z'’]{1,15}$/.test(String(s || '').trim());

async function pool(items, n, fn) {
  const out = []; let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx).catch((e) => ({ error: e.message })); }
  });
  await Promise.all(workers);
  return out;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shree_yantra', { serverSelectionTimeoutMS: 8000 });
  console.log('Mongo connected. Seeding…');

  const map = new Map(); // name.toLowerCase() -> entry (existing curated first = priority)
  for (const e of NAMES) map.set(e.name.toLowerCase(), { name: e.name, hi: e.hi || '', g: e.g, origin: e.origin || 'Sanskrit', meaning: e.meaning || '', themes: (e.themes || []).slice(0, 3), curated: true });
  const before = map.size;

  const jobs = [];
  for (const letter of LETTERS) for (const g of GENDERS) jobs.push({ letter, g });

  let added = 0;
  await pool(jobs, CONCURRENCY, async ({ letter, g }) => {
    const r = await generateBabyNames({ startWith: letter, gender: g, count: PER, lang: 'en' });
    let n = 0;
    for (const it of (r.names || [])) {
      const name = String(it.name || '').trim();
      if (!isCleanGivenName(name)) continue;
      const key = name.toLowerCase();
      if (map.has(key)) continue; // preserve curated / earlier
      map.set(key, {
        name,
        hi: String(it.nameHi || '').trim(),
        g,
        origin: String(it.origin || 'Sanskrit').trim() || 'Sanskrit',
        meaning: String(it.meaning || '').trim().slice(0, 90),
        themes: (Array.isArray(it.themes) ? it.themes : []).map((x) => String(x).trim()).filter(Boolean).slice(0, 3),
      });
      n++; added++;
    }
    console.log(`${letter} ${g}: +${n}  (total ${map.size})`);
  });

  // sort: boys then girls, alphabetical
  const all = [...map.values()].sort((a, b) => (a.g === b.g ? a.name.localeCompare(b.name) : (a.g === 'boy' ? -1 : 1)));
  const boys = all.filter((e) => e.g === 'boy').length;

  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const rows = all.map((e) =>
    `  { name: "${esc(e.name)}", hi: "${esc(e.hi)}", g: "${e.g}", origin: "${esc(e.origin)}", meaning: "${esc(e.meaning)}", themes: [${(e.themes || []).map((t) => `"${esc(t)}"`).join(', ')}] },`
  ).join('\n');

  const file = `'use strict';

/**
 * babyNames.js — curated, authentic Indian baby-name dataset (Phase 2: AI-baked + hand-curated).
 * ${all.length} names (${boys} boy / ${all.length - boys} girl). Used as the PRIMARY source for
 * letter/gender browse (real, fast, offline) and as the reliable fallback elsewhere.
 * Each entry: { name, hi (Devanagari), g: 'boy'|'girl', origin, meaning, themes }.
 * Meanings standard/verified; numerology is computed separately in code.
 * Regenerate: node src/scripts/seedBabyNames.js
 */
const NAMES = [
${rows}
];

module.exports = { NAMES };
`;

  const outPath = path.join(__dirname, '..', 'data', 'babyNames.js');
  fs.copyFileSync(outPath, outPath + '.bak'); // backup
  fs.writeFileSync(outPath, file, 'utf8');
  console.log(`\nDONE. ${before} curated kept + ${added} new = ${all.length} total (${boys} boy / ${all.length - boys} girl).`);
  console.log(`Wrote ${outPath} (backup at babyNames.js.bak)`);
  process.exit(0);
})().catch((e) => { console.error('seed failed:', e); process.exit(1); });
