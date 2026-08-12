'use strict';

const crypto = require('crypto');
const env = require('../config/env');
const OtpChallenge = require('../models/OtpChallenge');
const OtpThrottle = require('../models/OtpThrottle');
const { createMsg91Client, Msg91Error } = require('./msg91.service');

class OtpError extends Error {
  constructor(code, message, status = 400, retryable = false) {
    super(message);
    this.name = 'OtpError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

function normalizeIndianMobile(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new OtpError('OTP_INVALID_MOBILE', 'Enter a valid 10-digit Indian mobile number.', 400, false);
  }
  return `+91${digits}`;
}

function digest(value) {
  const secret = env.msg91.hashSecret || env.jwtSecret;
  return crypto.createHmac('sha256', secret).update(String(value || '')).digest('hex');
}

function requestId() {
  return crypto.randomBytes(24).toString('base64url');
}

function safeClientIp(value) {
  return String(value || 'unknown').trim().slice(0, 128);
}

async function consumeWindow(scope, subjectHash, max, windowMs, now = new Date()) {
  const bucket = Math.floor(now.getTime() / windowMs);
  const key = `${scope}:${subjectHash}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowMs + 60 * 1000);
  const record = await OtpThrottle.findOneAndUpdate(
    { _id: key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (record.count > max) {
    throw new OtpError('OTP_RATE_LIMIT', 'Too many OTP requests. Please try again later.', 429, true);
  }
  return key;
}

async function releaseWindow(key) {
  if (!key) return;
  await OtpThrottle.updateOne({ _id: key, count: { $gt: 0 } }, { $inc: { count: -1 } }).catch(() => {});
}

async function acquireSendLock(phoneHash, now = new Date()) {
  const key = `lock:${phoneHash}`;
  try {
    await OtpThrottle.create({ _id: key, count: 1, expiresAt: new Date(now.getTime() + env.msg91.requestTimeoutMs) });
    return key;
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const stale = await OtpThrottle.findOne({ _id: key, expiresAt: { $lte: now } });
    if (stale) {
      await OtpThrottle.deleteOne({ _id: key, expiresAt: { $lte: now } });
      return acquireSendLock(phoneHash, now);
    }
    throw new OtpError('OTP_REQUEST_IN_PROGRESS', 'An OTP request is already in progress. Please wait.', 429, true);
  }
}

async function releaseSendLock(key) {
  if (key) await OtpThrottle.deleteOne({ _id: key }).catch(() => {});
}

function assertChallenge(challenge, now = new Date()) {
  if (!challenge || challenge.status !== 'pending') {
    throw new OtpError('OTP_REQUEST_INVALID', 'This verification request is no longer valid. Request a new code.', 400, false);
  }
  if (challenge.expiresAt <= now) {
    challenge.status = 'expired';
    challenge.save().catch(() => {});
    throw new OtpError('OTP_EXPIRED', 'The verification code has expired. Request a new code.', 410, false);
  }
}

function challengeQuery(canonicalPhone, clientRequestId) {
  if (!clientRequestId || !/^[A-Za-z0-9_-]{20,80}$/.test(String(clientRequestId))) {
    throw new OtpError('OTP_REQUEST_INVALID', 'This verification request is invalid. Request a new code.', 400, false);
  }
  return { requestId: String(clientRequestId), phoneHash: digest(canonicalPhone) };
}

async function sendOtp({ phone, ip }) {
  const canonicalPhone = normalizeIndianMobile(phone);
  const phoneHash = digest(canonicalPhone);
  const ipHash = digest(safeClientIp(ip));
  const now = new Date();
  let lockKey;
  let phoneLimitKey;
  let ipLimitKey;
  try {
    lockKey = await acquireSendLock(phoneHash, now);
    const latest = await OtpChallenge.findOne({ phoneHash, status: 'pending' }).sort({ lastSentAt: -1 });
    if (latest && latest.expiresAt > now) {
      const waitMs = env.msg91.resendCooldownSeconds * 1000 - (now.getTime() - latest.lastSentAt.getTime());
      if (waitMs > 0) {
        const error = new OtpError('OTP_COOLDOWN', 'Please wait before requesting another code.', 429, true);
        error.retryAfterSeconds = Math.ceil(waitMs / 1000);
        throw error;
      }
    }

    phoneLimitKey = await consumeWindow('send-phone', phoneHash, env.msg91.maxSendAttempts, env.msg91.sendWindowMs, now);
    ipLimitKey = await consumeWindow('send-ip', ipHash, env.msg91.maxIpSendAttempts, env.msg91.sendWindowMs, now);

    const provider = createMsg91Client();
    const sent = await provider.sendOtp(canonicalPhone);
    await OtpChallenge.updateMany({ phoneHash, status: 'pending' }, { $set: { status: 'replaced' } });
    const id = requestId();
    await OtpChallenge.create({
      requestId: id,
      phoneHash,
      providerRequestId: sent.providerRequestId,
      status: 'pending',
      verifyAttempts: 0,
      resendCount: 0,
      lastSentAt: now,
      expiresAt: new Date(now.getTime() + env.msg91.expirySeconds * 1000),
    });
    return {
      success: true,
      sent: true,
      message: 'OTP sent successfully.',
      requestId: id,
      cooldownSeconds: env.msg91.resendCooldownSeconds,
      expiresInSeconds: env.msg91.expirySeconds,
    };
  } catch (error) {
    if (error instanceof Msg91Error || error?.code === 'OTP_PROVIDER_REJECTED') {
      await Promise.all([releaseWindow(phoneLimitKey), releaseWindow(ipLimitKey)]);
    }
    throw error;
  } finally {
    await releaseSendLock(lockKey);
  }
}

async function resendOtp({ phone, clientRequestId, ip }) {
  const canonicalPhone = normalizeIndianMobile(phone);
  const query = challengeQuery(canonicalPhone, clientRequestId);
  const now = new Date();
  const challenge = await OtpChallenge.findOne(query);
  assertChallenge(challenge, now);
  if (challenge.resendCount >= env.msg91.maxResendAttempts) {
    throw new OtpError('OTP_RESEND_LIMIT', 'The resend limit has been reached. Please request a new code later.', 429, false);
  }
  const waitMs = env.msg91.resendCooldownSeconds * 1000 - (now.getTime() - challenge.lastSentAt.getTime());
  if (waitMs > 0) {
    const error = new OtpError('OTP_COOLDOWN', 'Please wait before resending the code.', 429, true);
    error.retryAfterSeconds = Math.ceil(waitMs / 1000);
    throw error;
  }

  const phoneLimitKey = await consumeWindow('send-phone', query.phoneHash, env.msg91.maxSendAttempts, env.msg91.sendWindowMs, now);
  const ipLimitKey = await consumeWindow('send-ip', digest(safeClientIp(ip)), env.msg91.maxIpSendAttempts, env.msg91.sendWindowMs, now);
  try {
    await createMsg91Client().resendOtp(canonicalPhone);
    challenge.resendCount += 1;
    challenge.lastSentAt = now;
    await challenge.save();
    return {
      success: true,
      sent: true,
      message: 'OTP resent successfully.',
      requestId: challenge.requestId,
      cooldownSeconds: env.msg91.resendCooldownSeconds,
    };
  } catch (error) {
    if (error instanceof Msg91Error) await Promise.all([releaseWindow(phoneLimitKey), releaseWindow(ipLimitKey)]);
    throw error;
  }
}

async function verifyOtp({ phone, otp, clientRequestId }) {
  const canonicalPhone = normalizeIndianMobile(phone);
  if (!/^\d{6}$/.test(String(otp || ''))) {
    throw new OtpError('OTP_INVALID', 'Enter the 6-digit verification code.', 400, false);
  }
  const query = challengeQuery(canonicalPhone, clientRequestId);
  const now = new Date();
  const current = await OtpChallenge.findOne(query);
  assertChallenge(current, now);

  const challenge = await OtpChallenge.findOneAndUpdate(
    { ...query, status: 'pending', expiresAt: { $gt: now }, verifyAttempts: { $lt: env.msg91.maxVerifyAttempts } },
    { $inc: { verifyAttempts: 1 } },
    { new: true }
  );
  if (!challenge) {
    await OtpChallenge.updateOne(query, { $set: { status: 'blocked' } }).catch(() => {});
    throw new OtpError('OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect attempts. Request a new code.', 429, false);
  }

  try {
    await createMsg91Client().verifyOtp(canonicalPhone, String(otp));
  } catch (error) {
    if (['OTP_PROVIDER_TIMEOUT', 'OTP_PROVIDER_UNAVAILABLE', 'OTP_PROVIDER_REJECTED', 'OTP_PROVIDER_CONFIG'].includes(error?.code)) {
      await OtpChallenge.updateOne(query, { $inc: { verifyAttempts: -1 } }).catch(() => {});
    } else if (error?.code === 'OTP_EXPIRED') {
      await OtpChallenge.updateOne(query, { $set: { status: 'expired' } }).catch(() => {});
    } else if (error?.code === 'OTP_INVALID' && challenge.verifyAttempts >= env.msg91.maxVerifyAttempts) {
      await OtpChallenge.updateOne(query, { $set: { status: 'blocked' } }).catch(() => {});
    }
    throw error;
  }

  const consumed = await OtpChallenge.findOneAndUpdate(
    { ...query, status: 'pending' },
    { $set: { status: 'consumed', consumedAt: new Date() } },
    { new: true }
  );
  if (!consumed) throw new OtpError('OTP_REQUEST_INVALID', 'This verification request has already been used.', 409, false);
  return canonicalPhone;
}

module.exports = {
  sendOtp,
  resendOtp,
  verifyOtp,
  normalizeIndianMobile,
  digest,
  OtpError,
};
