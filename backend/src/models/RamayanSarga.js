// Valmiki Ramayana — per-sarga document (7 kanda → ~500 sarga → 23,402 shlok).
// Optimized: ek hi doc me sarga ke saare shlok (Sanskrit + English + Hindi same object).
// Hindi field abhi khaali; AI/source se baad me usi field me bhar denge (alag table nahi).
const mongoose = require('mongoose');

const shlokaSchema = new mongoose.Schema(
  {
    shloka: String,          // shloka number (string — kabhi "1", kabhi "1-2")
    sanskrit: String,        // mool shlok (Devanagari)
    transliteration: String,
    wordMeanings: String,    // word-by-word (Sanskrit→English)
    english: String,         // English explanation (readable)
    hindi: String,           // Hindi anuvaad (on-demand AI/source se)
  },
  { _id: false }
);

const ramayanSargaSchema = new mongoose.Schema(
  {
    kanda: String,                 // 'Bala Kanda'
    kandaOrder: { type: Number, index: true }, // 1..7
    sarga: { type: Number, index: true },
    shlokaCount: Number,
    hindiReady: { type: Boolean, default: false }, // Hindi translate ho chuka?
    shlokas: { type: [shlokaSchema], default: [] },
  },
  { timestamps: true }
);

ramayanSargaSchema.index({ kandaOrder: 1, sarga: 1 }, { unique: true });

module.exports = mongoose.model('RamayanSarga', ramayanSargaSchema);
