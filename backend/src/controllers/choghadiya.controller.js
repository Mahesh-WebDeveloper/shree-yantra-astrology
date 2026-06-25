const { getChoghadiya } = require('../services/vedastro.service');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/choghadiya  { place } ya { lat, lng } ya { lat, lng, tz }
exports.createChoghadiya = asyncHandler(async (req, res) => {
  const { lat, lng, place, tz } = req.body;
  if (place == null && (lat == null || lng == null)) {
    return res.status(400).json({ error: 'Chahiye: place YA lat+lng' });
  }
  res.json(await getChoghadiya({ lat, lng, place, tz }));
});
