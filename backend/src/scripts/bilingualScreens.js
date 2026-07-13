// Screen-content ko BILINGUAL banata hai.
//
// BUG: screencontents ke fields plain English STRINGS the ("KUNDLI", "DIVINE LIBRARY"…).
// localizeScreenFields() plain string ko dono bhasha ke liye waisa ka waisa return karta
// hai, aur app ka useScreen().t(key, fallback) non-empty field milte hi apna bilingual
// fallback CHHOD deta hai — isliye Hindi mode me bhi English title dikhta tha. (Choghadiya
// ka title theek tha kyunki wo .t() use hi nahi karta.)
//
// FIX: har plain string ko { en, hi } bana do. Admin panel pehle se dono bhasha edit
// karta hai (ScreensPage), model bhi Mixed hai — sirf data purana tha.
//
// Idempotent: jo pehle se { en, hi } hai use haath nahi lagata; admin ka Hindi likha hua
// overwrite NAHI karta.
// Usage: node src/scripts/bilingualScreens.js
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const ScreenContent = require('../models/ScreenContent');

// page → field → Hindi
const HI = {
  branding: {
    appName: 'Shree Yantra',            // brand — dono bhasha me same
    tagline: 'ज्योतिष',
    splashTagline: '“आपके पथ को ब्रह्मांड से जोड़ते हुए”',
  },
  dailyPrediction: {
    noteText: 'भविष्यवाणियाँ शास्त्रीय वैदिक ज्योतिष पर आधारित हैं और आपके सटीक जन्म विवरण के अनुसार भिन्न हो सकती हैं।',
  },
  kundli: {
    heading: 'आपकी जन्म कुंडली',
    subtitle: 'ग्रह स्थिति व विश्लेषण',
    pageTitle: 'कुंडली',
  },
  choghadiya: {
    subtitle: 'आज के शुभ व अशुभ समय जानें',
    locationNote: 'समय आपकी लोकेशन के अनुसार',
  },
  subscribe: {
    heading: 'प्रीमियम अनलॉक करें',
    subtitle: 'प्रीमियम भविष्यवाणियाँ व उपाय अनलॉक करें',
  },
  profile: {
    premiumBadge: 'प्रीमियम सदस्य',
    freeBadge: 'निःशुल्क सदस्य',
  },
  library: {
    heading: 'दिव्य पुस्तकालय',
    subtitle: 'मंत्र, शास्त्र व वैदिक ज्ञान',
  },
};

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — making screen content bilingual…');

  let changed = 0, skipped = 0;
  for (const screen of await ScreenContent.find({})) {
    const fields = screen.fields || {};
    const hiMap = HI[screen.page] || {};
    let touched = false;

    for (const [key, value] of Object.entries(fields)) {
      // pehle se { en, hi } → chhodo (admin ka likha hua safe rahe)
      if (value && typeof value === 'object') { skipped++; continue; }
      const en = String(value || '');
      if (!en.trim()) continue;              // khaali → app ka bilingual fallback chalega
      const hi = hiMap[key];
      if (!hi) { console.log(`  ! no Hindi for ${screen.page}.${key} — left as English`); continue; }
      fields[key] = { en, hi };
      touched = true;
      console.log(`  ${screen.page}.${key}: "${en.slice(0, 32)}" → hi "${hi.slice(0, 32)}"`);
    }

    if (touched) {
      screen.fields = fields;
      screen.markModified('fields');
      await screen.save();
      changed++;
    }
  }
  console.log(`Done. ${changed} pages updated, ${skipped} fields already bilingual.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Failed:', e); process.exit(1); });
