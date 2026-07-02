'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const vastu = require('../services/vastu.service');

// POST /api/vastu/analyze
// Body: { propertyType, facing, plot:{width,length,unit}, rooms:{ kitchen:'SE', ... }, requirements }
exports.analyze = asyncHandler(async (req, res) => {
  res.json(vastu.buildAnalysis(req.body || {}));
});

// POST /api/vastu/ask
// Body: same as analyze + { question, lang?, analysis? }
exports.ask = asyncHandler(async (req, res) => {
  if (!String((req.body || {}).question || '').trim()) {
    return res.status(400).json({ error: 'question chahiye' });
  }
  res.json(await vastu.askVastu(req.body || {}));
});
