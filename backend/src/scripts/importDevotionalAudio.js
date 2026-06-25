// Imports verified FREE/CC devotional audio from Internet Archive (CC0 / CC-BY-NC) as MediaItems.
// Streams from archive.org (download URL). Run: npm run import:devotional-audio
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const MediaItem = require('../models/MediaItem');

// verified items (agent-checked, real free-culture works)
const ITEMS = [
  { id: 'fptu_aarti-keejei-hanuman-lala-ki', category: 'bhajan', title: 'Aarti Keejai Hanuman Lala Ki', artist: 'Traditional', license: 'CC0', tags: ['aarti', 'hanuman'] },
  { id: 'Paheligeet1', category: 'bhajan', title: 'Ram Naam Bhajan', artist: 'Traditional', license: 'CC0', tags: ['bhajan', 'ram'] },
  { id: 'OmNamahShivaya', category: 'mantra', title: 'Om Namah Shivaya', artist: 'Traditional', license: 'CC BY-NC-SA 3.0', tags: ['mantra', 'shiva'] },
  { id: 'jamendo-218427', category: 'mantra', title: 'Gayatri Mantra', artist: 'Bird Hedgehog', license: 'CC BY-NC 3.0', tags: ['mantra', 'gayatri'] },
];

async function pickMp3(id) {
  const res = await fetch(`https://archive.org/metadata/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  const f = (data.files || []).find((x) => /\.mp3$/i.test(x.name || ''));
  if (!f) return null;
  return { url: `https://archive.org/download/${id}/${encodeURIComponent(f.name).replace(/%2F/g, '/')}`, durationText: f.length ? '' : '' };
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — importing free devotional audio…');
  let n = 0;
  for (const it of ITEMS) {
    const m = await pickMp3(it.id);
    if (!m) { console.log(`  ! ${it.title}: no mp3 found`); continue; }
    await MediaItem.findOneAndUpdate(
      { audioUrl: m.url },
      { $set: {
        title: it.title,
        subtitle: it.category === 'mantra' ? 'Sacred chanting' : 'Devotional',
        artist: it.artist,
        category: it.category,
        subCategory: 'free_devotional',
        language: 'hi',
        sourceType: 'audio',
        audioUrl: m.url,
        sourceName: 'Internet Archive',
        sourceUrl: `https://archive.org/details/${it.id}`,
        licenseName: it.license,
        attribution: `${it.title} — ${it.artist} · Internet Archive (${it.license})`,
        rightsNote: it.license.startsWith('CC0') ? 'Public domain dedication (CC0).' : 'Free under Creative Commons; keep attribution.',
        tags: it.tags,
        published: true,
        order: 50 + n,
      } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`  + ${it.title} (${it.license})`);
    n++;
  }
  console.log(`Done. ${n} free devotional audio items imported.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
