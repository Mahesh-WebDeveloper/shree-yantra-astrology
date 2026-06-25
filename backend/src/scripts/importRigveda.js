// Rigveda import — HuggingFace JDhruv14/RigVeda CSV.
// Columns: mandala_no,sukta_no,verse_no,sanskrit,transliteration,translation
// 10 mandala, 1028 sukta, 10,552 mantra. Run: npm run import:rigveda
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const RigVeda = require('../models/RigVeda');

const CSV_URL = 'https://huggingface.co/datasets/JDhruv14/RigVeda/resolve/main/rigveda_data.csv';

// CSV line parser (handles double-quoted fields with embedded commas)
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { q = false; }
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

async function run() {
  console.log('Downloading Rigveda CSV…');
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  let text = await res.text();
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  lines.shift(); // header

  // group by mandala+sukta
  const map = new Map(); // key "m.s" -> { mandala, sukta, mantras: [] }
  for (const line of lines) {
    const f = parseCsvLine(line);
    const mandala = Number(f[0]);
    const sukta = Number(f[1]);
    const verse = Number(f[2]);
    if (!mandala || !sukta) continue;
    const key = `${mandala}.${sukta}`;
    if (!map.has(key)) map.set(key, { mandala, sukta, mantras: [] });
    map.get(key).mantras.push({
      verse,
      sanskrit: (f[3] || '').trim(),
      transliteration: (f[4] || '').trim(),
      english: (f[5] || '').trim(),
      hindi: '',
    });
  }

  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — importing Rigveda…');
  await RigVeda.deleteMany({});

  const docs = [...map.values()]
    .sort((a, b) => a.mandala - b.mandala || a.sukta - b.sukta)
    .map((d) => {
      d.mantras.sort((x, y) => x.verse - y.verse);
      return { mandala: d.mandala, sukta: d.sukta, mantraCount: d.mantras.length, mantras: d.mantras };
    });

  await RigVeda.insertMany(docs, { ordered: false });

  const totalMantras = docs.reduce((s, d) => s + d.mantraCount, 0);
  const mandalas = new Set(docs.map((d) => d.mandala)).size;
  console.log(`Done. ${mandalas} mandala, ${docs.length} sukta, ${totalMantras} mantra imported.`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
