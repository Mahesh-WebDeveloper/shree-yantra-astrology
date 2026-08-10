'use strict';

/** @typedef {'mobile'|'website'|'admin'|'server'|'unknown'} ClientSource */

/**
 * Resolve which client originated an API request.
 * Uses X-Platform header, request_id prefix, and route heuristics (works on historical logs too).
 * @param {{ platform?: string, route?: string, request_id?: string, method?: string }} row
 * @returns {ClientSource}
 */
function resolveClientSource(row = {}) {
  const platform = String(row.platform || '').toLowerCase();
  const route = String(row.route || '');
  const requestId = String(row.request_id || '');

  if (platform === 'admin') return 'admin';
  if (platform === 'web') return 'website';
  if (platform === 'ios' || platform === 'android') return 'mobile';

  if (requestId.startsWith('m-')) return 'mobile';
  if (requestId.startsWith('w-')) return 'website';

  if (/\/admin(\/|$)/i.test(route)) return 'admin';

  if (!platform && !requestId && (route === '/' || route === '/api/health' || !route)) {
    return 'server';
  }

  if (!platform && !requestId.startsWith('m-') && !requestId.startsWith('w-') && !/\/admin(\/|$)/i.test(route)) {
    return 'server';
  }

  return 'unknown';
}

/**
 * MongoDB filter for client source (no migration required — uses platform, request_id, route).
 * @param {string} source
 * @returns {object|null}
 */
function sourceFilter(source) {
  const s = String(source || '').toLowerCase();
  if (!s || s === 'all') return null;

  if (s === 'mobile') {
    return {
      $or: [
        { platform: { $in: ['ios', 'android'] } },
        { request_id: /^m-/ },
      ],
    };
  }
  if (s === 'website') {
    return {
      $or: [
        { platform: 'web' },
        { request_id: /^w-/ },
      ],
    };
  }
  if (s === 'admin') {
    return {
      $or: [
        { platform: 'admin' },
        { route: /\/admin(\/|$)/i },
      ],
    };
  }
  if (s === 'server') {
    return {
      $and: [
        { platform: { $nin: ['ios', 'android', 'web', 'admin'] } },
        { request_id: { $not: /^[mw]-/ } },
        { route: { $not: /\/admin(\/|$)/i } },
      ],
    };
  }
  return null;
}

const LABELS = {
  mobile: 'Mobile App',
  website: 'Website',
  admin: 'Admin Panel',
  server: 'Server / Other',
  unknown: 'Unknown',
};

module.exports = {
  resolveClientSource,
  sourceFilter,
  LABELS,
};
