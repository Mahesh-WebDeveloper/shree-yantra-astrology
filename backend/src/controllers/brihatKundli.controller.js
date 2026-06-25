const asyncHandler = require('../middleware/asyncHandler');
const { getBrihatKundli } = require('../services/brihatKundli.service');

// POST /api/brihat-kundli { dob, tob, tz, place|lat+lng, lang? }
exports.createBrihatKundli = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place, lang } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({
      error: 'Chahiye: dob (DD-MM-YYYY), tob (HH:MM), tz (+05:30), aur (place YA lat+lng)',
    });
  }
  res.json(await getBrihatKundli({ lat, lng, dob, tob, tz, place, lang }));
});
