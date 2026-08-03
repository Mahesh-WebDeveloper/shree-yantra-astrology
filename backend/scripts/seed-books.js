/**
 * DEV ONLY — do not run on production to populate the admin Library page.
 * The app library uses real imported scripture collections (Gita, Ramayan, Veda, Media).
 * CMS Book documents should only be created via the admin panel when needed.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SEED !== 'true') {
  console.error('Refusing to seed books on production. Set ALLOW_DEV_SEED=true to override.');
  process.exit(1);
}

const mongoose = require('mongoose');
const Book = require('../src/models/Book');

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

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const count = await Book.countDocuments();
  if (count > 0) {
    console.log(`Books already exist (${count}). Skipping seed.`);
  } else {
    await Book.insertMany(BOOKS);
    console.log(`Seeded ${BOOKS.length} dev placeholder books.`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
