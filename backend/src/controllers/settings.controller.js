// Dashboard isi se VedAstro tier dekhta + toggle karta hai.
const Settings = require('../models/Settings');
const env = require('../config/env');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/settings — current tier + kya key set hai
exports.getSettings = asyncHandler(async (req, res) => {
  const s = await Settings.getGlobal();
  res.json({
    vedastroTier: s.vedastroTier,
    hasApiKey: !!env.vedastro.apiKey,
    keyStatus: {
      vedastroKeySet: !!env.vedastro.apiKey,
      geminiKeySet: !!env.ai.geminiKey,
      claudeKeySet: !!env.anthropicKey,
    },
    ayanamsa: env.vedastro.ayanamsa,
    authMethods: s.authMethods,
    aiProvider: s.aiProvider || env.ai.provider || 'gemini',
    updatedAt: s.updatedAt,
  });
});

// PATCH /api/settings/auth-methods  { password?, otp?, google?, apple? }
// Dashboard se app ke login/register options on/off (future methods ke liye).
exports.updateAuthMethods = asyncHandler(async (req, res) => {
  const s = await Settings.getGlobal();
  const { password, otp, google, apple } = req.body;
  if (typeof password === 'boolean') s.authMethods.password = password;
  if (typeof otp === 'boolean') s.authMethods.otp = otp;
  if (typeof google === 'boolean') s.authMethods.google = google;
  if (typeof apple === 'boolean') s.authMethods.apple = apple;
  // password hamesha ON rahe jab tak koi aur method na ho (lockout se bacho)
  const m = s.authMethods;
  if (!m.password && !m.otp && !m.google && !m.apple) {
    return res.status(400).json({ error: 'Kam se kam ek login method ON hona chahiye' });
  }
  s.markModified('authMethods');
  await s.save();
  res.json({ authMethods: s.authMethods, message: 'Auth methods updated successfully.' });
});

// PATCH /api/settings  { vedastroTier?: 'free' | 'paid', aiProvider?: 'gemini' | 'claude' }
exports.updateSettings = asyncHandler(async (req, res) => {
  const { vedastroTier, aiProvider } = req.body;
  const s = await Settings.getGlobal();
  if (vedastroTier !== undefined) {
    if (!['free', 'paid'].includes(vedastroTier)) {
      return res.status(400).json({ error: "vedastroTier 'free' ya 'paid' hona chahiye" });
    }
    // paid select karne se pehle key honi chahiye
    if (vedastroTier === 'paid' && !env.vedastro.apiKey) {
      return res.status(400).json({
        error: 'Paid tier ke liye pehle .env me VEDASTRO_API_KEY daalo aur server restart karo.',
      });
    }
    s.vedastroTier = vedastroTier;
  }
  if (aiProvider !== undefined) {
    if (!['gemini', 'claude'].includes(aiProvider)) {
      return res.status(400).json({ error: "aiProvider 'gemini' ya 'claude' hona chahiye" });
    }
    s.aiProvider = aiProvider;
  }
  await s.save();
  res.json({
    vedastroTier: s.vedastroTier,
    aiProvider: s.aiProvider,
    message: 'Settings updated successfully.',
  });
});

// PATCH /api/settings/ai-provider  { aiProvider: 'gemini' | 'claude' }
exports.updateAiProvider = asyncHandler(async (req, res) => {
  const { aiProvider } = req.body;
  if (!['gemini', 'claude'].includes(aiProvider)) {
    return res.status(400).json({ error: "aiProvider 'gemini' ya 'claude' hona chahiye" });
  }
  const s = await Settings.getGlobal();
  s.aiProvider = aiProvider;
  await s.save();
  res.json({ aiProvider: s.aiProvider, message: 'AI provider updated successfully.' });
});
