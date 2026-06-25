const { getDasha } = require('../services/vedastro.service');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/dasha  { dob, tob, tz, place } ya { dob, tob, tz, lat, lng }
exports.createDasha = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  }
  res.json(await getDasha({ lat, lng, dob, tob, tz, place }));
});
