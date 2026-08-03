const mongoose = require('mongoose');

const paymentSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    provider: { type: String, enum: ['razorpay'], default: 'razorpay', required: true },
    providerSubscriptionId: { type: String, unique: true, sparse: true, index: true },
    providerPlanId: { type: String, required: true },
    status: {
      type: String,
      enum: ['created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'],
      default: 'created',
      index: true,
    },
    startAt: Date,
    authorizationExpiresAt: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    nextChargeAt: Date,
    endedAt: Date,
    accessUntil: Date,
    entitlementActive: { type: Boolean, default: false, index: true },
    cancelAtCycleEnd: { type: Boolean, default: false },
    cancellationRequestedAt: Date,
    checkoutVerifiedAt: Date,
    trialConsumedAt: Date,
    initialPeriodType: { type: String, enum: ['trial', 'paid'], default: 'trial' },
    lastPaymentId: String,
    paidCount: { type: Number, default: 0 },
    remainingCount: Number,
    totalCount: Number,
    lastProviderEventAt: Date,
    lastSyncedAt: Date,
    creationLockToken: String,
    creationLockedUntil: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentSubscription', paymentSubscriptionSchema);
