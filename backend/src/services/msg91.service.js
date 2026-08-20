'use strict';

const crypto = require('crypto');
const env = require('../config/env');

const MSG91_BASE = 'https://control.msg91.com/api/v5/otp';
const MSG91_WIDGET_VERIFY_URL = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';

class Msg91Error extends Error {
  constructor(code, message, status = 503, retryable = false) {
    super(message);
    this.name = 'Msg91Error';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

function providerMessage(data) {
  return String(data?.message || '').trim().toLowerCase();
}

function sendRejection(data) {
  const message = providerMessage(data);
  if (/template.*(?:missing|invalid)|invalid.*template/.test(message)) {
    return new Msg91Error(
      'OTP_PROVIDER_TEMPLATE_INVALID',
      'Mobile verification is temporarily unavailable.',
      503,
      false
    );
  }
  if (/balance|credit|insufficient/.test(message)) {
    return new Msg91Error(
      'OTP_PROVIDER_BALANCE',
      'Mobile verification is temporarily unavailable.',
      503,
      false
    );
  }
  return new Msg91Error('OTP_PROVIDER_REJECTED', 'OTP could not be sent. Please try again.', 503, false);
}

function assertConfigured(config) {
  if (!config.authkey || !config.otpTemplateId) {
    throw new Msg91Error(
      'OTP_PROVIDER_CONFIG',
      'Mobile verification is temporarily unavailable.',
      503,
      false
    );
  }
}

function assertAuthkeyConfigured(config) {
  if (!config.authkey) {
    throw new Msg91Error(
      'OTP_PROVIDER_CONFIG',
      'Mobile verification is temporarily unavailable.',
      503,
      false
    );
  }
}

function decodeWidgetToken(accessToken) {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return {};
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (_) {
    return {};
  }
}

function widgetIdentifier(data, accessToken) {
  const tokenData = decodeWidgetToken(accessToken);
  const candidates = [
    data?.data?.identifier,
    data?.data?.mobile,
    data?.data?.phone,
    data?.data?.number,
    data?.identifier,
    data?.mobile,
    data?.phone,
    data?.number,
    // Official verifyAccessToken success schema returns the verified identifier
    // in the top-level message field: { type: 'success', message: '91...' }.
    data?.message,
    tokenData?.identifier,
    tokenData?.mobile,
    tokenData?.phone,
    tokenData?.number,
    tokenData?.sub,
  ];
  return candidates.find((value) => {
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    return /^\+?\d{10,15}$/.test(String(value).replace(/[\s()-]/g, ''));
  });
}

async function fetchJson(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal });
    let data = {};
    try { data = await response.json(); } catch (_) { /* sanitized below */ }
    if (!response.ok) {
      throw new Msg91Error(
        response.status === 401 ? 'OTP_PROVIDER_CONFIG' : 'OTP_PROVIDER_UNAVAILABLE',
        'Mobile verification is temporarily unavailable.',
        503,
        response.status >= 500
      );
    }
    return data;
  } catch (error) {
    if (error instanceof Msg91Error) throw error;
    if (error?.name === 'AbortError') {
      throw new Msg91Error('OTP_PROVIDER_TIMEOUT', 'Mobile verification timed out. Please try again.', 504, true);
    }
    throw new Msg91Error('OTP_PROVIDER_UNAVAILABLE', 'Mobile verification is temporarily unavailable.', 503, true);
  } finally {
    clearTimeout(timer);
  }
}

function createMsg91Client(config = env.msg91, fetchImpl = global.fetch) {
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');

  async function sendOtp(canonicalPhone) {
    assertConfigured(config);
    const otp = String(crypto.randomInt(100000, 1000000));
    const query = new URLSearchParams({
      template_id: config.otpTemplateId,
      mobile: canonicalPhone.replace(/\D/g, ''),
      authkey: config.authkey,
      otp,
      otp_expiry: String(Math.max(1, Math.ceil(config.expirySeconds / 60))),
      otp_length: '6',
      realTimeResponse: '1',
    });
    const data = await fetchJson(fetchImpl, `${MSG91_BASE}?${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The approved MSG91/DLT template variable is ##number##.
      body: JSON.stringify({ number: otp }),
    }, config.timeoutMs);
    if (data?.type !== 'success') {
      throw sendRejection(data);
    }
    return { providerRequestId: String(data.request_id || '') || undefined };
  }

  async function verifyOtp(canonicalPhone, otp) {
    assertConfigured(config);
    const query = new URLSearchParams({
      otp: String(otp),
      mobile: canonicalPhone.replace(/\D/g, ''),
    });
    const data = await fetchJson(fetchImpl, `${MSG91_BASE}/verify?${query}`, {
      method: 'GET',
      headers: { authkey: config.authkey },
    }, config.timeoutMs);
    if (data?.type === 'success') return true;

    const message = providerMessage(data);
    if (message.includes('expired')) {
      throw new Msg91Error('OTP_EXPIRED', 'The verification code has expired. Request a new code.', 410, false);
    }
    if (message.includes('not match') || message.includes('invalid otp')) {
      throw new Msg91Error('OTP_INVALID', 'The verification code is incorrect.', 401, false);
    }
    throw new Msg91Error('OTP_PROVIDER_REJECTED', 'The verification code could not be verified.', 503, false);
  }

  async function resendOtp(canonicalPhone) {
    assertConfigured(config);
    const query = new URLSearchParams({
      authkey: config.authkey,
      retrytype: 'text',
      mobile: canonicalPhone.replace(/\D/g, ''),
    });
    const data = await fetchJson(fetchImpl, `${MSG91_BASE}/retry?${query}`, { method: 'GET' }, config.timeoutMs);
    if (data?.type === 'success') return true;
    const message = providerMessage(data);
    if (message.includes('max retry')) {
      throw new Msg91Error('OTP_RESEND_LIMIT', 'The resend limit has been reached. Please request a new code later.', 429, false);
    }
    throw new Msg91Error('OTP_PROVIDER_REJECTED', 'OTP could not be resent. Please try again.', 503, false);
  }

  async function verifyWidgetAccessToken(accessToken) {
    assertAuthkeyConfigured(config);
    if (typeof accessToken !== 'string' || accessToken.length < 20 || accessToken.length > 4096) {
      throw new Msg91Error('OTP_WIDGET_TOKEN_INVALID', 'The verification session is invalid.', 401, false);
    }
    const data = await fetchJson(fetchImpl, MSG91_WIDGET_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ authkey: config.authkey, 'access-token': accessToken }),
    }, config.timeoutMs);

    const success = data?.type === 'success' || data?.status === 'success' || data?.success === true;
    if (!success) {
      const message = providerMessage(data);
      if (/auth\s*key|authentication|unauthori[sz]ed/.test(message)) {
        throw new Msg91Error(
          'OTP_PROVIDER_CONFIG',
          'Mobile verification is temporarily unavailable.',
          503,
          false
        );
      }
      const expired = message.includes('expired');
      throw new Msg91Error(
        expired ? 'OTP_EXPIRED' : 'OTP_WIDGET_TOKEN_INVALID',
        expired ? 'The verification session has expired.' : 'The verification session is invalid.',
        401,
        false
      );
    }

    const identifier = widgetIdentifier(data, accessToken);
    if (identifier == null || String(identifier).trim() === '') {
      throw new Msg91Error(
        'OTP_PROVIDER_REJECTED',
        'The verified mobile number was not returned by the provider.',
        503,
        false
      );
    }
    return { identifier: String(identifier) };
  }

  return { sendOtp, verifyOtp, resendOtp, verifyWidgetAccessToken };
}

module.exports = { createMsg91Client, Msg91Error, MSG91_BASE, MSG91_WIDGET_VERIFY_URL };
