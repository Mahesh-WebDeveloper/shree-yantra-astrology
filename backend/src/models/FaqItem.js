const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    answer: { type: String, trim: true, required: true },
    translations: {
      en: {
        question: { type: String, trim: true, default: '' },
        answer: { type: String, trim: true, default: '' },
        category: { type: String, trim: true, default: '' },
      },
      hi: {
        question: { type: String, trim: true, default: '' },
        answer: { type: String, trim: true, default: '' },
        category: { type: String, trim: true, default: '' },
      },
    },
    category: { type: String, trim: true, default: 'General' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

faqItemSchema.index({ published: 1, order: 1 });

module.exports = mongoose.model('FaqItem', faqItemSchema);
