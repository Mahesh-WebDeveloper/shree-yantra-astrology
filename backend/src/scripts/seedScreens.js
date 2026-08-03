// Page-wise content seed — ensures all app pages exist in admin dashboard.
// Idempotent: existing pages are never overwritten (admin edits safe).
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const ScreenContent = require('../models/ScreenContent');
const { PAGE_CATALOG, ensureScreenPages } = require('../data/screenDefaults');

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — ensuring page content records…');
  const added = await ensureScreenPages(ScreenContent);
  console.log(`Done. ${added} new page(s) from catalog of ${Object.keys(PAGE_CATALOG).length}.`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
