const { getKundli } = require('../services/vedastro.service');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/kundli  { lat, lng, dob:'DD-MM-YYYY', tob:'HH:MM', tz:'+05:30' }
exports.createKundli = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({
      error: 'Chahiye: dob (DD-MM-YYYY), tob (HH:MM), tz (+05:30), aur (place YA lat+lng)',
    });
  }
  const result = await getKundli({ lat, lng, dob, tob, tz, place });
  res.json(result);
});
