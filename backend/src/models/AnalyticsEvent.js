// Analytics event — har app interaction (app_open, screen_view, login, etc.)
// Location server-side IP se nikalti hai (geoip-lite) — privacy friendly, GPS nahi.
const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    deviceId: { type: String, index: true },      // anonymous persistent device id
    sessionId: { type: String, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, index: true }, // 'app_open' | 'screen_view' | 'login' | ...
    screen: { type: String },
    props: { type: mongoose.Schema.Types.Mixed },
    // device
    platform: String,   // ios | android | web
    osVersion: String,
    appVersion: String,
    // location (IP se)
    ip: String,
    country: String,
    region: String,
    city: String,
    lat: Number,
    lng: Number,
  },
  { timestamps: true }
);

analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ name: 1, screen: 1 });
analyticsEventSchema.index({ country: 1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
