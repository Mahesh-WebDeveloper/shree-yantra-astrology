// Fills missing Valmiki Ramayan English using the AshuVj dataset's `translation` field
// (kandas 1-6 are ~100% there; original import only used `explanation`). Uttara Kanda has neither.
// Usage: node src/scripts/fillRamayanEnglish.js
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const RamayanSarga = require('../models/RamayanSarga');

const URL = 'https://raw.githubusercontent.com/AshuVj/Valmiki_Ramayan_Dataset/main/data/Valmiki_Ramayan_Shlokas.json';
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

async function run() {
  const res = await fetch(URL);
  const rows = await res.json();
  // map kanda|sarga|shloka -> best english (translation preferred, else explanation)
  const map = new Map();
  for (const r of rows) {
    const en = clean(r.translation) || clean(r.explanation);
    if (en) map.set(`${r.kanda}|${r.sarga}|${r.shloka}`, en);
  }

  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — filling Ramayan English from translation field…');
  const docs = await RamayanSarga.find({});
  let filled = 0;
  for (const doc of docs) {
    let changed = false;
    for (const v of doc.shlokas) {
      if (v.english) continue;
      const en = map.get(`${doc.kanda}|${doc.sarga}|${v.shloka}`);
      if (en) { v.english = en; filled++; changed = true; }
    }
    if (changed) await doc.save();
  }
  console.log(`Done. ${filled} shlokas filled.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
