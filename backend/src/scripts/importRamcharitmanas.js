// Ramcharitmanas (Tulsidas) import — WirelessAlien/Ramcharitmanas dataset.
// 7 kand, mool Awadhi/Hindi text. Run: npm run import:ramcharitmanas
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const Ramcharitmanas = require('../models/Ramcharitmanas');

const BASE = 'https://raw.githubusercontent.com/WirelessAlien/Ramcharitmanas/main/main/data/verses';
const KANDAS = [
  { file: 'balkanda', kanda: 'Bal Kand', hindi: 'बालकांड', order: 1 },
  { file: 'ayodhyakanda', kanda: 'Ayodhya Kand', hindi: 'अयोध्याकांड', order: 2 },
  { file: 'aranyakanda', kanda: 'Aranya Kand', hindi: 'अरण्यकांड', order: 3 },
  { file: 'kishkindhakanda', kanda: 'Kishkindha Kand', hindi: 'किष्किंधाकांड', order: 4 },
  { file: 'sundarkanda', kanda: 'Sundar Kand', hindi: 'सुंदरकांड', order: 5 },
  { file: 'lankakanda', kanda: 'Lanka Kand', hindi: 'लंकाकांड', order: 6 },
  { file: 'uttarakanda', kanda: 'Uttar Kand', hindi: 'उत्तरकांड', order: 7 },
];
const TYPES = ['चौपाई', 'दोहा', 'सोरठा', 'छंद', 'श्लोक', 'हरिगीतिका'];

function parseContent(content) {
  const lines = String(content).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let type = '';
  if (lines.length && TYPES.some((tp) => lines[0].startsWith(tp))) {
    type = lines.shift();
  }
  return { type, text: lines.join('\n') };
}

async function getJson(file) {
  const res = await fetch(`${BASE}/${file}.json`);
  if (!res.ok) throw new Error(`fetch ${file} failed: ${res.status}`);
  return res.json();
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — importing Ramcharitmanas…');
  await Ramcharitmanas.deleteMany({});
  let total = 0;
  for (const k of KANDAS) {
    const rows = await getJson(k.file);
    const verses = rows.map((r) => {
      const { type, text } = parseContent(r.content);
      return { number: String(r['verse-number']), type, text };
    });
    await Ramcharitmanas.create({
      kanda: k.kanda, kandaHindi: k.hindi, kandaOrder: k.order,
      verseCount: verses.length, verses,
    });
    total += verses.length;
    console.log(`  + ${k.hindi} (${verses.length} verses)`);
  }
  console.log(`Done. 7 kand, ${total} verses imported.`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
