'use strict';
/**
 * seedAartiAudio.js — adds the 7 deity Aarti audios (in backend/uploads/audio/aarti/)
 * as MediaItems (category 'aarti'), served from /uploads/audio/aarti/<file>.
 * Idempotent (upsert by audioUrl). Run:  node src/scripts/seedAartiAudio.js
 */
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const MediaItem = require('../models/MediaItem');

// file, deity key, English title, famous Hindi opening line (subtitle)
const AARTIS = [
  { file: 'ganesh-1.mp3',    sub: 'ganesh',    title: 'Ganesh Aarti',    line: 'जय गणेश जय गणेश देवा' },
  { file: 'durga-1.mp3',     sub: 'durga',     title: 'Durga Aarti',     line: 'जय अम्बे गौरी, मैया जय श्यामा गौरी' },
  { file: 'lakshmi-1.mp3',   sub: 'lakshmi',   title: 'Lakshmi Aarti',   line: 'ॐ जय लक्ष्मी माता' },
  { file: 'saraswati-1.mp3', sub: 'saraswati', title: 'Saraswati Aarti', line: 'जय सरस्वती माता' },
  { file: 'vishnu-1.mp3',    sub: 'vishnu',    title: 'Vishnu Aarti',    line: 'ॐ जय जगदीश हरे' },
  { file: 'krishna-1.mp3',   sub: 'krishna',   title: 'Krishna Aarti',   line: 'आरती कुंजबिहारी की' },
  { file: 'hanuman-1.mp3',   sub: 'hanuman',   title: 'Hanuman Aarti',   line: 'आरती कीजै हनुमान लला की' },
];

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — seeding Aarti audios…');
  let n = 0;
  for (const a of AARTIS) {
    const audioUrl = `/uploads/audio/aarti/${a.file}`;
    await MediaItem.findOneAndUpdate(
      { audioUrl },
      { $set: {
        title: a.title,
        subtitle: a.line,
        artist: 'Traditional',
        category: 'aarti',
        subCategory: a.sub,
        language: 'hi',
        sourceType: 'audio',
        audioUrl,
        tags: ['aarti', a.sub],
        published: true,
        order: n,
      } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`  + ${a.title}`);
    n++;
  }
  console.log(`Done. ${n} Aarti audios seeded.`);
  await mongoose.disconnect();
  process.exit(0);
}
run().catch((e) => { console.error('seed failed:', e); process.exit(1); });
