const asyncHandler = require('../middleware/asyncHandler');
const RamayanSarga = require('../models/RamayanSarga');

// GET /api/ramayan — 7 kandas summary
exports.kandas = asyncHandler(async (req, res) => {
  const kandas = await RamayanSarga.aggregate([
    { $group: { _id: { kanda: '$kanda', order: '$kandaOrder' }, sargas: { $sum: 1 }, shlokas: { $sum: '$shlokaCount' } } },
    { $project: { _id: 0, kanda: '$_id.kanda', kandaOrder: '$_id.order', sargas: 1, shlokas: 1 } },
    { $sort: { kandaOrder: 1 } },
  ]);
  res.json({ kandas });
});

// GET /api/ramayan/:kanda — us kanda ke saare sargas (shlok ke bina)
exports.sargas = asyncHandler(async (req, res) => {
  const kandaOrder = Number(req.params.kanda);
  const sargas = await RamayanSarga.find({ kandaOrder }, { sarga: 1, shlokaCount: 1, kanda: 1, hindiReady: 1, _id: 0 })
    .sort({ sarga: 1 }).lean();
  if (!sargas.length) return res.status(404).json({ error: 'Kanda nahi mila' });
  res.json({ kanda: sargas[0].kanda, kandaOrder, sargas });
});

// GET /api/ramayan/:kanda/:sarga — ek sarga ke saare shlok
exports.getSarga = asyncHandler(async (req, res) => {
  const kandaOrder = Number(req.params.kanda);
  const sarga = Number(req.params.sarga);
  const doc = await RamayanSarga.findOne({ kandaOrder, sarga }).lean();
  if (!doc) return res.status(404).json({ error: 'Sarga nahi mila' });
  res.json({ sarga: doc });
});
