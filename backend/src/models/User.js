// User model — abhi email/phone + password se simple auth.
// FUTURE-PROOF: schema aise design kiya hai ki OTP / Google / social login
// baad me bina migration ke plug-in ho jaaye:
//   - email & phone dono unique-sparse (kisi ek se bhi register/login ho sake)
//   - passwordHash optional (OTP/social users ke paas password nahi hoga)
//   - providers[] me har linked auth method track hota hai (password|otp|google|apple)
//   - googleId/appleId sparse-unique (social account linking ke liye)
//   - phoneVerified/emailVerified flags (OTP flow ke liye ready)
// Client jab bhi mobile+OTP ya Google maange — sirf naya provider function add karna,
// model nahi badalna.
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    dob: String,        // 'DD-MM-YYYY'
    tob: String,        // 'HH:MM' (24h)
    tz: { type: String, default: '+05:30' },
    place: String,      // birth place (geocode backend karega)
    lat: Number,
    lng: Number,
    gender: String,
    avatar: String,     // profile pic ka relative path (e.g. /uploads/avatars/xxx.jpg)
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },

    // identifiers — at least one of email/phone present. sparse => null skip unique.
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },

    // password auth (optional — OTP/social users skip it)
    passwordHash: { type: String, select: false },

    // which auth methods this account has linked
    providers: { type: [String], default: [] }, // 'password' | 'otp' | 'google' | 'apple'

    // social account links (future)
    googleId: { type: String, unique: true, sparse: true, select: false },
    appleId: { type: String, unique: true, sparse: true, select: false },

    // verification flags (OTP flow ready)
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },

    // personalisation
    interests: { type: [String], default: [] }, // love|career|wealth|health
    profile: { type: profileSchema, default: () => ({}) },

    // subscription mirror (payment se update hoga)
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },

    // admin dashboard access + moderation
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    blocked: { type: Boolean, default: false },

    lastLoginAt: Date,
  },
  { timestamps: true }
);

// safe public shape — kabhi passwordHash/social ids client ko na jaaye
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email || null,
    phone: this.phone || null,
    providers: this.providers,
    emailVerified: this.emailVerified,
    phoneVerified: this.phoneVerified,
    interests: this.interests,
    profile: this.profile || {},
    plan: this.plan,
    role: this.role,
    blocked: !!this.blocked,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
