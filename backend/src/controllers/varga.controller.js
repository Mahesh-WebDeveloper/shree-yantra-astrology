const { getVargaCharts } = require('../services/varga.service');
const asyncHandler = require('../middleware/asyncHandler');

exports.createVarga = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place, charts } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({
      error: 'Chahiye: dob (DD-MM-YYYY), tob (HH:MM), tz (+05:30), aur (place YA lat+lng)',
    });
  }
  const result = await getVargaCharts({ lat, lng, dob, tob, tz, place }, { charts });
  res.json(result);
});
