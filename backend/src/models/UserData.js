// UserData — user ka apna app-data jo pehle SIRF phone par tha (Android Auto-Backup ke
// bharose). Ab server hi "asli ghar" hai: kisi bhi phone par login karo, sab wapas.
//
// Har entry ke saath `at` (client ka timestamp, ms) rehta hai — merge ke liye:
//   jaap     → count MAX liya jaata hai (mala kabhi peeche na jaaye), baaki newer `at`
//   saved    → per-item Last-Write-Wins ({on:false} = un-bookmark, tombstone)
//   progress → per-book LWW
//   samagri  → per-occasion LWW
//   prefs    → LWW
// Yeh classic LWW-register + max-counter design hai (simple, conflict-free, offline-safe).
const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    // { [mantraId]: { j: Number, m: Number, at: Number } }  — j = beads, m = malas target
    jaap: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    // { [itemId]: { on: Boolean, at: Number } }  — bookmarks (on:false = hataya gaya)
    saved: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    // { [bookId]: { chapter: Number, percent: Number, at: Number } }
    progress: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    // { [occasionId]: { items: [Number], at: Number } }  — samagri checklist
    samagri: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    // { lang?, theme?, fontScale?, at }
    prefs: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserData', userDataSchema);
