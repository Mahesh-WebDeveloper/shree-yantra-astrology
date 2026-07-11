// Mahapuranas import — seeds the 18 Mahapuranas into the generic VedaText store so
// they read exactly like Mahabharata/Vedas (DB-backed, per-verse AI Hindi meaning,
// same VedaScreen → VedaVerse UI). Content = curated invocation + section summaries
// (from mobile data), veda='puran-<name>', book=1, section=chapter, verse=line.
// Usage: node src/scripts/importMahapuranas.js
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');
const PURANAS = require('../data/mahapuranas.json');

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — importing ${PURANAS.length} Mahapuranas…`);
  let totalSec = 0, totalVerse = 0;
  for (const p of PURANAS) {
    await VedaText.deleteMany({ veda: p.id });               // idempotent re-seed
    if (p.sections.length) await VedaText.insertMany(p.sections, { ordered: false });
    totalSec += p.sections.length;
    totalVerse += p.sections.reduce((a, s) => a + (s.verses ? s.verses.length : 0), 0);
    console.log(`  ${p.id} (${p.title}): ${p.sections.length} sections`);
  }
  console.log(`Done. ${PURANAS.length} puranas, ${totalSec} sections, ${totalVerse} verses.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
