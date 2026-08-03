const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const env = require('../config/env');
const User = require('../models/User');
const PaymentSubscription = require('../models/PaymentSubscription');
const PaymentWebhookEvent = require('../models/PaymentWebhookEvent');
const PaymentTransaction = require('../models/PaymentTransaction');

const ACTIVE_PROVIDER_STATES = new Set(['authenticated', 'active', 'pending', 'completed']);
const CHECKOUT_SUCCESS_STATES = new Set(['authenticated', 'active']);
let client = null;
let planValidation = null;

class PaymentError extends Error {
  constructor(message, status = 400, code = 'PAYMENT_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function asDate(unixSeconds) {
  const n = Number(unixSeconds);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000) : undefined;
}

function addUtcMonths(date, count) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + count);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function secureEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function paymentBillingType(payment, subscription) {
  const amount = Number(payment?.amount) || 0;
  if (amount <= env.payments.trialAmountPaise) return 'trial';
  if (subscription?.initialPeriodType === 'trial' && !subscription?.trialConsumedAt) return 'trial';
  return 'paid';
}

async function recordPaymentTransaction(payment, context = {}) {
  if (!payment?.id) return null;
  const userId = context.userId;
  if (!userId || !mongoose.isValidObjectId(userId)) return null;

  const amount = Number(payment.amount) || 0;
  const isTrial = context.isTrial ?? amount <= env.payments.trialAmountPaise;
  const capturedAt = payment.created_at ? new Date(Number(payment.created_at) * 1000) : new Date();
  const payload = {
    user: userId,
    provider: 'razorpay',
    providerPaymentId: payment.id,
    providerSubscriptionId: payment.subscription_id || context.subscriptionId || undefined,
    providerInvoiceId: payment.invoice_id || undefined,
    providerOrderId: payment.order_id || undefined,
    amountPaise: amount,
    amountRefundedPaise: Number(payment.amount_refunded) || 0,
    currency: payment.currency || env.payments.currency,
    status: payment.status || 'created',
    captured: !!payment.captured,
    method: payment.method || undefined,
    bank: payment.bank || undefined,
    wallet: payment.wallet || undefined,
    vpa: payment.vpa || undefined,
    cardLast4: payment.card?.last4 || undefined,
    cardNetwork: payment.card?.network || undefined,
    email: payment.email || undefined,
    contact: payment.contact || undefined,
    feePaise: Number(payment.fee) || 0,
    taxPaise: Number(payment.tax) || 0,
    description: payment.description || undefined,
    errorCode: payment.error_code || undefined,
    errorDescription: payment.error_description || undefined,
    isTrial,
    billingPeriodType: context.billingPeriodType || (isTrial ? 'trial' : 'paid'),
    eventType: context.eventType || undefined,
    capturedAt: payment.status === 'captured' ? capturedAt : undefined,
    providerCreatedAt: capturedAt,
  };

  const existing = await PaymentTransaction.findOne({ providerPaymentId: payment.id });
  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }
  return PaymentTransaction.create(payload);
}

async function recordPaymentFromWebhook(payload, subscription, eventType) {
  const paymentEntity = payload.payload?.payment?.entity;
  if (!paymentEntity?.id || !subscription?.user) return null;
  return recordPaymentTransaction(paymentEntity, {
    userId: subscription.user,
    subscriptionId: subscription.providerSubscriptionId,
    eventType,
    isTrial: Number(paymentEntity.amount) <= env.payments.trialAmountPaise,
    billingPeriodType: Number(paymentEntity.amount) <= env.payments.trialAmountPaise ? 'trial' : 'paid',
  });
}

function requiredUpfrontAmount(subscription) {
  return subscription.initialPeriodType === 'paid'
    ? env.payments.monthlyAmountPaise
    : env.payments.trialAmountPaise;
}

function assertCapturedUpfrontPayment(payment, subscription) {
  const valid = payment?.status === 'captured'
    && payment.currency === env.payments.currency
    && Number(payment.amount) >= requiredUpfrontAmount(subscription);
  if (!valid) {
    throw new PaymentError('The upfront payment has not been captured yet.', 409, 'PAYMENT_NOT_CAPTURED');
  }
}

async function recoverCheckoutFromProvider(subscription, paymentIdHint) {
  let paymentId = paymentIdHint;
  if (!paymentId) {
    const invoices = await getClient().invoices.all({ subscription_id: subscription.providerSubscriptionId });
    const requiredAmount = requiredUpfrontAmount(subscription);
    const paidInvoice = (invoices?.items || [])
      .filter((invoice) => invoice.subscription_id === subscription.providerSubscriptionId
        && invoice.status === 'paid'
        && invoice.payment_id
        && Number(invoice.amount_paid) >= requiredAmount)
      .sort((a, b) => Number(a.paid_at || a.issued_at || 0) - Number(b.paid_at || b.issued_at || 0))[0];
    paymentId = paidInvoice?.payment_id;
  }
  if (!paymentId) {
    throw new PaymentError('The upfront payment is still being confirmed.', 409, 'PAYMENT_NOT_CAPTURED');
  }

  const payment = await getClient().payments.fetch(paymentId);
  assertCapturedUpfrontPayment(payment, subscription);
  subscription.checkoutVerifiedAt = subscription.checkoutVerifiedAt || new Date();
  subscription.lastPaymentId = payment.id;
  await recordPaymentTransaction(payment, {
    userId: subscription.user,
    subscriptionId: subscription.providerSubscriptionId,
    eventType: 'checkout.recover',
    isTrial: subscription.initialPeriodType !== 'paid',
    billingPeriodType: paymentBillingType(payment, subscription),
  });
  if (subscription.initialPeriodType !== 'paid' && !subscription.trialConsumedAt) {
    subscription.trialConsumedAt = new Date();
  }
  await subscription.save();
  await mirrorEntitlement(subscription);
  return subscription;
}

function assertConfigured({ webhook = false } = {}) {
  const p = env.payments;
  if (!p.enabled) throw new PaymentError('Payments are temporarily unavailable.', 503, 'PAYMENTS_DISABLED');
  if (!p.razorpayKeyId || !p.razorpayKeySecret || !p.razorpayPlanId) {
    throw new PaymentError('Payment configuration is incomplete.', 503, 'PAYMENTS_NOT_CONFIGURED');
  }
  if (webhook && !p.razorpayWebhookSecret) {
    throw new PaymentError('Payment webhook is not configured.', 503, 'WEBHOOK_NOT_CONFIGURED');
  }
}

function getClient() {
  assertConfigured();
  if (!client) {
    client = new Razorpay({ key_id: env.payments.razorpayKeyId, key_secret: env.payments.razorpayKeySecret });
  }
  return client;
}

function providerError(error, fallback) {
  const status = Number(error?.statusCode || error?.status) || 502;
  const safeStatus = status >= 400 && status < 500 ? 400 : 502;
  const err = new PaymentError(fallback, safeStatus, 'PAYMENT_PROVIDER_ERROR');
  err.cause = error;
  return err;
}

function calculateAccessUntil(subscription, now = new Date()) {
  const status = subscription.status;
  const verified = !!subscription.checkoutVerifiedAt;
  const startAt = subscription.startAt ? new Date(subscription.startAt) : null;
  const currentEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;

  if (status === 'authenticated' && verified && startAt && startAt > now) return startAt;
  if (['active', 'pending', 'completed'].includes(status) && currentEnd && currentEnd > now) return currentEnd;
  return null;
}

function toClient(subscription) {
  if (!subscription) {
    return {
      provider: 'razorpay', status: 'none', entitlementActive: false, cancelAtCycleEnd: false,
      trialEligible: true, initialPeriodType: null, trialEndsAt: null,
      currentPeriodEnd: null, nextChargeAt: null, accessUntil: null,
    };
  }
  const now = new Date();
  const accessUntil = calculateAccessUntil(subscription, now);
  return {
    provider: subscription.provider,
    status: subscription.status,
    entitlementActive: !!accessUntil,
    cancelAtCycleEnd: !!subscription.cancelAtCycleEnd,
    trialEligible: !subscription.trialConsumedAt,
    initialPeriodType: subscription.initialPeriodType || 'trial',
    trialEndsAt: subscription.status === 'authenticated' && subscription.initialPeriodType !== 'paid'
      ? subscription.startAt || null
      : null,
    currentPeriodEnd: subscription.currentPeriodEnd
      || (subscription.status === 'authenticated' && subscription.initialPeriodType === 'paid' ? subscription.startAt : null)
      || null,
    nextChargeAt: subscription.nextChargeAt || subscription.startAt || null,
    accessUntil: accessUntil || null,
    cancellationRequestedAt: subscription.cancellationRequestedAt || null,
  };
}

async function mirrorEntitlement(subscription) {
  const now = new Date();
  const accessUntil = calculateAccessUntil(subscription, now);
  subscription.accessUntil = accessUntil || undefined;
  subscription.entitlementActive = !!accessUntil;
  await subscription.save();

  const mirror = toClient(subscription);
  await User.updateOne(
    { _id: subscription.user },
    {
      $set: {
        plan: mirror.entitlementActive ? 'premium' : 'free',
        subscription: {
          provider: 'razorpay',
          status: mirror.status,
          entitlementActive: mirror.entitlementActive,
          cancelAtCycleEnd: mirror.cancelAtCycleEnd,
          trialEligible: mirror.trialEligible,
          initialPeriodType: mirror.initialPeriodType,
          trialEndsAt: mirror.trialEndsAt,
          currentPeriodEnd: mirror.currentPeriodEnd,
          nextChargeAt: mirror.nextChargeAt,
          accessUntil: mirror.accessUntil,
        },
      },
    }
  );
  return mirror;
}

async function syncProviderEntity(entity, userIdHint) {
  if (!entity?.id) throw new PaymentError('Subscription data is missing.', 400, 'INVALID_SUBSCRIPTION_DATA');
  if (entity.plan_id !== env.payments.razorpayPlanId) {
    throw new PaymentError('Subscription plan does not match.', 409, 'PLAN_MISMATCH');
  }

  let subscription = await PaymentSubscription.findOne({ providerSubscriptionId: entity.id });
  const noteUserId = entity.notes?.user_id;
  const candidateUserId = userIdHint || noteUserId;
  if (!subscription && candidateUserId && mongoose.isValidObjectId(candidateUserId)) {
    subscription = await PaymentSubscription.findOne({ user: candidateUserId });
  }
  if (!subscription) throw new PaymentError('Subscription record was not found.', 404, 'SUBSCRIPTION_NOT_FOUND');

  if (candidateUserId && String(subscription.user) !== String(candidateUserId)) {
    throw new PaymentError('Subscription ownership could not be verified.', 403, 'SUBSCRIPTION_OWNER_MISMATCH');
  }

  subscription.providerSubscriptionId = entity.id;
  subscription.providerPlanId = entity.plan_id;
  subscription.status = entity.status;
  subscription.startAt = asDate(entity.start_at);
  subscription.authorizationExpiresAt = asDate(entity.expire_by);
  subscription.currentPeriodStart = asDate(entity.current_start);
  subscription.currentPeriodEnd = asDate(entity.current_end);
  subscription.nextChargeAt = asDate(entity.charge_at);
  subscription.endedAt = asDate(entity.ended_at);
  subscription.paidCount = Number(entity.paid_count) || 0;
  subscription.remainingCount = Number.isFinite(Number(entity.remaining_count)) ? Number(entity.remaining_count) : undefined;
  subscription.totalCount = Number.isFinite(Number(entity.total_count)) ? Number(entity.total_count) : undefined;
  subscription.cancelAtCycleEnd = !!entity.has_scheduled_changes || !!subscription.cancelAtCycleEnd;
  subscription.lastSyncedAt = new Date();
  await subscription.save();
  await mirrorEntitlement(subscription);
  return subscription;
}

async function validatePlanConfiguration() {
  const now = Date.now();
  if (planValidation && now - planValidation.at < 10 * 60 * 1000) return;
  let plan;
  try {
    plan = await getClient().plans.fetch(env.payments.razorpayPlanId);
  } catch (error) {
    throw providerError(error, 'The subscription plan could not be verified.');
  }
  const item = plan?.item || {};
  const valid = plan.period === 'monthly'
    && Number(plan.interval) === 1
    && Number(item.amount) === env.payments.monthlyAmountPaise
    && item.currency === env.payments.currency;
  if (!valid) throw new PaymentError('The configured subscription plan has an invalid price or billing period.', 503, 'INVALID_PLAN_CONFIG');
  planValidation = { at: now };
}

async function createSubscription(user) {
  assertConfigured();
  await validatePlanConfiguration();

  let local = await PaymentSubscription.findOne({ user: user._id });
  if (local?.providerSubscriptionId && local.status === 'created' && local.authorizationExpiresAt > new Date()) {
    const initialPeriodType = local.initialPeriodType || 'trial';
    return {
      alreadyEntitled: false,
      keyId: env.payments.razorpayKeyId,
      providerSubscriptionId: local.providerSubscriptionId,
      currency: env.payments.currency,
      trialAmountPaise: env.payments.trialAmountPaise,
      trialDays: env.payments.trialDays,
      monthlyAmountPaise: env.payments.monthlyAmountPaise,
      upfrontAmountPaise: initialPeriodType === 'trial' ? env.payments.trialAmountPaise : env.payments.monthlyAmountPaise,
      initialPeriodType,
      startsAt: local.startAt,
      authorizationExpiresAt: local.authorizationExpiresAt,
    };
  }
  if (local?.providerSubscriptionId && ACTIVE_PROVIDER_STATES.has(local.status)) {
    try {
      const entity = await getClient().subscriptions.fetch(local.providerSubscriptionId);
      local = await syncProviderEntity(entity, user._id);
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw providerError(error, 'The current subscription could not be checked.');
    }
    const current = toClient(local);
    if (current.entitlementActive) return { alreadyEntitled: true, subscription: current };
    if (['authenticated', 'active', 'pending'].includes(local.status)) {
      throw new PaymentError('The existing subscription mandate is still being processed.', 409, 'MANDATE_STATE_PENDING');
    }
  }

  const now = new Date();
  const creationLockToken = crypto.randomUUID();
  const creationLockedUntil = new Date(now.getTime() + 2 * 60 * 1000);
  if (local) {
    local = await PaymentSubscription.findOneAndUpdate(
      {
        _id: local._id,
        $or: [
          { creationLockedUntil: { $exists: false } },
          { creationLockedUntil: null },
          { creationLockedUntil: { $lte: now } },
        ],
      },
      { $set: { creationLockToken, creationLockedUntil } },
      { new: true }
    );
    if (!local) throw new PaymentError('A payment session is already being created.', 409, 'PAYMENT_SESSION_IN_PROGRESS');
  } else {
    try {
      local = await PaymentSubscription.create({
        user: user._id,
        providerPlanId: env.payments.razorpayPlanId,
        status: 'created',
        creationLockToken,
        creationLockedUntil,
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new PaymentError('A payment session is already being created.', 409, 'PAYMENT_SESSION_IN_PROGRESS');
      }
      throw error;
    }
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const initialPeriodType = local?.trialConsumedAt ? 'paid' : 'trial';
  const initialPeriodEnd = initialPeriodType === 'trial'
    ? new Date(now.getTime() + env.payments.trialDays * 24 * 60 * 60 * 1000)
    : addUtcMonths(now, 1);
  const startAt = Math.floor(initialPeriodEnd.getTime() / 1000);
  const upfrontAmountPaise = initialPeriodType === 'trial'
    ? env.payments.trialAmountPaise
    : env.payments.monthlyAmountPaise;
  const expireBy = Math.min(startAt - 60, nowSeconds + env.payments.checkoutExpiryMinutes * 60);
  let entity;
  try {
    entity = await getClient().subscriptions.create({
      plan_id: env.payments.razorpayPlanId,
      total_count: env.payments.totalBillingCycles,
      quantity: 1,
      customer_notify: true,
      start_at: startAt,
      expire_by: expireBy,
      addons: [{
        item: {
          name: initialPeriodType === 'trial' ? 'Shree Yantra 7-day trial' : 'Shree Yantra Premium - first month',
          amount: upfrontAmountPaise,
          currency: env.payments.currency,
          description: initialPeriodType === 'trial'
            ? 'One-time trial charge before monthly subscription starts'
            : 'First paid month before recurring monthly billing starts',
        },
      }],
      notes: { user_id: String(user._id), product: 'shree_yantra_premium_monthly' },
    });
  } catch (error) {
    await PaymentSubscription.updateOne(
      { _id: local._id, creationLockToken },
      { $unset: { creationLockToken: 1, creationLockedUntil: 1 } }
    ).catch(() => {});
    throw providerError(error, 'The secure payment session could not be created.');
  }

  local = await PaymentSubscription.findOneAndUpdate(
    { _id: local._id, creationLockToken },
    {
      $set: {
        provider: 'razorpay',
        providerSubscriptionId: entity.id,
        providerPlanId: entity.plan_id,
        status: entity.status,
        startAt: asDate(entity.start_at),
        authorizationExpiresAt: asDate(entity.expire_by),
        currentPeriodStart: undefined,
        currentPeriodEnd: undefined,
        nextChargeAt: asDate(entity.charge_at),
        endedAt: undefined,
        accessUntil: undefined,
        entitlementActive: false,
        cancelAtCycleEnd: false,
        cancellationRequestedAt: undefined,
        checkoutVerifiedAt: undefined,
        initialPeriodType,
        lastPaymentId: undefined,
        paidCount: 0,
        totalCount: entity.total_count,
        remainingCount: entity.remaining_count,
        lastSyncedAt: new Date(),
      },
      $unset: { creationLockToken: 1, creationLockedUntil: 1 },
    },
    { new: true }
  );
  if (!local) {
    await getClient().subscriptions.cancel(entity.id, false).catch(() => {});
    throw new PaymentError('The payment session could not be saved safely.', 409, 'PAYMENT_SESSION_CONFLICT');
  }

  return {
    alreadyEntitled: false,
    keyId: env.payments.razorpayKeyId,
    providerSubscriptionId: local.providerSubscriptionId,
    currency: env.payments.currency,
    trialAmountPaise: env.payments.trialAmountPaise,
    trialDays: env.payments.trialDays,
    monthlyAmountPaise: env.payments.monthlyAmountPaise,
    upfrontAmountPaise,
    initialPeriodType,
    startsAt: local.startAt,
    authorizationExpiresAt: local.authorizationExpiresAt,
  };
}

async function verifyCheckout(user, input) {
  assertConfigured();
  const paymentId = String(input.razorpay_payment_id || '');
  const subscriptionId = String(input.razorpay_subscription_id || '');
  const signature = String(input.razorpay_signature || '');
  if (!paymentId || !subscriptionId || !signature) {
    throw new PaymentError('Payment verification details are incomplete.', 400, 'INVALID_PAYMENT_RESPONSE');
  }

  const local = await PaymentSubscription.findOne({ user: user._id, providerSubscriptionId: subscriptionId });
  if (!local) throw new PaymentError('This payment does not belong to the signed-in account.', 403, 'PAYMENT_OWNER_MISMATCH');

  const expected = crypto
    .createHmac('sha256', env.payments.razorpayKeySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');
  if (!secureEqual(expected, signature)) {
    throw new PaymentError('Payment signature verification failed.', 400, 'INVALID_PAYMENT_SIGNATURE');
  }

  let entity;
  let payment;
  try {
    const retryDelays = [0, 500, 1000, 1500];
    for (const delay of retryDelays) {
      if (delay) await wait(delay);
      [entity, payment] = await Promise.all([
        getClient().subscriptions.fetch(subscriptionId),
        getClient().payments.fetch(paymentId),
      ]);
      if (CHECKOUT_SUCCESS_STATES.has(entity.status) && payment.status === 'captured') break;
    }
  } catch (error) {
    throw providerError(error, 'The completed payment could not be confirmed.');
  }
  if (!CHECKOUT_SUCCESS_STATES.has(entity.status)) {
    throw new PaymentError('The subscription mandate is not active yet.', 409, 'MANDATE_NOT_ACTIVE');
  }
  assertCapturedUpfrontPayment(payment, local);

  local.checkoutVerifiedAt = new Date();
  if (local.initialPeriodType !== 'paid' && !local.trialConsumedAt) local.trialConsumedAt = new Date();
  local.lastPaymentId = paymentId;
  await recordPaymentTransaction(payment, {
    userId: user._id,
    subscriptionId: subscriptionId,
    eventType: 'checkout.verify',
    isTrial: local.initialPeriodType !== 'paid',
    billingPeriodType: paymentBillingType(payment, local),
  });
  await local.save();
  const synced = await syncProviderEntity(entity, user._id);
  const subscription = toClient(synced);
  if (!subscription.entitlementActive) {
    throw new PaymentError('The subscription is verified but access is not active yet.', 409, 'ENTITLEMENT_PENDING');
  }
  const freshUser = await User.findById(user._id);
  return { user: freshUser.toPublic(), subscription };
}

async function getStatus(user, { sync = true } = {}) {
  let subscription = await PaymentSubscription.findOne({ user: user._id });
  if (sync && subscription?.providerSubscriptionId) {
    try {
      const entity = await getClient().subscriptions.fetch(subscription.providerSubscriptionId);
      subscription = await syncProviderEntity(entity, user._id);
      if (CHECKOUT_SUCCESS_STATES.has(subscription.status) && !subscription.checkoutVerifiedAt) {
        try {
          subscription = await recoverCheckoutFromProvider(subscription);
        } catch (error) {
          if (!(error instanceof PaymentError) || error.code !== 'PAYMENT_NOT_CAPTURED') throw error;
        }
      }
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      if (!calculateAccessUntil(subscription)) throw providerError(error, 'The subscription status could not be refreshed.');
      await mirrorEntitlement(subscription);
    }
  } else if (subscription) {
    await mirrorEntitlement(subscription);
  }
  const freshUser = await User.findById(user._id);
  return { user: freshUser.toPublic(), subscription: toClient(subscription) };
}

async function refreshUserEntitlement(user) {
  const subscription = await PaymentSubscription.findOne({ user: user._id });
  if (!subscription) {
    if (user.role !== 'admin' && (user.plan !== 'free' || user.subscription?.entitlementActive)) {
      user.plan = 'free';
      user.subscription = undefined;
      await user.save();
    }
    return false;
  }
  const accessUntil = calculateAccessUntil(subscription);
  const storedAccessUntil = subscription.accessUntil ? new Date(subscription.accessUntil) : null;
  const entitlementChanged = subscription.entitlementActive !== !!accessUntil;
  const accessDateChanged = (storedAccessUntil?.getTime() || 0) !== (accessUntil?.getTime() || 0);
  const mirror = entitlementChanged || accessDateChanged
    ? await mirrorEntitlement(subscription)
    : toClient(subscription);
  user.plan = mirror.entitlementActive ? 'premium' : 'free';
  user.subscription = mirror;
  return mirror.entitlementActive;
}

async function cancelSubscription(user) {
  assertConfigured();
  let subscription = await PaymentSubscription.findOne({ user: user._id });
  if (!subscription?.providerSubscriptionId) {
    throw new PaymentError('No subscription was found for this account.', 404, 'SUBSCRIPTION_NOT_FOUND');
  }
  if (['cancelled', 'completed', 'expired'].includes(subscription.status)) return getStatus(user, { sync: false });

  // Trial mandates have no active billing cycle, so they must be cancelled immediately.
  // Active paid subscriptions are cancelled at period end so already-paid access is retained.
  const cancelAtCycleEnd = subscription.status === 'active';
  let entity;
  try {
    entity = await getClient().subscriptions.cancel(subscription.providerSubscriptionId, cancelAtCycleEnd);
  } catch (error) {
    throw providerError(error, 'The subscription could not be cancelled.');
  }
  subscription.cancellationRequestedAt = new Date();
  subscription.cancelAtCycleEnd = cancelAtCycleEnd;
  await subscription.save();
  subscription = await syncProviderEntity(entity, user._id);
  if (cancelAtCycleEnd) {
    subscription.cancellationRequestedAt = new Date();
    subscription.cancelAtCycleEnd = true;
    await subscription.save();
    await mirrorEntitlement(subscription);
  }
  const freshUser = await User.findById(user._id);
  return { user: freshUser.toPublic(), subscription: toClient(subscription) };
}

function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', env.payments.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');
  return secureEqual(expected, signature);
}

async function handleWebhook(rawBody, headers) {
  assertConfigured({ webhook: true });
  if (!Buffer.isBuffer(rawBody)) throw new PaymentError('Webhook body must be raw.', 400, 'INVALID_WEBHOOK_BODY');
  const signature = headers['x-razorpay-signature'];
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    throw new PaymentError('Webhook signature verification failed.', 400, 'INVALID_WEBHOOK_SIGNATURE');
  }

  let payload;
  try { payload = JSON.parse(rawBody.toString('utf8')); } catch (_) {
    throw new PaymentError('Webhook payload is invalid.', 400, 'INVALID_WEBHOOK_JSON');
  }
  const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const eventId = String(headers['x-razorpay-event-id'] || payload.id || payloadHash);
  const eventType = String(payload.event || 'unknown');
  const providerEntity = payload.payload?.subscription?.entity;

  let event;
  try {
    event = await PaymentWebhookEvent.create({
      eventId,
      eventType,
      providerSubscriptionId: providerEntity?.id,
      payloadHash,
      providerCreatedAt: asDate(payload.created_at),
      status: 'processing',
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    event = await PaymentWebhookEvent.findOne({ eventId });
    if (event?.status === 'processed' || event?.status === 'ignored') return { duplicate: true };
    event.status = 'processing';
    event.error = undefined;
    await event.save();
  }

  try {
    if (!providerEntity?.id) {
      event.status = 'ignored';
    } else {
      const latest = await getClient().subscriptions.fetch(providerEntity.id);
      const subscription = await syncProviderEntity(latest, providerEntity.notes?.user_id);
      if (eventType === 'subscription.authenticated' && !subscription.checkoutVerifiedAt) {
        const paymentId = payload.payload?.payment?.entity?.id;
        await recoverCheckoutFromProvider(subscription, paymentId);
      }
      await recordPaymentFromWebhook(payload, subscription, eventType);
      subscription.lastProviderEventAt = asDate(payload.created_at) || new Date();
      await subscription.save();
      event.status = 'processed';
    }
    event.processedAt = new Date();
    await event.save();
    return { duplicate: false };
  } catch (error) {
    event.status = 'failed';
    event.error = String(error?.code || error?.message || 'webhook processing failed').slice(0, 180);
    await event.save();
    throw error;
  }
}

function getPublicConfig() {
  const configured = !!(env.payments.enabled && env.payments.razorpayKeyId && env.payments.razorpayPlanId);
  return {
    enabled: configured,
    provider: 'razorpay',
    currency: env.payments.currency,
    trialAmountPaise: env.payments.trialAmountPaise,
    trialDays: env.payments.trialDays,
    monthlyAmountPaise: env.payments.monthlyAmountPaise,
  };
}

module.exports = {
  PaymentError,
  createSubscription,
  verifyCheckout,
  getStatus,
  refreshUserEntitlement,
  cancelSubscription,
  handleWebhook,
  getPublicConfig,
  calculateAccessUntil,
  addUtcMonths,
  requiredUpfrontAmount,
  toClient,
  verifyWebhookSignature,
  recordPaymentTransaction,
};
