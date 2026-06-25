// Atharvaveda import — DharmicData Sanskrit (per-sukta) + sacred-texts Griffith English (per-hymn).
// Joins per kanda.sukta.verse. Usage: node src/scripts/importAtharva.js [firstKanda] [lastKanda]
require('../config/env');
const mongoose = require('mongoose');
const { execFileSync } = require('child_process');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

// sacred-texts (Cloudflare) Node-fetch ko 403 deta hai par curl ko 200 — isliye curl shell-out
function curlGet(url) {
  try {
    return execFileSync('curl', ['-sL', '-m', '25', '-A', UA, url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  } catch (e) { return ''; }
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const DD = (k) => `https://raw.githubusercontent.com/bhavykhatri/DharmicData/main/AtharvaVeda/atharvaveda_kaanda_${k}.json`;
const ST = (k, s) => `https://sacred-texts.com/hin/av/av${String(k).padStart(2, '0')}${String(s).padStart(3, '0')}.htm`;

const DEV = { '०':0,'१':1,'२':2,'३':3,'४':4,'५':5,'६':6,'७':7,'८':8,'९':9 };
const devInt = (s) => Number(String(s).replace(/[०-९]/g, (d) => DEV[d]));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Sanskrit blob -> [{verse, sanskrit}] by ॥N॥ markers (header before verse 1 stripped)
function splitSanskrit(text) {
  const out = [];
  const re = /॥\s*([०-९]+)\s*॥/g;
  let prev = 0, m;
  while ((m = re.exec(text))) {
    let chunk = text.slice(prev, m.index).trim();
    prev = re.lastIndex;
    const n = devInt(m[1]);
    out.push({ verse: n, sanskrit: chunk });
  }
  // strip header lines from verse 1 (topic / rishi-devata-range / chhanda lines before mantra)
  if (out.length) {
    let lines = out[0].sanskrit.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const isHeader = (l) =>
      /[०-९]\s*[-–]\s*[०-९]/.test(l) ||                                  // range "१-४"
      (/।\s*$/.test(l) && l.length < 45) ||                              // short topic line
      /अनुष्टुप्|गायत्री|त्रिष्टुप्|जगती|बृहती|पङ्क्ति|विराट्|उष्णिक्|छन्द/.test(l); // chhanda
    while (lines.length > 1 && isHeader(lines[0])) lines.shift();
    out[0].sanskrit = lines.join('\n');
  }
  return out;
}

function fetchEnglish(k, s) {
  try {
    const html = curlGet(ST(k, s));
    if (!html) return {};
    // Griffith verses are anchored: <A NAME="an_KKSSSVV">N</A></FONT></span><verse text>...
    const verses = {};
    const re = /<A NAME="an_\d+">(\d+)<\/A>[\s\S]*?<\/span>([\s\S]*?)(?=<span class="margnote"|<\/p>)/gi;
    let m;
    while ((m = re.exec(html))) {
      const n = Number(m[1]);
      const t = m[2].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
        .replace(/&#257;/g, 'ā').replace(/&#(\d+);/g, (x, d) => String.fromCharCode(+d))
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
      if (n >= 1 && t.length > 3) verses[n] = t;
    }
    return verses;
  } catch (e) { return {}; }
}

async function run() {
  const first = Number(process.argv[2]) || 1;
  const last = Number(process.argv[3]) || 20;
  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — importing Atharvaveda kanda ${first}-${last}…`);
  if (first === 1) await VedaText.deleteMany({ veda: 'atharvaveda' });

  let totalSuktas = 0, totalVerses = 0, withEng = 0;
  for (let k = first; k <= last; k++) {
    const res = await fetch(DD(k), { headers: { 'User-Agent': UA } });
    if (!res.ok) { console.log(`  kanda ${k}: DharmicData ${res.status}`); continue; }
    const suktas = await res.json();
    const docs = [];
    for (const su of suktas) {
      const sukta = Number(su.sukta);
      const sa = splitSanskrit(su.text || '');
      const en = await fetchEnglish(k, sukta);
      await sleep(250);
      const verses = sa.map((v) => {
        if (en[v.verse]) withEng++;
        return { verse: v.verse, sanskrit: v.sanskrit, transliteration: '', english: en[v.verse] || '', hindi: '' };
      });
      docs.push({
        veda: 'atharvaveda', book: k, bookName: `Kanda ${k}`,
        section: sukta, sectionName: `Sukta ${sukta}`, verseCount: verses.length, verses,
      });
      totalVerses += verses.length;
    }
    await VedaText.insertMany(docs, { ordered: false });
    totalSuktas += docs.length;
    console.log(`  kanda ${k}: ${docs.length} sukta, ${docs.reduce((s, d) => s + d.verseCount, 0)} verses`);
  }
  console.log(`Done. ${totalSuktas} sukta, ${totalVerses} verses, ${withEng} with English.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
