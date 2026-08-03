const asyncHandler = require('../middleware/asyncHandler');
const ScreenContent = require('../models/ScreenContent');
const AppConfig = require('../models/AppConfig');
const { langFromReq, localizeScreenFields } = require('../utils/localize');
const { enrichScreen, ensureScreenPages, PAGE_CATALOG } = require('../data/screenDefaults');

function parseJsonMaybe(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function enrichResponse(screen, appConfig) {
  return enrichScreen(screen, appConfig);
}

// GET /api/screens  → { screens: { home: {...fields}, dailyPrediction: {...}, ... } }
exports.publicAll = asyncHandler(async (req, res) => {
  const lang = langFromReq(req);
  const rows = await ScreenContent.find().lean();
  const screens = {};
  rows.forEach((r) => {
    const enriched = enrichScreen(r);
    const localized = {};
    Object.entries(enriched.effective || {}).forEach(([key, val]) => {
      if (/image|logo|photo|icon|cover|banner/i.test(key)) {
        localized[key] = typeof val === 'string' ? val : '';
      } else {
        localized[key] = lang === 'hi' ? (val.hi || val.en || '') : (val.en || val.hi || '');
      }
    });
    screens[r.page] = localized;
  });
  res.json({ screens });
});

// GET /api/screens/:page → { fields }
exports.publicGet = asyncHandler(async (req, res) => {
  const lang = langFromReq(req);
  const row = await ScreenContent.findOne({ page: req.params.page }).lean();
  const enriched = enrichScreen(row || { page: req.params.page, fields: {} });
  const localized = {};
  Object.entries(enriched.effective || {}).forEach(([key, val]) => {
    if (/image|logo|photo|icon|cover|banner/i.test(key)) {
      localized[key] = typeof val === 'string' ? val : '';
    } else {
      localized[key] = lang === 'hi' ? (val.hi || val.en || '') : (val.en || val.hi || '');
    }
  });
  res.json({ fields: localized });
});

// GET /api/admin/screens → full list with live app preview (defaults merged)
exports.adminList = asyncHandler(async (req, res) => {
  await ensureScreenPages(ScreenContent);
  const [rows, appConfig] = await Promise.all([
    ScreenContent.find().sort({ order: 1, label: 1 }).lean(),
    AppConfig.getGlobal().catch(() => null),
  ]);
  res.json({ screens: rows.map((row) => enrichResponse(row, appConfig)) });
});

// GET /api/admin/screens/:page
exports.adminGet = asyncHandler(async (req, res) => {
  const appConfig = await AppConfig.getGlobal().catch(() => null);
  const screen = await ScreenContent.findOne({ page: req.params.page }).lean();
  if (!screen) return res.status(404).json({ error: 'Page nahi mila' });
  res.json({ screen: enrichResponse(screen, appConfig) });
});

// PUT /api/admin/screens/:page  { label?, group?, fields }
exports.update = asyncHandler(async (req, res) => {
  const { label, group, fields, order } = req.body;
  let screen = await ScreenContent.findOne({ page: req.params.page });
  if (!screen) {
    const meta = PAGE_CATALOG[req.params.page];
    if (!meta) return res.status(404).json({ error: 'Page nahi mila' });
    screen = new ScreenContent({
      page: req.params.page,
      label: meta.label,
      group: meta.group,
      order: meta.order,
      fields: {},
    });
  }
  if (label !== undefined) screen.label = String(label);
  if (group !== undefined) screen.group = String(group);
  if (order !== undefined) screen.order = Number(order) || 0;
  if (fields !== undefined) {
    const incoming = parseJsonMaybe(fields, {});
    screen.fields = { ...(screen.fields || {}), ...incoming };
    screen.markModified('fields');
  }
  await screen.save();
  const appConfig = await AppConfig.getGlobal().catch(() => null);
  res.json({ screen: enrichResponse(screen.toObject(), appConfig) });
});
