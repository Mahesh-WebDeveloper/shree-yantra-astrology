// Fix Samaveda structure: split into Purvarchika (650 mantra = 65 dasati) + Uttararchika.
// Preserves all verses + English. Boundary by count (GRETIL has no section header).
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

const PURVA_DASATIS = 65; // 650 mantras

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — restructuring Samaveda…');
  // load all in order, recompute book/section, then delete + reinsert (avoids unique-index clashes)
  const docs = await VedaText.find({ veda: 'samaveda' }).sort({ book: 1, section: 1 }).lean();
  const rebuilt = docs.map((doc, i) => {
    const idx = i + 1;
    const purva = idx <= PURVA_DASATIS;
    const sec = purva ? idx : idx - PURVA_DASATIS;
    return {
      veda: 'samaveda', book: purva ? 1 : 2,
      bookName: purva ? 'Purvarchika' : 'Uttararchika',
      section: sec, sectionName: `Dasati ${sec}`,
      verseCount: doc.verseCount, hindiReady: doc.hindiReady, verses: doc.verses,
    };
  });
  await VedaText.deleteMany({ veda: 'samaveda' });
  await VedaText.insertMany(rebuilt, { ordered: false });
  const b1 = await VedaText.countDocuments({ veda: 'samaveda', book: 1 });
  const b2 = await VedaText.countDocuments({ veda: 'samaveda', book: 2 });
  console.log(`Done. Purvarchika: ${b1} dasati, Uttararchika: ${b2} dasati.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
