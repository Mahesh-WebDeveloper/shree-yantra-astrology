const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../services/auth.service');
const Settings = require('../models/Settings');

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
  res.json({ user: req.user.toPublic() });
});

// POST /api/auth/request-otp  { phone }
exports.requestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  res.json(await auth.requestOtp({ phone }));
});

// POST /api/auth/verify-otp  { phone, code, name? }
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { phone, code, name } = req.body;
  const { user, token, isNew, profileComplete } = await auth.verifyOtp({ phone, code, name });
  res.json({ token, user: user.toPublic(), isNew, profileComplete });
});

// POST /api/auth/set-password  (protected)  { email?, password }
// Logged-in user (OTP wala) apne account par email+password link karta hai.
exports.setPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await auth.setPassword(req.user, { email, password });
  res.json({ user: user.toPublic() });
});
