const test = require('node:test');
const assert = require('node:assert/strict');
const { addUtcMonths, calculateAccessUntil, requiredUpfrontAmount, toClient } = require('./payment.service');

test('verified authenticated subscription grants access until trial end', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const trialEnd = new Date('2026-08-08T00:00:00.000Z');
  const access = calculateAccessUntil({ status: 'authenticated', checkoutVerifiedAt: now, startAt: trialEnd }, now);
  assert.equal(access.toISOString(), trialEnd.toISOString());
});

test('unverified checkout never grants trial access', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const access = calculateAccessUntil({ status: 'authenticated', startAt: new Date('2026-08-08T00:00:00.000Z') }, now);
  assert.equal(access, null);
});

test('active subscription grants access only through current period end', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const periodEnd = new Date('2026-09-01T00:00:00.000Z');
  const active = calculateAccessUntil({ status: 'active', currentPeriodEnd: periodEnd }, now);
  const expired = calculateAccessUntil({ status: 'active', currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z') }, now);
  assert.equal(active.toISOString(), periodEnd.toISOString());
  assert.equal(expired, null);
});

test('cancelled and halted subscriptions do not grant access', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const future = new Date('2026-09-01T00:00:00.000Z');
  assert.equal(calculateAccessUntil({ status: 'cancelled', currentPeriodEnd: future }, now), null);
  assert.equal(calculateAccessUntil({ status: 'halted', currentPeriodEnd: future }, now), null);
});

test('trial is offered once and returning subscribers owe the monthly amount upfront', () => {
  assert.equal(requiredUpfrontAmount({ initialPeriodType: 'trial' }), 100);
  assert.equal(requiredUpfrontAmount({ initialPeriodType: 'paid' }), 49900);
  assert.equal(toClient({ status: 'cancelled', trialConsumedAt: new Date() }).trialEligible, false);
});

test('paid introductory period advances by one calendar month', () => {
  const result = addUtcMonths(new Date('2027-01-31T12:30:00.000Z'), 1);
  assert.equal(result.toISOString(), '2027-02-28T12:30:00.000Z');
});
