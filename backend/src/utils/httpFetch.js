'use strict';

// fetch with a hard timeout — a hung/slow upstream (VedAstro/Gemini/Maps) must never
// tie up a request (and the socket pool) indefinitely. Aborts after timeoutMs.
const { getContext } = require('../lib/observability/context');
const { recordExternalCall } = require('../services/observability.service');

function serviceFromUrl(url) {
  const u = String(url);
  if (u.includes('vedastro')) return 'vedastro';
  if (u.includes('generativelanguage') || u.includes('gemini')) return 'gemini';
  if (u.includes('groq.com')) return 'groq';
  if (u.includes('openrouter')) return 'openrouter';
  if (u.includes('googleapis.com/maps') || u.includes('places.googleapis')) return 'google_places';
  if (u.includes('nominatim')) return 'nominatim';
  if (u.includes('photon')) return 'photon';
  if (u.includes('razorpay')) return 'razorpay';
  return 'external';
}

async function fetchT(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const ctx = getContext();
  const service = serviceFromUrl(url);
  const start = Date.now();
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    recordExternalCall({
      service,
      operation: options.method || 'GET',
      durationMs: Date.now() - start,
      ok: res.ok,
      requestId: ctx.requestId,
      traceId: ctx.traceId,
      statusCode: res.status,
    });
    if (ctx.req?.externalDeps && !ctx.req.externalDeps.includes(service)) {
      ctx.req.externalDeps.push(service);
    }
    return res;
  } catch (e) {
    recordExternalCall({
      service,
      operation: options.method || 'GET',
      durationMs: Date.now() - start,
      ok: false,
      requestId: ctx.requestId,
      traceId: ctx.traceId,
      errorCode: e && e.name,
    });
    if (e && e.name === 'AbortError') {
      throw Object.assign(new Error('Upstream request timed out'), { status: 504 });
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}

module.exports = { fetchT };
