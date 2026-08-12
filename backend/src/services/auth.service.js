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
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const otpAuth = require('./otpAuth.service');

const TOKEN_TTL = '30d'; // mobile app — lamba session theek hai

// SINGLE-DEVICE SESSION: each login mints a fresh random session id which is stored
// on the user (activeSessionId) AND embedded in the JWT (sid). The middleware only
// accepts a token whose sid == the user's current activeSessionId → one live device.
const newSessionId = () => crypto.randomBytes(24).toString('hex');

function signToken(user, sid) {
  return jwt.sign({ sub: String(user._id), sid: sid || user.activeSessionId }, env.jwtSecret, { expiresIn: TOKEN_TTL });
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
  constructor(message, status = 400, code) {
    super(message);
    this.status = status;
    if (code) this.code = code;
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
  const sid = newSessionId();
  const user = await User.create({
    name: name.trim(),
    email,
    phone,
    passwordHash,
    providers: ['password'],
    interests: Array.isArray(interests) ? interests : [],
    activeSessionId: sid,
    lastLoginAt: new Date(),
  });
  return { user, token: signToken(user, sid) };
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

  user.activeSessionId = newSessionId(); // rotate → logs out any other device
  user.lastLoginAt = new Date();
  await user.save();
  return { user, token: signToken(user, user.activeSessionId) };
}

async function getUserById(id) {
  // +activeSessionId so the auth middleware can enforce single-device sessions
  return User.findById(id).select('+activeSessionId');
}

// User-initiated logout — rotate to a fresh (never-issued) session id so the current
// token is dead even if it leaks. We rotate rather than clear, because a cleared
// (empty) activeSessionId would re-enable the legacy "allow" path for a replayed token.
async function logout(user) {
  if (!user) return;
  user.activeSessionId = newSessionId();
  await user.save();
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

// ── MOBILE + OTP ─────────────────────────────────────────────────────
// MSG91 verification and anti-abuse state remain server-side. The existing product
// intentionally uses one OTP flow for both login and registration; new users finish
// their required details in the existing onboarding screens.
function phoneAliases(phone) {
  const digits = phone.slice(3);
  return [phone, `91${digits}`, digits, `0${digits}`];
}

async function requestOtp({ phone, ip }) {
  return otpAuth.sendOtp({ phone, ip });
}

async function resendOtp({ phone, requestId, ip }) {
  return otpAuth.resendOtp({ phone, clientRequestId: requestId, ip });
}

async function verifyOtp({ phone, code, otp, requestId, name }) {
  phone = await otpAuth.verifyOtp({ phone, otp: otp || code, clientRequestId: requestId });
  return completeOtpLogin(phone, name);
}

async function completeOtpLogin(phone, name, UserModel = User) {
  // Match old representations too, then migrate the account to canonical +91 format.
  let user = await UserModel.findOne({ phone: { $in: phoneAliases(phone) } });
  let isNew = false;
  const sid = newSessionId(); // fresh session → any other device gets logged out
  if (!user) {
    isNew = true;
    user = await UserModel.create({
      name: (name && name.trim()) || 'Friend', // asli naam onboarding me set hoga
      phone,
      providers: ['otp'],
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      activeSessionId: sid,
      lastLoginAt: new Date(),
    });
  } else {
    user.phone = phone;
    if (!user.providers.includes('otp')) user.providers.push('otp');
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date();
    user.activeSessionId = sid;
    user.lastLoginAt = new Date();
    await user.save();
  }
  // profile adhura (dob nahi) → frontend birth-details wizard dikhayega
  const profileComplete = !!(user.profile && user.profile.dob);
  return { user, token: signToken(user, sid), isNew, profileComplete };
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
  const sid = newSessionId(); // fresh session → any other device gets logged out
  if (!user) {
    isNew = true;
    user = await User.create({
      name,
      email,
      googleId,
      emailVerified: true,
      providers: ['google'],
      profile: payload.picture ? { avatar: payload.picture } : {},
      activeSessionId: sid,
      lastLoginAt: new Date(),
    });
  } else {
    if (!user.googleId) user.googleId = googleId;
    if (!user.email && email) user.email = email;
    user.emailVerified = true;
    if (!user.providers.includes('google')) user.providers.push('google');
    user.activeSessionId = sid;
    user.lastLoginAt = new Date();
    await user.save();
  }
  const profileComplete = !!(user.profile && user.profile.dob);
  return { user, token: signToken(user, sid), isNew, profileComplete };
}

module.exports = {
  signToken,
  verifyToken,
  registerWithPassword,
  loginWithPassword,
  requestOtp,
  resendOtp,
  verifyOtp,
  loginWithGoogle,
  setPassword,
  logout,
  getUserById,
  AuthError,
  completeOtpLogin,
  phoneAliases,
};
