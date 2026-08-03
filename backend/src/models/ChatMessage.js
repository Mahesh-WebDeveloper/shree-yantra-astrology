// Astrologer chat history — ek doc = ek turn (user ka sawaal + poora jawab).
// DB me HAMESHA rehta hai (all-time). App sirf pichle 2 din local cache karta hai
// taaki turant dikhe; usse purana "load older" par yahin se aata hai.
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: String, required: true },
    // poora AiAstrologerResponse (answer, sections, remedies, basis, followUps…) jaisa ka taisa
    response: { type: mongoose.Schema.Types.Mixed },
    error: { type: String }, // AI jawab fail — admin tracking ke liye
    lang: { type: String, default: 'en' },
  },
  { timestamps: true }
);

// newest-first per user (history + "before" cursor pagination)
chatMessageSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
