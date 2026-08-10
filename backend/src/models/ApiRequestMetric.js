'use strict';

const mongoose = require('mongoose');

const apiRequestMetricSchema = new mongoose.Schema(
  {
    request_id: { type: String, index: true },
    trace_id: { type: String, index: true },
    method: { type: String, index: true },
    route: { type: String, index: true },
    status_code: { type: Number, index: true },
    duration_ms: Number,
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    platform: String,
    app_version: String,
    error_code: String,
    external_deps: [String],
    slow: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

apiRequestMetricSchema.index({ createdAt: 1 }, { expireAfterSeconds: Number(process.env.OBS_METRICS_RETENTION_SEC || 14 * 86400) });
apiRequestMetricSchema.index({ route: 1, createdAt: -1 });

module.exports = mongoose.model('ApiRequestMetric', apiRequestMetricSchema);
