'use strict';

const crypto = require('crypto');
const ObservabilityLog = require('../models/ObservabilityLog');
const ApiRequestMetric = require('../models/ApiRequestMetric');
const ObservabilityErrorGroup = require('../models/ObservabilityErrorGroup');
const logger = require('../lib/observability/logger');

const SLOW_MS = Number(process.env.OBS_SLOW_REQUEST_MS || 1000);

function mapLogDoc(entry) {
  return {
    timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    level: entry.level,
    service: entry.service,
    environment: entry.environment,
    event_name: entry.event_name,
    message: entry.message,
    request_id: entry.request_id,
    trace_id: entry.trace_id,
    span_id: entry.span_id,
    user_id: entry.user_id || undefined,
    session_id: entry.session_id,
    route: entry.route,
    method: entry.method,
    status_code: entry.status_code,
    duration_ms: entry.duration_ms,
    app_version: entry.app_version,
    platform: entry.platform,
    os_version: entry.os_version,
    device_brand: entry.device_brand,
    device_model: entry.device_model,
    error_code: entry.error_code,
    error_name: entry.error_name,
    stack: entry.stack,
    metadata: entry.metadata,
  };
}

async function persistLogs(batch) {
  if (!batch.length) return;
  await ObservabilityLog.insertMany(batch.map(mapLogDoc), { ordered: false }).catch(() => {});
}

logger.setPersistHandler(persistLogs);

function fingerprintError({ errorName, route, errorCode, message }) {
  const raw = [errorName || 'Error', route || '', errorCode || '', String(message || '').slice(0, 120)].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

async function recordApiRequest(ctx) {
  const {
    requestId, traceId, method, route, statusCode, durationMs, userId,
    platform, appVersion, sessionId, osVersion, deviceBrand, deviceModel,
    clientSource, errorCode, externalDeps,
  } = ctx;
  const slow = durationMs >= SLOW_MS;
  const level = statusCode >= 500 ? 'error' : slow ? 'warn' : 'info';
  const event = statusCode >= 400 ? 'api.request.failed' : slow ? 'api.request.slow' : 'api.request.completed';
  const logFn = logger[level] || logger.info;
  logFn(event, `${method} ${route} ${statusCode} ${durationMs}ms`, {
    request_id: requestId,
    trace_id: traceId,
    method,
    route,
    status_code: statusCode,
    duration_ms: durationMs,
    user_id: userId,
    session_id: sessionId,
    platform,
    app_version: appVersion,
    os_version: osVersion,
    device_brand: deviceBrand,
    device_model: deviceModel,
    error_code: errorCode,
    metadata: {
      ...(clientSource ? { client_source: clientSource } : {}),
      ...(externalDeps?.length ? { external_deps: externalDeps } : {}),
    },
  });

  ApiRequestMetric.create({
    request_id: requestId,
    trace_id: traceId,
    method,
    route,
    status_code: statusCode,
    duration_ms: durationMs,
    user_id: userId || undefined,
    platform,
    app_version: appVersion,
    error_code: errorCode,
    external_deps: externalDeps || [],
    slow,
  }).catch(() => {});
}

async function recordError(err, ctx = {}) {
  const {
    requestId, traceId, route, method, userId, platform, appVersion, statusCode,
  } = ctx;
  const errorName = err?.name || 'Error';
  const errorCode = err?.code || undefined;
  const message = err?.message || 'Unknown error';
  const stack = err?.stack ? String(err.stack).slice(0, 4000) : undefined;
  const fp = fingerprintError({ errorName, route, errorCode, message });

  logger.error('api.request.failed', message, {
    request_id: requestId,
    trace_id: traceId,
    route,
    method,
    status_code: statusCode || err?.status || 500,
    user_id: userId,
    platform,
    app_version: appVersion,
    error_code: errorCode,
    error_name: errorName,
    stack,
    metadata: { fingerprint: fp },
  });

  const severity = (statusCode || 500) >= 500 ? 'high' : 'medium';
  await ObservabilityErrorGroup.findOneAndUpdate(
    { fingerprint: fp },
    {
      $set: {
        title: `${errorName}: ${route || 'unknown'}`,
        error_code: errorCode,
        error_name: errorName,
        route,
        severity,
        last_seen: new Date(),
        last_request_id: requestId,
        last_trace_id: traceId,
        stack_sample: stack,
      },
      $inc: { occurrence_count: 1 },
      $setOnInsert: { first_seen: new Date(), status: 'open' },
      ...(userId ? { $addToSet: { affected_user_ids: userId } } : {}),
      ...(platform ? { $addToSet: { platforms: platform } } : {}),
      ...(appVersion ? { $addToSet: { app_versions: appVersion } } : {}),
    },
    { upsert: true, new: true },
  ).catch(() => {});

  ObservabilityErrorGroup.updateOne(
    { fingerprint: fp },
    [{ $set: { affected_users: { $size: { $ifNull: ['$affected_user_ids', []] } } } }],
  ).catch(() => {});
}

function recordExternalCall({ service, operation, durationMs, ok, requestId, traceId, statusCode, errorCode }) {
  const event = ok ? 'external_api.success' : 'external_api.failed';
  const level = ok ? 'info' : 'warn';
  logger[level](event, `${service}.${operation}`, {
    request_id: requestId,
    trace_id: traceId,
    duration_ms: durationMs,
    status_code: statusCode,
    error_code: errorCode,
    metadata: { external_service: service, operation },
  });
}

module.exports = {
  recordApiRequest,
  recordError,
  recordExternalCall,
  fingerprintError,
  SLOW_MS,
};
