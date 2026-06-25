// Kundli CACHE — ek birth-time (date+time+place) ki kundli kabhi nahi badalti,
// isliye ek baar VedAstro se laa kar hamesha ke liye yahan store kar lete hain.
// Dobara wahi maange to API call hi nahi hoti (fast + free tier bachta hai).
const mongoose = require('mongoose');

const kundliSchema = new mongoose.Schema(
  {
    cacheKey: { type: String, unique: true, index: true },
    input: { type: Object }, // { lat, lng, dob, tob, tz }
    data: { type: Object },  // VedAstro ka result
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kundli', kundliSchema);
