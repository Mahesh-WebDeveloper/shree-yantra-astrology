const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    translations: {
      en: {
        title: { type: String, trim: true, default: '' },
        content: { type: String, default: '' },
      },
      hi: {
        title: { type: String, trim: true, default: '' },
        content: { type: String, default: '' },
      },
    },
    order: { type: Number, default: 0 },
    content: { type: String, default: '' },
    audioUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: false }
);

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    author: { type: String, trim: true, default: '' },
    translations: {
      en: {
        title: { type: String, trim: true, default: '' },
        author: { type: String, trim: true, default: '' },
        category: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
      },
      hi: {
        title: { type: String, trim: true, default: '' },
        author: { type: String, trim: true, default: '' },
        category: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
      },
    },
    coverImage: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'General' },
    description: { type: String, trim: true, default: '' },
    language: { type: String, trim: true, default: 'en' },
    chapters: { type: [chapterSchema], default: [] },
    isPremium: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bookSchema.index({ published: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model('Book', bookSchema);
