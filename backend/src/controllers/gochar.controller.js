const asyncHandler = require('../middleware/asyncHandler');
const { getGochar } = require('../services/vedastro.service');
const ai = require('../services/ai.service');

// POST /api/gochar  { dob, tob, tz, place|lat+lng, lang? }
exports.createGochar = asyncHandler(async (req, res) => {
  const { lat, lng, dob, tob, tz, place, lang } = req.body;
  if (!dob || !tob || !tz || (place == null && (lat == null || lng == null))) {
    return res.status(400).json({ error: 'Chahiye: dob (DD-MM-YYYY), tob (HH:MM), tz (+05:30), aur (place YA lat+lng)' });
  }
  const result = await getGochar({ lat, lng, dob, tob, tz, place });
  let explanation = null;
  try {
    explanation = await ai.generateGocharExplanation({
      transits: result.transits, natalMoonSign: result.natalMoonSign, sadeSati: result.sadeSati, lang,
    });
  } catch (_) { /* AI optional */ }
  res.json({ ...result, explanation });
});
