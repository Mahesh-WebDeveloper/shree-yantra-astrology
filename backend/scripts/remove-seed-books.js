require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../src/models/Book');

const SEED_TITLES = [
  'Bhagavad Gita — Saar',
  'Hanuman Chalisa',
  'Vedic Astrology Basics',
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const result = await Book.deleteMany({ title: { $in: SEED_TITLES } });
  console.log(`Removed ${result.deletedCount} seed placeholder book(s). Remaining: ${await Book.countDocuments()}`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
