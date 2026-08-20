'use strict';

const OtpWidgetToken = require('../models/OtpWidgetToken');
const { createMsg91Client } = require('./msg91.service');
const { normalizeIndianMobile, digest, OtpError } = require('./otpAuth.service');

async function verifyWidgetAccess({ mobile, accessToken }, dependencies = {}) {
  const canonicalPhone = normalizeIndianMobile(mobile);
  const provider = dependencies.provider || createMsg91Client();
  const TokenModel = dependencies.TokenModel || OtpWidgetToken;
  const verified = await provider.verifyWidgetAccessToken(accessToken);
  const verifiedPhone = normalizeIndianMobile(verified.identifier);

  if (verifiedPhone !== canonicalPhone) {
    throw new OtpError('OTP_WIDGET_PHONE_MISMATCH', 'The verified mobile number does not match.', 401, false);
  }

  try {
    await TokenModel.create({
      tokenHash: digest(accessToken),
      phoneHash: digest(canonicalPhone),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new OtpError('OTP_WIDGET_TOKEN_USED', 'This verification session has already been used.', 409, false);
    }
    throw error;
  }

  return canonicalPhone;
}

module.exports = { verifyWidgetAccess };
