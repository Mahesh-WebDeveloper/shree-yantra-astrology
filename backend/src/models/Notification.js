const mongoose = require('mongoose');

const readReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    body: { type: String, trim: true, required: true },
    translations: {
      en: {
        title: { type: String, trim: true, default: '' },
        body: { type: String, trim: true, default: '' },
      },
      hi: {
        title: { type: String, trim: true, default: '' },
        body: { type: String, trim: true, default: '' },
      },
    },
    type: { type: String, enum: ['promo', 'account', 'prediction'], default: 'promo' },
    audience: { type: String, enum: ['all', 'premium', 'free', 'user'], default: 'all' },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scheduledAt: Date,
    sentAt: Date,
    readBy: { type: [readReceiptSchema], default: [] },
    // per-user "clear/delete": broadcasts are shared docs, so a user hiding one just adds
    // their id here; publicList filters these out. Never deletes the doc for other users.
    hiddenBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, sentAt: -1 });
notificationSchema.index({ targetUserId: 1, sentAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
