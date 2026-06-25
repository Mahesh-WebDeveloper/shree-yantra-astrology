// Yajurveda (Shukla/Vajasaneyi-Madhyandina) import — DharmicData Sanskrit (40 adhyaya)
// + Griffith "Texts of the White Yajurveda" English (sacred-texts wyvbk NN). book=adhyaya, section=1.
// Usage: node src/scripts/importYajur.js [firstAdhyaya] [lastAdhyaya]
require('../config/env');
const mongoose = require('mongoose');
const { execFileSync } = require('child_process');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const DD = 'https://raw.githubusercontent.com/bhavykhatri/DharmicData/main/Yajurveda/vajasneyi_madhyadina_samhita.json';
const WYV = (bk) => `https://sacred-texts.com/hin/wyv/wyvbk${String(bk).padStart(2, '0')}.htm`;
const DEV = { '०':0,'१':1,'२':2,'३':3,'४':4,'५':5,'६':6,'७':7,'८':8,'९':9 };
const devInt = (s) => Number(String(s).replace(/[०-९]/g, (d) => DEV[d]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function curlGet(url) {
  try { return execFileSync('curl', ['-sL', '-m', '25', '-A', UA, url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); }
  catch (e) { return ''; }
}

// Sanskrit adhyaya blob -> [{verse, sanskrit}] by ।।N।। (or ॥N॥) markers
function splitSanskrit(text) {
  const out = [];
  const re = /[।॥]{1,2}\s*([०-९]+)\s*[।॥]{1,2}/g;
  let prev = 0, m;
  while ((m = re.exec(text))) {
    out.push({ verse: devInt(m[1]), sanskrit: text.slice(prev, m.index).trim() });
    prev = re.lastIndex;
  }
  return out;
}

// Griffith White Yajurveda book -> {verse: english}. Verses inline-numbered; verse 1 unnumbered.
function fetchEnglish(bk) {
  const html = curlGet(WYV(bk));
  if (!html) return {};
  // collect <p> blocks, drop header/footer/footnote blocks
  const paras = [];
  const re = /<p>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html))) {
    let t = m[1].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
      .replace(/&#(\d+);/g, (x, d) => String.fromCharCode(+d)).replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (!t) continue;
    if (/^(BOOK|HYMN|Next:|Previous:|Buy this Book|p\.\s)/i.test(t)) continue;
    if (/^\d+\s+[A-Z][a-z]/.test(t) === false && /^[a-z]/.test(t)) continue; // footnote-ish lowercase start
    paras.push(t);
  }
  let body = paras.join(' ');
  if (!body) return {};
  if (!/^\d/.test(body)) body = '1 ' + body; // verse 1 unnumbered
  const verses = {};
  const vre = /(\d+)\s+(.+?)(?=\s+\d+\s+[A-Z]|$)/g;
  let v;
  while ((v = vre.exec(body))) {
    const n = Number(v[1]); const t = v[2].trim();
    if (n >= 1 && n < 300 && t.length > 8) verses[n] = t;
  }
  return verses;
}

async function run() {
  const first = Number(process.argv[2]) || 1;
  const last = Number(process.argv[3]) || 40;
  const res = await fetch(DD, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`DharmicData ${res.status}`);
  const adhyayas = await res.json();

  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — importing Yajurveda adhyaya ${first}-${last}…`);
  if (first === 1) await VedaText.deleteMany({ veda: 'yajurveda' });

  let totalVerses = 0, withEng = 0;
  for (const a of adhyayas) {
    const adh = Number(a.adhyaya);
    if (adh < first || adh > last) continue;
    const sa = splitSanskrit(a.text || '');
    const en = fetchEnglish(adh);
    await sleep(250);
    const verses = sa.map((x) => {
      if (en[x.verse]) withEng++;
      return { verse: x.verse, sanskrit: x.sanskrit, transliteration: '', english: en[x.verse] || '', hindi: '' };
    });
    await VedaText.create({
      veda: 'yajurveda', book: adh, bookName: `Adhyaya ${adh}`,
      section: 1, sectionName: '', verseCount: verses.length, verses,
    });
    totalVerses += verses.length;
    console.log(`  adhyaya ${adh}: ${verses.length} verses (${verses.filter((v) => v.english).length} en)`);
  }
  console.log(`Done. ${totalVerses} verses, ${withEng} with English.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
