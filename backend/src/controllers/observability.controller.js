'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const ObservabilityLog = require('../models/ObservabilityLog');
const ApiRequestMetric = require('../models/ApiRequestMetric');
const ObservabilityErrorGroup = require('../models/ObservabilityErrorGroup');
const { collectServerMetrics } = require('../services/serverMetrics.service');
const { resolveClientSource, sourceFilter } = require('../lib/observability/clientSource');

function buildLogFilter(query = {}) {
  const filter = {};
  if (query.level) filter.level = query.level;
  if (query.route) filter.route = new RegExp(String(query.route), 'i');
  if (query.event) filter.event_name = new RegExp(String(query.event), 'i');
  if (query.request_id) filter.request_id = String(query.request_id);
  if (query.trace_id) filter.trace_id = String(query.trace_id);
  if (query.user_id) filter.user_id = query.user_id;
  if (query.platform) filter.platform = String(query.platform);
  if (query.method) filter.method = String(query.method).toUpperCase();
  if (query.status_code) filter.status_code = Number(query.status_code);
  if (query.errors_only === 'true' || query.errors_only === '1') filter.status_code = { $gte: 400 };
  if (query.since) filter.timestamp = { ...(filter.timestamp || {}), $gte: new Date(String(query.since)) };
  if (query.until) filter.timestamp = { ...(filter.timestamp || {}), $lte: new Date(String(query.until)) };
  if (query.q) filter.message = new RegExp(String(query.q), 'i');

  const src = sourceFilter(query.source);
  if (src) {
    if (Object.keys(filter).length) return { $and: [filter, src] };
    return src;
  }
  return filter;
}

function enrichLog(log) {
  const clientSource = log.metadata?.client_source || resolveClientSource(log);
  return { ...log, client_source: clientSource };
}

const LOG_SORT_FIELDS = {
  timestamp: 'timestamp',
  level: 'level',
  duration: 'duration_ms',
  status: 'status_code',
  route: 'route',
  event: 'event_name',
};

function logSort(query = {}) {
  const field = LOG_SORT_FIELDS[String(query.sort || 'timestamp')] || 'timestamp';
  const dir = String(query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  return { [field]: dir };
}

const overview = asyncHandler(async (req, res) => {
  const since1h = new Date(Date.now() - 3600000);
  const since24h = new Date(Date.now() - 86400000);

  const [requests1h, errors1h, slow1h, openErrors, errorGroups24h, host] = await Promise.all([
    ApiRequestMetric.countDocuments({ createdAt: { $gte: since1h } }),
    ApiRequestMetric.countDocuments({ createdAt: { $gte: since1h }, status_code: { $gte: 500 } }),
    ApiRequestMetric.countDocuments({ createdAt: { $gte: since1h }, slow: true }),
    ObservabilityErrorGroup.countDocuments({ status: { $in: ['open', 'acknowledged', 'investigating'] } }),
    ObservabilityErrorGroup.countDocuments({ last_seen: { $gte: since24h } }),
    collectServerMetrics().catch(() => null),
  ]);

  const errorRate = requests1h ? Math.round((errors1h / requests1h) * 1000) / 10 : 0;

  res.json({
    requestsLastHour: requests1h,
    errorsLastHour: errors1h,
    slowLastHour: slow1h,
    errorRatePct: errorRate,
    openErrorGroups: openErrors,
    newErrorGroups24h: errorGroups24h,
    host: host ? { cpu: host.cpu, memory: host.memory, disk: host.disk } : null,
  });
});

const listErrors = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(10, Number(req.query.limit) || 20));
  const status = String(req.query.status || '').trim();
  const q = String(req.query.q || '').trim();
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { route: new RegExp(q, 'i') }, { error_code: new RegExp(q, 'i') }];

  const [total, items] = await Promise.all([
    ObservabilityErrorGroup.countDocuments(filter),
    ObservabilityErrorGroup.find(filter).sort({ last_seen: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  res.json({ items, total, page });
});

const getError = asyncHandler(async (req, res) => {
  const item = await ObservabilityErrorGroup.findOne({ fingerprint: req.params.fingerprint }).lean();
  if (!item) return res.status(404).json({ error: 'Error group not found' });
  const logs = await ObservabilityLog.find({ 'metadata.fingerprint': req.params.fingerprint })
    .sort({ timestamp: -1 }).limit(30).lean()
    .catch(() => ObservabilityLog.find({ error_name: item.error_name, route: item.route }).sort({ timestamp: -1 }).limit(30).lean());
  res.json({ group: item, recentLogs: logs });
});

const updateError = asyncHandler(async (req, res) => {
  const { status, assigned_to, notes } = req.body || {};
  const update = {};
  if (status) update.status = status;
  if (assigned_to != null) update.assigned_to = assigned_to;
  if (notes != null) update.notes = notes;
  if (status === 'resolved') update.resolved_at = new Date();
  const item = await ObservabilityErrorGroup.findOneAndUpdate({ fingerprint: req.params.fingerprint }, update, { new: true });
  if (!item) return res.status(404).json({ error: 'Error group not found' });
  res.json({ group: item });
});

const apiStats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - (Number(req.query.hours) || 24) * 3600000);
  const rows = await ApiRequestMetric.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { method: '$method', route: '$route' },
        requests: { $sum: 1 },
        errors: { $sum: { $cond: [{ $gte: ['$status_code', 500] }, 1, 0] } },
        avgMs: { $avg: '$duration_ms' },
        maxMs: { $max: '$duration_ms' },
        lastError: { $max: { $cond: [{ $gte: ['$status_code', 500] }, '$createdAt', null] } },
      },
    },
    { $sort: { requests: -1 } },
    { $limit: 80 },
  ]);
  res.json({
    endpoints: rows.map((r) => ({
      method: r._id.method,
      route: r._id.route,
      requests: r.requests,
      errorPct: r.requests ? Math.round((r.errors / r.requests) * 1000) / 10 : 0,
      avgMs: Math.round(r.avgMs || 0),
      p95Ms: Math.round(r.maxMs || 0),
      lastError: r.lastError,
    })),
  });
});

const searchLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(20, Number(req.query.limit) || 40));
  const filter = buildLogFilter(req.query);
  const sort = logSort(req.query);

  const [total, logs] = await Promise.all([
    ObservabilityLog.countDocuments(filter),
    ObservabilityLog.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  res.json({ logs: logs.map(enrichLog), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
});

const getLog = asyncHandler(async (req, res) => {
  const log = await ObservabilityLog.findById(req.params.id).lean();
  if (!log) return res.status(404).json({ error: 'Log entry not found' });
  let traceTimeline = [];
  if (log.request_id) {
    traceTimeline = await ObservabilityLog.find({ request_id: log.request_id }).sort({ timestamp: 1 }).lean();
  }
  res.json({ log: enrichLog(log), traceTimeline: traceTimeline.map(enrichLog) });
});

const deleteLog = asyncHandler(async (req, res) => {
  const result = await ObservabilityLog.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ error: 'Log entry not found' });
  res.json({ deleted: true, id: req.params.id });
});

const deleteAllLogs = asyncHandler(async (req, res) => {
  const filter = buildLogFilter(req.query);
  const result = await ObservabilityLog.deleteMany(filter);
  res.json({ deleted: result.deletedCount || 0 });
});

const deleteBulkLogs = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ error: 'No log IDs provided' });
  const result = await ObservabilityLog.deleteMany({ _id: { $in: ids } });
  res.json({ deleted: result.deletedCount || 0 });
});

const traceByRequestId = asyncHandler(async (req, res) => {
  const requestId = String(req.params.requestId || '');
  const [logs, metric] = await Promise.all([
    ObservabilityLog.find({ request_id: requestId }).sort({ timestamp: 1 }).lean(),
    ApiRequestMetric.findOne({ request_id: requestId }).lean(),
  ]);
  res.json({ requestId, metric, timeline: logs });
});

module.exports = {
  overview,
  listErrors,
  getError,
  updateError,
  apiStats,
  searchLogs,
  getLog,
  deleteLog,
  deleteAllLogs,
  deleteBulkLogs,
  traceByRequestId,
};
