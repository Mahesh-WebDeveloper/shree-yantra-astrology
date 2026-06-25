// AI-generated content ka cache — Gemini quota bachane ke liye.
// cacheKey me time-bucket hota hai (date / choghadiya-period) taaki content
// time ke saath naturally refresh ho (daily prediction roz naya, etc.).
const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema(
  {
    cacheKey: { type: String, unique: true, index: true },
    type: String, // 'daily' | 'insights' | 'choghadiya'
    data: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiCache', aiCacheSchema);
