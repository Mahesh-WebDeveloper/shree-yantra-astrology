// Imports official Yatharth Geeta Hindi audio links from Internet Archive.
// This does not download, decrypt, join, or modify audio files. It only stores
// source URLs and license metadata in MediaItem for playback/reference.
// Run: npm run import:yatharth-geeta-audio
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const MediaItem = require('../models/MediaItem');

const IDENTIFIER = 'YatharthGeetaHindiAudio';
const METADATA_URL = `https://archive.org/metadata/${IDENTIFIER}`;
const ITEM_URL = `https://archive.org/details/${IDENTIFIER}`;
const DOWNLOAD_BASE = `https://archive.org/download/${IDENTIFIER}`;
const LICENSE_NAME = 'CC BY-NC-ND 3.0';
const LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-nd/3.0/';
const ATTRIBUTION = 'Yatharth Geeta - Srimad Bhagavad Gita - Hindi (Audio), Swami Adgadanand; hosted by Internet Archive.';
const RIGHTS_NOTE = 'Non-commercial only; no derivatives. Keep attribution and verify permission before commercial use.';

function fileUrl(name) {
  return `${DOWNLOAD_BASE}/${encodeURIComponent(name).replace(/%2F/g, '/')}`;
}

function durationLabel(file) {
  const seconds = Number(file.length || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function chapterInfo(name) {
  const base = String(name || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const withoutPrefix = base.replace(/^\d+\s+/, '').trim();
  const chapter = withoutPrefix.match(/chapter\s*(\d+)/i);
  if (chapter) {
    const n = Number(chapter[1]);
    return {
      order: n,
      titleEn: `Yatharth Geeta - Chapter ${n}`,
      titleHi: `यथार्थ गीता - अध्याय ${n}`,
      subCategory: `chapter_${n}`,
      tags: ['yatharth geeta', 'bhagavad gita', 'geeta audio', `chapter ${n}`, 'hindi'],
    };
  }
  if (/prakkathan/i.test(withoutPrefix)) {
    return {
      order: 0,
      titleEn: 'Yatharth Geeta - Prakkathan',
      titleHi: 'यथार्थ गीता - प्राक्कथन',
      subCategory: 'prakkathan',
      tags: ['yatharth geeta', 'bhagavad gita', 'geeta audio', 'prakkathan', 'hindi'],
    };
  }
  if (/upasham/i.test(withoutPrefix)) {
    return {
      order: 19,
      titleEn: 'Yatharth Geeta - Upasham',
      titleHi: 'यथार्थ गीता - उपशम',
      subCategory: 'upasham',
      tags: ['yatharth geeta', 'bhagavad gita', 'geeta audio', 'upasham', 'hindi'],
    };
  }
  const title = titleCase(withoutPrefix);
  return {
    order: 999,
    titleEn: `Yatharth Geeta - ${title}`,
    titleHi: `यथार्थ गीता - ${title}`,
    subCategory: withoutPrefix.toLowerCase().replace(/\s+/g, '_'),
    tags: ['yatharth geeta', 'bhagavad gita', 'geeta audio', 'hindi'],
  };
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected - importing Yatharth Geeta audio links...');

  const response = await fetch(METADATA_URL);
  if (!response.ok) throw new Error(`Internet Archive metadata failed: ${response.status}`);
  const data = await response.json();
  const files = (data.files || [])
    .filter((file) => file && /\.mp3$/i.test(file.name || '') && /vbr mp3/i.test(file.format || ''))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));

  if (!files.length) throw new Error('No VBR MP3 files found in Internet Archive metadata');

  let imported = 0;
  for (const file of files) {
    const info = chapterInfo(file.name);
    const audioUrl = fileUrl(file.name);
    const payload = {
      title: info.titleEn,
      subtitle: 'Hindi audio commentary of Srimad Bhagavad Gita',
      artist: 'Swami Adgadanand',
      category: 'spiritual_music',
      subCategory: `yatharth_geeta_${info.subCategory}`,
      language: 'hi',
      sourceType: 'audio',
      audioUrl,
      thumbnailImage: '',
      durationText: durationLabel(file),
      sourceName: 'Internet Archive',
      sourceUrl: ITEM_URL,
      licenseName: LICENSE_NAME,
      licenseUrl: LICENSE_URL,
      attribution: ATTRIBUTION,
      rightsNote: RIGHTS_NOTE,
      tags: info.tags,
      translations: {
        en: {
          title: info.titleEn,
          subtitle: 'Hindi audio commentary of Srimad Bhagavad Gita',
          artist: 'Swami Adgadanand',
          tags: info.tags,
        },
        hi: {
          title: info.titleHi,
          subtitle: 'श्रीमद भगवद्गीता की हिंदी ऑडियो व्याख्या',
          artist: 'स्वामी अड़गड़ानंद',
          tags: ['यथार्थ गीता', 'भगवद्गीता', 'गीता ऑडियो', 'हिंदी'],
        },
      },
      isPremium: false,
      published: true,
      order: 1000 + info.order,
    };

    await MediaItem.findOneAndUpdate(
      { audioUrl },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    imported += 1;
    console.log(`  + ${payload.title}`);
  }

  console.log(`Done. ${imported} Yatharth Geeta audio items imported.`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
