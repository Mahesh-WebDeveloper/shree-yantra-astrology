// Honest content audit — DB me har book ka actual count + English/Hindi coverage.
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const GitaChapter = require('../models/GitaChapter');
const RamayanSarga = require('../models/RamayanSarga');
const Ramcharitmanas = require('../models/Ramcharitmanas');
const RigVeda = require('../models/RigVeda');
const VedaText = require('../models/VedaText');

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('\n================ CONTENT AUDIT ================\n');

  // Gita
  {
    const chs = await GitaChapter.find({}, { verses: 1 }).lean();
    let total = 0, en = 0, hi = 0;
    for (const c of chs) for (const v of c.verses) { total++; if (v.english) en++; if (v.hindi) hi++; }
    console.log(`GITA: ${chs.length} chapters, ${total} verses | English ${pct(en,total)}% | Hindi(static) ${pct(hi,total)}%  [canonical: 18 ch, 700 verses]`);
  }
  // Valmiki Ramayan
  {
    const sg = await RamayanSarga.find({}, { shlokas: 1, kandaOrder: 1 }).lean();
    let total = 0, en = 0, hi = 0;
    const kandas = new Set();
    for (const s of sg) { kandas.add(s.kandaOrder); for (const v of s.shlokas) { total++; if (v.english) en++; if (v.hindi) hi++; } }
    console.log(`VALMIKI RAMAYAN: ${kandas.size} kanda, ${sg.length} sarga, ${total} shloka | English ${pct(en,total)}% | Hindi(static) ${pct(hi,total)}%  [canonical: 7 kanda, ~24000 shloka]`);
  }
  // Ramcharitmanas
  {
    const ks = await Ramcharitmanas.find({}, { verseCount: 1 }).lean();
    const total = ks.reduce((s, k) => s + (k.verseCount || 0), 0);
    console.log(`RAMCHARITMANAS: ${ks.length} kand, ${total} chand | mool text only (no meaning)  [canonical: 7 kand]`);
  }
  // Rigveda
  {
    const su = await RigVeda.find({}, { mantras: 1 }).lean();
    let total = 0, en = 0, hi = 0;
    for (const s of su) for (const v of s.mantras) { total++; if (v.english) en++; if (v.hindi) hi++; }
    console.log(`RIGVEDA: ${su.length} sukta, ${total} mantra | English ${pct(en,total)}% | Hindi(authentic) ${pct(hi,total)}%  [canonical: 10 mandala, 1028 sukta, 10552 mantra]`);
  }
  // VedaText vedas + mahabharata
  for (const [veda, canon] of [
    ['yajurveda', 'Shukla Madhyandina ~1975 verses'],
    ['samaveda', '~1875 verses'],
    ['atharvaveda', 'Shaunaka ~5977 verses'],
    ['mahabharata', 'critical edition ~75000 shloka'],
  ]) {
    const docs = await VedaText.find({ veda }, { verses: 1, book: 1 }).lean();
    let total = 0, en = 0, hi = 0;
    const books = new Set();
    for (const d of docs) { books.add(d.book); for (const v of d.verses) { total++; if (v.english) en++; if (v.hindi) hi++; } }
    console.log(`${veda.toUpperCase()}: ${books.size} books, ${docs.length} sections, ${total} verses | English ${pct(en,total)}% | Hindi(authentic) ${pct(hi,total)}%  [canonical: ${canon}]`);
  }

  console.log('\n==============================================\n');
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
