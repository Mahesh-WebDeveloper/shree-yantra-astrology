// Hanuman Chalisa — authentic Devanagari text from vignanam.org (verified). Stored in generic
// VedaText (veda='hanuman-chalisa'); per-verse Hindi meaning via AI (VerseMeaning). Run: npm run import:hanuman-chalisa
require('../config/env');
const mongoose = require('mongoose');
const { execFileSync } = require('child_process');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

const URL = 'https://vignanam.org/devanagari/hanuman-chalisa.html';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function curlGet(url) {
  return execFileSync('curl', ['-sL', '-m', '25', '-A', UA, url], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
}
const hasDev = (s) => /[ऀ-ॿ]/.test(s);

async function run() {
  const html = curlGet(URL);
  const i = html.indexOf('stotramtext');
  if (i < 0) throw new Error('stotramtext not found');
  let seg = html.slice(i, i + 6000).split(/<\/div>/i)[0];
  seg = seg.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (x, d) => String.fromCharCode(+d)).replace(/&nbsp;/g, ' ');
  const lines = seg.split(/\n/).map((l) => l.trim()).filter(Boolean);
  // keep only Devanagari verse lines; skip English intro + lone section labels
  const labels = /^(दोहा|चौपाई|ध्यानम्|॥?\s*श्री.*चालीसा\s*॥?)$/;
  const verses = [];
  let n = 0;
  let tail = -1; // after chaupai 40, take a couple closing-doha lines then stop
  for (const l of lines) {
    if (/इति\s|सूर्य\s*पञ्जर|स्तोत्रम्|कवचम्|अष्टकम्/.test(l)) break;
    if (!hasDev(l)) continue;            // skip English paragraphs (IAST/translation)
    if (l.length < 6) continue;
    if (/^(दोहा|चौपाई|ध्यानम्)$/.test(l)) continue; // lone section labels
    verses.push({ verse: ++n, sanskrit: l, transliteration: '', english: '', hindi: '' });
    if (tail >= 0) { tail++; if (tail >= 1) break; }       // closing doha = पवनतनय line + 1 more, then stop
    if (/पवनतनय/.test(l)) tail = 0;                         // closing doha reached (reliable content marker)
  }
  if (verses.length < 20) throw new Error(`Parsed too few lines (${verses.length}) — page format changed?`);

  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — importing Hanuman Chalisa…');
  await VedaText.deleteMany({ veda: 'hanuman-chalisa' });
  await VedaText.create({
    veda: 'hanuman-chalisa', book: 1, bookName: 'Hanuman Chalisa',
    section: 1, sectionName: 'Hanuman Chalisa', verseCount: verses.length, verses,
  });
  console.log(`Done. Hanuman Chalisa imported — ${verses.length} verses.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
