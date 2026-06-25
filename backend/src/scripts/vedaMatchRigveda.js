// Fills missing English in a VedaText veda by matching verses to Rigveda (authentic Wilson).
// Many Atharva (kanda 20) / Sama verses are Rigvedic borrowings. Svara-aware normalize.
// Usage: node src/scripts/vedaMatchRigveda.js <veda>
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const RigVeda = require('../models/RigVeda');
const VedaText = require('../models/VedaText');

// strip non-Devanagari + vedic accent/tone marks (udatta/anudatta) + danda/digits
const norm = (s) => String(s || '').normalize('NFC')
  .replace(/[॒॑᳐-᳿꣠-ꣿ]/g, '')
  .replace(/[^ऀ-ॿ]/g, '').replace(/[।॥॰ऽ०-९]/g, '');

async function run() {
  const veda = process.argv[2] || 'atharvaveda';
  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — matching ${veda} → Rigveda English…`);

  const rv = await RigVeda.find({}, { mantras: 1 }).lean();
  const entries = [];
  for (const s of rv) for (const m of s.mantras) if (m.english) entries.push({ n: norm(m.sanskrit), en: m.english });
  const buckets = new Map();
  for (const e of entries) { const k = e.n.slice(0, 12); (buckets.get(k) || buckets.set(k, []).get(k)).push(e); }

  const docs = await VedaText.find({ veda });
  let matched = 0, total = 0;
  for (const doc of docs) {
    let changed = false;
    for (const v of doc.verses) {
      if (v.english) continue;
      total++;
      const sn = norm(v.sanskrit);
      if (sn.length < 8) continue;
      const cands = buckets.get(sn.slice(0, 12)) || [];
      let hit = cands.find((e) => e.n.startsWith(sn.slice(0, 18)) || sn.startsWith(e.n.slice(0, 18)));
      if (!hit) { const inc = sn.slice(0, 16); hit = entries.find((e) => e.n.includes(inc)); }
      if (hit) { v.english = hit.en; matched++; changed = true; }
    }
    if (changed) await doc.save();
  }
  console.log(`Done. ${matched}/${total} still-missing ${veda} verses got Rigveda English.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
