'use strict';

const mongoose = require('mongoose');

const otpThrottleSchema = new mongoose.Schema(
  {
    _id: { type: String },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpThrottle', otpThrottleSchema);
