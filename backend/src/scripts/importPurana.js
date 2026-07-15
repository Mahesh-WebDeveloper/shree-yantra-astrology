// Generic complete-Purana import — replaces a placeholder with the full text.
//
// Source files are scraped from Sanskrit Wikisource (public domain editions) by the
// fetchPurana pipeline; the Sanskrit is verbatim, only the verse INDEX is ours (printed
// numbering restarts around mangala shlokas, the app needs a unique ordered index).
// Hindi meaning is NOT stored — it comes per-verse from /api/ai/veda-explain (cached),
// and per-chapter stories come from generatePuranaStories.js.
//
// Usage: node src/scripts/importPurana.js <veda-id> <data-file>
//   e.g. node src/scripts/importPurana.js puran-vishnu src/data/vishnuPurana.json
require('../config/env');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

const VEDA = process.argv[2];
const FILE = process.argv[3];
if (!VEDA || !FILE || !VEDA.startsWith('puran-')) {
  console.error('Usage: node src/scripts/importPurana.js <puran-id> <data-file>');
  process.exit(1);
}
const CHAPTERS = require(path.resolve(FILE));

async function run() {
  await mongoose.connect(env.mongoUri);

  const shlokas = CHAPTERS.reduce((a, c) => a + c.verses.length, 0);
  const books = [...new Set(CHAPTERS.map((c) => c.bookName))];
  console.log(`Mongo connected — importing ${VEDA}: ${CHAPTERS.length} adhyayas, ${shlokas} shlokas, ${books.length} parts`);

  const before = await VedaText.countDocuments({ veda: VEDA });
  await VedaText.deleteMany({ veda: VEDA });          // idempotent re-seed (drops the placeholder)
  console.log(`  cleared ${before} old docs`);

  const docs = CHAPTERS.map((c) => ({
    veda: VEDA,
    book: c.book,
    bookName: c.bookName,
    section: c.section,
    sectionName: c.sectionName,
    verseCount: c.verses.length,
    hindiReady: false,
    verses: c.verses.map((v) => ({ verse: v.verse, sanskrit: v.sanskrit, transliteration: '', english: '', hindi: '' })),
  }));

  for (let i = 0; i < docs.length; i += 100) {
    await VedaText.insertMany(docs.slice(i, i + 100), { ordered: false });
  }

  console.log('Per part:');
  for (const name of books) {
    const secs = CHAPTERS.filter((c) => c.bookName === name);
    console.log(`  ${name.padEnd(24)} ${String(secs.length).padStart(3)} adhyaya · ${secs.reduce((a, s) => a + s.verses.length, 0)} shloka`);
  }
  console.log(`\nDone. ${docs.length} adhyayas, ${shlokas} shlokas.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
