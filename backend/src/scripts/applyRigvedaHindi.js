// Applies extracted authentic Hindi (mahakavya / Ganga Sahay Sharma) into RigVeda.mantras[].hindi.
// Input JSON shape: { "<sukta>": { "mantras": { "<verse>": "<hindi>" } }, ... } for ONE mandala.
// Usage: node src/scripts/applyRigvedaHindi.js <mandala> <jsonRelPath>
require('../config/env');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../config/env');
const RigVeda = require('../models/RigVeda');

async function run() {
  const mandala = Number(process.argv[2]);
  const jsonPath = process.argv[3];
  if (!mandala || !jsonPath) { console.error('Usage: node applyRigvedaHindi.js <mandala> <jsonPath>'); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(path.resolve(jsonPath), 'utf8'));

  await mongoose.connect(env.mongoUri);
  console.log(`Mongo connected — applying Hindi to mandala ${mandala}…`);

  let suktasUpdated = 0, mantrasUpdated = 0, missing = 0;
  for (const [suktaStr, obj] of Object.entries(data)) {
    const sukta = Number(suktaStr);
    const hmap = (obj && obj.mantras) || {};
    const doc = await RigVeda.findOne({ mandala, sukta });
    if (!doc) { missing++; continue; }
    let changed = false;
    for (const m of doc.mantras) {
      const h = hmap[String(m.verse)];
      if (h && h.trim()) { m.hindi = h.trim(); mantrasUpdated++; changed = true; }
    }
    if (changed) { doc.hindiReady = doc.mantras.every((x) => x.hindi); await doc.save(); suktasUpdated++; }
  }
  console.log(`Done. ${suktasUpdated} sukta updated, ${mantrasUpdated} mantra Hindi set, ${missing} sukta missing in DB.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Apply failed:', e); process.exit(1); });
