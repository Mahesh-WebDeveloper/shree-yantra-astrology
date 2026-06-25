const asyncHandler = require('../middleware/asyncHandler');
const { getMatch } = require('../services/match.service');

const hasBirth = (b) => b && b.dob && b.tob && b.tz && (b.place != null || (b.lat != null && b.lng != null));

// POST /api/match  { boy:{dob,tob,tz,place|lat+lng,name?}, girl:{...}, lang? }
exports.createMatch = asyncHandler(async (req, res) => {
  const { boy, girl, lang } = req.body;
  if (!hasBirth(boy) || !hasBirth(girl)) {
    return res.status(400).json({
      error: 'Dono ke chahiye: dob (DD-MM-YYYY), tob (HH:MM), tz (+05:30), aur (place YA lat+lng)',
    });
  }
  const result = await getMatch({ boy, girl, lang });
  res.json(result);
});
