// Samaveda authentic English via Rigveda match — ~75% of Samaveda verses are Rigveda incipits.
// Normalizes Sanskrit text and matches each Sama verse to a Rigveda mantra; copies its English (Wilson).
// Unmatched (Sama-unique) verses keep empty English (AI Hindi still covers). Usage: node src/scripts/matchSamaEnglish.js
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const RigVeda = require('../models/RigVeda');
const VedaText = require('../models/VedaText');

// keep only Devanagari letters/matras; drop danda, digits, avagraha, spaces, punctuation
const norm = (s) => String(s || '').normalize('NFC').replace(/[^ऀ-ॿ]/g, '').replace(/[।॥॰ऽ०-९]/g, '');

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — matching Samaveda → Rigveda English…');

  // build Rigveda index: normalized text -> english (also a prefix map for fast lookup)
  const rv = await RigVeda.find({}, { mantras: 1 }).lean();
  const entries = [];
  for (const s of rv) for (const m of s.mantras) {
    if (m.english) entries.push({ n: norm(m.sanskrit), en: m.english });
  }
  // prefix bucket by first 12 chars for speed
  const buckets = new Map();
  for (const e of entries) {
    const key = e.n.slice(0, 12);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(e);
  }
  console.log(`Rigveda english mantras indexed: ${entries.length}`);

  const sama = await VedaText.find({ veda: 'samaveda' });
  let matched = 0, total = 0;
  for (const doc of sama) {
    let changed = false;
    for (const v of doc.verses) {
      total++;
      const sn = norm(v.sanskrit);
      if (sn.length < 8) continue;
      const probe = sn.slice(0, 12);
      const cands = buckets.get(probe) || [];
      let hit = cands.find((e) => e.n.startsWith(sn.slice(0, 18)) || sn.startsWith(e.n.slice(0, 18)));
      if (!hit) {
        // fallback: scan for any rv mantra containing the sama incipit (first 16 chars)
        const inc = sn.slice(0, 16);
        hit = entries.find((e) => e.n.includes(inc));
      }
      if (hit) { v.english = hit.en; matched++; changed = true; }
    }
    if (changed) await doc.save();
  }
  console.log(`Done. ${matched}/${total} Samaveda verses got Rigveda English (~${Math.round(matched / total * 100)}%).`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Match failed:', e); process.exit(1); });
