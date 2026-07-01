const asyncHandler = require('../middleware/asyncHandler');
const { MUHURAT_CATEGORIES } = require('../data/muhuratRules');
const { findMuhurat } = require('../services/muhurat.service');

const fromDMY = (v) => {
  if (!v) return null;
  const [d, m, y] = String(v).split('/').map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
};

// GET /api/muhurat/categories
exports.listCategories = asyncHandler(async (req, res) => {
  res.json({
    items: MUHURAT_CATEGORIES.map((c) => ({
      key: c.key, name: c.name, emoji: c.emoji, art: c.art, group: c.group, blurb: c.blurb, nameBased: c.nameBased, why: c.why, requires: c.requires,
    })),
  });
});

// POST /api/muhurat/find { category, date?|month+year?, months?, place|lat+lng, tz?, nameRashi?, birth? }
exports.find = asyncHandler(async (req, res) => {
  const { category, date, month, year, months, place, lat, lng, tz, nameRashi, birth, nameRashi2, birth2, targetDate, toDate } = req.body || {};
  const dmyOk = (v) => v && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(v)) ? String(v) : undefined;
  if (!category) return res.status(400).json({ error: 'category chahiye' });
  if (place == null && (lat == null || lng == null)) return res.status(400).json({ error: 'place YA lat+lng chahiye' });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  // When the user picks an exact date, scan the whole window from TODAY up to it,
  // so the list shows the best of that range and `target` = the chosen date itself.
  let fromDate = fromDMY(date);
  if (targetDate) fromDate = today;
  else {
    if (!fromDate && month && year) fromDate = new Date(Number(year), Number(month) - 1, 1);
    if (!fromDate) fromDate = new Date();
  }
  if (fromDate < today) fromDate = today; // never suggest a past muhurat

  const result = await findMuhurat({
    category,
    fromDate,
    months: months || 2,
    place,
    lat,
    lng,
    tz: tz || '+05:30',
    nameRashi,
    birth,
    nameRashi2,
    birth2,
    targetDate: dmyOk(targetDate),
    toDate: dmyOk(toDate),
  });
  res.json(result);
});
