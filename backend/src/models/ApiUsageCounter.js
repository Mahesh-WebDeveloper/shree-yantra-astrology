const mongoose = require('mongoose');

const apiUsageCounterSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    sku: { type: String, required: true },
    period: { type: String, enum: ['day', 'month'], required: true },
    key: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

apiUsageCounterSchema.index({ provider: 1, sku: 1, period: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('ApiUsageCounter', apiUsageCounterSchema);
