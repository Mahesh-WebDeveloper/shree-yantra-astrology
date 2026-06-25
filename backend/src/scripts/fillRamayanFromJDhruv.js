// Fills remaining Valmiki Ramayan English (esp. Uttara Kanda) by text-matching each DB shloka's
// Sanskrit to JDhruv14/Ramayana CSV (which has authentic translation incl. Uttara Kanda).
// Edition numbering differs, so we match by normalized Sanskrit text (accurate). Usage: node src/scripts/fillRamayanFromJDhruv.js
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const RamayanSarga = require('../models/RamayanSarga');

const CSV = 'https://huggingface.co/datasets/JDhruv14/Ramayana/resolve/main/ramayana_data.csv';
const norm = (s) => String(s || '').normalize('NFC').replace(/[^ऀ-ॿ]/g, '').replace(/[।॥॰ऽ०-९]/g, '');

function parseLine(l) {
  const o = []; let c = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; }
  }
  o.push(c); return o;
}

async function run() {
  const res = await fetch(CSV);
  let text = await res.text();
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const lines = text.split(/\r?\n/).filter(Boolean);
  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseLine(lines[i]);
    const en = (f[5] || '').trim();
    const sa = norm(f[3]);
    if (en && sa.length > 10) entries.push({ n: sa, en });
  }
  const buckets = new Map();
  for (const e of entries) { const k = e.n.slice(0, 16); (buckets.get(k) || buckets.set(k, []).get(k)).push(e); }
  console.log(`JDhruv Ramayana entries indexed: ${entries.length}`);

  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — text-matching Ramayan English…');
  const docs = await RamayanSarga.find({});
  let filled = 0, total = 0;
  for (const doc of docs) {
    let changed = false;
    for (const v of doc.shlokas) {
      if (v.english) continue;
      total++;
      const sn = norm(v.sanskrit);
      if (sn.length < 12) continue;
      const cands = buckets.get(sn.slice(0, 16)) || [];
      let hit = cands.find((e) => e.n.startsWith(sn.slice(0, 24)) || sn.startsWith(e.n.slice(0, 24)));
      if (!hit) { const inc = sn.slice(0, 22); hit = entries.find((e) => e.n.includes(inc) || inc.includes(e.n.slice(0, 22))); }
      if (hit) { v.english = hit.en; filled++; changed = true; }
    }
    if (changed) await doc.save();
  }
  console.log(`Done. ${filled}/${total} still-missing Ramayan shlokas filled from JDhruv.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
