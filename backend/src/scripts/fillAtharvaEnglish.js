// Fills missing Atharvaveda English from Griffith (sacred-texts), handling quirks:
//  - verse-0 labeling (first verse shown as "0" in some hymns) -> map to verse 1
//  - merged verses (no anchor) -> forward-fill the covering translation
//  - 404 pages -> Wayback Machine fallback
// Usage: node src/scripts/fillAtharvaEnglish.js
require('../config/env');
const mongoose = require('mongoose');
const { execFileSync } = require('child_process');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36';
const ST = (k, s) => `https://sacred-texts.com/hin/av/av${String(k).padStart(2, '0')}${String(s).padStart(3, '0')}.htm`;
const WB = (url) => `https://web.archive.org/web/2id_/${url}`;

function curlGet(url) {
  try { return execFileSync('curl', ['-sL', '-m', '30', '-A', UA, url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); }
  catch (e) { return ''; }
}

function parseEnglish(html) {
  const verses = {};
  if (!html) return verses;
  const re = /<A NAME="an_\d+">(\d+)<\/A>[\s\S]*?<\/span>([\s\S]*?)(?=<span class="margnote"|<\/p>)/gi;
  let m;
  while ((m = re.exec(html))) {
    const n = Number(m[1]);
    const t = m[2].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
      .replace(/&#(\d+);/g, (x, d) => String.fromCharCode(+d)).replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (t.length > 3) verses[n] = t;
  }
  return verses;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — filling Atharva English gaps…');
  const docs = await VedaText.find({ veda: 'atharvaveda' });
  let fixedVerses = 0, fixedSuktas = 0, still404 = [];

  for (const doc of docs) {
    const total = doc.verses.length;
    const have = doc.verses.filter((v) => v.english).length;
    if (have === total) continue; // already complete

    let html = curlGet(ST(doc.book, doc.section));
    let en = parseEnglish(html);
    if (Object.keys(en).length === 0) {
      // 404 / empty -> Wayback fallback
      html = curlGet(WB(ST(doc.book, doc.section)));
      en = parseEnglish(html);
    }
    if (Object.keys(en).length === 0) { still404.push(`${doc.book}.${doc.section}`); continue; }

    let changed = false, last = '';
    for (const v of doc.verses) {
      if (v.english) { last = v.english; continue; }
      let val = en[v.verse];
      if (!val && v.verse === 1 && en[0]) val = en[0];        // verse-0 quirk
      if (!val && last) val = last;                            // merged verse -> covering translation
      if (val) { v.english = val; last = val; fixedVerses++; changed = true; }
    }
    if (changed) { await doc.save(); fixedSuktas++; }
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log(`Done. ${fixedVerses} verses filled across ${fixedSuktas} suktas. Still missing pages: ${still404.length} [${still404.join(', ')}]`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
