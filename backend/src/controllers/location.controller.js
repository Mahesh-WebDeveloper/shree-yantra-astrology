const { searchLocations, resolveLocation } = require('../services/location.service');
const asyncHandler = require('../middleware/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const { q, lang, country, limit } = req.query;
  const query = String(q || '').trim();
  if (query.length < 3) return res.json({ items: [] });
  const items = await searchLocations({ query, lang, country, limit });
  res.json({ items });
});

const resolve = asyncHandler(async (req, res) => {
  const item = await resolveLocation(req.body || {});
  res.json({ item });
});

module.exports = { search, resolve };
