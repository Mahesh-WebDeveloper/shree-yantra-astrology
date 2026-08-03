const mongoose = require('mongoose');

const paymentWebhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['razorpay'], default: 'razorpay', required: true },
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    providerSubscriptionId: { type: String, index: true },
    payloadHash: { type: String, required: true },
    providerCreatedAt: Date,
    status: { type: String, enum: ['processing', 'processed', 'ignored', 'failed'], default: 'processing' },
    processedAt: Date,
    error: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentWebhookEvent', paymentWebhookEventSchema);
