const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema(
  {
    en: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    hi: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const mediaItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    artist: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: ['mantra', 'spiritual_music', 'bhajan'],
      required: true,
      index: true,
    },
    subCategory: { type: String, default: '', trim: true, index: true },
    language: { type: String, default: 'hi', trim: true },
    sourceType: {
      type: String,
      enum: ['audio', 'youtube', 'external'],
      default: 'youtube',
      index: true,
    },
    audioUrl: { type: String, default: '', trim: true },
    youtubeVideoId: { type: String, default: '', trim: true, index: true },
    youtubeUrl: { type: String, default: '', trim: true },
    thumbnailImage: { type: String, default: '', trim: true },
    durationText: { type: String, default: '', trim: true },
    sourceName: { type: String, default: '', trim: true },
    sourceUrl: { type: String, default: '', trim: true },
    licenseName: { type: String, default: '', trim: true },
    licenseUrl: { type: String, default: '', trim: true },
    attribution: { type: String, default: '', trim: true },
    rightsNote: { type: String, default: '', trim: true },
    tags: [{ type: String, trim: true }],
    translations: { type: translationSchema, default: () => ({ en: {}, hi: {} }) },
    isPremium: { type: Boolean, default: false },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

mediaItemSchema.index({ published: 1, category: 1, order: 1 });
mediaItemSchema.index(
  { title: 'text', subtitle: 'text', artist: 'text', tags: 'text', subCategory: 'text' },
  { default_language: 'none', language_override: 'textLanguage' }
);

module.exports = mongoose.model('MediaItem', mediaItemSchema);
