'use strict';

const mongoose = require('mongoose');

const otpChallengeSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    phoneHash: { type: String, required: true, index: true },
    providerRequestId: { type: String, select: false },
    status: {
      type: String,
      enum: ['pending', 'consumed', 'expired', 'blocked', 'replaced'],
      default: 'pending',
      index: true,
    },
    verifyAttempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: Date,
  },
  { timestamps: true }
);

// MongoDB's TTL cleanup is asynchronous; application queries still check expiresAt.
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
otpChallengeSchema.index({ phoneHash: 1, createdAt: -1 });

module.exports = mongoose.model('OtpChallenge', otpChallengeSchema);
