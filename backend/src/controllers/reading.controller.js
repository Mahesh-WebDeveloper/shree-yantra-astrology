const asyncHandler = require('../middleware/asyncHandler');
const { getReading, getNameSuggestions } = require('../services/reading.service');

// POST /api/name-suggestions  { dob, tob, tz, place|lat+lng, gender?, candidate?, lang?, scope?, origin?, theme?, lengthPref? }
exports.createNameSuggestions = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place, gender, candidate, lang, scope, origin, theme, lengthPref } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  }
  res.json(await getNameSuggestions({ lat, lng, dob, tob, tz, place, gender, candidate, lang, scope, origin, theme, lengthPref }));
});

// POST /api/vedic-reading  { dob, tob, tz, place|lat+lng, lang? }
exports.createReading = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place, lang } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({ error: 'Chahiye: dob (DD-MM-YYYY), tob (HH:MM), tz (+05:30), aur (place YA lat+lng)' });
  }
  res.json(await getReading({ lat, lng, dob, tob, tz, place, lang }));
});
