const { getSunTimes } = require('../services/vedastro.service');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/sunrise  { place, date?:'DD/MM/YYYY' } ya { lat, lng, date? }
exports.createSunrise = asyncHandler(async (req, res) => {
  const { lat, lng, place, date, tz } = req.body;
  if (place == null && (lat == null || lng == null)) {
    return res.status(400).json({ error: 'Chahiye: place YA lat+lng' });
  }
  res.json(await getSunTimes({ lat, lng, place, date, tz }));
});
