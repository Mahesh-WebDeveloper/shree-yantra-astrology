// Upanishads import — atmabodha/Vedanta_Datasets CSV (authentic Sanskrit + English).
// Stored in generic VedaText (veda='upanishads', book=each upanishad, section=chapter/valli, verse).
// Hindi per-verse via AI (VerseMeaning). Run: npm run import:upanishads
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

const BASE = 'https://raw.githubusercontent.com/atmabodha/Vedanta_Datasets/main/Upanishads';
const UPS = [
  { file: 'Isavasya', book: 1, name: 'Ishavasya Upanishad' },
  { file: 'Katha', book: 2, name: 'Katha Upanishad' },
  { file: 'Mandukya', book: 3, name: 'Mandukya Upanishad' },
];

// full CSV parser (handles quoted fields with embedded commas + newlines)
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); if (row.some((x) => x !== '')) rows.push(row); }
  return rows;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — importing Upanishads…');
  await VedaText.deleteMany({ veda: 'upanishads' });

  let totalDocs = 0, totalVerses = 0;
  for (const up of UPS) {
    const res = await fetch(`${BASE}/Upanishad_${up.file}.csv`);
    if (!res.ok) { console.log(`  ! ${up.name}: ${res.status}`); continue; }
    const rows = parseCSV(await res.text());
    rows.shift(); // header
    // group by chapter/valli column (col 0), assign sequential section numbers
    const order = [];
    const groups = new Map();
    for (const r of rows) {
      const chap = String(r[0] || '').trim();
      const verse = Number(String(r[1] || '').trim());
      const sanskrit = String(r[2] || '').replace(/\s+/g, ' ').trim();
      const english = String(r[3] || '').replace(/\s+/g, ' ').trim();
      if (!chap || !sanskrit) continue;
      if (!groups.has(chap)) { groups.set(chap, []); order.push(chap); }
      groups.get(chap).push({ verse: verse || groups.get(chap).length + 1, sanskrit, transliteration: '', english, hindi: '' });
    }
    const docs = order.map((chap, idx) => ({
      veda: 'upanishads', book: up.book, bookName: up.name,
      section: idx + 1, sectionName: order.length > 1 ? `Valli ${chap}` : up.name,
      verseCount: groups.get(chap).length, verses: groups.get(chap),
    }));
    await VedaText.insertMany(docs, { ordered: false });
    const vc = docs.reduce((s, d) => s + d.verseCount, 0);
    totalDocs += docs.length; totalVerses += vc;
    console.log(`  + ${up.name}: ${docs.length} section(s), ${vc} verses`);
  }
  console.log(`Done. ${totalDocs} sections, ${totalVerses} verses across ${UPS.length} Upanishads.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
