// Ramcharitmanas (Tulsidas) — Awadhi/Hindi, 7 kand. Per-kanda document.
// Mool text (doha/chaupai/sortha/chhand). Source: WirelessAlien/Ramcharitmanas.
const mongoose = require('mongoose');

const rcVerseSchema = new mongoose.Schema(
  {
    number: String, // verse-number (e.g. "1.1")
    type: String,   // चौपाई | दोहा | सोरठा | छंद | श्लोक
    text: String,   // mool Awadhi/Hindi text
  },
  { _id: false }
);

const ramcharitmanasKandaSchema = new mongoose.Schema(
  {
    kanda: String,                 // 'Bal Kand'
    kandaHindi: String,            // 'बालकांड'
    kandaOrder: { type: Number, unique: true, index: true }, // 1..7
    verseCount: Number,
    verses: { type: [rcVerseSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ramcharitmanas', ramcharitmanasKandaSchema);
