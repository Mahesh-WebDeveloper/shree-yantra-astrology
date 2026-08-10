'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { redactObject, redactHeaders, maskPhone, hashShort, safeBirthMeta } = require('./redact');

describe('redact', () => {
  it('masks phone numbers in object fields', () => {
    const out = redactObject({ phone: '+919876543210', name: 'Test' });
    assert.equal(out.phone, '******3210');
    assert.equal(out.name, 'Test');
  });

  it('redacts secret keys', () => {
    const out = redactObject({
      password: 'secret123',
      otp: '123456',
      access_token: 'abc',
      refreshToken: 'xyz',
      api_key: 'key',
    });
    assert.equal(out.password, '[REDACTED]');
    assert.equal(out.otp, '[REDACTED]');
    assert.equal(out.access_token, '[REDACTED]');
    assert.equal(out.refreshToken, '[REDACTED]');
    assert.equal(out.api_key, '[REDACTED]');
  });

  it('redacts bearer authorization headers', () => {
    const out = redactHeaders({ Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'X-Request-Id': 'abc' });
    assert.equal(out.Authorization, '[REDACTED]');
    assert.equal(out['X-Request-Id'], 'abc');
  });

  it('redacts bearer token strings', () => {
    const out = redactObject({ header: 'Bearer super-secret' });
    assert.equal(out.header, 'Bearer [REDACTED]');
  });

  it('minimizes birth metadata', () => {
    const out = safeBirthMeta({ dob: '1990-01-01', tob: '10:30', place: 'Delhi', tz: 'Asia/Kolkata' });
    assert.deepEqual(out, { hasDob: true, hasTob: true, hasPlace: true, tz: 'Asia/Kolkata' });
    assert.equal(out.dob, undefined);
  });

  it('hashShort is stable', () => {
    assert.equal(hashShort('device-abc'), hashShort('device-abc'));
    assert.notEqual(hashShort('a'), hashShort('b'));
  });

  it('maskPhone handles short numbers', () => {
    assert.match(maskPhone('1234'), /^[*]+/);
  });
});
