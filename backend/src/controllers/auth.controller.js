const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../services/auth.service');
const Settings = require('../models/Settings');
const payments = require('../services/payment.service');

// GET /api/auth/config — app ko batata hai kaun se login methods dikhane hain
exports.config = asyncHandler(async (req, res) => {
  const s = await Settings.getGlobal();
  res.json({ authMethods: s.authMethods });
});

// POST /api/auth/register  { name, email?, phone?, password, interests? }
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, interests } = req.body;
  const { user, token } = await auth.registerWithPassword({ name, email, phone, password, interests });
  res.status(201).json({ token, user: user.toPublic() });
});

// POST /api/auth/login  { identifier(email|phone), password }
exports.login = asyncHandler(async (req, res) => {
  const { identifier, email, phone, password } = req.body;
  const { user, token } = await auth.loginWithPassword({
    identifier: identifier || email || phone,
    password,
  });
  res.json({ token, user: user.toPublic() });
});

// GET /api/auth/me  (protected)
exports.me = asyncHandler(async (req, res) => {
  await payments.refreshUserEntitlement(req.user);
  res.json({ user: req.user.toPublic() });
});

// POST /api/auth/logout  (protected) — clear the server-side session so the
// current token is dead everywhere (single-device: user-initiated logout).
exports.logout = asyncHandler(async (req, res) => {
  await auth.logout(req.user);
  res.json({ ok: true });
});

// POST /api/auth/send-otp (legacy alias: request-otp) { phone }
exports.requestOtp = asyncHandler(async (req, res) => {
  const phone = req.body.mobile || req.body.phone;
  res.json(await auth.requestOtp({ phone, ip: req.ip }));
});

// POST /api/auth/resend-otp { phone, requestId }
exports.resendOtp = asyncHandler(async (req, res) => {
  const phone = req.body.mobile || req.body.phone;
  const { requestId } = req.body;
  res.json(await auth.resendOtp({ phone, requestId, ip: req.ip }));
});

// POST /api/auth/verify-otp  { phone, otp|code, requestId, name? }
exports.verifyOtp = asyncHandler(async (req, res) => {
  const phone = req.body.mobile || req.body.phone;
  const { otp, code, requestId, name } = req.body;
  const { user, token, isNew, profileComplete } = await auth.verifyOtp({ phone, otp, code, requestId, name });
  res.json({ token, user: user.toPublic(), isNew, profileComplete });
});

// POST /api/auth/msg91-widget/verify { mobile, accessToken, name? }
// The mobile SDK token is never trusted directly. MSG91 validates it server-side
// before the existing application JWT/session is created.
exports.verifyMsg91Widget = asyncHandler(async (req, res) => {
  const { mobile, accessToken, name } = req.body;
  const { user, token, isNew, profileComplete } = await auth.verifyWidgetOtp({ mobile, accessToken, name });
  res.json({ token, user: user.toPublic(), isNew, profileComplete });
});

// POST /api/auth/google  { idToken }  — verify Google ID token, find-or-create, return JWT
exports.google = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const { user, token, isNew, profileComplete } = await auth.loginWithGoogle({ idToken });
  res.json({ token, user: user.toPublic(), isNew, profileComplete });
});

// POST /api/auth/set-password  (protected)  { email?, password }
// Logged-in user (OTP wala) apne account par email+password link karta hai.
exports.setPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await auth.setPassword(req.user, { email, password });
  res.json({ user: user.toPublic() });
});
