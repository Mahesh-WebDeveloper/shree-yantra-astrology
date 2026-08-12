'use strict';

const crypto = require('crypto');
const env = require('../config/env');

const MSG91_BASE = 'https://control.msg91.com/api/v5/otp';

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
      throw new Msg91Error('OTP_PROVIDER_REJECTED', 'OTP could not be sent. Please try again.', 503, false);
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

  return { sendOtp, verifyOtp, resendOtp };
}

module.exports = { createMsg91Client, Msg91Error, MSG91_BASE };
