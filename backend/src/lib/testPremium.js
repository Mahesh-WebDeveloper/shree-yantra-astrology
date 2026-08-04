/**
 * Testing allow-list: specific phones always appear as active premium.
 * Use while Razorpay keys are not configured.
 *
 * Extra phones: TEST_PREMIUM_PHONES=9876543210,9123456780 in .env
 */
function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

const DEFAULT_TEST_PREMIUM_PHONES = [
  '6375058155', // tester — bypass paywall until payments go live
];

function testPremiumPhoneSet() {
  const fromEnv = String(process.env.TEST_PREMIUM_PHONES || '')
    .split(',')
    .map((s) => normalizePhone(s.trim()))
    .filter(Boolean);
  return new Set([...DEFAULT_TEST_PREMIUM_PHONES, ...fromEnv]);
}

function isTestPremiumPhone(phone) {
  const n = normalizePhone(phone);
  return !!(n && testPremiumPhoneSet().has(n));
}

function testPremiumSubscriptionMirror() {
  const accessUntil = new Date();
  accessUntil.setFullYear(accessUntil.getFullYear() + 10);
  return {
    provider: 'razorpay',
    status: 'active',
    entitlementActive: true,
    cancelAtCycleEnd: false,
    trialEligible: false,
    initialPeriodType: 'paid',
    trialEndsAt: null,
    currentPeriodEnd: accessUntil,
    nextChargeAt: null,
    accessUntil,
  };
}

module.exports = {
  normalizePhone,
  isTestPremiumPhone,
  testPremiumSubscriptionMirror,
};
