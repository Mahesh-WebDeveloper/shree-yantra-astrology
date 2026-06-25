const asyncHandler = require('../middleware/asyncHandler');
const { getLifeTimeline } = require('../services/lifeTimeline.service');

// POST /api/life-timeline  { dob, tob, tz, place|lat+lng, lang? }
exports.createLifeTimeline = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place, lang } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({ error: 'Chahiye: dob (DD-MM-YYYY), tob (HH:MM), tz (+05:30), aur (place YA lat+lng)' });
  }
  res.json(await getLifeTimeline({ lat, lng, dob, tob, tz, place, lang }));
});
