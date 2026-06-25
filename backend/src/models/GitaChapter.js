// Bhagavad Gita — chapter-wise (18 adhyay, 700 shlok).
// Public-domain dataset (gita/gita) se import; DB me store → offline, fast, free.
const mongoose = require('mongoose');

const verseSchema = new mongoose.Schema(
  {
    verse: { type: Number, required: true },
    sanskrit: String,        // mool shlok (Devanagari)
    transliteration: String, // roman
    wordMeanings: String,
    hindi: String,           // Hindi anuvaad
    english: String,         // English translation
  },
  { _id: false }
);

const gitaChapterSchema = new mongoose.Schema(
  {
    chapter: { type: Number, unique: true, index: true }, // 1..18
    name: String,            // Sanskrit naam (अर्जुनविषादयोग)
    transliterated: String,  // Arjun Viṣhād Yog
    meaning: String,         // English meaning (Arjuna's Dilemma)
    translation: String,     // name_translation
    summaryEn: String,
    summaryHi: String,
    versesCount: Number,
    verses: { type: [verseSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GitaChapter', gitaChapterSchema);
