// Downloads the legally-hosted Yatharth Geeta Hindi audio (Internet Archive, CC BY-NC-ND 3.0)
// into backend/uploads/audio/yatharth-geeta/ and points the MediaItem audioUrl at the local copy.
// Non-commercial use with attribution (app already shows source/license). Run: npm run download:yatharth-geeta
require('../config/env');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const mongoose = require('mongoose');
const env = require('../config/env');
const MediaItem = require('../models/MediaItem');

const IDENTIFIER = 'YatharthGeetaHindiAudio';
const META = `https://archive.org/metadata/${IDENTIFIER}`;
const DL = (name) => `https://archive.org/download/${IDENTIFIER}/${encodeURIComponent(name).replace(/%2F/g, '/')}`;
const OUT_DIR = path.join(__dirname, '..', '..', 'uploads', 'audio', 'yatharth-geeta');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36';

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const res = await fetch(META);
  const data = await res.json();
  const files = (data.files || [])
    .filter((f) => /\.mp3$/i.test(f.name || '') && /vbr mp3/i.test(f.format || ''))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));

  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — downloading ${files.length} Yatharth Geeta files…`);

  let done = 0, updated = 0;
  for (const f of files) {
    const dest = path.join(OUT_DIR, f.name);
    const wantSize = Number(f.size || 0);
    const haveSize = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
    if (haveSize > 0 && (!wantSize || Math.abs(haveSize - wantSize) < 1024)) {
      console.log(`  = ${f.name} (already downloaded)`);
    } else {
      try {
        execFileSync('curl', ['-sL', '--fail', '-m', '600', '-A', UA, '-o', dest, DL(f.name)], { stdio: 'ignore' });
        console.log(`  + ${f.name} (${(fs.statSync(dest).size / 1048576).toFixed(1)} MB)`);
        done++;
      } catch (e) { console.log(`  ! ${f.name} failed`); continue; }
    }
    // point DB at local copy (match by old archive.org url or by file name)
    const localUrl = `/uploads/audio/yatharth-geeta/${f.name}`;
    const r = await MediaItem.updateOne({ audioUrl: DL(f.name) }, { $set: { audioUrl: localUrl } });
    if (r.modifiedCount) updated++;
  }
  console.log(`Done. Downloaded ${done} files, ${updated} media items now point to local copies.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Download failed:', e); process.exit(1); });
