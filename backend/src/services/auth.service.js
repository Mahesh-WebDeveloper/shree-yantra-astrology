// Auth service — saara auth logic yahan (controllers patle rahein).
//
// DESIGN (future-proof): har auth method ek alag function hai. Abhi sirf
// password method live hai. Jab client mobile+OTP ya Google maange:
//   - OTP:    requestOtp() + verifyOtp() implement karo (SMS provider plug karo)
//   - Google: loginWithGoogle() me google token verify karke user upsert karo
// Baaki app (token, middleware, /me) bilkul same rahega — sirf naya entry point.
//
// Dashboard se control: Settings.authMethods batata hai kaun se methods ON hain.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const TOKEN_TTL = '30d'; // mobile app — lamba session theek hai

function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret); // throws on invalid/expired
}

// normalize identifiers
const normEmail = (e) => (e ? String(e).trim().toLowerCase() : undefined);
const normPhone = (p) => {
  if (!p) return undefined;
  const digits = String(p).replace(/[^\d+]/g, '');
  return digits || undefined;
};

class AuthError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// ── REGISTER (password) ─────────────────────────────────────────────
async function registerWithPassword({ name, email, phone, password, interests }) {
  email = normEmail(email);
  phone = normPhone(phone);
  if (!name || !name.trim()) throw new AuthError('Name zaroori hai');
  if (!email && !phone) throw new AuthError('Email ya mobile number chahiye');
  if (!password || password.length < 6) throw new AuthError('Password kam se kam 6 characters');

  // ── ACCOUNT LINKING / DUPLICATE GUARD ──
  // phone = canonical identity. Pehle se account ho to naya NAHI banate (no duplicate).
  const byPhone = phone ? await User.findOne({ phone }) : null;
  const byEmail = email ? await User.findOne({ email }) : null;

  if (byPhone && byEmail && String(byPhone._id) !== String(byEmail._id)) {
    throw new AuthError('Ye email ek account se aur mobile doosre se juda hai — Sign In karein', 409);
  }
  const existing = byPhone || byEmail;
  if (existing) {
    if (existing.passwordHash) {
      throw new AuthError('Account pehle se hai — Sign In karein', 409);
    }
    // OTP se bana account (password nahi) → SECURITY: unverified register se link
    // mat karo (takeover risk). User OTP login karke Settings me password set kare.
    throw new AuthError('Is number se account hai — OTP se login karke password set karein', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email,
    phone,
    passwordHash,
    providers: ['password'],
    interests: Array.isArray(interests) ? interests : [],
    lastLoginAt: new Date(),
  });
  return { user, token: signToken(user) };
}

// ── LOGIN (password) ────────────────────────────────────────────────
async function loginWithPassword({ identifier, password }) {
  if (!identifier || !password) throw new AuthError('Email/mobile aur password dono chahiye');
  const email = normEmail(identifier);
  const phone = normPhone(identifier);
  // identifier email-jaisa hai ya phone — dono try karo
  const user = await User.findOne({
    $or: [{ email }, { phone }],
  }).select('+passwordHash');
  if (!user || !user.passwordHash) throw new AuthError('Galat email/mobile ya password', 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AuthError('Galat email/mobile ya password', 401);

  user.lastLoginAt = new Date();
  await user.save();
  return { user, token: signToken(user) };
}

async function getUserById(id) {
  return User.findById(id);
}

// ── ACCOUNT LINKING: logged-in user (OTP wala) ko email+password add karna ──
// SECURE: user already authenticated hai (req.user) → koi takeover risk nahi.
// Isse "dono methods ek hi account par" wala linking poora hota hai.
async function setPassword(user, { email, password }) {
  if (!password || password.length < 6) throw new AuthError('Password kam se kam 6 characters');
  if (email) {
    email = normEmail(email);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new AuthError('Sahi email daalein');
    const taken = await User.findOne({ email, _id: { $ne: user._id } });
    if (taken) throw new AuthError('Ye email pehle se kisi aur account par hai', 409);
    user.email = email;
    user.emailVerified = false;
  }
  user.passwordHash = await bcrypt.hash(password, 10);
  if (!user.providers.includes('password')) user.providers.push('password');
  await user.save();
  return user;
}

// ── MOBILE + OTP (sabse simple — non-educated users ke liye) ─────────
// DEV MODE: OTP generate hota hai, console me log + response me 'devCode'
// (taaki bina SMS cost ke client ko demo dikha saken). PRODUCTION me:
//   1) sendOtp() me MSG91 / Twilio / WhatsApp Business API plug karo
//   2) response se devCode HATAO (security)
//   3) Settings.authMethods.otp = true (dashboard se)
const OTP_STORE = new Map(); // phone -> { code, expires, attempts }
const OTP_TTL_MS = 5 * 60 * 1000; // 5 min
const gen6 = () => String(Math.floor(100000 + Math.random() * 900000));

// abhi sirf dev log. Yahan real provider lagega (MSG91/Twilio/WhatsApp).
async function sendOtp(phone, code) {
  if (!env.isProd) console.log(`[OTP] ${phone} → ${code} (dev mode — no real SMS sent)`);
  // TODO(prod): await msg91.send(phone, `Your Shree Yantra OTP is ${code}`);
  return true;
}

const OTP_RESEND_MS = 30 * 1000;      // min gap between OTPs to a number
const OTP_HOURLY_CAP = 5;              // max OTPs per number per hour
async function requestOtp({ phone }) {
  phone = normPhone(phone);
  if (!phone || phone.replace(/\D/g, '').length < 10) throw new AuthError('Please enter a valid mobile number.');
  // SECURITY: per-phone throttle — stops SMS-bomb / SMS-cost abuse (the per-IP limiter alone
  // is defeated by rotating IPs). Cooldown between sends + an hourly cap per number.
  const prev = OTP_STORE.get(phone);
  const now = Date.now();
  let carry = { windowStart: now, sentInWindow: 1 };
  if (prev) {
    if (prev.lastSent && now - prev.lastSent < OTP_RESEND_MS) {
      throw new AuthError('Please wait a few seconds before requesting another OTP.', 429);
    }
    const inWindow = prev.windowStart && now - prev.windowStart < 3600 * 1000;
    const sentInWindow = inWindow ? (prev.sentInWindow || 0) : 0;
    if (sentInWindow >= OTP_HOURLY_CAP) {
      throw new AuthError('Too many OTP requests for this number. Please try again later.', 429);
    }
    carry = { windowStart: inWindow ? prev.windowStart : now, sentInWindow: sentInWindow + 1 };
  }
  const code = gen6();
  OTP_STORE.set(phone, { code, expires: now + OTP_TTL_MS, attempts: 0, lastSent: now, ...carry });
  await sendOtp(phone, code);
  // SECURITY: never return the OTP to the client in production
  return env.isProd ? { sent: true, phone } : { sent: true, phone, devCode: code };
}

async function verifyOtp({ phone, code, name }) {
  phone = normPhone(phone);
  const rec = OTP_STORE.get(phone);
  if (!rec) throw new AuthError('Pehle OTP request karein', 400);
  if (Date.now() > rec.expires) { OTP_STORE.delete(phone); throw new AuthError('OTP expire ho gaya — naya mangwayein', 400); }
  if (rec.attempts >= 5) { OTP_STORE.delete(phone); throw new AuthError('Bahut zyada galat tries — naya OTP mangwayein', 429); }
  if (String(code) !== rec.code) { rec.attempts += 1; throw new AuthError('Galat OTP', 401); }
  OTP_STORE.delete(phone);

  // find-or-create — ek hi flow login + register dono ke liye
  let user = await User.findOne({ phone });
  let isNew = false;
  if (!user) {
    isNew = true;
    user = await User.create({
      name: (name && name.trim()) || 'Friend', // asli naam onboarding me set hoga
      phone,
      providers: ['otp'],
      phoneVerified: true,
      lastLoginAt: new Date(),
    });
  } else {
    if (!user.providers.includes('otp')) user.providers.push('otp');
    user.phoneVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
  }
  // profile adhura (dob nahi) → frontend birth-details wizard dikhayega
  const profileComplete = !!(user.profile && user.profile.dob);
  return { user, token: signToken(user), isNew, profileComplete };
}

// ── GOOGLE SIGN-IN ──────────────────────────────────────────────────
// Frontend gives a Google ID token (from the native GoogleSignin SDK, webClientId).
// We verify it DIRECTLY with Google (no extra npm dep), check the audience is OUR web
// client, then find-or-create the user — same one-flow as OTP (login + register).
async function loginWithGoogle({ idToken }) {
  if (!idToken) throw new AuthError('Google token chahiye');
  if (!env.google.clientId) throw new AuthError('Google login abhi configured nahi hai', 500);

  let payload;
  try {
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
    if (!r.ok) throw new Error('bad status');
    payload = await r.json();
  } catch (_) {
    throw new AuthError('Google verification fail — dobara try karein', 401);
  }
  // the token MUST be minted for our app, and the email must be verified
  if (payload.aud !== env.google.clientId) throw new AuthError('Ye Google token kisi aur app ka hai', 401);
  if (String(payload.email_verified) !== 'true') throw new AuthError('Google email verified nahi hai', 401);

  const email = normEmail(payload.email);
  const googleId = payload.sub;
  const name = (payload.name && String(payload.name).trim()) || (email ? email.split('@')[0] : 'Friend');

  let user = await User.findOne({ $or: [{ googleId }, ...(email ? [{ email }] : [])] });
  let isNew = false;
  if (!user) {
    isNew = true;
    user = await User.create({
      name,
      email,
      googleId,
      emailVerified: true,
      providers: ['google'],
      profile: payload.picture ? { avatar: payload.picture } : {},
      lastLoginAt: new Date(),
    });
  } else {
    if (!user.googleId) user.googleId = googleId;
    if (!user.email && email) user.email = email;
    user.emailVerified = true;
    if (!user.providers.includes('google')) user.providers.push('google');
    user.lastLoginAt = new Date();
    await user.save();
  }
  const profileComplete = !!(user.profile && user.profile.dob);
  return { user, token: signToken(user), isNew, profileComplete };
}

module.exports = {
  signToken,
  verifyToken,
  registerWithPassword,
  loginWithPassword,
  requestOtp,
  verifyOtp,
  loginWithGoogle,
  setPassword,
  getUserById,
  AuthError,
};
