// Page-wise content CMS — har app screen ka editable content + images.
// `fields` ek flexible object hai (key -> string ya image-path). Admin har page
// alag se edit karta hai; app real-time ye content dikhata hai.
const mongoose = require('mongoose');

const screenContentSchema = new mongoose.Schema(
  {
    page: { type: String, unique: true, index: true }, // 'home' | 'dailyPrediction' | ...
    label: { type: String, default: '' },              // admin list me human-readable naam
    group: { type: String, default: 'App' },           // sidebar grouping
    fields: { type: mongoose.Schema.Types.Mixed, default: () => ({}) }, // { heroTitle: { en, hi }, bannerImage: '...' }
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScreenContent', screenContentSchema);
