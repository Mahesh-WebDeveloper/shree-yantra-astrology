const asyncHandler = require('../middleware/asyncHandler');
const RigVeda = require('../models/RigVeda');

// GET /api/rigveda — 10 mandala summary (sukta + mantra counts)
exports.mandalas = asyncHandler(async (req, res) => {
  const rows = await RigVeda.aggregate([
    { $group: { _id: '$mandala', suktas: { $sum: 1 }, mantras: { $sum: '$mantraCount' } } },
    { $sort: { _id: 1 } },
  ]);
  const mandalas = rows.map((r) => ({ mandala: r._id, suktas: r.suktas, mantras: r.mantras }));
  res.json({ mandalas });
});

// GET /api/rigveda/:mandala — us mandala ke saare sukta (mantras ke bina, lightweight)
exports.suktas = asyncHandler(async (req, res) => {
  const mandala = Number(req.params.mandala);
  const suktas = await RigVeda.find({ mandala }, { mantras: 0 }).sort({ sukta: 1 }).lean();
  res.json({ mandala, suktas });
});

// GET /api/rigveda/:mandala/:sukta — ek sukta + uske saare mantra
exports.getSukta = asyncHandler(async (req, res) => {
  const mandala = Number(req.params.mandala);
  const sukta = Number(req.params.sukta);
  const doc = await RigVeda.findOne({ mandala, sukta }).lean();
  if (!doc) return res.status(404).json({ error: 'Sukta nahi mila' });
  res.json({ sukta: doc });
});
