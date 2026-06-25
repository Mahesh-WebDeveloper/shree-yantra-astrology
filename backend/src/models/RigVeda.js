// Rigveda — per-sukta document (10 mandala → 1028 sukta → 10,552 mantra).
// Source: HuggingFace JDhruv14/RigVeda (Sanskrit + IAST + English Wilson/Sayana), Apache-2.0.
// Hindi field abhi khaali; AI se on-demand (VerseMeaning) — Valmiki jaisa pattern.
const mongoose = require('mongoose');

const mantraSchema = new mongoose.Schema(
  {
    verse: Number,           // mantra number within sukta
    sanskrit: String,        // mool mantra (Devanagari, accented)
    transliteration: String, // IAST
    english: String,         // English translation (Wilson/Sayana)
    hindi: String,           // Hindi anuvaad (optional; AI/source se baad me)
  },
  { _id: false }
);

const rigvedaSuktaSchema = new mongoose.Schema(
  {
    mandala: { type: Number, index: true },  // 1..10
    sukta: { type: Number, index: true },
    mantraCount: Number,
    hindiReady: { type: Boolean, default: false }, // authentic Hindi (mahakavya OCR) bhar gaya?
    mantras: { type: [mantraSchema], default: [] },
  },
  { timestamps: true }
);

rigvedaSuktaSchema.index({ mandala: 1, sukta: 1 }, { unique: true });

module.exports = mongoose.model('RigVeda', rigvedaSuktaSchema);
