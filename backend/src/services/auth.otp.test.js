'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const auth = require('./auth.service');

test('verified new mobile creates the existing OTP user session shape', async () => {
  let created;
  const UserModel = {
    findOne: async () => null,
    create: async (input) => {
      created = { ...input, _id: '507f1f77bcf86cd799439011', profile: {}, save: async () => {} };
      return created;
    },
  };
  const result = await auth.completeOtpLogin('+919876543210', '', UserModel);
  assert.equal(result.isNew, true);
  assert.equal(result.profileComplete, false);
  assert.equal(created.phone, '+919876543210');
  assert.equal(created.phoneVerified, true);
  assert.ok(created.phoneVerifiedAt instanceof Date);
  assert.match(result.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
});

test('verified existing mobile logs in without creating a duplicate user', async () => {
  let query;
  let createCalled = false;
  const existing = {
    _id: '507f1f77bcf86cd799439012',
    phone: '9876543210',
    providers: ['password'],
    profile: { dob: '01-01-1990' },
    save: async () => {},
  };
  const UserModel = {
    findOne: async (value) => { query = value; return existing; },
    create: async () => { createCalled = true; },
  };
  const result = await auth.completeOtpLogin('+919876543210', 'Name', UserModel);
  assert.equal(result.isNew, false);
  assert.equal(result.profileComplete, true);
  assert.equal(createCalled, false);
  assert.deepEqual(query.phone.$in, ['+919876543210', '919876543210', '9876543210', '09876543210']);
  assert.equal(existing.phone, '+919876543210');
  assert.equal(existing.phoneVerified, true);
  assert.ok(existing.providers.includes('otp'));
});
