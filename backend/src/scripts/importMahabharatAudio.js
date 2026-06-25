// Imports "Mahabharat" (Fever FM / HT Smartcast, narrated by Vijay Raaz) — 100-episode Hindi
// audio drama — from the official Megaphone podcast RSS. Stores public stream URLs (podcast-standard
// streaming, no download/re-host). Run: npm run import:mahabharat-audio
require('../config/env');
const mongoose = require('mongoose');
const { execFileSync } = require('child_process');
const env = require('../config/env');
const MediaItem = require('../models/MediaItem');

const RSS = 'https://feeds.megaphone.fm/HTMEDIALTD4526130397';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36';

function curlGet(url) {
  return execFileSync('curl', ['-sL', '-m', '40', '-A', UA, url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}
const decode = (s) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();

async function run() {
  const xml = curlGet(RSS);
  const items = xml.split(/<item>/).slice(1).map((b) => b.split('</item>')[0]);
  const eps = [];
  for (const b of items) {
    const title = decode((b.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const url = decode((b.match(/<enclosure[^>]*\burl="([^"]+)"/) || [])[1]);
    const dur = (b.match(/<itunes:duration>([^<]+)<\/itunes:duration>/) || [])[1];
    if (!title || !url) continue;
    const n = Number((title.match(/#?\s*(\d+)/) || [])[1]) || 0;
    eps.push({ title, url, n, durationText: dur ? dur.trim() : '' });
  }
  // dedupe by episode number, sort ascending
  const seen = new Set();
  const unique = eps.filter((e) => { if (e.n > 0) { if (seen.has(e.n)) return false; seen.add(e.n); } return true; })
    .sort((a, b) => a.n - b.n);
  if (!unique.length) throw new Error('No episodes parsed');

  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — importing ${unique.length} Mahabharat audio episodes…`);
  await MediaItem.deleteMany({ subCategory: 'mahabharat_audio' });

  let n = 0;
  for (const e of unique) {
    await MediaItem.findOneAndUpdate(
      { audioUrl: e.url },
      { $set: {
        title: e.title,
        subtitle: 'Mahabharat — Hindi Audio (Fever FM)',
        artist: 'Vijay Raaz · Fever FM / HT Smartcast',
        category: 'spiritual_music',
        subCategory: 'mahabharat_audio',
        language: 'hi',
        sourceType: 'audio',
        audioUrl: e.url,
        durationText: e.durationText,
        sourceName: 'Fever FM / HT Smartcast',
        sourceUrl: 'https://podcasts.apple.com/in/podcast/mahabharat/id1491290270',
        attribution: 'Mahabharat · Fever FM / HT Smartcast (narrated by Vijay Raaz)',
        rightsNote: 'Streamed from the official public podcast RSS (podcast-standard playback).',
        tags: ['mahabharat', 'mahabharata', 'hindi', 'katha', 'audio'],
        published: true,
        order: 3000 + (e.n || n),
      } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    n++;
  }
  console.log(`Done. ${n} Mahabharat audio episodes imported.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
