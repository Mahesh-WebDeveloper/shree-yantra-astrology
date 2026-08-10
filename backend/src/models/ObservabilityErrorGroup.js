'use strict';

const mongoose = require('mongoose');

const observabilityErrorGroupSchema = new mongoose.Schema(
  {
    fingerprint: { type: String, unique: true, index: true },
    title: String,
    error_code: String,
    error_name: String,
    service: { type: String, default: 'shree-yantra-backend' },
    route: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['open', 'acknowledged', 'investigating', 'resolved'], default: 'open', index: true },
    occurrence_count: { type: Number, default: 1 },
    affected_users: { type: Number, default: 0 },
    affected_user_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    platforms: [String],
    app_versions: [String],
    first_seen: { type: Date, default: Date.now },
    last_seen: { type: Date, default: Date.now, index: true },
    last_request_id: String,
    last_trace_id: String,
    stack_sample: String,
    assigned_to: String,
    notes: String,
    resolved_at: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model('ObservabilityErrorGroup', observabilityErrorGroupSchema);
