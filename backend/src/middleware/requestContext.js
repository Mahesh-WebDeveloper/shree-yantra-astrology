'use strict';

const { correlationFromRequest } = require('../lib/observability/correlation');
const { runWithContext } = require('../lib/observability/context');
const { recordApiRequest } = require('../services/observability.service');
const { resolveClientSource } = require('../lib/observability/clientSource');

const SLOW_MS = Number(process.env.OBS_SLOW_REQUEST_MS || 1000);

function clientMeta(req) {
  return {
    platform: req.headers['x-platform'] || req.headers['x-client-platform'] || undefined,
    appVersion: req.headers['x-app-version'] || undefined,
    sessionId: req.headers['x-session-id'] || undefined,
    osVersion: req.headers['x-os-version'] || undefined,
    deviceBrand: req.headers['x-device-brand'] || undefined,
    deviceModel: req.headers['x-device-model'] || undefined,
  };
}

function requestContext(req, res, next) {
  const { requestId, traceId, spanId } = correlationFromRequest(req);
  req.requestId = requestId;
  req.traceId = traceId;
  req.spanId = spanId;
  req.observabilityStart = Date.now();
  req.externalDeps = req.externalDeps || [];

  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Trace-Id', traceId);

  runWithContext({ requestId, traceId, spanId, req }, () => {
    res.on('finish', () => {
      const durationMs = Date.now() - (req.observabilityStart || Date.now());
      const route = req.route?.path ? `${req.baseUrl || ''}${req.route.path}` : req.path || req.originalUrl?.split('?')[0];
      const meta = clientMeta(req);
      recordApiRequest({
        requestId,
        traceId,
        method: req.method,
        route,
        statusCode: res.statusCode,
        durationMs,
        userId: req.user?._id,
        platform: meta.platform,
        appVersion: meta.appVersion,
        sessionId: meta.sessionId,
        osVersion: meta.osVersion,
        deviceBrand: meta.deviceBrand,
        deviceModel: meta.deviceModel,
        clientSource: resolveClientSource({ platform: meta.platform, route, requestId }),
        errorCode: res.statusCode >= 400 ? res.locals?.errorCode : undefined,
        externalDeps: req.externalDeps,
      }).catch(() => {});
    });
    next();
  });
}

module.exports = requestContext;
