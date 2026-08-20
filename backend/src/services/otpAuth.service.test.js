'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const OtpChallenge = require('../models/OtpChallenge');
const OtpThrottle = require('../models/OtpThrottle');
const env = require('../config/env');
const otpAuth = require('./otpAuth.service');

function patch(target, replacements) {
  const original = {};
  for (const [key, value] of Object.entries(replacements)) {
    original[key] = target[key];
    target[key] = value;
  }
  return () => Object.assign(target, original);
}

test('Indian mobile numbers normalize to one canonical identity', () => {
  assert.equal(otpAuth.normalizeIndianMobile('98765 43210'), '+919876543210');
  assert.equal(otpAuth.normalizeIndianMobile('09876543210'), '+919876543210');
  assert.equal(otpAuth.normalizeIndianMobile('+91-98765-43210'), '+919876543210');
});

test('invalid mobile numbers are rejected', () => {
  for (const value of ['', '12345', '+911234567890', '+14155552671']) {
    assert.throws(() => otpAuth.normalizeIndianMobile(value), (error) => error.code === 'OTP_INVALID_MOBILE');
  }
});

test('successful send stores no plaintext phone or OTP and returns no OTP', async () => {
  let storedChallenge;
  const restores = [
    patch(OtpThrottle, {
      create: async () => ({}),
      findOneAndUpdate: async () => ({ count: 1 }),
      updateOne: async () => ({}),
      deleteOne: async () => ({}),
      findOne: async () => null,
    }),
    patch(OtpChallenge, {
      findOne: () => ({ sort: async () => null }),
      updateMany: async () => ({}),
      create: async (value) => { storedChallenge = value; return value; },
    }),
    patch(global, { fetch: async () => ({ ok: true, status: 200, json: async () => ({ type: 'success', request_id: 'provider-id' }) }) }),
    patch(env.msg91, { authkey: 'test-authkey', otpTemplateId: 'test-template' }),
  ];
  try {
    const result = await otpAuth.sendOtp({ phone: '+919876543210', ip: '203.0.113.10' });
    assert.equal(result.success, true);
    assert.equal(result.otp, undefined);
    assert.equal(result.phone, undefined);
    assert.equal(storedChallenge.otp, undefined);
    assert.equal(storedChallenge.phone, undefined);
    assert.notEqual(storedChallenge.phoneHash, '+919876543210');
  } finally { restores.reverse().forEach((restore) => restore()); }
});

test('send rate limit blocks provider call', async () => {
  let providerCalled = false;
  const restores = [
    patch(OtpThrottle, {
      create: async () => ({}),
      findOneAndUpdate: async () => ({ count: env.msg91.maxSendAttempts + 1 }),
      updateOne: async () => ({}),
      deleteOne: async () => ({}),
      findOne: async () => null,
    }),
    patch(OtpChallenge, {
      findOne: () => ({ sort: async () => null }),
    }),
    patch(global, { fetch: async () => { providerCalled = true; throw new Error('must not run'); } }),
  ];
  try {
    await assert.rejects(() => otpAuth.sendOtp({ phone: '+919876543210', ip: '203.0.113.10' }), (error) => error.code === 'OTP_RATE_LIMIT');
    assert.equal(providerCalled, false);
  } finally { restores.reverse().forEach((restore) => restore()); }
});

test('resend cooldown is enforced before provider call', async () => {
  let providerCalled = false;
  const challenge = {
    status: 'pending',
    expiresAt: new Date(Date.now() + 60_000),
    lastSentAt: new Date(),
    resendCount: 0,
    save: async () => {},
  };
  const restores = [
    patch(OtpChallenge, { findOne: async () => challenge }),
    patch(global, { fetch: async () => { providerCalled = true; throw new Error('must not run'); } }),
  ];
  try {
    await assert.rejects(() => otpAuth.resendOtp({
      phone: '+919876543210',
      clientRequestId: 'A2345678901234567890',
      ip: '203.0.113.10',
    }), (error) => error.code === 'OTP_COOLDOWN');
    assert.equal(providerCalled, false);
  } finally { restores.reverse().forEach((restore) => restore()); }
});

test('resend attempt cap is enforced', async () => {
  const challenge = {
    status: 'pending',
    expiresAt: new Date(Date.now() + 60_000),
    lastSentAt: new Date(Date.now() - 60_000),
    resendCount: env.msg91.maxResendAttempts,
    save: async () => {},
  };
  const restore = patch(OtpChallenge, { findOne: async () => challenge });
  try {
    await assert.rejects(() => otpAuth.resendOtp({
      phone: '+919876543210',
      clientRequestId: 'A2345678901234567890',
      ip: '203.0.113.10',
    }), (error) => error.code === 'OTP_RESEND_LIMIT');
  } finally { restore(); }
});

test('invalid request ID is rejected before database or provider access', async () => {
  let dbCalled = false;
  const restore = patch(OtpChallenge, { findOne: async () => { dbCalled = true; return null; } });
  try {
    await assert.rejects(() => otpAuth.verifyOtp({
      phone: '+919876543210',
      otp: '482913',
      clientRequestId: 'short',
    }), (error) => error.code === 'OTP_REQUEST_INVALID');
    assert.equal(dbCalled, false);
  } finally { restore(); }
});

test('successful MSG91 verification consumes the request once', async () => {
  const current = {
    status: 'pending',
    expiresAt: new Date(Date.now() + 60_000),
    save: async () => {},
  };
  let updateCall = 0;
  const restores = [
    patch(OtpChallenge, {
      findOne: async () => current,
      findOneAndUpdate: async () => {
        updateCall += 1;
        return updateCall === 1 ? { ...current, verifyAttempts: 1 } : { ...current, status: 'consumed' };
      },
      updateOne: async () => ({}),
    }),
    patch(global, { fetch: async () => ({ ok: true, status: 200, json: async () => ({ type: 'success', message: 'OTP verified success' }) }) }),
    patch(env.msg91, { authkey: 'test-authkey', otpTemplateId: 'test-template' }),
  ];
  try {
    const phone = await otpAuth.verifyOtp({
      phone: '+919876543210',
      otp: '482913',
      clientRequestId: 'A2345678901234567890',
    });
    assert.equal(phone, '+919876543210');
    assert.equal(updateCall, 2);
  } finally { restores.reverse().forEach((restore) => restore()); }
});

test('verification attempt limit blocks further MSG91 checks', async () => {
  let providerCalled = false;
  const current = {
    status: 'pending',
    expiresAt: new Date(Date.now() + 60_000),
    save: async () => {},
  };
  const restores = [
    patch(OtpChallenge, {
      findOne: async () => current,
      findOneAndUpdate: async () => null,
      updateOne: async () => ({}),
    }),
    patch(global, { fetch: async () => { providerCalled = true; throw new Error('must not run'); } }),
  ];
  try {
    await assert.rejects(() => otpAuth.verifyOtp({
      phone: '+919876543210',
      otp: '482913',
      clientRequestId: 'A2345678901234567890',
    }), (error) => error.code === 'OTP_ATTEMPTS_EXCEEDED');
    assert.equal(providerCalled, false);
  } finally { restores.reverse().forEach((restore) => restore()); }
});

test('expired local challenge is rejected without MSG91 request', async () => {
  let providerCalled = false;
  const current = {
    status: 'pending',
    expiresAt: new Date(Date.now() - 1000),
    save: async () => {},
  };
  const restores = [
    patch(OtpChallenge, { findOne: async () => current }),
    patch(global, { fetch: async () => { providerCalled = true; throw new Error('must not run'); } }),
  ];
  try {
    await assert.rejects(() => otpAuth.verifyOtp({
      phone: '+919876543210',
      otp: '482913',
      clientRequestId: 'A2345678901234567890',
    }), (error) => error.code === 'OTP_EXPIRED');
    assert.equal(providerCalled, false);
  } finally { restores.reverse().forEach((restore) => restore()); }
});
