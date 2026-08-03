const asyncHandler = require('../middleware/asyncHandler');
const { collectServerMetrics } = require('../services/serverMetrics.service');

// GET /api/admin/server-monitor — live VPS + app usage (admin only)
exports.get = asyncHandler(async (req, res) => {
  const metrics = await collectServerMetrics();
  res.json(metrics);
});
