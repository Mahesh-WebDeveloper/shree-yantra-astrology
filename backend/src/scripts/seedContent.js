// Default content seed — app ko turant "dynamic but populated" banata hai.
// Idempotent: sirf khaali collections me daalta hai (admin edits safe rahte hain).
// Run: npm run seed:content
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const Book = require('../models/Book');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const AppConfig = require('../models/AppConfig');
const FaqItem = require('../models/FaqItem');
const MediaItem = require('../models/MediaItem');

const PLANS = [
  { name: 'Free', priceINR: 0, durationDays: 36500, features: ['Daily prediction', 'Basic kundli', 'Choghadiya'], badge: '', isActive: true, order: 0 },
  { name: 'Monthly Premium', priceINR: 99, durationDays: 30, features: ['Everything in Free', 'Full kundli + dasha', 'AI personalised predictions', 'Ad-free'], badge: 'Popular', isActive: true, order: 1 },
  { name: 'Yearly Premium', priceINR: 999, durationDays: 365, features: ['Everything in Monthly', '2 months free', 'Priority support', 'Premium library'], badge: 'Best Value', isActive: true, order: 2 },
];

const BOOKS = [
  {
    title: 'Bhagavad Gita — Saar', author: 'Ved Vyas', category: 'Scripture', language: 'hi',
    description: 'Geeta ke amar updeshon ka saral saar.', isPremium: false, published: true, order: 0,
    chapters: [{ title: 'Adhyay 1 — Arjuna Vishaad', order: 0, content: 'Dharmakshetre Kurukshetre... (saar).' }],
  },
  {
    title: 'Hanuman Chalisa', author: 'Tulsidas', category: 'Mantra', language: 'hi',
    description: '40 chaupaiyon me Hanuman ji ki stuti.', isPremium: false, published: true, order: 1,
    chapters: [{ title: 'Chalisa', order: 0, content: 'Shri Guru Charan Saroj Raj...' }],
  },
  {
    title: 'Vedic Astrology Basics', author: 'Shree Yantra', category: 'Learning', language: 'en',
    description: 'Houses, signs, planets — a beginner friendly intro.', isPremium: true, published: true, order: 2,
    chapters: [{ title: 'The 12 Houses', order: 0, content: 'Each house governs an area of life...' }],
  },
];

const FAQS = [
  { question: 'Mera data kitna accurate hai?', answer: 'Saare calculations VedAstro (Swiss Ephemeris) se hote hain — best-in-class accuracy.', category: 'General', order: 0, published: true },
  { question: 'Premium me kya extra milta hai?', answer: 'Full kundli, dasha, AI personalised predictions aur premium library.', category: 'Subscription', order: 1, published: true },
  { question: 'Login kaise karun?', answer: 'Mobile number daalein, OTP se verify karein — bas ho gaya.', category: 'Account', order: 2, published: true },
];

const MEDIA = [
  {
    title: 'Om Mantra Meditation',
    subtitle: 'Soft Om drone for daily mantra practice',
    artist: 'Traditional',
    category: 'mantra',
    subCategory: 'gayatri',
    sourceType: 'audio',
    audioUrl: '/uploads/content/om-drone.wav',
    youtubeVideoId: 'SarlTxrAbIY',
    youtubeUrl: 'https://www.youtube.com/watch?v=SarlTxrAbIY',
    thumbnailImage: 'https://i.ytimg.com/vi/SarlTxrAbIY/hqdefault.jpg',
    durationText: '108 chants',
    tags: ['gayatri', 'mantra', '108', 'morning'],
    published: true,
    order: 0,
  },
  {
    title: 'Shiva Mantra Tanpura Base',
    subtitle: 'Tanpura background for Mahamrityunjaya or Shiva chanting',
    artist: 'Traditional',
    category: 'mantra',
    subCategory: 'shiva',
    sourceType: 'audio',
    audioUrl: '/uploads/content/tanpura.wav',
    youtubeVideoId: 'Y4TAWi3fUro',
    youtubeUrl: 'https://www.youtube.com/watch?v=Y4TAWi3fUro',
    thumbnailImage: 'https://i.ytimg.com/vi/Y4TAWi3fUro/hqdefault.jpg',
    durationText: 'Chanting',
    tags: ['mahamrityunjaya', 'shiva', 'mantra', 'healing'],
    published: true,
    order: 1,
  },
  {
    title: 'Krishna Flute Meditation',
    subtitle: 'Soft bansuri music for focus and relaxation',
    artist: 'Instrumental',
    category: 'spiritual_music',
    subCategory: 'flute',
    sourceType: 'audio',
    audioUrl: '/uploads/content/flute-calm.wav',
    youtubeVideoId: 'kJQP7kiw5Fk',
    youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    thumbnailImage: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    durationText: 'Instrumental',
    tags: ['flute', 'bansuri', 'krishna', 'meditation'],
    published: true,
    order: 2,
  },
  {
    title: 'Temple Bells Puja Ambience',
    subtitle: 'Sacred bells for puja, aarti and meditation',
    artist: 'Ambient',
    category: 'spiritual_music',
    subCategory: 'temple_bells',
    sourceType: 'audio',
    audioUrl: '/uploads/content/temple-bells.wav',
    youtubeVideoId: '1ZYbU82GVz4',
    youtubeUrl: 'https://www.youtube.com/watch?v=1ZYbU82GVz4',
    thumbnailImage: 'https://i.ytimg.com/vi/1ZYbU82GVz4/hqdefault.jpg',
    durationText: 'Ambient',
    tags: ['temple', 'bells', 'om', 'ambience'],
    published: true,
    order: 3,
  },
  {
    title: 'Hanuman Bhajan Bells Background',
    subtitle: 'Temple bell ambience for Hanuman bhajan practice',
    artist: 'Traditional',
    category: 'bhajan',
    subCategory: 'hanuman',
    sourceType: 'audio',
    audioUrl: '/uploads/content/temple-bells.wav',
    youtubeVideoId: 'AETFvQonfV8',
    youtubeUrl: 'https://www.youtube.com/watch?v=AETFvQonfV8',
    thumbnailImage: 'https://i.ytimg.com/vi/AETFvQonfV8/hqdefault.jpg',
    durationText: 'Chalisa',
    tags: ['hanuman', 'chalisa', 'bhajan'],
    published: true,
    order: 4,
  },
  {
    title: 'Krishna Bhajan Flute Background',
    subtitle: 'Soft flute ambience for Krishna bhajan practice',
    artist: 'Traditional',
    category: 'bhajan',
    subCategory: 'krishna',
    sourceType: 'audio',
    audioUrl: '/uploads/content/flute-calm.wav',
    youtubeVideoId: '3OZK3UezW9c',
    youtubeUrl: 'https://www.youtube.com/watch?v=3OZK3UezW9c',
    thumbnailImage: 'https://i.ytimg.com/vi/3OZK3UezW9c/hqdefault.jpg',
    durationText: 'Bhajan',
    tags: ['krishna', 'bhajan', 'devotional'],
    published: true,
    order: 5,
  },
];

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — seeding content…');

  if ((await SubscriptionPlan.countDocuments()) === 0) {
    await SubscriptionPlan.insertMany(PLANS); console.log(`  + ${PLANS.length} plans`);
  } else console.log('  · plans already present, skip');

  if ((await Book.countDocuments()) === 0) {
    await Book.insertMany(BOOKS); console.log(`  + ${BOOKS.length} books`);
  } else console.log('  · books already present, skip');

  if ((await FaqItem.countDocuments()) === 0) {
    await FaqItem.insertMany(FAQS); console.log(`  + ${FAQS.length} faqs`);
  } else console.log('  · faqs already present, skip');

  try { await MediaItem.collection.dropIndex('title_text_subtitle_text_artist_text_tags_text_subCategory_text'); } catch (_) {}
  await MediaItem.syncIndexes();
  if ((await MediaItem.countDocuments()) === 0) {
    await MediaItem.insertMany(MEDIA); console.log(`  + ${MEDIA.length} media items`);
  } else console.log('  · media already present, skip');

  const cfg = await AppConfig.getGlobal();
  let changed = false;
  if (!cfg.support || !cfg.support.email) { cfg.support = { email: 'support@shreeyantra.app', phone: '+91 90000 00000' }; changed = true; }
  if (!cfg.onboardingSlides || cfg.onboardingSlides.length === 0) {
    cfg.onboardingSlides = [
      { title: 'Discover Your Cosmic Path', subtitle: 'Personalised Vedic horoscopes & kundli analysis.', order: 0, isActive: true },
      { title: 'Daily Divine Guidance', subtitle: 'Predictions tailored to your moon sign & dasha.', order: 1, isActive: true },
      { title: 'Unlock Premium Wisdom', subtitle: 'Detailed predictions & sacred library content.', order: 2, isActive: true },
    ];
    changed = true;
  }
  if (!cfg.featureFlags || Object.keys(cfg.featureFlags).length === 0) {
    cfg.featureFlags = { library: true, choghadiya: true, dailyPrediction: true, kundli: true, aiPredictions: true };
    changed = true;
  }
  if (!cfg.appVersion) { cfg.appVersion = '1.0.0'; changed = true; }
  if (changed) { cfg.markModified('featureFlags'); await cfg.save(); console.log('  + app-config defaults'); }
  else console.log('  · app-config already set, skip');

  console.log('Done.');
  await mongoose.disconnect();
}

run().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
