// Generic Veda store — Yajurveda / Samaveda / Atharvaveda (Rigveda ka apna RigVeda model hai).
// Per-section document: ek book ke ek section (sukta/adhyaya) ke saare verses.
// Sanskrit + transliteration + authentic English (Griffith); hindi field AI/source se baad me.
const mongoose = require('mongoose');

const vTextVerseSchema = new mongoose.Schema(
  {
    verse: Number,
    sanskrit: String,        // Devanagari (svaras ke saath)
    transliteration: String, // IAST (jaha ho)
    english: String,         // authentic Griffith/Keith translation
    hindi: String,           // AI/source se baad me
  },
  { _id: false }
);

const vedaTextSchema = new mongoose.Schema(
  {
    veda: { type: String, index: true },       // 'yajurveda' | 'samaveda' | 'atharvaveda'
    book: { type: Number, index: true },        // kanda / adhyaya / part
    bookName: String,                           // display (e.g. 'Kanda 1')
    section: { type: Number, index: true },     // sukta (Yajur/Sama me 1 fixed if no sections)
    sectionName: String,
    verseCount: Number,
    hindiReady: { type: Boolean, default: false },
    verses: { type: [vTextVerseSchema], default: [] },
  },
  { timestamps: true }
);

vedaTextSchema.index({ veda: 1, book: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('VedaText', vedaTextSchema);
