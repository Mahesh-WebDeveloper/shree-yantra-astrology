const asyncHandler = require('../middleware/asyncHandler');
const horoscope = require('../services/horoscope.service');

const needBirth = (b) => b && b.dob && b.tob && b.tz && (b.place != null || (b.lat != null && b.lng != null));

exports.publicList = asyncHandler(async (req, res) => {
  const input = {
    period: req.query.period,
    date: req.query.date,
    place: req.query.place,
    lat: req.query.lat,
    lng: req.query.lng,
    tz: req.query.tz,
    lang: req.query.lang,
  };
  res.json(await horoscope.publicHoroscope(input));
});

exports.personalized = asyncHandler(async (req, res) => {
  if (!needBirth(req.body)) return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  res.json(await horoscope.personalizedHoroscope(req.body));
});
