const asyncHandler = require('../middleware/asyncHandler');
const Ramcharitmanas = require('../models/Ramcharitmanas');

// GET /api/ramcharitmanas — 7 kand summary
exports.kandas = asyncHandler(async (req, res) => {
  const kandas = await Ramcharitmanas.find({}, { verses: 0 }).sort({ kandaOrder: 1 }).lean();
  res.json({ kandas });
});

// GET /api/ramcharitmanas/:kanda — ek kand ke saare verses
exports.getKanda = asyncHandler(async (req, res) => {
  const kandaOrder = Number(req.params.kanda);
  const kanda = await Ramcharitmanas.findOne({ kandaOrder }).lean();
  if (!kanda) return res.status(404).json({ error: 'Kand nahi mila' });
  res.json({ kanda });
});
