// Bhagavad Gita import — public-domain dataset (github.com/gita/gita) se DB me.
// Run: npm run import:gita   (idempotent — har baar refresh kar deta hai)
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const GitaChapter = require('../models/GitaChapter');

const BASE = 'https://raw.githubusercontent.com/gita/gita/main/data';

// readable authors (saaf anuvaad) — preference order
const HI_AUTHORS = ['Swami Tejomayananda', 'Swami Ramsukhdas'];
const EN_AUTHORS = ['Swami Sivananda', 'Shri Purohit Swami', 'Swami Gambirananda'];

async function getJson(file) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`fetch ${file} failed: ${res.status}`);
  return res.json();
}

function pickTranslation(list, authors) {
  for (const a of authors) {
    const hit = list.find((t) => t.authorName === a);
    if (hit) return hit.description;
  }
  return list.length ? list[0].description : '';
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — importing Bhagavad Gita…');

  const [chapters, verses, translations] = await Promise.all([
    getJson('chapters.json'),
    getJson('verse.json'),
    getJson('translation.json'),
  ]);
  console.log(`  fetched: ${chapters.length} chapters, ${verses.length} verses, ${translations.length} translations`);

  // verse_id -> { hindi:[...], english:[...] }
  const byVerse = new Map();
  for (const t of translations) {
    const e = byVerse.get(t.verse_id) || { hindi: [], english: [] };
    if (t.lang === 'hindi') e.hindi.push(t);
    else if (t.lang === 'english') e.english.push(t);
    byVerse.set(t.verse_id, e);
  }

  const clean = (s) => (s || '').replace(/\s+\n/g, '\n').trim();

  let total = 0;
  for (const ch of chapters) {
    const chVerses = verses
      .filter((v) => v.chapter_number === ch.chapter_number)
      .sort((a, b) => a.verse_number - b.verse_number)
      .map((v) => {
        const tr = byVerse.get(v.id) || { hindi: [], english: [] };
        return {
          verse: v.verse_number,
          sanskrit: clean(v.text),
          transliteration: clean(v.transliteration),
          wordMeanings: clean(v.word_meanings),
          hindi: clean(pickTranslation(tr.hindi, HI_AUTHORS)),
          english: clean(pickTranslation(tr.english, EN_AUTHORS)),
        };
      });

    await GitaChapter.findOneAndUpdate(
      { chapter: ch.chapter_number },
      {
        chapter: ch.chapter_number,
        name: ch.name,
        transliterated: ch.name_transliterated,
        meaning: ch.name_meaning,
        translation: ch.name_translation,
        summaryEn: clean(ch.chapter_summary),
        summaryHi: clean(ch.chapter_summary_hindi),
        versesCount: ch.verses_count,
        verses: chVerses,
      },
      { upsert: true, new: true }
    );
    total += chVerses.length;
    console.log(`  + Ch ${ch.chapter_number} ${ch.name_transliterated} (${chVerses.length} verses)`);
  }

  console.log(`Done. 18 chapters, ${total} verses imported.`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
