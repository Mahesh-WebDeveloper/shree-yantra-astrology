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
    deviceBrand: String,  // e.g. 'Samsung' (Platform.constants — no extra permission)
    deviceModel: String,  // e.g. 'SM-G991B'
    // location — 'gps' (device, accurate, user ne permission di) ya 'ip' (approx, carrier CGNAT
    // ki wajah se Indian mobile par galat ho sakti hai — isliye GPS ko prefer karte hain)
    locSource: { type: String, enum: ['gps', 'ip'], index: true },
    ip: String,
    country: String,
    region: String,
    city: String,
    lat: Number,
    lng: Number,
    accuracy: Number,  // GPS accuracy in metres (gps only)
  },
  { timestamps: true }
);

analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ name: 1, screen: 1 });
analyticsEventSchema.index({ country: 1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
