'use strict';

const env = require('../../config/env');
const { redactObject } = require('./redact');

const SERVICE = 'shree-yantra-backend';
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };

let persistFn = null;
const queue = [];
let flushTimer = null;
const MAX_QUEUE = 500;

function baseFields(level, eventName, message, meta = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE,
    environment: env.nodeEnv || process.env.NODE_ENV || 'development',
    event_name: eventName,
    message: String(message || eventName || ''),
    ...redactObject(meta),
  };
}

function emit(entry) {
  try {
    const line = JSON.stringify(entry);
    if (env.isProd || process.env.LOG_FORMAT === 'json') {
      // eslint-disable-next-line no-console
      console.log(line);
    } else if (entry.level === 'error' || entry.level === 'fatal') {
      // eslint-disable-next-line no-console
      console.error(line);
    } else if (entry.level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  } catch (_) { /* never throw */ }

  if (persistFn && shouldPersist(entry)) {
    if (queue.length >= MAX_QUEUE) queue.shift();
    queue.push(entry);
    scheduleFlush();
  }
}

function shouldPersist(entry) {
  const min = process.env.OBS_LOG_PERSIST_LEVEL || 'info';
  return (LEVELS[entry.level] || 20) >= (LEVELS[min] || 20);
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushQueue().catch(() => {});
  }, 250);
}

async function flushQueue() {
  if (!persistFn || !queue.length) return;
  const batch = queue.splice(0, 100);
  try {
    await persistFn(batch);
  } catch (_) {
    /* fail-safe: drop batch */
  }
}

function log(level, eventName, message, meta) {
  if ((LEVELS[level] || 20) < (LEVELS[process.env.LOG_LEVEL || 'info'] || 20)) return;
  emit(baseFields(level, eventName, message, meta));
}

const logger = {
  debug: (eventName, message, meta) => log('debug', eventName, message, meta),
  info: (eventName, message, meta) => log('info', eventName, message, meta),
  warn: (eventName, message, meta) => log('warn', eventName, message, meta),
  error: (eventName, message, meta) => log('error', eventName, message, meta),
  fatal: (eventName, message, meta) => log('fatal', eventName, message, meta),
  setPersistHandler(fn) {
    persistFn = typeof fn === 'function' ? fn : null;
  },
  async flush() {
    await flushQueue();
  },
};

module.exports = logger;
