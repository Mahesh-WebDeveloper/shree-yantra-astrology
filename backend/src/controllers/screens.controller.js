const asyncHandler = require('../middleware/asyncHandler');
const ScreenContent = require('../models/ScreenContent');
const { langFromReq, localizeScreenFields } = require('../utils/localize');

function parseJsonMaybe(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

// GET /api/screens  → { screens: { home: {...fields}, dailyPrediction: {...}, ... } }
// App ek baar fetch karke saare pages ka content cache karta hai.
exports.publicAll = asyncHandler(async (req, res) => {
  const lang = langFromReq(req);
  const rows = await ScreenContent.find().lean();
  const screens = {};
  rows.forEach((r) => { screens[r.page] = localizeScreenFields(r.fields || {}, lang); });
  res.json({ screens });
});

// GET /api/screens/:page → { fields }
exports.publicGet = asyncHandler(async (req, res) => {
  const lang = langFromReq(req);
  const row = await ScreenContent.findOne({ page: req.params.page }).lean();
  res.json({ fields: localizeScreenFields((row && row.fields) || {}, lang) });
});

// GET /api/admin/screens → full list (admin Pages list)
exports.adminList = asyncHandler(async (req, res) => {
  const screens = await ScreenContent.find().sort({ order: 1, label: 1 }).lean();
  res.json({ screens });
});

// GET /api/admin/screens/:page
exports.adminGet = asyncHandler(async (req, res) => {
  const screen = await ScreenContent.findOne({ page: req.params.page }).lean();
  if (!screen) return res.status(404).json({ error: 'Page nahi mila' });
  res.json({ screen });
});

// PUT /api/admin/screens/:page  { label?, group?, fields }
// fields ko MERGE karta hai (admin sirf changed keys bheje to baaki preserve).
exports.update = asyncHandler(async (req, res) => {
  const { label, group, fields, order } = req.body;
  const screen = await ScreenContent.findOne({ page: req.params.page });
  if (!screen) return res.status(404).json({ error: 'Page nahi mila' });
  if (label !== undefined) screen.label = String(label);
  if (group !== undefined) screen.group = String(group);
  if (order !== undefined) screen.order = Number(order) || 0;
  if (fields !== undefined) {
    const incoming = parseJsonMaybe(fields, {});
    screen.fields = { ...(screen.fields || {}), ...incoming };
    screen.markModified('fields');
  }
  await screen.save();
  res.json({ screen });
});
