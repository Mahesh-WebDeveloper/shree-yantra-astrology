'use strict';
const asyncHandler = require('../middleware/asyncHandler');
const numerology = require('../services/numerology.service');
const ai = require('../services/ai.service');

function parseDob(dob, d, m, y) {
  if (d && m && y) return { d: Number(d), m: Number(m), y: Number(y) };
  if (dob && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(dob))) {
    const [dd, mm, yy] = String(dob).split('/').map(Number);
    return { d: dd, m: mm, y: yy };
  }
  return null;
}

// POST /api/numerology/profile { name?, dob:"DD/MM/YYYY" (or d,m,y), currentYear? }
// → deterministic profile (instant, free, no AI).
exports.profile = asyncHandler(async (req, res) => {
  const { name, dob, d, m, y, currentYear } = req.body || {};
  const parts = parseDob(dob, d, m, y);
  if (!parts) return res.status(400).json({ error: 'dob (DD/MM/YYYY) chahiye' });
  res.json({ profile: numerology.fullProfile({ name, d: parts.d, m: parts.m, y: parts.y, currentYear }) });
});

// POST /api/numerology/interpret { name?, dob, lang? } → AI reading grounded on the
// SERVER-recomputed numbers (never trusts client numbers). AI only interprets.
exports.interpret = asyncHandler(async (req, res) => {
  const { name, dob, d, m, y, currentYear, lang } = req.body || {};
  const parts = parseDob(dob, d, m, y);
  if (!parts) return res.status(400).json({ error: 'dob (DD/MM/YYYY) chahiye' });
  const profile = numerology.fullProfile({ name, d: parts.d, m: parts.m, y: parts.y, currentYear });
  const reading = await ai.generateNumerologyReading({ profile, lang });
  res.json({ profile, reading });
});

// POST /api/numerology/check-number { number, mulank | dob } → friend/enemy/neutral.
exports.checkNumber = asyncHandler(async (req, res) => {
  const { number, mulank, dob, d, m, y } = req.body || {};
  if (!number || !String(number).replace(/\D/g, '')) return res.status(400).json({ error: 'number chahiye' });
  let mn = Number(mulank);
  if (!mn) { const parts = parseDob(dob, d, m, y); if (parts) mn = numerology.mulank(parts.d).final; }
  if (!mn || mn < 1 || mn > 9) return res.status(400).json({ error: 'mulank (1-9) YA dob chahiye' });
  res.json({ userMulank: mn, ...numerology.checkNumber(mn, number) });
});
