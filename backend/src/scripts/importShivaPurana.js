// Complete Śivapurāṇa import — the full text, not the placeholder.
//
// Source: Sanskrit Wikisource (https://sa.wikisource.org/wiki/शिवपुराणम्), which reproduces
// the public-domain Venkatesvara Steam Press edition. 7 samhitas / 458 adhyayas.
// GRETIL was the first choice but only carries books 1 and 7 — Rudra, Satarudra, Kotirudra,
// Uma and Kailasa samhitas are absent there, so it cannot give the complete text.
//
// The Sanskrit is verbatim from the source; nothing here is generated. Only the verse
// INDEX is ours: the printed edition restarts numbering at १ after the mangala shloka, so
// its numbers repeat inside a chapter, and the app needs a unique ordered index.
//
// Rudra Samhita's 5 khandas and Vayaviya's 2 bhagas each become their own `book` (the model
// is book/section), so the 7 samhitas map onto 12 parts; bookName keeps the samhita name so
// the app still reads as the canonical 7-samhita text.
//
// Hindi meaning is NOT stored — it comes per-verse from /api/ai/veda-explain and is cached,
// exactly like Mahabharata. Usage: node src/scripts/importShivaPurana.js
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');
const CHAPTERS = require('../data/shivaPurana.json');

const VEDA = 'puran-shiva';

async function run() {
  await mongoose.connect(env.mongoUri);

  const shlokas = CHAPTERS.reduce((a, c) => a + c.verses.length, 0);
  const books = [...new Set(CHAPTERS.map((c) => c.bookName))];
  console.log(`Mongo connected — importing Shiva Purana: ${CHAPTERS.length} adhyayas, ${shlokas} shlokas, ${books.length} parts`);

  const before = await VedaText.countDocuments({ veda: VEDA });
  await VedaText.deleteMany({ veda: VEDA });               // idempotent re-seed (drops the 8-verse placeholder)
  console.log(`  cleared ${before} old docs (placeholder)`);

  const docs = CHAPTERS.map((c) => ({
    veda: VEDA,
    book: c.book,
    bookName: c.bookName,
    section: c.section,
    sectionName: c.sectionName,
    verseCount: c.verses.length,
    hindiReady: false,                                     // AI fills Hindi on demand, then caches
    verses: c.verses.map((v) => ({ verse: v.verse, sanskrit: v.sanskrit, transliteration: '', english: '', hindi: '' })),
  }));

  for (let i = 0; i < docs.length; i += 100) {
    await VedaText.insertMany(docs.slice(i, i + 100), { ordered: false });
    console.log(`  inserted ${Math.min(i + 100, docs.length)}/${docs.length}`);
  }

  console.log('\nPer part:');
  for (const name of books) {
    const secs = CHAPTERS.filter((c) => c.bookName === name);
    console.log(`  ${name.padEnd(34)} ${String(secs.length).padStart(3)} adhyaya · ${secs.reduce((a, s) => a + s.verses.length, 0)} shloka`);
  }
  console.log(`\nDone. ${docs.length} adhyayas, ${shlokas} shlokas.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
