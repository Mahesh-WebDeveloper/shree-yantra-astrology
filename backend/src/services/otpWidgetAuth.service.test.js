'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyWidgetAccess } = require('./otpWidgetAuth.service');

const accessToken = 'header.payload.signature-for-widget-test';

test('verified widget phone is normalized and token is stored only as hashes', async () => {
  let stored;
  const phone = await verifyWidgetAccess(
    { mobile: '+91 98765 43210', accessToken },
    {
      provider: { verifyWidgetAccessToken: async () => ({ identifier: '919876543210' }) },
      TokenModel: { create: async (value) => { stored = value; return value; } },
    }
  );

  assert.equal(phone, '+919876543210');
  assert.equal(stored.accessToken, undefined);
  assert.equal(stored.phone, undefined);
  assert.notEqual(stored.tokenHash, accessToken);
  assert.notEqual(stored.phoneHash, phone);
});

test('widget token cannot authenticate a different mobile number', async () => {
  await assert.rejects(
    () => verifyWidgetAccess(
      { mobile: '+919876543210', accessToken },
      {
        provider: { verifyWidgetAccessToken: async () => ({ identifier: '919111111111' }) },
        TokenModel: { create: async () => ({}) },
      }
    ),
    (error) => error.code === 'OTP_WIDGET_PHONE_MISMATCH'
  );
});

test('widget access-token is single-use for application login', async () => {
  await assert.rejects(
    () => verifyWidgetAccess(
      { mobile: '+919876543210', accessToken },
      {
        provider: { verifyWidgetAccessToken: async () => ({ identifier: '919876543210' }) },
        TokenModel: { create: async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); } },
      }
    ),
    (error) => error.code === 'OTP_WIDGET_TOKEN_USED'
  );
});
