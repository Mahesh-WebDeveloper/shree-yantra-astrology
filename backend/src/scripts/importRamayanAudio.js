// Imports "Ramayan Hindi" audio playlist from the public Audioboom podcast RSS.
// Stores the episodes' public stream URLs (podcast-standard) as MediaItems — streams in-app,
// full + free + no login. Does not re-host/extract. Run: npm run import:ramayan-audio
require('../config/env');
const mongoose = require('mongoose');
const { execFileSync } = require('child_process');
const env = require('../config/env');
const MediaItem = require('../models/MediaItem');

const RSS = 'https://audioboom.com/channels/4903139.rss';
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
    const durRaw = (b.match(/<itunes:duration>([^<]+)<\/itunes:duration>/) || [])[1];
    if (!title || !url) continue;
    const epNum = Number((title.match(/Ep\s*(\d+)/i) || [])[1]) || 0;
    eps.push({ title, url, epNum, durationText: durRaw ? durRaw.trim() : '' });
  }
  // dedupe by Ep number (RSS me kabhi-kabhi ek episode 2 baar hota hai, e.g. Ep 100) — pehla rakho
  const seen = new Set();
  const unique = [];
  for (const e of eps) {
    if (e.epNum > 0) {
      if (seen.has(e.epNum)) continue;
      seen.add(e.epNum);
    }
    unique.push(e);
  }
  unique.sort((a, b) => a.epNum - b.epNum);
  eps.length = 0; eps.push(...unique);
  if (!eps.length) throw new Error('No episodes parsed from RSS');

  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — importing ${eps.length} Ramayan Hindi audio episodes…`);
  await MediaItem.deleteMany({ subCategory: 'ramayan_audio' });

  let n = 0;
  for (const e of eps) {
    await MediaItem.findOneAndUpdate(
      { audioUrl: e.url },
      { $set: {
        title: e.title,
        subtitle: 'Ramayan Hindi — Audio Katha',
        artist: 'Ramayan Hindi',
        category: 'spiritual_music',
        subCategory: 'ramayan_audio',
        language: 'hi',
        sourceType: 'audio',
        audioUrl: e.url,
        durationText: e.durationText,
        sourceName: 'Audioboom',
        sourceUrl: 'https://audioboom.com/channels/4903139-ramayan-hindi',
        attribution: 'Ramayan Hindi · Audioboom podcast',
        rightsNote: 'Streamed from the public podcast RSS (podcast-standard playback).',
        tags: ['ramayan', 'ramayana', 'hindi', 'katha', 'audio'],
        published: true,
        order: 2000 + (e.epNum || n),
      } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    n++;
  }
  console.log(`Done. ${n} Ramayan audio episodes imported.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
