// Samaveda import — reads samaveda.json (GRETIL IAST->Devanagari, built by samaveda_build).
// Authentic Sanskrit + AI Hindi (English source alignment deferred). Usage: node src/scripts/importSama.js
require('../config/env');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

async function run() {
  const jsonPath = process.argv[2] || path.join(__dirname, 'veda-hindi', 'samaveda.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — importing Samaveda…');
  await VedaText.deleteMany({ veda: 'samaveda' });

  const docs = data.map((d) => ({
    veda: 'samaveda',
    book: d.book,
    bookName: d.book === 1 ? 'Purvarchika' : 'Uttararchika',
    section: d.section,
    sectionName: `Dasati ${d.section}`,
    verseCount: d.verses.length,
    verses: d.verses.map((v) => ({ verse: v.verse, sanskrit: v.sanskrit, transliteration: '', english: v.english || '', hindi: '' })),
  }));
  await VedaText.insertMany(docs, { ordered: false });
  const total = docs.reduce((s, d) => s + d.verseCount, 0);
  console.log(`Done. ${docs.length} sections, ${total} verses.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
