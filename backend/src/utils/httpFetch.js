'use strict';

// fetch with a hard timeout — a hung/slow upstream (VedAstro/Gemini/Maps) must never
// tie up a request (and the socket pool) indefinitely. Aborts after timeoutMs.
async function fetchT(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e) {
    if (e && e.name === 'AbortError') {
      throw Object.assign(new Error('Upstream request timed out'), { status: 504 });
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}

module.exports = { fetchT };
