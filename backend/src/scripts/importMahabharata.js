// Mahabharata import — DharmicData per-shloka JSON (18 parva). Sanskrit + AI Hindi (English deferred).
// Stored in generic VedaText with veda='mahabharata', book=parva, section=adhyaya, verse=shloka.
// Usage: node src/scripts/importMahabharata.js [firstBook] [lastBook]
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36';
const DD = (b) => `https://raw.githubusercontent.com/bhavykhatri/DharmicData/main/Mahabharata/mahabharata_book_${b}.json`;

async function run() {
  const first = Number(process.argv[2]) || 1;
  const last = Number(process.argv[3]) || 18;
  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — importing Mahabharata parva ${first}-${last}…`);
  if (first === 1) await VedaText.deleteMany({ veda: 'mahabharata' });

  let totalShlokas = 0, totalChapters = 0;
  for (let b = first; b <= last; b++) {
    const res = await fetch(DD(b), { headers: { 'User-Agent': UA } });
    if (!res.ok) { console.log(`  parva ${b}: ${res.status}`); continue; }
    const rows = await res.json();
    // group by chapter
    const byCh = new Map();
    for (const r of rows) {
      const ch = Number(r.chapter);
      if (!byCh.has(ch)) byCh.set(ch, []);
      byCh.get(ch).push({ verse: Number(r.shloka), sanskrit: String(r.text || '').trim(), transliteration: '', english: '', hindi: '' });
    }
    const docs = [...byCh.entries()]
      .sort((a, x) => a[0] - x[0])
      .map(([ch, verses]) => {
        verses.sort((p, q) => p.verse - q.verse);
        return {
          veda: 'mahabharata', book: b, bookName: `Parva ${b}`,
          section: ch, sectionName: `Adhyaya ${ch}`, verseCount: verses.length, verses,
        };
      });
    // insert in batches (large parvas)
    for (let i = 0; i < docs.length; i += 200) {
      await VedaText.insertMany(docs.slice(i, i + 200), { ordered: false });
    }
    totalChapters += docs.length;
    totalShlokas += rows.length;
    console.log(`  parva ${b}: ${docs.length} adhyaya, ${rows.length} shloka`);
  }
  console.log(`Done. ${totalChapters} adhyaya, ${totalShlokas} shloka imported.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
