// Valmiki Ramayana import — public-domain dataset (AshuVj/Valmiki_Ramayan_Dataset).
// 23,402 shlok, 7 kanda → per-sarga docs me DB me. Run: npm run import:ramayan
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const RamayanSarga = require('../models/RamayanSarga');

const URL = 'https://raw.githubusercontent.com/AshuVj/Valmiki_Ramayan_Dataset/main/data/Valmiki_Ramayan_Shlokas.json';
const KANDA_ORDER = {
  'Bala Kanda': 1, 'Ayodhya Kanda': 2, 'Aranya Kanda': 3, 'Kishkindha Kanda': 4,
  'Sundara Kanda': 5, 'Yuddha Kanda': 6, 'Uttara Kanda': 7,
};
const clean = (s) => (s || '').toString().replace(/\s+\n/g, '\n').trim();

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — fetching Valmiki Ramayana dataset…');
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const rows = await res.json();
  console.log(`  fetched ${rows.length} shlokas`);

  // group by kanda + sarga
  const map = new Map(); // key "order|sarga" -> doc
  for (const r of rows) {
    const order = KANDA_ORDER[r.kanda];
    if (!order) continue;
    const sarga = Number(r.sarga);
    const key = `${order}|${sarga}`;
    let doc = map.get(key);
    if (!doc) {
      doc = { kanda: r.kanda, kandaOrder: order, sarga, hindiReady: false, shlokas: [] };
      map.set(key, doc);
    }
    doc.shlokas.push({
      shloka: String(r.shloka),
      sanskrit: clean(r.shloka_text),
      transliteration: clean(r.transliteration),
      wordMeanings: clean(r.translation),
      english: clean(r.explanation),
      hindi: '',
    });
  }
  const docs = [...map.values()].map((d) => ({ ...d, shlokaCount: d.shlokas.length }));
  docs.sort((a, b) => a.kandaOrder - b.kandaOrder || a.sarga - b.sarga);

  console.log(`  grouped into ${docs.length} sargas — saving…`);
  await RamayanSarga.deleteMany({});
  await RamayanSarga.insertMany(docs, { ordered: false });

  // per-kanda summary
  const byKanda = {};
  docs.forEach((d) => {
    byKanda[d.kanda] = byKanda[d.kanda] || { sargas: 0, shlokas: 0 };
    byKanda[d.kanda].sargas += 1;
    byKanda[d.kanda].shlokas += d.shlokaCount;
  });
  Object.entries(byKanda).forEach(([k, v]) => console.log(`  + ${k}: ${v.sargas} sargas, ${v.shlokas} shlokas`));
  console.log(`Done. ${docs.length} sargas, ${rows.length} shlokas imported.`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
