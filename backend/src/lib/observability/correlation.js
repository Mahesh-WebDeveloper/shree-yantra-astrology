'use strict';

const crypto = require('crypto');

function newRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function parseTraceParent(header) {
  const s = String(header || '').trim();
  // W3C traceparent: version-traceid-spanid-flags
  const m = s.match(/^[\da-f]{2}-([\da-f]{32})-([\da-f]{16})-[\da-f]{2}$/i);
  if (!m) return null;
  return { traceId: m[1], spanId: m[2] };
}

function correlationFromRequest(req) {
  const incomingReqId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const tp = parseTraceParent(req.headers.traceparent);
  const requestId = incomingReqId ? String(incomingReqId).slice(0, 128) : newRequestId();
  const traceId = tp?.traceId || requestId.replace(/-/g, '').slice(0, 32).padEnd(32, '0');
  const spanId = tp?.spanId || crypto.randomBytes(8).toString('hex');
  return { requestId, traceId, spanId };
}

module.exports = { newRequestId, correlationFromRequest, parseTraceParent };
