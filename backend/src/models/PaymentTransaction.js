const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['razorpay'], default: 'razorpay', required: true },
    providerPaymentId: { type: String, required: true, unique: true, index: true },
    providerSubscriptionId: { type: String, index: true },
    providerInvoiceId: { type: String, index: true },
    providerOrderId: { type: String },
    amountPaise: { type: Number, required: true, index: true },
    amountRefundedPaise: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
      default: 'created',
      index: true,
    },
    captured: { type: Boolean, default: false },
    method: { type: String, index: true },
    bank: String,
    wallet: String,
    vpa: String,
    cardLast4: String,
    cardNetwork: String,
    email: String,
    contact: String,
    feePaise: { type: Number, default: 0 },
    taxPaise: { type: Number, default: 0 },
    description: String,
    errorCode: String,
    errorDescription: String,
    isTrial: { type: Boolean, default: false, index: true },
    billingPeriodType: { type: String, enum: ['trial', 'paid', 'unknown'], default: 'unknown' },
    eventType: String,
    capturedAt: { type: Date, index: true },
    providerCreatedAt: Date,
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ createdAt: -1 });
paymentTransactionSchema.index({ user: 1, capturedAt: -1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
