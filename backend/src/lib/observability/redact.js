'use strict';

const SECRET_KEYS = /^(password|otp|token|access_?token|refresh_?token|authorization|api_?key|secret|cvv|card|pan|razorpay|signature|jwt)$/i;
const PHONE_RE = /(\+?\d{2,3})?(\d{6})(\d{4})/;

function maskPhone(value) {
  const s = String(value || '');
  const m = s.replace(/\D/g, '').match(/(\d{6})(\d{4})$/);
  if (!m) return '******';
  return `******${m[2]}`;
}

function hashShort(value) {
  if (!value) return undefined;
  const s = String(value);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `h${h.toString(16)}`;
}

function redactValue(key, value, depth = 0) {
  if (value == null) return value;
  if (depth > 6) return '[truncated]';
  if (SECRET_KEYS.test(String(key || ''))) return '[REDACTED]';
  if (typeof value === 'string') {
    if (/^Bearer\s+/i.test(value)) return 'Bearer [REDACTED]';
    if (key && /phone|mobile/i.test(String(key))) return maskPhone(value);
    if (value.length > 500) return `${value.slice(0, 500)}…`;
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v, i) => redactValue(String(i), v, depth + 1));
  if (typeof value === 'object') return redactObject(value, depth + 1);
  return value;
}

function redactObject(obj, depth = 0) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = redactValue(k, v, depth);
  }
  return out;
}

function redactHeaders(headers = {}) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();
    if (key === 'authorization' || key === 'cookie' || key === 'x-api-key') {
      out[k] = '[REDACTED]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

function safeBirthMeta(birth = {}) {
  if (!birth || typeof birth !== 'object') return undefined;
  return {
    hasDob: !!birth.dob,
    hasTob: !!birth.tob,
    hasPlace: !!birth.place,
    tz: birth.tz || undefined,
  };
}

module.exports = {
  redactObject,
  redactHeaders,
  redactValue,
  maskPhone,
  hashShort,
  safeBirthMeta,
};
