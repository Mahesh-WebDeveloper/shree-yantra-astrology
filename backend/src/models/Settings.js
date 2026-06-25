// App-wide settings — abhi sirf VedAstro tier (free/paid) ka toggle.
// Ek hi global document rehta hai (singleton). Dashboard isi ko badalta hai.
const mongoose = require('mongoose');
const env = require('../config/env');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    // 'free' = bina key, 15 req/min | 'paid' = $1/mo unlimited (key se)
    vedastroTier: { type: String, enum: ['free', 'paid'], default: 'free' },

    // Dashboard se control: app me kaun se login/register methods dikhein.
    // Abhi sirf password live hai. OTP/Google/Apple ka backend future me jab
    // implement hoga, dashboard se ON kar dena → app automatically dikhane lagega.
    authMethods: {
      password: { type: Boolean, default: true },
      otp: { type: Boolean, default: false },
      google: { type: Boolean, default: false },
      apple: { type: Boolean, default: false },
    },

    aiProvider: { type: String, enum: ['gemini', 'claude'], default: 'gemini' },
  },
  { timestamps: true }
);

// hamesha ek hi settings doc — ATOMIC upsert (race-safe).
// (pehle findOne+create tha → 9 parallel requests ek saath create karte the →
//  E11000 duplicate key error. Upsert se ye problem khatam.)
settingsSchema.statics.getGlobal = async function () {
  return this.findOneAndUpdate(
    { key: 'global' },
    {
      $setOnInsert: {
        key: 'global',
        vedastroTier: env.vedastro.tier === 'paid' ? 'paid' : 'free',
        aiProvider: ['gemini', 'claude'].includes(env.ai.provider) ? env.ai.provider : 'gemini',
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('Settings', settingsSchema);
