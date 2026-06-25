const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    translations: {
      en: {
        name: { type: String, trim: true, default: '' },
        badge: { type: String, trim: true, default: '' },
        features: { type: [String], default: [] },
      },
      hi: {
        name: { type: String, trim: true, default: '' },
        badge: { type: String, trim: true, default: '' },
        features: { type: [String], default: [] },
      },
    },
    priceINR: { type: Number, min: 0, default: 0 },
    durationDays: { type: Number, min: 1, required: true },
    features: { type: [String], default: [] },
    badge: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
