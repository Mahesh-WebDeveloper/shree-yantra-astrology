// Page-wise content seed — app ka CURRENT content dashboard me mirror karta hai.
// Idempotent: page pehle se ho to skip (admin edits safe). Run: npm run seed:screens
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const ScreenContent = require('../models/ScreenContent');

// Har page: label (admin list), group, fields (app ka asli current content).
// Image fields ka naam *Image/*Logo/*Photo rakha hai → admin me image uploader banta hai.
const PAGES = [
  {
    page: 'branding', label: 'Branding (Logo & Name)', group: 'Global', order: 0,
    fields: {
      appName: 'Shree Yantra', tagline: 'Astrology',
      logoImage: '', splashTagline: '“Aligning your path with the cosmos”',
    },
  },
  {
    // text fields empty rakhe — app i18n (Hindi/English) se dikhata hai;
    // admin chahe to yahan custom text bhar ke override kar sakta hai.
    page: 'home', label: 'Home / Welcome', group: 'App Pages', order: 1,
    fields: {
      greeting: '', subtitle: '', sectionTitle: '',
      featurePredTitle: '', featurePredDesc: '',
      featureKundliTitle: '', featureKundliDesc: '',
      featureChogTitle: '', featureChogDesc: '',
      bannerImage: '',
    },
  },
  {
    page: 'dailyPrediction', label: 'Daily Prediction', group: 'App Pages', order: 2,
    fields: {
      noteText: 'Predictions are based on classical Vedic Astrology and may vary depending on your exact birth details.',
      heroImage: '',
    },
  },
  {
    page: 'kundli', label: 'Kundli', group: 'App Pages', order: 3,
    fields: { pageTitle: 'KUNDLI', heading: 'YOUR BIRTH CHART' },
  },
  {
    page: 'choghadiya', label: 'Choghadiya', group: 'App Pages', order: 4,
    fields: { subtitle: "Know Today's Auspicious & Inauspicious Timings", locationNote: 'Timings based on your location' },
  },
  {
    page: 'subscribe', label: 'Subscribe / Premium', group: 'App Pages', order: 5,
    fields: { subtitle: 'Unlock Premium Predictions & Remedies', bannerImage: '' },
  },
  {
    page: 'profile', label: 'Profile', group: 'App Pages', order: 6,
    fields: { premiumBadge: 'PREMIUM MEMBER', freeBadge: 'FREE MEMBER' },
  },
  {
    page: 'library', label: 'Library', group: 'App Pages', order: 7,
    fields: { heading: 'DIVINE LIBRARY', subtitle: 'Mantras, Scriptures & Vedic Wisdom' },
  },
];

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — seeding page content…');
  let added = 0;
  for (const p of PAGES) {
    const r = await ScreenContent.updateOne(
      { page: p.page },
      { $setOnInsert: p },
      { upsert: true }
    );
    if (r.upsertedCount) { added++; console.log(`  + ${p.page}`); }
    else console.log(`  · ${p.page} exists, skip`);
  }
  console.log(`Done. ${added} new page(s).`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
