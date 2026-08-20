'use strict';

const mongoose = require('mongoose');

const otpWidgetTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    phoneHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Keep the replay record briefly after the widget token has been consumed.
otpWidgetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpWidgetToken', otpWidgetTokenSchema);
