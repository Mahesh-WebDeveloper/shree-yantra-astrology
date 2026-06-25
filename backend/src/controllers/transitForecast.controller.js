const asyncHandler = require('../middleware/asyncHandler');
const { getTransitForecast } = require('../services/transitForecast.service');

// POST /api/transit-forecast  { dob, tob, tz, place|lat+lng, fromYear?, toYear?, lang? }
exports.createTransitForecast = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place, fromYear, toYear, lang } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  }
  res.json(await getTransitForecast({ lat, lng, dob, tob, tz, place, fromYear, toYear, lang }));
});
