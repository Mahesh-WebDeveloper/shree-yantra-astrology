'use strict';

const mongoose = require('mongoose');

const observabilityLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    level: { type: String, index: true },
    service: String,
    environment: String,
    event_name: { type: String, index: true },
    message: String,
    request_id: { type: String, index: true },
    trace_id: { type: String, index: true },
    span_id: String,
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    session_id: String,
    route: { type: String, index: true },
    method: String,
    status_code: Number,
    duration_ms: Number,
    app_version: String,
    platform: String,
    os_version: String,
    device_brand: String,
    device_model: String,
    error_code: String,
    error_name: String,
    stack: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: false, versionKey: false },
);

observabilityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: Number(process.env.OBS_LOG_RETENTION_SEC || 30 * 86400) });

module.exports = mongoose.model('ObservabilityLog', observabilityLogSchema);
