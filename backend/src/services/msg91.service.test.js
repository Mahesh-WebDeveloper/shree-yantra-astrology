'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createMsg91Client, Msg91Error, MSG91_WIDGET_VERIFY_URL } = require('./msg91.service');

const config = {
  authkey: 'test-authkey',
  otpTemplateId: 'test-template',
  expirySeconds: 300,
  timeoutMs: 50,
};

const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});

test('send OTP uses the official endpoint and approved number variable', async () => {
  let captured;
  const client = createMsg91Client(config, async (url, options) => {
    captured = { url, options };
    return response({ type: 'success', request_id: 'provider-request' });
  });
  const result = await client.sendOtp('+919876543210');
  const url = new URL(captured.url);
  const body = JSON.parse(captured.options.body);

  assert.equal(url.origin + url.pathname, 'https://control.msg91.com/api/v5/otp');
  assert.equal(url.searchParams.get('mobile'), '919876543210');
  assert.equal(url.searchParams.get('template_id'), config.otpTemplateId);
  assert.equal(url.searchParams.get('otp_length'), '6');
  assert.match(url.searchParams.get('otp'), /^\d{6}$/);
  assert.equal(body.number, url.searchParams.get('otp'));
  assert.equal(body.authkey, undefined);
  assert.equal(result.providerRequestId, 'provider-request');
});

test('MSG91 send failures are sanitized', async () => {
  const client = createMsg91Client(config, async () => response({ type: 'error', message: 'internal provider detail' }));
  await assert.rejects(() => client.sendOtp('+919876543210'), (error) => {
    assert.equal(error.code, 'OTP_PROVIDER_REJECTED');
    assert.doesNotMatch(error.message, /internal provider detail/i);
    return true;
  });
});

test('invalid MSG91 OTP template is reported as configuration failure', async () => {
  const client = createMsg91Client(config, async () => response({
    type: 'error',
    message: 'Template ID Missing or Invalid Template',
  }));
  await assert.rejects(() => client.sendOtp('+919876543210'), (error) => {
    assert.equal(error.code, 'OTP_PROVIDER_TEMPLATE_INVALID');
    assert.doesNotMatch(error.message, /template id/i);
    return true;
  });
});

test('correct OTP is accepted by MSG91 verification', async () => {
  const client = createMsg91Client(config, async () => response({ type: 'success', message: 'OTP verified success' }));
  assert.equal(await client.verifyOtp('+919876543210', '482913'), true);
});

test('wrong and expired OTP responses map to safe application errors', async () => {
  const wrong = createMsg91Client(config, async () => response({ type: 'error', message: 'OTP not match' }));
  await assert.rejects(() => wrong.verifyOtp('+919876543210', '482913'), (error) => error.code === 'OTP_INVALID');

  const expired = createMsg91Client(config, async () => response({ type: 'error', message: 'OTP expired' }));
  await assert.rejects(() => expired.verifyOtp('+919876543210', '482913'), (error) => error.code === 'OTP_EXPIRED');
});

test('resend uses MSG91 retry endpoint and text channel', async () => {
  let capturedUrl;
  const client = createMsg91Client(config, async (url) => {
    capturedUrl = new URL(url);
    return response({ type: 'success' });
  });
  assert.equal(await client.resendOtp('+919876543210'), true);
  assert.equal(capturedUrl.pathname, '/api/v5/otp/retry');
  assert.equal(capturedUrl.searchParams.get('retrytype'), 'text');
});

test('MSG91 timeout becomes a retryable sanitized error', async () => {
  const timeoutConfig = { ...config, timeoutMs: 5 };
  const client = createMsg91Client(timeoutConfig, (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  }));
  await assert.rejects(() => client.sendOtp('+919876543210'), (error) => {
    assert.ok(error instanceof Msg91Error);
    assert.equal(error.code, 'OTP_PROVIDER_TIMEOUT');
    assert.equal(error.retryable, true);
    return true;
  });
});

test('widget access-token is verified server-side without exposing the Authkey in the URL', async () => {
  let captured;
  const client = createMsg91Client(config, async (url, options) => {
    captured = { url, options };
    return response({ type: 'success', data: { identifier: '919876543210' } });
  });
  const token = 'header.payload.signature-for-widget-test';
  const result = await client.verifyWidgetAccessToken(token);
  const body = JSON.parse(captured.options.body);

  assert.equal(captured.url, MSG91_WIDGET_VERIFY_URL);
  assert.equal(captured.options.method, 'POST');
  assert.equal(body.authkey, config.authkey);
  assert.equal(body['access-token'], token);
  assert.equal(new URL(captured.url).searchParams.has('authkey'), false);
  assert.equal(result.identifier, '919876543210');
});

test('widget access-token accepts the official MSG91 message identifier schema', async () => {
  const client = createMsg91Client(config, async () => response({
    type: 'success',
    message: '919876543210',
  }));

  const result = await client.verifyWidgetAccessToken('a-valid-widget-access-token');
  assert.equal(result.identifier, '919876543210');
});

test('invalid widget access-token response is rejected with a safe error', async () => {
  const client = createMsg91Client(config, async () => response({ type: 'error', message: 'provider internal token detail' }));
  await assert.rejects(
    () => client.verifyWidgetAccessToken('header.payload.signature-for-widget-test'),
    (error) => error.code === 'OTP_WIDGET_TOKEN_INVALID' && !/provider internal/i.test(error.message)
  );
});

test('widget Authkey rejection is mapped to provider configuration without leaking details', async () => {
  const client = createMsg91Client(config, async () => response({ type: 'error', message: 'Authkey is invalid' }));
  await assert.rejects(
    () => client.verifyWidgetAccessToken('header.payload.signature-for-widget-test'),
    (error) => error.code === 'OTP_PROVIDER_CONFIG' && !/authkey/i.test(error.message)
  );
});
